/**
 * Content classification used by the app.
 *
 * AniList has a useful 18+ signal, but it does not provide MAL's nuanced
 * nudity labels. Keep the small override table in source control so a title
 * can be corrected without making the app depend on a second live API.
 */
export type ContentRating = 'safe' | 'mature' | 'explicit'

const normalizeLabel = (value: string): string => value.trim().toLowerCase()

/** AniList's genre/tag names that represent hentai in this app. */
export const HENTAI_LABELS = ['hentai'] as const

/**
 * Labels that indicate sexualised or nudity content without making a title
 * hentai. These remain in the separate mature bucket.
 */
export const MATURE_LABELS = [
  'ecchi',
  'erotica',
  'erotic',
  'sexual',
  'nudity',
  'mild nudity',
] as const

export const SEXUAL_CONTENT_CATEGORY = 'sexual content'

export const isHentaiLabel = (value?: string): boolean =>
  Boolean(value && HENTAI_LABELS.includes(normalizeLabel(value) as (typeof HENTAI_LABELS)[number]))

export const isMatureLabel = (value?: string): boolean =>
  Boolean(value && MATURE_LABELS.includes(normalizeLabel(value) as (typeof MATURE_LABELS)[number]))

export const isSexualContentCategory = (value?: string): boolean =>
  normalizeLabel(value || '') === SEXUAL_CONTENT_CATEGORY

export interface ContentPreferences {
  /** Show titles classified as nudity/mild nudity/ecchi. */
  showMature: boolean
  /** Show titles classified as hentai. */
  showExplicit: boolean
}

export const DEFAULT_CONTENT_PREFERENCES: ContentPreferences = {
  showMature: false,
  showExplicit: false,
}

/**
 * Local corrections for titles whose provider metadata is incomplete or too
 * broad. Keys may be AniList or MAL ids. Add entries as moderation decisions
 * are made; the values are deliberately explicit and reviewable in git.
 */
export const CONTENT_RATING_OVERRIDES: {
  anilist: Record<number, ContentRating>
  mal: Record<number, ContentRating>
} = {
  anilist: {
    // Example: 12345: 'mature',
  },
  mal: {
    // Example: 67890: 'explicit',
  },
}

export const normalizeContentPreferences = (
  value?: ContentPreferences | boolean | null,
): ContentPreferences => {
  if (typeof value === 'boolean') {
    return { showMature: value, showExplicit: value }
  }

  return {
    showMature: Boolean(value?.showMature),
    showExplicit: Boolean(value?.showExplicit),
  }
}

export const isContentAllowed = (
  rating: ContentRating,
  preferences?: ContentPreferences | boolean | null,
): boolean => {
  const normalized = normalizeContentPreferences(preferences)
  if (rating === 'explicit') return normalized.showExplicit
  if (rating === 'mature') return normalized.showMature
  return true
}

export const ratingLabel = (rating: ContentRating): string | undefined => {
  if (rating === 'explicit') return 'Rx - Hentai'
  if (rating === 'mature') return 'R+ - Mild Nudity'
  return undefined
}

export const getContentRatingOverride = (
  anilistId?: number,
  malId?: number,
): ContentRating | undefined => {
  if (anilistId && CONTENT_RATING_OVERRIDES.anilist[anilistId]) {
    return CONTENT_RATING_OVERRIDES.anilist[anilistId]
  }
  if (malId && CONTENT_RATING_OVERRIDES.mal[malId]) {
    return CONTENT_RATING_OVERRIDES.mal[malId]
  }
  return undefined
}
