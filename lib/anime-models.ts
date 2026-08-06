/**
 * Public data contracts shared by Server Components and the small client
 * islands.  The provider-specific response shape never crosses this boundary.
 */
import type { ContentRating, ContentPreferences } from '@/lib/contentRatings'
import {
  isContentAllowed,
  normalizeContentPreferences,
} from '@/lib/contentRatings'

export interface AnimeTag {
  mal_id: number
  type: string
  name: string
  url: string
  rank?: number
  category?: string
  isAdult?: boolean
  isGeneralSpoiler?: boolean
  isMediaSpoiler?: boolean
}

export interface CharacterData {
  mal_id: number
  url: string
  images: { jpg: { image_url: string; small_image_url: string }; webp?: { image_url: string; small_image_url: string } }
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

export interface AnimeImageSet {
  jpg: { image_url: string; small_image_url: string; large_image_url: string }
  webp?: { image_url: string; small_image_url: string; large_image_url: string }
}

/** Minimal fields used by cards, grids, search, and library links. */
export interface AnimeListItem {
  mal_id: number
  anilist_id?: number
  title: string
  title_english?: string
  title_japanese?: string
  title_synonyms?: string[]
  cover: string
  images: AnimeImageSet
  url?: string
  synopsis?: string
  score?: number
  average_score?: number
  score_percentage?: number
  rank?: number
  popularity?: number
  favorites?: number
  type: string
  episodes?: number
  status: string
  duration: string
  rating?: string
  contentRating: ContentRating
  isAdult: boolean
  season?: string
  year?: number
  genres: AnimeTag[]
  themes?: AnimeTag[]
  demographics?: AnimeTag[]
  explicit_genres?: AnimeTag[]
  tags?: AnimeTag[]
}

/** Full detail payload. Characters are fetched in the same provider request. */
export interface AnimeDetails extends AnimeListItem {
  aired: {
    from?: string
    to?: string
    prop: {
      from: { day?: number; month?: number; year?: number }
      to: { day?: number; month?: number; year?: number }
    }
  }
  broadcast?: { day?: string; time?: string; timezone?: string; string?: string }
  source?: string
  mean_score?: number
  mean_score_percentage?: number
  members?: number
  scored_by?: number
  producers: Array<{ mal_id: number; type: string; name: string; url: string }>
  licensors: Array<{ mal_id: number; type: string; name: string; url: string }>
  studios: Array<{ mal_id: number; type: string; name: string; url: string }>
  streaming?: Array<{ name: string; url: string }>
  trailer?: { youtube_id?: string; url?: string; embed_url?: string }
  relations?: Array<{ relation: string; entry: Array<{ mal_id: number; type: string; name: string; url: string }> }>
  theme?: { openings?: string[]; endings?: string[] }
  background?: string
  characters?: CharacterWithRole[]
}

export interface PageResult<T> {
  items: T[]
  page: number
  totalPages: number
  totalItems: number
  hasNextPage: boolean
}

export interface NormalizedPage<T = AnimeDetails> {
  data: T[]
  pagination: {
    last_visible_page: number
    has_next_page: boolean
    current_page: number
    items: { count: number; total: number; per_page: number }
  }
}

export interface ListQuery {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
  preferences?: ContentPreferences
}

export interface SearchQuery extends ListQuery {
  query: string
}

export interface SeasonalQuery extends ListQuery {
  year: number
  season: string
}

export interface ScheduleQuery {
  weekStartUtc: string
  preferences?: ContentPreferences
}

export type ExploreQuery = ListQuery & {
  category?: TagCategory
  include?: number[]
  exclude?: number[]
  minimumTagRank?: number
}

export const toPageResult = <T>(result: {
  data: T[]
  pagination: {
    current_page: number
    last_visible_page: number
    has_next_page: boolean
    items: { total: number }
  }
}): PageResult<T> => ({
  items: result.data,
  page: result.pagination.current_page,
  totalPages: result.pagination.last_visible_page,
  totalItems: result.pagination.items.total,
  hasNextPage: result.pagination.has_next_page,
})

export const isVisible = (
  anime: Pick<AnimeListItem, 'contentRating'>,
  preferences?: ContentPreferences | boolean | null,
): boolean => isContentAllowed(anime.contentRating, normalizeContentPreferences(preferences))

export type { ContentRating, ContentPreferences }
