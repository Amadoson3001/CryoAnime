import type { AnimeListItem } from '@/lib/anime-models'
import type { ContentRating } from '@/lib/contentRatings'
import {
  getContentRatingOverride,
  isHentaiLabel,
  isMatureLabel,
  isSexualContentCategory,
} from '@/lib/contentRatings'

export const safeExternalUrl = (value: unknown): string | undefined => {
  if (typeof value !== 'string' || value.length > 2048) return undefined
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase().replace(/^www\./, '')
    const approved = ['anilist.co', 'crunchyroll.com', 'hidive.com', 'hulu.com', 'funimation.com', 'netflix.com', 'primevideo.com', 'amazon.com', 'disneyplus.com', 'youtube.com', 'youtu.be']
    if (url.protocol !== 'https:' || !approved.some(item => host === item || host.endsWith(`.${item}`))) return undefined
    return url.href
  } catch {
    return undefined
  }
}

export const formatScore = (score?: number): string =>
  typeof score === 'number' && Number.isFinite(score) ? score.toFixed(2) : 'N/A'

export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

export const getOptimizedImageUrl = (anime: Pick<AnimeListItem, 'cover' | 'images'>): string =>
  anime.cover || anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || '/placeholder-anime.svg'

export const getAnimeContentRating = (anime: AnimeListItem): ContentRating => {
  if (anime.contentRating) return anime.contentRating
  const tags = [...(anime.genres || []), ...(anime.themes || []), ...(anime.explicit_genres || []), ...(anime.tags || [])]
  if (tags.some(item => isHentaiLabel(item.name))) return getContentRatingOverride(anime.anilist_id, anime.mal_id) || 'explicit'
  if (anime.isAdult || tags.some(item => isMatureLabel(item.name) || isSexualContentCategory(item.category))) return getContentRatingOverride(anime.anilist_id, anime.mal_id) || 'mature'
  return getContentRatingOverride(anime.anilist_id, anime.mal_id) || 'safe'
}

export const isNsfwAnime = (anime: AnimeListItem): boolean => getAnimeContentRating(anime) !== 'safe'
