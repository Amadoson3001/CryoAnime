'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  getFavorites, 
  isFavorite, 
  toggleFavorite, 
  getWatchlist, 
  isInWatchlist, 
  toggleWatchlist,
  LibraryItem
} from '@/lib/library'
import { AnimeData } from '@/lib/api'

export function useLibrary(anime?: AnimeData) {
  const [favorites, setFavorites] = useState<LibraryItem[]>([])
  const [watchlist, setWatchlist] = useState<LibraryItem[]>([])
  const [favoriteStatus, setFavoriteStatus] = useState(false)
  const [watchlistStatus, setWatchlistStatus] = useState(false)

  const refresh = useCallback(() => {
    setFavorites(getFavorites())
    setWatchlist(getWatchlist())
    if (anime) {
      setFavoriteStatus(isFavorite(anime.mal_id))
      setWatchlistStatus(isInWatchlist(anime.mal_id))
    }
  }, [anime])

  useEffect(() => {
    refresh()
    
    // Listen for changes from other components
    window.addEventListener('library-change', refresh)
    return () => window.removeEventListener('library-change', refresh)
  }, [refresh])

  const handleToggleFavorite = () => {
    if (!anime) return
    const newState = toggleFavorite(anime)
    setFavoriteStatus(newState)
  }

  const handleToggleWatchlist = () => {
    if (!anime) return
    const newState = toggleWatchlist(anime)
    setWatchlistStatus(newState)
  }

  return {
    favorites,
    watchlist,
    isFavorite: favoriteStatus,
    isInWatchlist: watchlistStatus,
    toggleFavorite: handleToggleFavorite,
    toggleWatchlist: handleToggleWatchlist,
    refresh
  }
}
