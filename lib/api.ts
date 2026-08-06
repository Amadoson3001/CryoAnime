// Legacy AniList compatibility module retained for existing integrations and
// tests. Production routes use the typed server boundary in lib/anilist.ts;
// no client component imports this module at runtime.

import {
  CACHE_TTL,
  deletePendingRequest,
  getCache,
  getPendingRequest,
  getStaleCache,
  setCache,
  setPendingRequest,
} from './cache'
import {
  ContentPreferences,
  ContentRating,
  getContentRatingOverride,
  isHentaiLabel,
  isMatureLabel,
  isSexualContentCategory,
  isContentAllowed,
  normalizeContentPreferences,
  ratingLabel,
} from './contentRatings'

const DEFAULT_ANILIST_API_BASE = 'https://graphql.anilist.co'

const resolveApiBase = (): string => {
  const configured = process.env.ANILIST_API_URL?.trim()
  if (!configured) return DEFAULT_ANILIST_API_BASE
  try {
    const url = new URL(configured)
    const isLocalDevelopment = url.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    if (url.protocol !== 'https:' && !isLocalDevelopment) return DEFAULT_ANILIST_API_BASE
    return url.toString().replace(/\/+$/, '')
  } catch {
    return DEFAULT_ANILIST_API_BASE
  }
}

const ANILIST_API_BASE = resolveApiBase()

const USER_AGENT = process.env.ANILIST_USER_AGENT?.trim() || 'CryoAnime/1.0'

const APPROVED_STREAMING_HOSTS = new Set([
  'anilist.co',
  'crunchyroll.com',
  'hidive.com',
  'hulu.com',
  'funimation.com',
  'netflix.com',
  'primevideo.com',
  'amazon.com',
  'disneyplus.com',
  'youtube.com',
  'youtu.be',
])

const isApprovedHost = (hostname: string): boolean => {
  const normalized = hostname.toLowerCase().replace(/^www\./, '')
  return Array.from(APPROVED_STREAMING_HOSTS).some(host =>
    normalized === host || normalized.endsWith(`.${host}`),
  )
}

/**
 * AniList provider responses are external input. Only expose HTTPS links from
 * known streaming providers to the UI; javascript:, data:, blob:, and
 * look-alike hosts are rejected before they can become clickable links.
 */
export const safeExternalUrl = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || value.length > 2048) return undefined
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || !isApprovedHost(url.hostname)) return undefined
    return url.href
  } catch {
    return undefined
  }
}

export interface AnimeData {
  /** Provider-compatible public id. AniList's MAL id is preferred when available. */
  mal_id: number
  /** Native AniList id, useful when a title has no MAL mapping. */
  anilist_id?: number
  title: string
  title_english?: string
  title_japanese?: string
  title_synonyms?: string[]
  images: {
    jpg: { image_url: string; small_image_url: string; large_image_url: string }
    webp?: { image_url: string; small_image_url: string; large_image_url: string }
  }
  url?: string
  synopsis?: string
  background?: string
  score?: number
  /** AniList's native 0–100 average score, retained alongside the UI's /10 score. */
  average_score?: number
  score_percentage?: number
  /** AniList's unweighted 0–100 mean score. */
  mean_score?: number
  mean_score_percentage?: number
  scored_by?: number
  rank?: number
  popularity?: number
  members?: number
  favorites?: number
  type: string
  episodes?: number
  status: string
  source?: string
  aired: {
    from?: string
    to?: string
    prop: {
      from: { day?: number; month?: number; year?: number }
      to: { day?: number; month?: number; year?: number }
    }
  }
  duration: string
  rating?: string
  /** Normalized app classification: safe, mature, or Hentai-only explicit. */
  contentRating: ContentRating
  /** AniList's raw 18+ flag, retained for diagnostics and moderation. */
  isAdult: boolean
  season?: string
  year?: number
  broadcast?: { day?: string; time?: string; timezone?: string; string?: string }
  genres: AnimeTag[]
  explicit_genres?: AnimeTag[]
  themes?: AnimeTag[]
  demographics?: AnimeTag[]
  /** Every AniList tag, including technical/content/setting tags not exposed by the old API. */
  tags?: AnimeTag[]
  producers: Array<{ mal_id: number; type: string; name: string; url: string }>
  licensors: Array<{ mal_id: number; type: string; name: string; url: string }>
  studios: Array<{ mal_id: number; type: string; name: string; url: string }>
  streaming?: Array<{ name: string; url: string }>
  trailer?: { youtube_id?: string; url?: string; embed_url?: string }
  relations?: Array<{ relation: string; entry: Array<{ mal_id: number; type: string; name: string; url: string }> }>
  theme?: { openings?: string[]; endings?: string[] }
  characters?: CharacterWithRole[]
}

export interface AnimeTag {
  mal_id: number
  type: string
  name: string
  url: string
  /** AniList relevance rank, expressed as a percentage from 0 to 100. */
  rank?: number
  category?: string
  isAdult?: boolean
  isGeneralSpoiler?: boolean
  isMediaSpoiler?: boolean
}

export interface CharacterData {
  mal_id: number
  url: string
  images: {
    jpg: { image_url: string; small_image_url: string }
    webp?: { image_url: string; small_image_url: string }
  }
  name: string
  name_kanji?: string
  nicknames: string[]
  favorites: number
  about?: string
  role?: string
}

export interface VoiceActorData {
  person: { mal_id: number; name: string; images?: { jpg?: { image_url: string; small_image_url: string } } }
  language: string
}

export interface CharacterWithRole {
  character: CharacterData
  role: string
  favorites?: number
  voice_actors?: VoiceActorData[]
}

export interface Genre {
  mal_id: number
  name: string
  url: string
  count?: number
  category?: string
  isAdult?: boolean
  /** Some mixed Explore categories contain both native genres and AniList tags. */
  filterKind?: 'genre' | 'tag'
}
export interface GenresResponse { data: Genre[] }
export interface AnimeResponse {
  data: AnimeData[]
  pagination: {
    last_visible_page: number
    has_next_page: boolean
    current_page: number
    items: { count: number; total: number; per_page: number }
  }
}

export type ImageSize = 'small' | 'medium' | 'large'
export type TagCategory = 'genres' | 'all_tags' | 'themes' | 'demographics' | 'explicit_genres' | 'technical' | 'content' | 'setting' | 'format'

export interface AnimeFilterOptions {
  genreIds?: number[]
  excludedGenreIds?: number[]
  tagIds?: number[]
  excludedTagIds?: number[]
  genreNames?: string[]
  excludedGenreNames?: string[]
  tagNames?: string[]
  excludedTagNames?: string[]
  minimumTagRank?: number
}

type ApiRequestOptions = { signal?: AbortSignal }
type AniListPage<T> = { pageInfo: { total: number; currentPage: number; lastPage: number; hasNextPage: boolean; perPage: number }; media: T[] }

export class ApiRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

export class ContentRestrictedError extends Error {
  readonly status = 451

  constructor() {
    super('This title is hidden by your content preferences.')
    this.name = 'ContentRestrictedError'
  }
}

const REQUEST_TIMEOUT = 10000
const REQUEST_INTERVAL = 700
const MAX_STALE_AGE = 7 * 24 * 60 * 60 * 1000
let nextRequestAt = 0
let requestSlotTail: Promise<void> = Promise.resolve()

const wait = (delay: number, signal?: AbortSignal): Promise<void> => {
  if (delay <= 0) return Promise.resolve()
  return new Promise((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const onAbort = () => {
      if (timer !== undefined) clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      reject(signal?.reason || new DOMException('Request aborted.', 'AbortError'))
    }
    timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, delay)
    if (signal?.aborted) onAbort()
    else signal?.addEventListener('abort', onAbort, { once: true })
  })
}

const throwIfAborted = (signal?: AbortSignal): void => {
  if (signal?.aborted) {
    throw signal.reason || new DOMException('Request aborted.', 'AbortError')
  }
}

const scheduleRequest = <T>(request: () => Promise<T>, signal?: AbortSignal): Promise<T> => {
  const slot = requestSlotTail.then(async () => {
    throwIfAborted(signal)
    const delay = Math.max(0, nextRequestAt - Date.now())
    if (delay) await wait(delay, signal)
    throwIfAborted(signal)
    nextRequestAt = Date.now() + REQUEST_INTERVAL
  })
  requestSlotTail = slot.then(() => undefined, () => undefined)
  return slot.then(request)
}

const isAbortError = (error: unknown): boolean => error instanceof Error && error.name === 'AbortError'

const fetchWithTimeout = async (query: string, variables: Record<string, unknown>, signal?: AbortSignal): Promise<Response> => {
  const controller = new AbortController()
  const onAbort = () => controller.abort(signal?.reason)
  if (signal?.aborted) onAbort()
  else signal?.addEventListener('abort', onAbort, { once: true })
  const timeout = setTimeout(() => controller.abort(new DOMException('Anime data request timed out.', 'TimeoutError')), REQUEST_TIMEOUT)
  try {
    return await fetch(ANILIST_API_BASE, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': USER_AGENT },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
      cache: 'default',
      credentials: 'omit',
    })
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', onAbort)
  }
}

const cacheDuration = (cacheKey: string): number => {
  if (cacheKey.startsWith('details_') || cacheKey.startsWith('characters_') || cacheKey.startsWith('tags_')) return CACHE_TTL.STATIC
  if (cacheKey.startsWith('schedule_') || cacheKey.startsWith('seasonal_')) return CACHE_TTL.SEMI_STATIC
  if (cacheKey.startsWith('landing_')) return CACHE_TTL.LANDING
  return CACHE_TTL.DYNAMIC
}

const queryAniList = async <T>(query: string, variables: Record<string, unknown>, cacheKey: string, options: ApiRequestOptions = {}): Promise<T> => {
  throwIfAborted(options.signal)
  const cached = getCache<T>(cacheKey)
  if (cached) return cached

  const pendingKey = options.signal ? null : `${cacheKey}:${JSON.stringify(variables)}`
  const pending = pendingKey ? getPendingRequest<T>(pendingKey) : null
  if (pending) return pending

  const stale = getStaleCache<T>(cacheKey, MAX_STALE_AGE)
  const requestPromise = (async () => {
    try {
      const response = await scheduleRequest(() => fetchWithTimeout(query, variables, options.signal), options.signal)
      if (response.status === 429) throw new ApiRequestError('AniList is temporarily rate-limited. Please wait before retrying.', 429)
      if (!response.ok) throw new ApiRequestError(`HTTP error! status: ${response.status}`, response.status)
      const payload = await response.json() as { data?: T; errors?: Array<{ message?: string }> }
      if (payload.errors?.length || payload.data === undefined) {
        const errorStatus = (payload.errors?.[0] as { status?: number } | undefined)?.status
        throw new ApiRequestError(payload.errors?.map(error => error.message).filter(Boolean).join('; ') || 'AniList returned an invalid response.', errorStatus === 429 ? 429 : 502)
      }
      setCache(cacheKey, payload.data, cacheDuration(cacheKey))
      return payload.data
    } catch (error) {
      if (!isAbortError(error) && stale !== null) return stale
      throw error
    } finally {
      if (pendingKey) deletePendingRequest(pendingKey)
    }
  })()
  if (pendingKey) setPendingRequest(pendingKey, requestPromise)
  const staleWhileRevalidate = stale !== null &&
    (cacheKey.startsWith('landing_') || cacheKey.startsWith('schedule_') || cacheKey.startsWith('seasonal_'))
  if (staleWhileRevalidate) {
    void requestPromise.catch(() => undefined)
    return stale as T
  }
  return requestPromise
}

const LIST_MEDIA_FIELDS = `
  id idMal type format status source description(asHtml: false)
  title { romaji english native userPreferred } synonyms
  genres averageScore meanScore popularity favourites rankings { rank type allTime context season format year }
  episodes duration season seasonYear isAdult
  startDate { year month day } endDate { year month day }
  coverImage { extraLarge large medium }
  tags { id name category rank isAdult isGeneralSpoiler isMediaSpoiler }
  nextAiringEpisode { airingAt episode }
  siteUrl
`

const DETAIL_MEDIA_FIELDS = `
  ${LIST_MEDIA_FIELDS}
  trailer { id site thumbnail }
  studios { edges { isMain node { id name siteUrl } } }
  relations { edges { relationType node { id idMal type format title { romaji english native userPreferred } } } }
  streamingEpisodes { title thumbnail url site }
`

const LIST_QUERY = `query AnimeList($page: Int!, $perPage: Int!, $sort: [MediaSort], $search: String, $genreIn: [String], $genreNotIn: [String], $tagIn: [String], $tagNotIn: [String], $minimumTagRank: Int, $type: MediaType, $format: [MediaFormat], $season: MediaSeason, $seasonYear: Int, $isAdult: Boolean!) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { total currentPage lastPage hasNextPage perPage }
    media(type: $type, format_in: $format, search: $search, genre_in: $genreIn, genre_not_in: $genreNotIn, tag_in: $tagIn, tag_not_in: $tagNotIn, minimumTagRank: $minimumTagRank, season: $season, seasonYear: $seasonYear, isAdult: $isAdult, sort: $sort) { ${LIST_MEDIA_FIELDS} }
  }
}`

const DETAILS_QUERY = `query AnimeDetails($id: Int, $idMal: Int) {
  Media(id: $id, idMal: $idMal, type: ANIME) { ${DETAIL_MEDIA_FIELDS}
    characters(sort: [ROLE, FAVOURITES_DESC], perPage: 30) {
      edges { role node { id siteUrl name { full native alternative } image { large medium } description favourites } voiceActors(language: JAPANESE) { id siteUrl name { full native } image { large medium } } }
    }
  }
}`

const SCHEDULE_QUERY = `query AiringAnime($page: Int!, $perPage: Int!, $isAdult: Boolean!) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { total currentPage lastPage hasNextPage perPage }
    media(type: ANIME, status: RELEASING, isAdult: $isAdult, sort: [POPULARITY_DESC]) { ${LIST_MEDIA_FIELDS} }
  }
}`

const hashId = (value: string): number => {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619)
  return (hash >>> 0) || 1
}

// Most AniList anime have a MAL mapping, but not all of them do. Reserving a
// numeric range for unmapped AniList ids lets old MAL deep links keep working
// without making a new AniList id ambiguous with somebody else's MAL id.
const ANILIST_PUBLIC_ID_OFFSET = 1_000_000_000
const publicMediaId = (media: any): number => Number(media?.idMal) || ANILIST_PUBLIC_ID_OFFSET + Number(media?.id || 0)

const genreLookup = new Map<number, string>()
const tagLookup = new Map<number, string>()
const providerUrl = (id: number) => `https://anilist.co/anime/${id}`

// Keep direct genre calls useful even before the Explore page has populated
// the live GenreCollection. IDs are deterministic and match the values
// returned by fetchGenres.
const KNOWN_GENRES = ['Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 'Horror', 'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller']
KNOWN_GENRES.forEach((name: string) => genreLookup.set(hashId(`genre:${name}`), name))
const FALLBACK_TAGS: Record<Exclude<TagCategory, 'genres'>, string[]> = {
  all_tags: ['Adult Cast', 'CGI', 'Episodic', 'Historical', 'Isekai', 'Male Protagonist', 'Female Protagonist', 'Reincarnation', 'School', 'Space', 'Time Travel'],
  themes: ['Adult Cast', 'Historical', 'Isekai', 'Mahou Shoujo', 'Martial Arts', 'Mecha', 'Music', 'Psychological', 'School', 'Space', 'Super Power', 'Time Travel', 'Vampire', 'Video Game'],
  demographics: ['Josei', 'Kids', 'Seinen', 'Shoujo', 'Shounen'],
  explicit_genres: ['Nudity', 'Sex', 'Sexual Content', 'Large Breasts', 'Female Harem', 'Male Harem'],
  technical: ['CGI', 'Episodic', 'Full Color', 'Primarily Adult Cast', 'Primarily Female Cast', 'Primarily Male Cast'],
  content: ['Gore', 'Iyashikei', 'Male Protagonist', 'Female Protagonist', 'Reincarnation', 'Time Skip'],
  setting: ['School', 'Urban', 'Rural', 'Historical', 'Workplace', 'Space'],
  format: ['Anthology', 'Episodic', 'Shorts', 'Stop Motion'],
}
Object.entries(FALLBACK_TAGS).forEach(([category, names]) => names.forEach(name => tagLookup.set(hashId(`${category}:${name}`), name)))

const dateValue = (date?: { year?: number; month?: number; day?: number } | null): string | undefined => {
  const year = Number(date?.year)
  const month = Number(date?.month || 1)
  const day = Number(date?.day || 1)
  if (!Number.isInteger(year) || year < 1 || !Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(day) || day < 1 || day > 31) return undefined
  const parsed = new Date(Date.UTC(year, month - 1, day))
  if (Number.isNaN(parsed.getTime()) || parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return undefined
  return parsed.toISOString()
}

const titleOf = (title: any): string => [title?.english, title?.romaji, title?.native, title?.userPreferred].find(value => typeof value === 'string' && value.trim()) || 'Unknown title'
const titleEnglish = (title: any): string | undefined => typeof title?.english === 'string' && title.english.trim() ? title.english : undefined
const titleJapanese = (title: any): string | undefined => typeof title?.native === 'string' && title.native.trim() ? title.native : undefined
const cleanDescription = (value?: unknown): string | undefined => typeof value === 'string' ? value.replace(/<br\s*\/?>(\n)?/gi, '\n').replace(/<[^>]+>/g, '').trim() || undefined : undefined
const formatName = (value?: unknown): string => typeof value === 'string' && value.trim() ? value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase()) : 'Unknown'
const formatType = (format?: string | null): string => ({ TV: 'TV', TV_SHORT: 'TV Short', MOVIE: 'Movie', OVA: 'OVA', ONA: 'ONA', SPECIAL: 'Special', MUSIC: 'Music' } as Record<string, string>)[format || ''] || format || 'Unknown'
const formatStatus = (status?: string | null): string => ({ FINISHED: 'Finished Airing', RELEASING: 'Currently Airing', NOT_YET_RELEASED: 'Not yet aired', CANCELLED: 'Cancelled', HIATUS: 'On Hiatus' } as Record<string, string>)[status || ''] || formatName(status)

const makeTag = (id: number, name: string, type: string, url = `https://anilist.co/search/anime?${type === 'genre' ? 'genres' : 'tags'}=${encodeURIComponent(name)}`) => ({ mal_id: id, type, name, url })

const normalizeTag = (tag: any): AnimeTag => {
  const id = Number(tag?.id) || hashId(`tag:${tag?.name || 'unknown'}`)
  const category = String(tag?.category || 'other').trim().toLowerCase()
  const rank = Number(tag?.rank)
  tagLookup.set(id, String(tag?.name || 'Unknown'))
  return {
    ...makeTag(id, String(tag?.name || 'Unknown'), category),
    category,
    rank: Number.isFinite(rank) ? Math.max(0, Math.min(100, rank)) : undefined,
    isAdult: Boolean(tag?.isAdult),
    isGeneralSpoiler: Boolean(tag?.isGeneralSpoiler),
    isMediaSpoiler: Boolean(tag?.isMediaSpoiler),
  }
}

const normalizeCharacter = (edge: any): CharacterWithRole => {
  const node = edge?.node || {}
  const id = Number(node.id) || hashId(node.name?.full || 'character')
  return {
    role: formatName(edge?.role),
    favorites: Number(node.favourites) || 0,
    character: {
      mal_id: id,
      url: node.siteUrl || `https://anilist.co/character/${id}`,
      images: { jpg: { image_url: node.image?.large || node.image?.medium || '/placeholder-anime.svg', small_image_url: node.image?.medium || node.image?.large || '/placeholder-anime.svg' } },
      name: typeof node.name?.full === 'string' ? node.name.full : 'Unknown Character',
      name_kanji: typeof node.name?.native === 'string' ? node.name.native : undefined,
      nicknames: Array.isArray(node.name?.alternative) ? node.name.alternative.filter((value: unknown): value is string => typeof value === 'string') : [],
      favorites: Number(node.favourites) || 0,
      about: cleanDescription(node.description),
    },
    voice_actors: (Array.isArray(edge?.voiceActors) ? edge.voiceActors : []).map((person: any) => ({
      person: { mal_id: Number(person.id) || hashId(String(person.name?.full || 'person')), name: typeof person.name?.full === 'string' ? person.name.full : 'Unknown', images: { jpg: { image_url: person.image?.large || person.image?.medium || '/placeholder-anime.svg', small_image_url: person.image?.medium || person.image?.large || '/placeholder-anime.svg' } } },
      language: 'Japanese',
    })),
  }
}

/** Legacy provider mapping retained for compatibility tests/integrations. */
export const normalizeAniListMedia = (media: any): AnimeData => {
  const id = Number(media?.id) || 0
  const publicId = publicMediaId(media)
  const title = media?.title || {}
  const start = dateValue(media?.startDate)
  const end = dateValue(media?.endDate)
  const allTags = Array.isArray(media?.tags) ? media.tags : []
  const genres = (Array.isArray(media?.genres) ? media.genres : [])
    .filter((name: unknown): name is string => typeof name === 'string' && name.trim().length > 0)
    .map((name: string) => { const tagId = hashId(`genre:${name}`); genreLookup.set(tagId, name); return makeTag(tagId, name, 'genre') })
  const tags = allTags.map(normalizeTag)
  const categoryMatches = (tag: AnimeTag, category: string): boolean => tag.category === category || tag.category?.startsWith(`${category}-`) === true
  const themes = tags.filter((tag: AnimeTag) => categoryMatches(tag, 'theme'))
  const demographics = tags.filter((tag: AnimeTag) => categoryMatches(tag, 'demographic'))
  const normalizedGenreNames = genres.map((genre: AnimeTag) => genre.name.trim().toLowerCase())
  const anilistAdult = Boolean(media?.isAdult)
  const hasHentaiLabel = genres.some((genre: AnimeTag) => isHentaiLabel(genre.name)) || tags.some((tag: AnimeTag) => isHentaiLabel(tag.name))
  const hasMatureLabel = normalizedGenreNames.some((name: string) => isMatureLabel(name)) || tags.some((tag: AnimeTag) => isMatureLabel(tag.name) || isSexualContentCategory(tag.category))
  const override = getContentRatingOverride(id, Number(media?.idMal) || undefined)
  const contentRating: ContentRating = override || (hasHentaiLabel ? 'explicit' : (anilistAdult || hasMatureLabel) ? 'mature' : 'safe')
  const explicit = [...genres.filter((genre: AnimeTag) => isHentaiLabel(genre.name)), ...tags.filter((tag: AnimeTag) => isHentaiLabel(tag.name))].map((tag: AnimeTag) => ({ ...tag, type: 'explicit_genre' }))
  const studioEdges = Array.isArray(media?.studios?.edges) ? media.studios.edges : []
  const studios = studioEdges.map((edge: any) => makeTag(Number(edge.node?.id) || hashId(edge.node?.name || ''), edge.node?.name || 'Unknown', 'studio', edge.node?.siteUrl || providerUrl(id)))
  // AniList does not expose a producer role on Media.studios. Do not present
  // secondary studios as producers; an empty list is more accurate than a
  // misleading credit.
  const producers: AnimeData['producers'] = []
  const relationEdges = Array.isArray(media?.relations?.edges) ? media.relations.edges : []
  const relations = relationEdges.map((edge: any) => ({ relation: formatName(edge.relationType), entry: edge.node ? [{ mal_id: publicMediaId(edge.node), type: formatType(edge.node.format || edge.node.type), name: titleOf(edge.node.title), url: providerUrl(Number(edge.node.id)) }] : [] }))
  const airingTimestamp = Number(media?.nextAiringEpisode?.airingAt)
  const airingAt = Number.isFinite(airingTimestamp) && airingTimestamp > 0 ? new Date(airingTimestamp * 1000) : undefined
  const rating = ratingLabel(contentRating)
  const rank = Array.isArray(media?.rankings) ? media.rankings.find((item: any) => item?.type === 'RATED' || item?.type === 'POPULAR')?.rank : undefined
  return {
    mal_id: publicId,
    anilist_id: id,
    title: titleOf(title),
    title_english: titleEnglish(title),
    title_japanese: titleJapanese(title),
    title_synonyms: Array.isArray(media?.synonyms) ? media.synonyms : [],
    images: { jpg: { image_url: media?.coverImage?.large || media?.coverImage?.extraLarge || '/placeholder-anime.svg', small_image_url: media?.coverImage?.medium || media?.coverImage?.large || '/placeholder-anime.svg', large_image_url: media?.coverImage?.extraLarge || media?.coverImage?.large || '/placeholder-anime.svg' } },
    url: media?.siteUrl || providerUrl(id),
    synopsis: cleanDescription(media?.description),
    score: typeof media?.averageScore === 'number' ? media.averageScore / 10 : undefined,
    average_score: typeof media?.averageScore === 'number' ? media.averageScore : undefined,
    score_percentage: typeof media?.averageScore === 'number' ? media.averageScore : undefined,
    mean_score: typeof media?.meanScore === 'number' ? media.meanScore : undefined,
    mean_score_percentage: typeof media?.meanScore === 'number' ? media.meanScore : undefined,
    rank,
    popularity: Number(media?.popularity) || undefined,
    members: undefined,
    favorites: Number(media?.favourites) || undefined,
    type: formatType(media?.format || media?.type),
    episodes: media?.episodes || undefined,
    status: formatStatus(media?.status),
    source: formatName(media?.source),
    aired: { from: start, to: end, prop: { from: media?.startDate || {}, to: media?.endDate || {} } },
    duration: media?.duration ? `${media.duration} min` : 'Unknown',
    rating,
    contentRating,
    isAdult: anilistAdult,
    season: media?.season ? String(media.season).toLowerCase() : undefined,
    year: media?.seasonYear || media?.startDate?.year || undefined,
    broadcast: airingAt && !Number.isNaN(airingAt.getTime()) ? { day: airingAt.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }), time: airingAt.toISOString().slice(11, 16), timezone: 'UTC', string: airingAt.toUTCString() } : undefined,
    genres,
    themes,
    demographics,
    explicit_genres: explicit,
    tags,
    producers,
    licensors: [],
    studios,
    streaming: (Array.isArray(media?.streamingEpisodes) ? media.streamingEpisodes : [])
      .map((item: any) => ({ name: String(item?.site || item?.title || 'Watch'), url: safeExternalUrl(item?.url) }))
      .filter((item: { name: string; url?: string }): item is { name: string; url: string } => Boolean(item.url)),
    trailer: typeof media?.trailer?.id === 'string' && /^[A-Za-z0-9_-]{6,64}$/.test(media.trailer.id)
      ? { youtube_id: media.trailer.id, url: `https://www.youtube.com/watch?v=${media.trailer.id}`, embed_url: `https://www.youtube.com/embed/${media.trailer.id}` }
      : undefined,
    relations,
    characters: (media?.characters?.edges || []).map(normalizeCharacter),
  }
}

export const normalizeAniListPage = (page: AniListPage<any>): AnimeResponse => ({
  data: (page?.media || []).filter(Boolean).map(normalizeAniListMedia),
  pagination: { last_visible_page: page?.pageInfo?.lastPage || 1, has_next_page: Boolean(page?.pageInfo?.hasNextPage), current_page: page?.pageInfo?.currentPage || 1, items: { count: page?.media?.length || 0, total: page?.pageInfo?.total || 0, per_page: page?.pageInfo?.perPage || page?.media?.length || 0 } },
})

const dedupe = (items: AnimeData[]): AnimeData[] => Array.from(new Map(items.map(item => [item.mal_id, item])).values())
const createSinglePageResponse = (data: AnimeData[], perPage: number): AnimeResponse => ({ data, pagination: { last_visible_page: 1, has_next_page: false, current_page: 1, items: { count: data.length, total: data.length, per_page: perPage } } })
type ContentFilter = ContentPreferences | boolean
const contentFilter = (value?: ContentFilter | null): ContentPreferences => normalizeContentPreferences(value)
const CONTENT_POLICY_VERSION = 'hentai-only-v2'
const contentKey = (value?: ContentFilter | null): string => {
  const preferences = contentFilter(value)
  return `${CONTENT_POLICY_VERSION}_m${preferences.showMature ? 1 : 0}e${preferences.showExplicit ? 1 : 0}`
}
const cacheToken = (values: unknown): string => encodeURIComponent(JSON.stringify(values))
const inferContentRating = (anime: AnimeData): ContentRating => {
  if (anime.contentRating) return anime.contentRating
  const tags = [...(anime.genres || []), ...(anime.themes || []), ...(anime.explicit_genres || []), ...(anime.tags || [])]
  if (tags.some(item => isHentaiLabel(item.name))) return 'explicit'
  if (tags.some(item => isMatureLabel(item.name) || isSexualContentCategory(item.category))) return 'mature'
  if (anime.rating === 'Rx - Hentai') return 'explicit'
  if (anime.rating === 'R+ - Mild Nudity') return 'mature'
  // AniList's media-level adult flag is broader than hentai. Keep legacy
  // records visible through the mature preference unless a Hentai label is
  // present or a local moderation override says otherwise.
  if (anime.isAdult) return 'mature'
  return 'safe'
}
const filterContent = (response: AnimeResponse, preferences?: ContentFilter | null): AnimeResponse => {
  const normalized = contentFilter(preferences)
  return { ...response, data: response.data.filter(anime => isContentAllowed(anime.contentRating || inferContentRating(anime), normalized)) }
}

const safePage = (page: number) => Number.isFinite(page) ? Math.max(1, Math.floor(page)) : 1
const safeLimit = (limit: number) => Number.isFinite(limit) ? Math.max(1, Math.min(25, Math.floor(limit))) : 20
const sortValue = (sort = 'popularity', order = 'desc'): string => {
  const direction = order === 'asc' ? 'ASC' : 'DESC'
  if (sort === 'score') return `SCORE_${direction}`
  if (sort === 'recent') return `START_DATE_${direction}`
  if (sort === 'title') return `TITLE_ROMAJI_${direction}`
  return `POPULARITY_${direction}`
}
const seasonValue = (season: string): string => {
  const value = typeof season === 'string' ? season.toUpperCase() : ''
  if (!['WINTER', 'SPRING', 'SUMMER', 'FALL'].includes(value)) throw new Error(`Invalid anime season: ${season}`)
  return value
}

const fetchList = async (variables: Record<string, unknown>, cacheKey: string, options?: ApiRequestOptions): Promise<AnimeResponse> => {
  const data = await queryAniList<{ Page: AniListPage<any> }>(LIST_QUERY, variables, cacheKey, options)
  return normalizeAniListPage(data.Page)
}

const compareOptionalNumbers = (left?: number, right?: number, descending = true): number => {
  if (left === undefined && right === undefined) return 0
  if (left === undefined) return 1
  if (right === undefined) return -1
  return descending ? right - left : left - right
}

const compareAnimeForSort = (left: AnimeData, right: AnimeData, sortToken: string): number => {
  if (sortToken === 'SEARCH_MATCH') return 0
  const descending = !sortToken.endsWith('_ASC')
  if (sortToken.startsWith('TITLE_ROMAJI')) {
    const result = left.title.localeCompare(right.title)
    return descending ? -result : result
  }
  if (sortToken.startsWith('START_DATE')) {
    const leftDate = left.aired.from ? Date.parse(left.aired.from) : undefined
    const rightDate = right.aired.from ? Date.parse(right.aired.from) : undefined
    return compareOptionalNumbers(Number.isNaN(leftDate) ? undefined : leftDate, Number.isNaN(rightDate) ? undefined : rightDate, descending)
  }
  if (sortToken.startsWith('SCORE')) return compareOptionalNumbers(left.score, right.score, descending)
  return compareOptionalNumbers(left.popularity, right.popularity, descending)
}

const mergeContentResponses = (responses: AnimeResponse[], sortToken: string, requestedPerPage?: number): AnimeResponse => {
  const [first] = responses
  if (!first) return createSinglePageResponse([], 0)
  const perPage = Math.max(requestedPerPage || 0, ...responses.map(response => response.pagination.items.per_page || response.data.length || 1), 1)
  const interleaved: AnimeData[] = []
  const longest = Math.max(...responses.map(response => response.data.length))
  for (let index = 0; index < longest; index += 1) {
    responses.forEach(response => {
      const anime = response.data[index]
      if (anime) interleaved.push(anime)
    })
  }
  const merged = dedupe(interleaved)
  if (sortToken !== 'SEARCH_MATCH') merged.sort((left, right) => compareAnimeForSort(left, right, sortToken))
  const total = responses.reduce((sum, response) => sum + response.pagination.items.total, 0)
  return {
    data: merged.slice(0, perPage),
    pagination: {
      last_visible_page: Math.max(...responses.map(response => response.pagination.last_visible_page), Math.ceil(total / perPage)),
      has_next_page: responses.some(response => response.pagination.has_next_page),
      current_page: first.pagination.current_page,
      items: { count: Math.min(merged.length, perPage), total, per_page: perPage },
    },
  }
}

/**
 * AniList's isAdult argument is an equality filter, not an "include adult"
 * switch. Fetch both partitions so non-Hentai adult records remain available,
 * then apply the app's Hentai-only classification locally.
 */
const fetchListForContent = async (
  variables: Record<string, unknown>,
  cacheKey: string,
  preferences: ContentFilter = false,
  options?: ApiRequestOptions,
): Promise<AnimeResponse> => {
  const content = contentFilter(preferences)
  const fetchPartition = (isAdult: boolean) =>
    fetchList(
      { ...variables, isAdult },
      `${cacheKey}_adult${isAdult ? 1 : 0}`,
      options,
    )
  const nonAdultPromise = fetchPartition(false)
  if (!content.showMature && !content.showExplicit) return nonAdultPromise

  // Reserve both rate-limit slots up front. The scheduler still spaces the
  // requests apart, but starting the second partition before the first network
  // response completes avoids adding an entire round-trip to page latency.
  const adultPromise = fetchPartition(true)
  const [nonAdultResult, adultResult] = await Promise.all([
    nonAdultPromise.then(
      value => ({ status: 'fulfilled' as const, value }),
      reason => ({ status: 'rejected' as const, reason }),
    ),
    adultPromise.then(
      value => ({ status: 'fulfilled' as const, value }),
      reason => ({ status: 'rejected' as const, reason }),
    ),
  ])
  if (nonAdultResult.status === 'rejected') throw nonAdultResult.reason
  const nonAdult = nonAdultResult.value
  if (adultResult.status === 'rejected') {
    if (isAbortError(adultResult.reason)) throw adultResult.reason
    // Keep ordinary content usable if the optional adult partition is
    // temporarily rate-limited or unavailable.
    return nonAdult
  }
  const adult = adultResult.value
  const sortToken = Array.isArray(variables.sort) && typeof variables.sort[0] === 'string' ? variables.sort[0] : 'POPULARITY_DESC'
  const requestedPerPage = typeof variables.perPage === 'number' ? variables.perPage : undefined
  return mergeContentResponses([nonAdult, adult], sortToken, requestedPerPage)
}

export const fetchTopAnime = async (page = 1, limit = 20, preferences: ContentFilter = false, signal?: AbortSignal): Promise<AnimeResponse> => {
  const p = safePage(page), l = safeLimit(limit)
  const content = contentFilter(preferences)
  const key = contentKey(content)
  return filterContent(await fetchListForContent({ page: p, perPage: l, sort: ['SCORE_DESC'], type: 'ANIME' }, `top_anime_${p}_${l}_${key}`, content, { signal }), content)
}

export const fetchTopAnimeForLanding = async (preferences: ContentFilter = false): Promise<AnimeData[]> => {
  const content = contentFilter(preferences)
  const key = `landing_top_anime_${contentKey(content)}`
  const cached = getCache<AnimeData[]>(key)
  if (cached) return cached
  const stale = getStaleCache<AnimeData[]>(key, MAX_STALE_AGE)
  const refresh = fetchTopAnime(1, content.showMature || content.showExplicit ? 10 : 20, content)
    .then(response => {
      const data = response.data.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 10)
      setCache(key, data, CACHE_TTL.LANDING)
      return data
    })
  if (stale) {
    void refresh.catch(() => undefined)
    return stale
  }
  return refresh
}

export const fetchAnimeByGenre = async (genreIds: number | number[], page = 1, limit = 20, preferences: ContentFilter = false, sort?: string, order?: string, signal?: AbortSignal): Promise<AnimeResponse> => fetchAnimeByTags(genreIds, 'genres', page, limit, preferences, sort, order, signal)

export const fetchAnimeByFilters = async (filters: AnimeFilterOptions = {}, page = 1, limit = 20, preferences: ContentFilter = false, sort?: string, order?: string, signal?: AbortSignal): Promise<AnimeResponse> => {
  const content = contentFilter(preferences)
  const genreIds = (filters.genreIds || []).map(Number).filter(Number.isFinite)
  const excludedGenreIds = (filters.excludedGenreIds || []).map(Number).filter(Number.isFinite)
  const tagIds = (filters.tagIds || []).map(Number).filter(Number.isFinite)
  const excludedTagIds = (filters.excludedTagIds || []).map(Number).filter(Number.isFinite)
  const cleanNames = (names?: string[]) => (names || []).map(name => String(name).trim()).filter(Boolean)
  const genreIn = Array.from(new Set([...cleanNames(filters.genreNames), ...genreIds.map(id => genreLookup.get(id)).filter((name): name is string => Boolean(name))])).sort()
  const genreNotIn = Array.from(new Set([...cleanNames(filters.excludedGenreNames), ...excludedGenreIds.map(id => genreLookup.get(id)).filter((name): name is string => Boolean(name))])).sort()
  const tagIn = Array.from(new Set([...cleanNames(filters.tagNames), ...tagIds.map(id => tagLookup.get(id)).filter((name): name is string => Boolean(name))])).sort()
  const tagNotIn = Array.from(new Set([...cleanNames(filters.excludedTagNames), ...excludedTagIds.map(id => tagLookup.get(id)).filter((name): name is string => Boolean(name))])).sort()

  if (!genreIn.length && !genreNotIn.length && !tagIn.length && !tagNotIn.length) {
    return createSinglePageResponse([], safeLimit(limit))
  }

  const minimumTagRank = Math.max(0, Math.min(100, Math.round(filters.minimumTagRank ?? 60)))
  const variables: Record<string, unknown> = {
    page: safePage(page),
    perPage: safeLimit(limit),
    sort: [sortValue(sort, order)],
    type: 'ANIME',
    genreIn: genreIn.length ? genreIn : undefined,
    genreNotIn: genreNotIn.length ? genreNotIn : undefined,
    tagIn: tagIn.length ? tagIn : undefined,
    tagNotIn: tagNotIn.length ? tagNotIn : undefined,
    minimumTagRank: tagIn.length || tagNotIn.length ? minimumTagRank : undefined,
  }
  const cacheKey = [
    `filters_gi:${cacheToken(genreIn)}`,
    `go:${cacheToken(genreNotIn)}`,
    `ti:${cacheToken(tagIn)}`,
    `to:${cacheToken(tagNotIn)}`,
    `rank:${minimumTagRank}`,
    `page:${safePage(page)}`,
    `limit:${safeLimit(limit)}`,
    `sort:${sort || 'default'}:${order || 'default'}`,
    contentKey(content),
  ].join('_')
  return filterContent(await fetchListForContent(variables, cacheKey, content, { signal }), content)
}

export const fetchAnimeByTags = async (tagIds: number | number[], tagType: TagCategory = 'genres', page = 1, limit = 20, preferences: ContentFilter = false, sort?: string, order?: string, signal?: AbortSignal): Promise<AnimeResponse> => {
  const ids = (Array.isArray(tagIds) ? tagIds : [tagIds]).map(Number).filter(Number.isFinite)
  const isGenre = tagType === 'genres'
  return fetchAnimeByFilters(isGenre ? { genreIds: ids } : { tagIds: ids, minimumTagRank: 18 }, page, limit, preferences, sort, order, signal)
}

export const fetchMovies = async (page = 1, limit = 20, preferences: ContentFilter = false, sort?: string, order?: string, signal?: AbortSignal): Promise<AnimeResponse> => {
  const p = safePage(page), l = safeLimit(limit)
  const content = contentFilter(preferences)
  const key = contentKey(content)
  return filterContent(await fetchListForContent({ page: p, perPage: l, sort: [sortValue(sort, order)], type: 'ANIME', format: ['MOVIE'] }, `movies_${p}_${l}_${sort || 'default'}_${order || 'default'}_${key}`, content, { signal }), content)
}

export const fetchGenres = async (signal?: AbortSignal): Promise<GenresResponse> => {
  try {
    const data = await queryAniList<{ GenreCollection: string[] }>('query { GenreCollection }', {}, 'genres_anilist', { signal })
    const genres = (data.GenreCollection || []).map(name => { const id = hashId(`genre:${name}`); genreLookup.set(id, name); return { mal_id: id, name, url: `https://anilist.co/search/anime?genres=${encodeURIComponent(name)}` } })
    return { data: genres }
  } catch (error) {
    if (isAbortError(error)) throw error
    return { data: KNOWN_GENRES.map(name => ({ mal_id: hashId(`genre:${name}`), name, url: `https://anilist.co/search/anime?genres=${encodeURIComponent(name)}` })) }
  }
}

export const fetchTagsByCategory = async (category: TagCategory, signal?: AbortSignal): Promise<GenresResponse> => {
  if (category === 'genres') return fetchGenres(signal)
  try {
    const data = await queryAniList<{ MediaTagCollection: Array<{ id: number; name: string; category?: string; isAdult?: boolean }> }>('query { MediaTagCollection { id name category isAdult } }', {}, 'tags_collection', { signal })
    const matchesCategory = (value?: string, isAdult?: boolean) => {
      const normalized = String(value || '').trim().toLowerCase()
      if (category === 'all_tags') return true
      if (category === 'explicit_genres') return Boolean(isAdult) || normalized === 'sexual content' || normalized.startsWith('sexual content-')
      if (category === 'themes') return normalized === 'theme' || normalized.startsWith('theme-')
      if (category === 'setting') return normalized === 'setting' || normalized.startsWith('setting-')
      if (category === 'demographics') return normalized === 'demographic' || normalized.startsWith('demographic-')
      if (category === 'content') return normalized === 'content warning' || normalized.startsWith('content warning-')
      if (category === 'technical') return normalized === 'technical' || normalized.startsWith('technical-')
      if (category === 'format') return normalized === 'format' || normalized.startsWith('format-')
      return false
    }
    const tags = (data.MediaTagCollection || [])
      .filter(tag => matchesCategory(tag.category, tag.isAdult))
      .map(tag => {
        tagLookup.set(tag.id, tag.name)
        return { mal_id: tag.id, name: tag.name, category: tag.category, isAdult: tag.isAdult, filterKind: 'tag' as const, url: `https://anilist.co/search/anime?tags=${tag.id}` }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
    if (category === 'explicit_genres') {
      const hentaiId = hashId('genre:Hentai')
      genreLookup.set(hentaiId, 'Hentai')
      return { data: [{ mal_id: hentaiId, name: 'Hentai', category: 'Genre', isAdult: true, filterKind: 'genre', url: `https://anilist.co/search/anime?genres=${encodeURIComponent('Hentai')}` }, ...tags] }
    }
    return { data: tags }
  } catch (error) {
    if (isAbortError(error)) throw error
    const fallbackTags: Genre[] = FALLBACK_TAGS[category].map(name => ({ mal_id: hashId(`${category}:${name}`), name, isAdult: category === 'explicit_genres', filterKind: 'tag', url: `https://anilist.co/search/anime?tags=${encodeURIComponent(name)}` }))
    if (category === 'explicit_genres') {
      const hentaiId = hashId('genre:Hentai')
      genreLookup.set(hentaiId, 'Hentai')
      return { data: [{ mal_id: hentaiId, name: 'Hentai', category: 'Genre', isAdult: true, filterKind: 'genre', url: `https://anilist.co/search/anime?genres=${encodeURIComponent('Hentai')}` }, ...fallbackTags] }
    }
    return { data: fallbackTags }
  }
}

export const searchAnime = async (query: string, page = 1, limit = 20, preferences: ContentFilter = false, signal?: AbortSignal): Promise<AnimeResponse> => {
  if (typeof query !== 'string') throw new Error('Search query must be a string')
  const safeQuery = query.trim().slice(0, 200).replace(/[\x00-\x1F\x7F]/g, '')
  if (!safeQuery) throw new Error('Search query cannot be empty')
  const content = contentFilter(preferences)
  const response = await fetchListForContent({ page: Math.min(100, safePage(page)), perPage: safeLimit(limit), sort: ['SEARCH_MATCH'], search: safeQuery, type: 'ANIME' }, `search_${encodeURIComponent(safeQuery)}_${safePage(page)}_${safeLimit(limit)}_${contentKey(content)}`, content, { signal })
  return filterContent(response, content)
}

export const fetchSeasonalAnime = async (year: number, season: string, page = 1, limit = 20, preferences: ContentFilter = false, sort?: string, order?: string, signal?: AbortSignal): Promise<AnimeResponse> => {
  const p = safePage(page), l = safeLimit(limit), selectedSeason = seasonValue(season)
  const content = contentFilter(preferences)
  const response = await fetchListForContent({ page: p, perPage: l, sort: [sortValue(sort, order)], type: 'ANIME', season: selectedSeason, seasonYear: year }, `seasonal_${year}_${selectedSeason}_${p}_${l}_${sort || 'default'}_${order || 'default'}_${contentKey(content)}`, content, { signal })
  return filterContent(response, content)
}

const sortAnime = (list: AnimeData[]): AnimeData[] => [...list].sort((a, b) => (a.popularity ?? Number.MAX_SAFE_INTEGER) - (b.popularity ?? Number.MAX_SAFE_INTEGER) || (b.score || 0) - (a.score || 0))
export const fetchSeasonalAnimeSorted = async (year: number, season: string, preferences: ContentFilter = false): Promise<AnimeData[]> => {
  const items: AnimeData[] = []
  for (let page = 1; page <= 3; page += 1) {
    const response = await fetchSeasonalAnime(year, season, page, 25, preferences)
    items.push(...response.data)
    if (!response.pagination.has_next_page) break
  }
  return sortAnime(dedupe(items))
}
export const fetchSeasonalAnimeFast = async (year: number, season: string, preferences: ContentFilter = false, limit = 10): Promise<AnimeData[]> => {
  const content = contentFilter(preferences)
  const perPage = content.showMature || content.showExplicit ? Math.max(limit, 10) : Math.max(limit, 20)
  try { return sortAnime((await fetchSeasonalAnime(year, season, 1, perPage, content)).data).slice(0, limit) } catch { return [] }
}
export const fetchSeasonalAnimeForLanding = async (year: number, season: string, preferences: ContentFilter = false, limit = 10): Promise<AnimeData[]> => {
  const content = contentFilter(preferences)
  const key = `landing_seasonal_anime_${year}_${season}_${contentKey(content)}_${limit}`
  const cached = getCache<AnimeData[]>(key)
  if (cached) return cached
  const stale = getStaleCache<AnimeData[]>(key, MAX_STALE_AGE)
  const refresh = fetchSeasonalAnimeFast(year, season, content, limit).then(data => {
    setCache(key, data, CACHE_TTL.LANDING)
    return data
  })
  if (stale) {
    void refresh.catch(() => undefined)
    return stale
  }
  return refresh
}

const detailsFor = async (id: number, cacheKey: string): Promise<{ Media: any }> => {
  if (id >= ANILIST_PUBLIC_ID_OFFSET) return queryAniList<{ Media: any }>(DETAILS_QUERY, { id: id - ANILIST_PUBLIC_ID_OFFSET }, `${cacheKey}_anilist`)
  try {
    const byMal = await queryAniList<{ Media: any }>(DETAILS_QUERY, { idMal: id }, cacheKey)
    if (byMal.Media) return byMal
  } catch {
    // Fall through to the native AniList id for newer/unmapped entries.
  }
  return queryAniList<{ Media: any }>(DETAILS_QUERY, { id }, `${cacheKey}_anilist`)
}
export const fetchAnimeById = async (id: number, preferences: ContentFilter = false): Promise<{ data: AnimeData }> => {
  const response = await detailsFor(id, `details_${id}`)
  if (!response.Media) throw new ApiRequestError('Anime not found.', 404)
  const data = normalizeAniListMedia(response.Media)
  if (!isContentAllowed(data.contentRating, preferences)) throw new ContentRestrictedError()
  return { data }
}
export const fetchAnimeCharacters = async (id: number, preferences: ContentFilter = false): Promise<{ data: CharacterWithRole[] }> => {
  const response = await detailsFor(id, `details_${id}`)
  if (response.Media && !isContentAllowed(normalizeAniListMedia(response.Media).contentRating, preferences)) throw new ContentRestrictedError()
  return { data: (response.Media?.characters?.edges || []).map(normalizeCharacter) }
}

export const getOptimizedImageUrl = (anime: AnimeData): string => anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || '/placeholder-anime.svg'
export const preloadImage = (src: string): Promise<void> => new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(); img.onerror = reject; img.src = src })
export const preloadAnimeImages = async (animeList: AnimeData[], priorityCount = 2): Promise<void> => { await Promise.all(animeList.slice(0, priorityCount).map(anime => preloadImage(getOptimizedImageUrl(anime)))); setTimeout(() => { Promise.all(animeList.slice(priorityCount).map(anime => preloadImage(getOptimizedImageUrl(anime)))).catch(() => undefined) }, 100) }

export const getAnimeContentRating = (anime: AnimeData): ContentRating => inferContentRating(anime)
/** @deprecated Use getAnimeContentRating/isContentAllowed for new code. */
export const isNsfwAnime = (anime: AnimeData): boolean => getAnimeContentRating(anime) !== 'safe'
export const formatScore = (score?: number): string => typeof score === 'number' && Number.isFinite(score) ? score.toFixed(2) : 'N/A'
export const formatDate = (dateString?: string): string => { if (!dateString) return 'N/A'; const date = new Date(dateString); if (Number.isNaN(date.getTime())) return 'N/A'; return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) }

export const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
export type Weekday = (typeof WEEKDAYS)[number]
export type WeeklyAnimeSchedule = Record<Weekday, AnimeData[]>
const emptySchedule = (): WeeklyAnimeSchedule => Object.fromEntries(WEEKDAYS.map(day => [day, []])) as unknown as WeeklyAnimeSchedule
const normalizeDay = (day?: string): Weekday | null => { const normalized = day?.trim().toLowerCase().replace(/s$/, ''); return normalized && WEEKDAYS.includes(normalized as Weekday) ? normalized as Weekday : null }
const groupSchedule = (items: AnimeData[]): WeeklyAnimeSchedule => { const grouped = emptySchedule(); const seen = new Map<Weekday, Set<number>>(WEEKDAYS.map(day => [day, new Set()])); items.forEach(item => { const day = normalizeDay(item.broadcast?.day); if (day && !seen.get(day)!.has(item.mal_id)) { seen.get(day)!.add(item.mal_id); grouped[day].push(item) } }); return grouped }

export const fetchWeeklyAnimeSchedule = async (preferences: ContentFilter = false, signal?: AbortSignal): Promise<WeeklyAnimeSchedule> => {
  const content = contentFilter(preferences)
  const key = `schedule_weekly_${contentKey(content)}`
  const cached = getCache<WeeklyAnimeSchedule>(key)
  if (cached) return cached
  const items: AnimeData[] = []
  let includeAdultPartition = content.showMature || content.showExplicit
  // Keep a defensive upper bound against a malformed pageInfo response while
  // allowing the complete current schedule to be read in normal conditions.
  // A normal weekly schedule fits comfortably within a few 50-item pages.
  // Keep a finite upper bound so a malformed pageInfo cannot turn one visit
  // into dozens of rate-limited requests.
  const MAX_SCHEDULE_PAGES = 12
  for (let page = 1; page <= MAX_SCHEDULE_PAGES; page += 1) {
    let hasNextPage = false
    try {
      const partitions = includeAdultPartition ? [false, true] : [false]
      const partitionResults = await Promise.all(partitions.map(async isAdult => {
        try {
          const data = await queryAniList<{ Page: AniListPage<any> }>(SCHEDULE_QUERY, { page, perPage: 50, isAdult }, `${key}_${page}_adult${isAdult ? 1 : 0}`, { signal })
          return { isAdult, page: normalizeAniListPage(data.Page), hasNextPage: Boolean(data.Page?.pageInfo?.hasNextPage) }
        } catch (error) {
          if (isAbortError(error)) throw error
          // The optional adult partition should not prevent the ordinary
          // schedule from loading. A non-adult failure still ends pagination
          // because there is no reliable way to advance that partition.
          if (isAdult) {
            includeAdultPartition = false
            return null
          }
          throw error
        }
      }))
      partitionResults.forEach(result => {
        if (!result) return
        items.push(...result.page.data)
        hasNextPage = hasNextPage || result.hasNextPage
      })
      if (!hasNextPage) break
    } catch (error) {
      if (isAbortError(error)) throw error
      break
    }
  }
  const grouped = groupSchedule(items.filter(item => isContentAllowed(item.contentRating, content)))
  if (!Object.values(grouped).some(day => day.length)) throw new Error('No current schedule data is available.')
  setCache(key, grouped, CACHE_TTL.SEMI_STATIC)
  return grouped
}
export const fetchAnimeSchedule = async (day?: string, preferences: ContentFilter = false, signal?: AbortSignal): Promise<AnimeResponse> => { const normalized = day ? normalizeDay(day) : null; if (day && !normalized) throw new Error(`Invalid schedule day: ${day}`); const weekly = await fetchWeeklyAnimeSchedule(preferences, signal); const data = normalized ? weekly[normalized] : WEEKDAYS.flatMap(item => weekly[item]); return createSinglePageResponse(data, data.length) }
export const fetchNextDayAnime = async (preferences: ContentFilter = false): Promise<AnimeData[]> => { if (typeof window === 'undefined') return []; const date = new Date(); date.setUTCDate(date.getUTCDate() + 1); try { return (await fetchAnimeSchedule(date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }).toLowerCase(), preferences)).data } catch { return [] } }
export const fetchTodayAnime = async (preferences: ContentFilter = false): Promise<AnimeData[]> => { if (typeof window === 'undefined') return []; try { return (await fetchAnimeSchedule(new Date().toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }).toLowerCase(), preferences)).data } catch { return [] } }
export const getCurrentSeasonInfo = (): { year: number; season: string; displayName: string } => { const month = new Date().getMonth() + 1; const season = month <= 3 ? 'winter' : month <= 6 ? 'spring' : month <= 9 ? 'summer' : 'fall'; return { year: new Date().getFullYear(), season, displayName: season.charAt(0).toUpperCase() + season.slice(1) } }
