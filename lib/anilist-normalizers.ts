/** Provider-to-app normalization kept separate from the legacy compatibility API. */
import type { AnimeDetails, AnimeTag, CharacterWithRole, NormalizedPage } from '@/lib/anime-models'
import { safeExternalUrl } from '@/lib/anime-utils'
import {
  getContentRatingOverride,
  isHentaiLabel,
  isMatureLabel,
  isSexualContentCategory,
  ratingLabel,
  type ContentRating,
} from '@/lib/contentRatings'

type Raw = Record<string, unknown>
type RawDate = Raw & { year?: unknown; month?: unknown; day?: unknown }
type RawTitle = Raw & { english?: unknown; romaji?: unknown; native?: unknown; userPreferred?: unknown }
type RawEdge = Raw & { node?: Raw; voiceActors?: Raw[] }
type RawCollection = Raw & { edges?: RawEdge[] }
type RawMedia = Raw & {
  id?: unknown
  idMal?: unknown
  title?: RawTitle
  startDate?: RawDate
  endDate?: RawDate
  tags?: Raw[]
  genres?: unknown[]
  studios?: RawCollection
  relations?: RawCollection
  characters?: RawCollection
  coverImage?: Raw
  nextAiringEpisode?: Raw
  rankings?: Raw[]
  streamingEpisodes?: Raw[]
  externalLinks?: Raw[]
  staff?: RawCollection
  openingThemes?: unknown[]
  endingThemes?: unknown[]
  background?: unknown
  trailer?: Raw
}

export type AniListPageInput = {
  pageInfo?: { total?: number; currentPage?: number; lastPage?: number; hasNextPage?: boolean; perPage?: number }
  media?: unknown[]
}

const asRaw = (value: unknown): Raw => value && typeof value === 'object' && !Array.isArray(value) ? value as Raw : {}
const rawArray = (value: unknown): Raw[] => Array.isArray(value) ? value.filter(item => item && typeof item === 'object' && !Array.isArray(item)) as Raw[] : []
const rawStrings = (value: unknown): string[] => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
const text = (value: unknown, fallback = ''): string => typeof value === 'string' && value.trim() ? value : fallback

const hashId = (value: string): number => {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619)
  return (hash >>> 0) || 1
}

/** Stable IDs shared by the tag browser and normalized detail genres. */
export const genreTagId = (name: string): number => 2_000_000_000 + (hashId(`genre:${name.trim()}`) % 100_000_000)

const publicMediaId = (media: Raw): number => Number(media?.idMal) || 1_000_000_000 + Number(media?.id || 0)
const providerUrl = (id: number) => `https://anilist.co/anime/${id}`

const dateValue = (date?: RawDate | null): string | undefined => {
  const year = Number(date?.year)
  const month = Number(date?.month || 1)
  const day = Number(date?.day || 1)
  if (!Number.isInteger(year) || year < 1 || !Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(day) || day < 1 || day > 31) return undefined
  const parsed = new Date(Date.UTC(year, month - 1, day))
  if (Number.isNaN(parsed.getTime()) || parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return undefined
  return parsed.toISOString()
}

const dateParts = (date?: RawDate | null): { day?: number; month?: number; year?: number } => {
  const parts: { day?: number; month?: number; year?: number } = {}
  for (const key of ['year', 'month', 'day'] as const) {
    const value = Number(date?.[key])
    if (Number.isInteger(value) && value > 0) parts[key] = value
  }
  return parts
}

const titleOf = (title: RawTitle | undefined): string => {
  const values = [title?.english, title?.romaji, title?.native, title?.userPreferred]
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0) || 'Unknown title'
}
const titleEnglish = (title: RawTitle | undefined): string | undefined => {
  const value = title?.english
  return typeof value === 'string' && value.trim() ? value : undefined
}
const titleJapanese = (title: RawTitle | undefined): string | undefined => {
  const value = title?.native
  return typeof value === 'string' && value.trim() ? value : undefined
}
const cleanDescription = (value?: unknown): string | undefined => typeof value === 'string' ? value.replace(/<br\s*\/?>(\n)?/gi, '\n').replace(/<[^>]+>/g, '').trim() || undefined : undefined
const formatName = (value?: unknown): string => typeof value === 'string' && value.trim() ? value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, char => char.toUpperCase()) : 'Unknown'
const formatType = (format?: string | null): string => ({ TV: 'TV', TV_SHORT: 'TV Short', MOVIE: 'Movie', OVA: 'OVA', ONA: 'ONA', SPECIAL: 'Special', MUSIC: 'Music' } as Record<string, string>)[format || ''] || format || 'Unknown'
const formatStatus = (status?: string | null): string => ({ FINISHED: 'Finished Airing', RELEASING: 'Currently Airing', NOT_YET_RELEASED: 'Not yet aired', CANCELLED: 'Cancelled', HIATUS: 'On Hiatus' } as Record<string, string>)[status || ''] || formatName(status)

const makeTag = (id: number, name: string, type: string, url = `https://anilist.co/search/anime?${type === 'genre' ? 'genres' : 'tags'}=${encodeURIComponent(name)}`) => ({ mal_id: id, type, name, url })
const normalizeTag = (tag: Raw): AnimeTag => {
  const id = Number(tag?.id) || hashId(`tag:${tag?.name || 'unknown'}`)
  const category = String(tag?.category || 'other').trim().toLowerCase()
  const rank = Number(tag?.rank)
  return {
    ...makeTag(id, String(tag?.name || 'Unknown'), category),
    category,
    rank: Number.isFinite(rank) ? Math.max(0, Math.min(100, rank)) : undefined,
    isAdult: Boolean(tag?.isAdult),
    isGeneralSpoiler: Boolean(tag?.isGeneralSpoiler),
    isMediaSpoiler: Boolean(tag?.isMediaSpoiler),
  }
}

const normalizeCharacter = (edge: RawEdge): CharacterWithRole => {
  const node = asRaw(edge?.node)
  const name = asRaw(node.name)
  const image = asRaw(node.image)
  const id = Number(node.id) || hashId(text(name.full, 'character'))
  return {
    role: formatName(edge?.role),
    favorites: Number(node.favourites) || 0,
    character: {
      mal_id: id,
      url: text(node.siteUrl, `https://anilist.co/character/${id}`),
      images: { jpg: { image_url: text(image.large, text(image.medium, '/placeholder-anime.svg')), small_image_url: text(image.medium, text(image.large, '/placeholder-anime.svg')) } },
      name: text(name.full, 'Unknown Character'),
      name_kanji: text(name.native) || undefined,
      nicknames: rawStrings(name.alternative),
      favorites: Number(node.favourites) || 0,
      about: cleanDescription(node.description),
    },
    voice_actors: rawArray(edge?.voiceActors).map((person: Raw) => {
      const personName = asRaw(person.name)
      const personImage = asRaw(person.image)
      return {
      person: { mal_id: Number(person.id) || hashId(text(personName.full, 'person')), name: text(personName.full, 'Unknown'), images: { jpg: { image_url: text(personImage.large, text(personImage.medium, '/placeholder-anime.svg')), small_image_url: text(personImage.medium, text(personImage.large, '/placeholder-anime.svg')) } } },
      language: 'Japanese',
      }
    }),
  }
}

const normalizeRawAniListMedia = (media: RawMedia): AnimeDetails => {
  const id = Number(media?.id) || 0
  const publicId = publicMediaId(media)
  const title = asRaw(media?.title) as RawTitle
  const startDate = asRaw(media?.startDate) as RawDate
  const endDate = asRaw(media?.endDate) as RawDate
  const start = dateValue(startDate)
  const end = dateValue(endDate)
  const allTags = rawArray(media?.tags)
  const genres = rawStrings(media?.genres)
    .map((name: string) => makeTag(genreTagId(name), name, 'genre'))
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
  const studioEdges = rawArray(asRaw(media?.studios).edges) as RawEdge[]
  const studios = studioEdges.map((edge: RawEdge) => {
    const node = asRaw(edge.node)
    return makeTag(Number(node.id) || hashId(text(node.name)), text(node.name, 'Unknown'), 'studio', text(node.siteUrl, providerUrl(id)))
  })
  const relations = rawArray(asRaw(media?.relations).edges).map((edge: RawEdge) => {
    const node = asRaw(edge.node)
    return { relation: formatName(edge.relationType), entry: edge.node ? [{ mal_id: publicMediaId(node), type: formatType(text(node.format, text(node.type))), name: titleOf(node.title as RawTitle | undefined), url: providerUrl(Number(node.id)) }] : [] }
  })
  const staffEdges = rawArray(asRaw(media?.staff).edges) as RawEdge[]
  const staffCredits = staffEdges.map((edge: RawEdge) => {
    const person = asRaw(edge.node)
    const name = asRaw(person.name)
    const staffId = Number(person.id) || hashId(text(name.full, 'staff'))
    const role = text(edge.role, 'Staff')
    return { mal_id: staffId, type: role, name: text(name.full, 'Unknown'), url: text(person.siteUrl, `https://anilist.co/staff/${staffId}`) }
  })
  const streamingLinks = [
    ...rawArray(media?.externalLinks).map((item: Raw) => ({ name: text(item.site, 'Watch'), url: safeExternalUrl(item.url) })),
    ...rawArray(media?.streamingEpisodes).map((item: Raw) => ({ name: text(item.site, text(item.title, 'Watch')), url: safeExternalUrl(item.url) })),
  ].filter((item: { name: string; url?: string }): item is { name: string; url: string } => Boolean(item.url))
  const airingTimestamp = Number(asRaw(media?.nextAiringEpisode).airingAt)
  const airingAt = Number.isFinite(airingTimestamp) && airingTimestamp > 0 ? new Date(airingTimestamp * 1000) : undefined
  const rating = ratingLabel(contentRating)
  const rankValue = rawArray(media?.rankings).find(item => item.type === 'RATED' || item.type === 'POPULAR')?.rank
  const rank = typeof rankValue === 'number' ? rankValue : undefined
  const cover = asRaw(media?.coverImage)
  return {
    mal_id: publicId,
    anilist_id: id,
    title: titleOf(title),
    title_english: titleEnglish(title),
    title_japanese: titleJapanese(title),
    title_synonyms: rawStrings(media?.synonyms),
    cover: text(cover.extraLarge, text(cover.large, text(cover.medium, '/placeholder-anime.svg'))),
    images: { jpg: { image_url: text(cover.large, text(cover.extraLarge, '/placeholder-anime.svg')), small_image_url: text(cover.medium, text(cover.large, '/placeholder-anime.svg')), large_image_url: text(cover.extraLarge, text(cover.large, '/placeholder-anime.svg')) } },
    url: text(media?.siteUrl, providerUrl(id)),
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
    type: formatType(text(media?.format, text(media?.type))),
    episodes: typeof media?.episodes === 'number' ? media.episodes : undefined,
    status: formatStatus(text(media?.status)),
    source: formatName(media?.source),
    aired: { from: start, to: end, prop: { from: dateParts(startDate), to: dateParts(endDate) } },
    duration: media?.duration ? `${Number(media.duration)} min` : 'Unknown',
    rating,
    contentRating,
    isAdult: anilistAdult,
    season: media?.season ? String(media.season).toLowerCase() : undefined,
    year: typeof media?.seasonYear === 'number' ? media.seasonYear : Number.isInteger(Number(startDate.year)) ? Number(startDate.year) : undefined,
    broadcast: airingAt && !Number.isNaN(airingAt.getTime()) ? { day: airingAt.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }), time: airingAt.toISOString().slice(11, 16), timezone: 'UTC', string: airingAt.toUTCString() } : undefined,
    genres,
    themes,
    demographics,
    explicit_genres: explicit,
    tags,
    studios,
    producers: staffCredits.filter(item => /producer/i.test(item.type)),
    licensors: staffCredits.filter(item => /licensor/i.test(item.type)),
    streaming: Array.from(new Map(streamingLinks.map(item => [item.url, item])).values()),
    theme: { openings: rawStrings(media?.openingThemes), endings: rawStrings(media?.endingThemes) },
    background: cleanDescription(media?.background),
    trailer: typeof asRaw(media?.trailer).id === 'string' && /^[A-Za-z0-9_-]{6,64}$/.test(asRaw(media?.trailer).id as string)
      ? { youtube_id: asRaw(media?.trailer).id as string, url: `https://www.youtube.com/watch?v=${asRaw(media?.trailer).id as string}`, embed_url: `https://www.youtube.com/embed/${asRaw(media?.trailer).id as string}` }
      : undefined,
    relations,
    characters: rawArray(asRaw(media?.characters).edges).map(edge => normalizeCharacter(edge as RawEdge)),
  }
}

export const normalizeAniListMedia = (input: unknown): AnimeDetails => normalizeRawAniListMedia(asRaw(input) as RawMedia)

export const normalizeAniListPage = (page: AniListPageInput): NormalizedPage => ({
  data: (page?.media || []).filter(Boolean).map(normalizeAniListMedia),
  pagination: { last_visible_page: page?.pageInfo?.lastPage || 1, has_next_page: Boolean(page?.pageInfo?.hasNextPage), current_page: page?.pageInfo?.currentPage || 1, items: { count: page?.media?.length || 0, total: page?.pageInfo?.total || 0, per_page: page?.pageInfo?.perPage || page?.media?.length || 0 } },
})
