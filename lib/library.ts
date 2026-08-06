import type { AnimeListItem } from './anime-models'

const VERSION = 2
const FAVORITES_KEY = 'cryoanime_library_v2_favorites'
const WATCHLIST_KEY = 'cryoanime_library_v2_watchlist'
const LEGACY_FAVORITES_KEY = 'cryoanime_favorites'
const LEGACY_WATCHLIST_KEY = 'cryoanime_watchlist'
export const MAX_LIBRARY_ITEMS = 200

export interface CompactLibraryRecord {
  id: number
  title: string
  cover: string
  score?: number
  year?: number
  rating?: string
  added_at: number
}

/** UI-compatible projection of a compact record. The full provider response
 * is never written to storage. */
export type LibraryItem = AnimeListItem & { added_at: number }

const record = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value))
const safeCover = (value: unknown): string => typeof value === 'string' && value.length <= 2048 ? value : '/placeholder-anime.svg'

const toCompact = (value: unknown): CompactLibraryRecord | null => {
  if (!record(value)) return null
  const id = Number(value.id ?? value.mal_id)
  const title = typeof value.title === 'string' ? value.title.trim() : ''
  const images = record(value.images) && record(value.images.jpg) ? value.images.jpg as Record<string, unknown> : {}
  const cover = safeCover(value.cover ?? images.large_image_url ?? images.image_url)
  const addedAt = Number(value.added_at ?? value.timestamp)
  if (!Number.isSafeInteger(id) || id <= 0 || !title || title.length > 500 || !Number.isFinite(addedAt)) return null
  const score = Number(value.score)
  const year = Number(value.year)
  return {
    id,
    title,
    cover,
    score: Number.isFinite(score) ? score : undefined,
    year: Number.isInteger(year) ? year : undefined,
    rating: typeof value.rating === 'string' ? value.rating.slice(0, 80) : undefined,
    added_at: Math.max(0, Math.min(8_640_000_000_000_000, addedAt)),
  }
}

const toUiItem = (item: CompactLibraryRecord): LibraryItem => ({
  mal_id: item.id,
  title: item.title,
  cover: item.cover,
  images: { jpg: { image_url: item.cover, small_image_url: item.cover, large_image_url: item.cover } },
  score: item.score,
  year: item.year,
  rating: item.rating,
  type: 'ANIME',
  status: 'Unknown',
  duration: 'Unknown',
  contentRating: item.rating?.startsWith('Rx') ? 'explicit' : item.rating?.startsWith('R+') ? 'mature' : 'safe',
  isAdult: false,
  genres: [],
  added_at: item.added_at,
})

const readRecords = (key: string): CompactLibraryRecord[] => {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(key)
    if (!raw || raw.length > 500_000) return []
    const parsed: unknown = JSON.parse(raw)
    const values = Array.isArray(parsed) ? parsed : record(parsed) && Array.isArray(parsed.items) ? parsed.items : []
    const seen = new Set<number>()
    return values.map(toCompact).filter((item): item is CompactLibraryRecord => Boolean(item && !seen.has(item.id) && seen.add(item.id))).slice(0, MAX_LIBRARY_ITEMS)
  } catch {
    return []
  }
}

const writeRecords = (key: string, items: CompactLibraryRecord[]): void => {
  if (typeof window === 'undefined') return
  const value = JSON.stringify({ version: VERSION, items: items.slice(0, MAX_LIBRARY_ITEMS) })
  if (value.length > 500_000) return
  try {
    localStorage.setItem(key, value)
    window.dispatchEvent(new CustomEvent('library-change', { detail: { key } }))
  } catch {
    // Storage is optional; the UI remains usable when it is disabled.
  }
}

const migrateLegacy = (key: string, legacyKey: string): CompactLibraryRecord[] => {
  const current = readRecords(key)
  if (current.length || typeof window === 'undefined') return current
  const legacy = readRecords(legacyKey)
  if (legacy.length) {
    writeRecords(key, legacy)
    try { localStorage.removeItem(legacyKey) } catch { /* ignored */ }
  }
  return legacy
}

const getItems = (key: string, legacyKey: string): LibraryItem[] => migrateLegacy(key, legacyKey).map(toUiItem)

export const getFavorites = (): LibraryItem[] => getItems(FAVORITES_KEY, LEGACY_FAVORITES_KEY)
export const getWatchlist = (): LibraryItem[] => getItems(WATCHLIST_KEY, LEGACY_WATCHLIST_KEY)
export const isFavorite = (malId: number): boolean => getFavorites().some(item => item.mal_id === malId)
export const isInWatchlist = (malId: number): boolean => getWatchlist().some(item => item.mal_id === malId)

const toggle = (key: string, legacyKey: string, anime: AnimeListItem): boolean => {
  const items = migrateLegacy(key, legacyKey)
  const exists = items.some(item => item.id === anime.mal_id)
  const next = exists ? items.filter(item => item.id !== anime.mal_id) : [{
    id: anime.mal_id,
    title: anime.title,
    cover: safeCover(anime.cover || anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url),
    score: anime.score,
    year: anime.year,
    rating: anime.rating,
    added_at: Date.now(),
  }, ...items]
  writeRecords(key, next)
  return !exists
}

export const toggleFavorite = (anime: AnimeListItem): boolean => toggle(FAVORITES_KEY, LEGACY_FAVORITES_KEY, anime)
export const toggleWatchlist = (anime: AnimeListItem): boolean => toggle(WATCHLIST_KEY, LEGACY_WATCHLIST_KEY, anime)
