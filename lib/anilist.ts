/**
 * Server-only AniList boundary.
 *
 * Nothing in this module is imported by a client island. Every public method
 * validates its arguments, normalizes provider data, and returns a compact
 * app contract. The cache key is the operation plus sanitized variables, so
 * search, details, lists, tags, and schedules can never collide.
 */
import { cacheLife } from 'next/cache'
import { genreTagId, normalizeAniListMedia, normalizeAniListPage, type AniListPageInput } from '@/lib/anilist-normalizers'
import { safeExternalUrl } from '@/lib/anime-utils'
import type { ContentPreferences } from '@/lib/contentRatings'
import {
  isContentAllowed,
  normalizeContentPreferences,
} from '@/lib/contentRatings'
import type { AnimeDetails, AnimeFilterOptions, AnimeListItem, AnimeTag, NormalizedPage, PageResult } from '@/lib/anime-models'

const API_URL = (() => {
  const configured = process.env.ANILIST_API_URL?.trim()
  if (!configured) return 'https://graphql.anilist.co'
  try {
    const url = new URL(configured)
    if (url.protocol === 'https:' || (process.env.NODE_ENV === 'development' && url.hostname === 'localhost')) {
      return url.toString().replace(/\/$/, '')
    }
  } catch {
    // Fall through to the production endpoint.
  }
  return 'https://graphql.anilist.co'
})()

export const ANILIST_PUBLIC_ID_OFFSET = 1_000_000_000
const REQUEST_TIMEOUT_MS = 8_000
const MAX_STALE_MS = 7 * 24 * 60 * 60 * 1_000
const USER_AGENT = process.env.ANILIST_USER_AGENT?.trim() || 'CryoAnime/1.0'

export class RetryableAniListError extends Error {
  readonly retryable = true
  constructor(message: string, readonly status = 503) {
    super(message)
    this.name = 'RetryableAniListError'
  }
}

type Operation = 'cards' | 'search' | 'details' | 'tags' | 'schedule'
type GraphqlResponse = { data?: unknown; errors?: Array<{ message?: string }> }

const CARD_FIELDS = `
  id idMal type format status source description(asHtml: false)
  title { romaji english native userPreferred } synonyms
  genres averageScore meanScore popularity favourites
  rankings { rank type allTime context season format year }
  episodes duration season seasonYear isAdult
  startDate { year month day } endDate { year month day }
  coverImage { extraLarge large medium }
  tags { id name category rank isAdult isGeneralSpoiler isMediaSpoiler }
  nextAiringEpisode { airingAt episode }
  siteUrl
`

const QUERIES: Record<Operation, string> = {
  cards: `query CryoCards($page: Int!, $perPage: Int!, $sort: [MediaSort], $search: String, $genreIn: [String], $genreNotIn: [String], $tagIn: [String], $tagNotIn: [String], $minimumTagRank: Int, $format: [MediaFormat], $season: MediaSeason, $seasonYear: Int, $isAdult: Boolean!) {
    Page(page: $page, perPage: $perPage) { pageInfo { total currentPage lastPage hasNextPage perPage }
      media(type: ANIME, format_in: $format, search: $search, genre_in: $genreIn, genre_not_in: $genreNotIn, tag_in: $tagIn, tag_not_in: $tagNotIn, minimumTagRank: $minimumTagRank, season: $season, seasonYear: $seasonYear, isAdult: $isAdult, sort: $sort) { ${CARD_FIELDS} }
    }
  }`,
  search: `query CryoSearch($page: Int!, $perPage: Int!, $search: String!, $isAdult: Boolean!) {
    Page(page: $page, perPage: $perPage) { pageInfo { total currentPage lastPage hasNextPage perPage }
      media(type: ANIME, search: $search, isAdult: $isAdult, sort: [SEARCH_MATCH]) { ${CARD_FIELDS} }
    }
  }`,
  details: `query CryoDetails($id: Int, $idMal: Int) {
    Media(id: $id, idMal: $idMal, type: ANIME) { ${CARD_FIELDS}
      trailer { id site thumbnail }
      studios { edges { isMain node { id name siteUrl } } }
      externalLinks { site type url }
      staff(perPage: 50) { edges { role node { id siteUrl name { full } } } }
      relations { edges { relationType node { id idMal type format title { romaji english native userPreferred } } } }
      streamingEpisodes { title thumbnail url site }
      characters(sort: [ROLE, FAVOURITES_DESC], perPage: 30) {
        edges { role node { id siteUrl name { full native alternative } image { large medium } description favourites }
          voiceActors(language: JAPANESE) { id siteUrl name { full native } image { large medium } }
        }
      }
    }
  }`,
  tags: `query CryoTags { GenreCollection MediaTagCollection { id name category rank isAdult isGeneralSpoiler isMediaSpoiler } }`,
  schedule: `query CryoSchedule($page: Int!, $perPage: Int!, $airingAtGreater: Int!, $airingAtLesser: Int!) {
    Page(page: $page, perPage: $perPage) { pageInfo { total currentPage lastPage hasNextPage perPage }
      airingSchedules(airingAt_greater: $airingAtGreater, airingAt_lesser: $airingAtLesser, sort: [TIME]) {
        id airingAt episode
        media { ${CARD_FIELDS} }
      }
    }
  }`,
}

const staleResults = new Map<string, { value: unknown; savedAt: number }>()
const MAX_STALE_ENTRIES = 200

const rememberStaleResult = (key: string, value: unknown): void => {
  const savedAt = Date.now()
  staleResults.delete(key)
  staleResults.set(key, { value, savedAt })

  for (const [candidate, entry] of staleResults) {
    if (savedAt - entry.savedAt > MAX_STALE_MS) staleResults.delete(candidate)
  }
  while (staleResults.size > MAX_STALE_ENTRIES) {
    const oldest = staleResults.keys().next().value as string | undefined
    if (!oldest) break
    staleResults.delete(oldest)
  }
}

const stableJson = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stableJson).sort().join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
      .join(',')}}`
  }
  return JSON.stringify(value) ?? 'null'
}

const cleanText = (value: unknown, max: number): string | undefined => {
  if (typeof value !== 'string') return undefined
  const text = value.replace(/[\u0000-\u001f]/g, ' ').trim()
  return text ? text.slice(0, max) : undefined
}

const safePage = (page: number | undefined): number => Number.isFinite(page) ? Math.max(1, Math.min(100, Math.floor(page as number))) : 1
const safeLimit = (limit: number | undefined): number => Number.isFinite(limit) ? Math.max(1, Math.min(50, Math.floor(limit as number))) : 24
const safeQuery = (query: string): string => cleanText(query, 100)?.slice(0, 100) || ''

const cacheProfile = (operation: Operation): { stale: number; revalidate: number; expire: number } => {
  if (operation === 'search') return { stale: 900, revalidate: 300, expire: 3600 }
  if (operation === 'schedule') return { stale: 3600, revalidate: 3600, expire: 7 * 24 * 3600 }
  if (operation === 'details' || operation === 'tags') return { stale: 24 * 3600, revalidate: 24 * 3600, expire: 30 * 24 * 3600 }
  return { stale: 3600, revalidate: 900, expire: 7 * 24 * 3600 }
}

const fetchUpstream = async (operation: Operation, variables: Record<string, unknown>): Promise<unknown> => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(new Error('AniList request timed out')), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json', 'user-agent': USER_AGENT },
      body: JSON.stringify({ query: QUERIES[operation], variables }),
      signal: controller.signal,
    })
    if (response.status === 429) throw new RetryableAniListError('AniList is rate limiting requests.', 429)
    if (!response.ok) throw new RetryableAniListError(`AniList returned HTTP ${response.status}.`, response.status)
    const payload = await response.json() as GraphqlResponse
    if (payload.errors?.length || payload.data === undefined) {
      throw new RetryableAniListError(payload.errors?.map(error => cleanText(error.message, 250)).filter(Boolean).join('; ') || 'AniList returned no data.')
    }
    return payload.data
  } catch (error) {
    if (error instanceof RetryableAniListError) throw error
    throw new RetryableAniListError(error instanceof Error && error.name === 'AbortError' ? 'AniList request timed out.' : 'AniList is temporarily unavailable.')
  } finally {
    clearTimeout(timeout)
  }
}

/** Cached upstream operation. The directive is intentionally kept at function scope. */
const cachedOperation = async (operation: Operation, variablesKey: string): Promise<unknown> => {
  'use cache'
  cacheLife(cacheProfile(operation))
  const variables = JSON.parse(variablesKey) as Record<string, unknown>
  const key = `${operation}:${variablesKey}`
  try {
    const value = await fetchUpstream(operation, variables)
    rememberStaleResult(key, value)
    return value
  } catch (error) {
    const stale = staleResults.get(key)
    if (stale && Date.now() - stale.savedAt <= MAX_STALE_MS) return stale.value
    throw error
  }
}

const runOperation = async (operation: Operation, variables: Record<string, unknown>): Promise<unknown> =>
  cachedOperation(operation, stableJson(variables))

const preferencesValue = (value?: ContentPreferences | boolean | null): ContentPreferences => normalizeContentPreferences(value)

type AniListSchedulePageInput = AniListPageInput & { airingSchedules?: unknown[] }

/**
 * AniList exposes airing-time filters on Page.airingSchedules, not on the
 * Page.media connection. Convert those schedule entries to the normal media
 * page shape while preserving the airing timestamp for broadcast labels.
 */
const schedulePageInput = (value: unknown): AniListPageInput => {
  const page = ((value as { Page?: AniListSchedulePageInput })?.Page || {})
  if (!Array.isArray(page.airingSchedules)) return page

  const media = page.airingSchedules.flatMap(entry => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return []
    const record = entry as Record<string, unknown>
    if (!record.media || typeof record.media !== 'object' || Array.isArray(record.media)) return []

    const airingMedia = { ...(record.media as Record<string, unknown>) }
    const existingAiring = airingMedia.nextAiringEpisode && typeof airingMedia.nextAiringEpisode === 'object' && !Array.isArray(airingMedia.nextAiringEpisode)
      ? airingMedia.nextAiringEpisode as Record<string, unknown>
      : {}
    const airingAt = Number(record.airingAt)
    const episode = Number(record.episode)
    if (Number.isFinite(airingAt) && airingAt > 0) {
      airingMedia.nextAiringEpisode = {
        ...existingAiring,
        airingAt,
        ...(Number.isFinite(episode) && episode > 0 ? { episode } : {}),
      }
    }
    return [airingMedia]
  })

  return { ...page, media }
}

const mapPage = (value: unknown, preferences: ContentPreferences): NormalizedPage => {
  const page = normalizeAniListPage(schedulePageInput(value))
  const data = page.data.filter(item => isContentAllowed(item.contentRating, preferences))
  return { ...page, data, pagination: { ...page.pagination, items: { ...page.pagination.items, count: data.length } } }
}

const needsAdultPartition = (preferences: ContentPreferences): boolean => preferences.showMature || preferences.showExplicit

const listVariables = (page: number, limit: number, preferences: ContentPreferences, extra: Record<string, unknown> = {}) => ({
  page: safePage(page),
  perPage: safeLimit(limit),
  isAdult: false,
  ...extra,
})

const mergeResponses = (responses: NormalizedPage[]): NormalizedPage => {
  const first = responses[0] || { data: [], pagination: { current_page: 1, last_visible_page: 1, has_next_page: false, items: { count: 0, total: 0, per_page: 0 } } }
  const data = Array.from(new Map(responses.flatMap(item => item.data).map(item => [item.mal_id, item])).values())
  return {
    data,
    pagination: {
      current_page: first.pagination.current_page,
      last_visible_page: Math.max(...responses.map(item => item.pagination.last_visible_page), 1),
      has_next_page: responses.some(item => item.pagination.has_next_page),
      items: { count: data.length, total: responses.reduce((sum, item) => sum + item.pagination.items.total, 0), per_page: first.pagination.items.per_page },
    },
  }
}

/** Strip detail-only fields before a card/list result crosses the RSC boundary. */
const toListItem = (anime: AnimeDetails): AnimeListItem => ({
  mal_id: anime.mal_id,
  anilist_id: anime.anilist_id,
  title: anime.title,
  title_english: anime.title_english,
  title_japanese: anime.title_japanese,
  title_synonyms: anime.title_synonyms,
  cover: anime.cover,
  images: anime.images,
  url: anime.url,
  synopsis: anime.synopsis,
  score: anime.score,
  average_score: anime.average_score,
  score_percentage: anime.score_percentage,
  rank: anime.rank,
  popularity: anime.popularity,
  favorites: anime.favorites,
  type: anime.type,
  episodes: anime.episodes,
  status: anime.status,
  duration: anime.duration,
  rating: anime.rating,
  contentRating: anime.contentRating,
  isAdult: anime.isAdult,
  season: anime.season,
  year: anime.year,
  genres: anime.genres,
  themes: anime.themes,
  demographics: anime.demographics,
  explicit_genres: anime.explicit_genres,
  tags: anime.tags,
})

const runContentOperation = async (operation: 'cards' | 'search' | 'schedule', variables: Record<string, unknown>, preferences: ContentPreferences): Promise<NormalizedPage> => {
  const safeVariables = operation === 'schedule' ? variables : { ...variables, isAdult: false }
  const safePageResult = mapPage(await runOperation(operation, safeVariables), preferences)
  if (operation === 'schedule' || !needsAdultPartition(preferences)) return safePageResult
  const adultPageResult = mapPage(await runOperation(operation, { ...variables, isAdult: true }), preferences)
  return mergeResponses([safePageResult, adultPageResult])
}

const toPublicResult = (response: NormalizedPage): PageResult<AnimeListItem> => ({
  items: response.data.map(toListItem),
  page: response.pagination.current_page,
  totalPages: response.pagination.last_visible_page,
  totalItems: response.pagination.items.total,
  hasNextPage: response.pagination.has_next_page,
})

export async function getAnimeList(options: {
  page?: number
  limit?: number
  preferences?: ContentPreferences | boolean
  sort?: string
  order?: 'asc' | 'desc'
  format?: 'MOVIE'
  season?: string
  seasonYear?: number
  filters?: AnimeFilterOptions
} = {}): Promise<PageResult<AnimeListItem>> {
  const preferences = preferencesValue(options.preferences)
  const direction = options.order === 'asc' ? 'ASC' : 'DESC'
  const sort = options.sort === 'score' ? `SCORE_${direction}` : options.sort === 'title' ? `TITLE_ROMAJI_${direction}` : options.sort === 'recent' ? `START_DATE_${direction}` : `POPULARITY_${direction}`
  const filters = options.filters || {}
  const targetLimit = options.limit || 24
  const fetchLimit = Math.min(Math.max(targetLimit + 6, Math.ceil(targetLimit * 1.5)), 50)
  const variables = listVariables(options.page || 1, fetchLimit, preferences, {
    sort: [sort],
    format: options.format ? [options.format] : undefined,
    season: options.season?.toUpperCase(),
    seasonYear: Number.isInteger(options.seasonYear) ? options.seasonYear : undefined,
    genreIn: filters.genreNames,
    genreNotIn: filters.excludedGenreNames,
    tagIn: filters.tagNames,
    tagNotIn: filters.excludedTagNames,
    minimumTagRank: Number.isFinite(filters.minimumTagRank) ? Math.max(0, Math.min(100, Math.floor(filters.minimumTagRank as number))) : undefined,
  })
  const response = await runContentOperation('cards', variables, preferences)
  const result = toPublicResult(response)
  result.items = result.items.slice(0, targetLimit)
  return result
}

export async function searchAnimeServer(query: string, page = 1, limit = 24, preferences?: ContentPreferences | boolean): Promise<PageResult<AnimeListItem>> {
  const safe = safeQuery(query)
  if (safe.length < 2) return { items: [], page: 1, totalPages: 1, totalItems: 0, hasNextPage: false }
  const normalized = preferencesValue(preferences)
  const response = await runContentOperation('search', listVariables(page, limit, normalized, { search: safe }), normalized)
  return toPublicResult(response)
}

export async function getAnimeDetails(publicId: number, preferences?: ContentPreferences | boolean): Promise<AnimeDetails> {
  if (!Number.isSafeInteger(publicId) || publicId <= 0) throw new RetryableAniListError('Invalid anime id.', 400)
  const normalized = preferencesValue(preferences)
  const variables = publicId > ANILIST_PUBLIC_ID_OFFSET ? { id: publicId - ANILIST_PUBLIC_ID_OFFSET } : { idMal: publicId }
  const payload = await runOperation('details', variables) as { Media?: unknown }
  if (!payload.Media) throw new RetryableAniListError('Anime details were not found.', 404)
  const anime = normalizeAniListMedia(payload.Media)
  if (!isContentAllowed(anime.contentRating, normalized)) throw new RetryableAniListError('This title is hidden by your content preferences.', 451)
  return anime
}

export async function getWeeklySchedule(weekStartUtc: Date, preferences?: ContentPreferences | boolean): Promise<Record<string, AnimeListItem[]>> {
  const normalized = preferencesValue(preferences)
  const safeWeekStart = Number.isFinite(weekStartUtc.getTime()) ? weekStartUtc : getUtcWeekStart()
  const start = Math.floor(safeWeekStart.getTime() / 1_000)
  const end = start + 7 * 24 * 60 * 60
  const pages: NormalizedPage[] = []
  const maxPages = 12
  for (let page = 1; page <= maxPages; page += 1) {
    let response: NormalizedPage
    try {
      response = await runContentOperation('schedule', {
        page,
        perPage: 50,
        airingAtGreater: start,
        airingAtLesser: end,
      }, normalized)
    } catch (error) {
      // Keep the entries already loaded if a later page is rate-limited. The
      // first page still provides a useful schedule instead of blanking the
      // whole route because one optional page failed.
      if (pages.length > 0) break
      throw error
    }
    pages.push(response)
    if (!response.pagination.has_next_page) break
  }
  const days: Record<string, AnimeListItem[]> = { monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] }
  const seen = new Map<string, Set<number>>(Object.keys(days).map(day => [day, new Set<number>()]))
  for (const anime of pages.flatMap(page => page.data)) {
    const day = anime.broadcast?.day?.toLowerCase()
    if (day && days[day] && !seen.get(day)?.has(anime.mal_id)) {
      seen.get(day)?.add(anime.mal_id)
      days[day].push(toListItem(anime))
    }
  }
  return days
}

export async function getTags(): Promise<AnimeTag[]> {
  const payload = await runOperation('tags', {}) as { GenreCollection?: unknown; MediaTagCollection?: unknown }
  const genreTags = Array.isArray(payload.GenreCollection)
    ? payload.GenreCollection.map(name => {
      const label = String(name || '').trim()
      return {
        mal_id: genreTagId(label),
        type: 'genre',
        name: label,
        url: `https://anilist.co/search/anime?genres=${encodeURIComponent(label)}`,
        category: 'genre',
        rank: undefined,
        isAdult: false,
      }
    }).filter(tag => tag.name)
    : []
  const collection = Array.isArray(payload.MediaTagCollection)
    ? payload.MediaTagCollection.map(item => ({
      mal_id: Number((item as { id?: unknown })?.id) || 0,
      type: 'tag',
      name: String((item as { name?: unknown })?.name || 'Unknown'),
      url: `https://anilist.co/search/anime?search=${encodeURIComponent(String((item as { name?: unknown })?.name || ''))}`,
      category: String((item as { category?: unknown })?.category || 'other').toLowerCase(),
      rank: Number((item as { rank?: unknown })?.rank) || undefined,
      isAdult: Boolean((item as { isAdult?: unknown })?.isAdult),
    }))
    : []
  return [...genreTags, ...collection] as AnimeTag[]
}

export const getCurrentSeasonInfo = (now = new Date()): { year: number; season: string; displayName: string } => {
  const month = now.getUTCMonth() + 1
  const season = month <= 3 ? 'winter' : month <= 6 ? 'spring' : month <= 9 ? 'summer' : 'fall'
  return { year: now.getUTCFullYear(), season, displayName: season[0].toUpperCase() + season.slice(1) }
}

export const getUtcWeekStart = (now = new Date()): Date => {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() - day + 1)
  return date
}

export const isPublicAnimeId = (value: number): boolean => Number.isSafeInteger(value) && value > 0
export { safeExternalUrl }
