// lib/library.ts
import { AnimeData } from './api'

const FAVORITES_KEY = 'cryoanime_favorites'
const WATCHLIST_KEY = 'cryoanime_watchlist'

export interface LibraryItem extends AnimeData {
  added_at: number
}

// Internal helper for localStorage access
const getItems = (key: string): LibraryItem[] => {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : []
  } catch (e) {
    console.error(`Error reading ${key} from localStorage:`, e)
    return []
  }
}

const setItems = (key: string, items: LibraryItem[]): void => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(items))
    // Dispatch a custom event so other components can react to changes
    window.dispatchEvent(new Event('library-change'))
  } catch (e) {
    console.error(`Error saving ${key} to localStorage:`, e)
  }
}

// Favorites
export const getFavorites = (): LibraryItem[] => getItems(FAVORITES_KEY)

export const isFavorite = (mal_id: number): boolean => {
  return getFavorites().some(item => item.mal_id === mal_id)
}

export const toggleFavorite = (anime: AnimeData): boolean => {
  const favorites = getFavorites()
  const exists = favorites.findIndex(item => item.mal_id === anime.mal_id)
  
  if (exists > -1) {
    const updated = favorites.filter(item => item.mal_id !== anime.mal_id)
    setItems(FAVORITES_KEY, updated)
    return false // Removed
  } else {
    const newItem: LibraryItem = { ...anime, added_at: Date.now() }
    setItems(FAVORITES_KEY, [newItem, ...favorites])
    return true // Added
  }
}

// Watchlist
export const getWatchlist = (): LibraryItem[] => getItems(WATCHLIST_KEY)

export const isInWatchlist = (mal_id: number): boolean => {
  return getWatchlist().some(item => item.mal_id === mal_id)
}

export const toggleWatchlist = (anime: AnimeData): boolean => {
  const watchlist = getWatchlist()
  const exists = watchlist.findIndex(item => item.mal_id === anime.mal_id)
  
  if (exists > -1) {
    const updated = watchlist.filter(item => item.mal_id !== anime.mal_id)
    setItems(WATCHLIST_KEY, updated)
    return false // Removed
  } else {
    const newItem: LibraryItem = { ...anime, added_at: Date.now() }
    setItems(WATCHLIST_KEY, [newItem, ...watchlist])
    return true // Added
  }
}
