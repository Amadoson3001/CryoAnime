// Jikan API service for fetching anime data
const JIKAN_API_BASE = 'https://api.jikan.moe/v4'

// Types for API responses
export interface AnimeData {
  mal_id: number
  title: string
  title_english?: string
  title_japanese?: string
  title_synonyms?: string[]
  images: {
    jpg: {
      image_url: string
      small_image_url: string
      large_image_url: string
    }
    webp?: {
      image_url: string
      small_image_url: string
      large_image_url: string
    }
  }
  url?: string
  synopsis?: string
  background?: string
  score?: number
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
  season?: string
  year?: number
  broadcast?: {
    day?: string
    time?: string
    timezone?: string
    string?: string
  }
  genres: Array<{
    mal_id: number
    type: string
    name: string
    url: string
  }>
  explicit_genres?: Array<{
    mal_id: number
    type: string
    name: string
    url: string
  }>
  themes?: Array<{
    mal_id: number
    type: string
    name: string
    url: string
  }>
  demographics?: Array<{
    mal_id: number
    type: string
    name: string
    url: string
  }>
  producers: Array<{
    mal_id: number
    type: string
    name: string
    url: string
  }>
  licensors: Array<{
    mal_id: number
    type: string
    name: string
    url: string
  }>
  studios: Array<{
    mal_id: number
    type: string
    name: string
    url: string
  }>
  streaming?: Array<{
    name: string
    url: string
  }>
  trailer?: {
    youtube_id?: string
    url?: string
    embed_url?: string
  }
  relations?: Array<{
    relation: string
    entry: Array<{
      mal_id: number
      type: string
      name: string
      url: string
    }>
  }>
  theme?: {
    openings?: string[]
    endings?: string[]
  }
  characters?: CharacterWithRole[]
}

export interface CharacterData {
  mal_id: number
  url: string
  images: {
    jpg: {
      image_url: string
      small_image_url: string
    }
    webp?: {
      image_url: string
      small_image_url: string
    }
  }
  name: string
  name_kanji?: string
  nicknames: string[]
  favorites: number
  about?: string
  role: string
}

export interface VoiceActorData {
  person: {
    mal_id: number
    name: string
    images?: {
      jpg?: {
        image_url: string
        small_image_url: string
      }
    }
  }
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
}

export interface GenresResponse {
  data: Genre[]
}

export interface AnimeResponse {
  data: AnimeData[]
  pagination: {
    last_visible_page: number
    has_next_page: boolean
    current_page: number
    items: {
      count: number
      total: number
      per_page: number
    }
  }
}

export type ImageSize = 'small' | 'medium' | 'large';

// Import unified cache utilities
import { getCache, setCache, getPendingRequest, setPendingRequest, deletePendingRequest, CACHE_TTL } from './cache'

// Rate limiting controls
const REQUEST_DELAY = 1000 // 1 second between requests
const MAX_RETRIES = 2
const BASE_RETRY_DELAY = 1000
let lastRequestTime = 0

// Helper function to build sorted URL parameters
const buildSortParams = (url: string, sort?: string, order?: string): string => {
  let result = url;

  if (sort) {
    switch (sort) {
      case 'popularity':
        result += `&order_by=popularity`
        if (order) {
          result += `&sort=${order === 'desc' ? 'asc' : 'desc'}`
        } else {
          result += `&sort=asc`
        }
        break
      case 'score':
        result += `&order_by=score`
        break
      case 'recent':
        result += `&order_by=start_date`
        break
      case 'title':
        result += `&order_by=title`
        break
      default:
        result += `&order_by=popularity`
    }

    if (sort !== 'popularity') {
      if (order) {
        result += `&sort=${order}`
      } else {
        result += `&sort=desc`
      }
    }
  }

  return result;
}

// Centralized API fetcher with caching
const processAnimeData = (anime: AnimeData): AnimeData => {
  if (anime && !anime.year && anime.aired?.prop?.from?.year) {
    anime.year = anime.aired.prop.from.year
  }
  return anime
}

// Enhanced cache key generator with data type awareness
const generateCacheKey = (endpoint: string, params: Record<string, any> = {}): string => {
  const sortedParams = Object.keys(params).sort().reduce((obj: Record<string, any>, key) => {
    obj[key] = params[key];
    return obj;
  }, {});

  return `${endpoint}_${JSON.stringify(sortedParams)}`;
}

// Determine cache duration based on endpoint type
const getCacheDuration = (endpoint: string): number => {
  if (endpoint.includes('genres') || endpoint.includes('top/anime')) {
    return CACHE_TTL.STATIC;
  }

  if (endpoint.includes('seasons')) {
    return CACHE_TTL.SEMI_STATIC;
  }

  if (endpoint.includes('landing')) {
    return CACHE_TTL.LANDING;
  }

  return CACHE_TTL.DYNAMIC;
}

async function fetchFromApi<T>(endpoint: string, cacheKey: string): Promise<T> {
  // Check unified cache first
  const cached = getCache<T>(cacheKey)
  if (cached) {
    return cached
  }

  // Check for pending deduplicated request
  const pending = getPendingRequest<T>(endpoint)
  if (pending) {
    return pending
  }

  // Create a new promise for this request
  const requestPromise = (async () => {
    try {
      // Implement request throttling
      const now = Date.now()
      const timeSinceLastRequest = now - lastRequestTime
      if (timeSinceLastRequest < REQUEST_DELAY) {
        const waitTime = REQUEST_DELAY - timeSinceLastRequest
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          lastRequestTime = Date.now()
          const response = await fetch(`${JIKAN_API_BASE}/${endpoint}`)

          // If we get a 429, wait and retry (except on final attempt)
          if (response.status === 429 && attempt < MAX_RETRIES) {
            const delay = BASE_RETRY_DELAY * Math.pow(2, attempt)
            await new Promise(resolve => setTimeout(resolve, delay))
            continue
          }

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const data = await response.json()

          // Process data to add year for movies
          if (data.data) {
            if (Array.isArray(data.data)) {
              data.data.forEach(processAnimeData)
            } else {
              processAnimeData(data.data)
            }
          }

          // Cache the data with appropriate duration
          setCache(cacheKey, data, getCacheDuration(cacheKey));
          return data
        } catch (error) {
          if (attempt === MAX_RETRIES || (error instanceof Error && !error.message.includes('429'))) {
            throw error
          }

          if (attempt < MAX_RETRIES) {
            const delay = BASE_RETRY_DELAY * Math.pow(2, attempt)
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }
      }

      throw new Error(`Failed to fetch ${endpoint} after ${MAX_RETRIES} attempts`)
    } finally {
      deletePendingRequest(endpoint);
    }
  })();

  setPendingRequest(endpoint, requestPromise);

  return requestPromise;
}

// Optimized API functions
export const fetchTopAnime = async (page = 1, limit = 20, includeNsfw = false): Promise<AnimeResponse> => {
   const response = await fetchFromApi<AnimeResponse>(`top/anime?page=${page}&limit=${limit}`, `top_anime_${page}_${limit}`)
   if (!includeNsfw) {
     response.data = response.data.filter((anime: AnimeData) => !isNsfwAnime(anime))
   }
   return response
 }

// Optimized landing page functions with longer cache duration
export const fetchTopAnimeForLanding = async (includeNsfw = false): Promise<AnimeData[]> => {
   const cacheKey = generateCacheKey('landing_top_anime', { includeNsfw });
   const cached = getCache<AnimeData[]>(cacheKey);

   if (cached) {
     return cached;
   }

   const response = await fetchTopAnime(1, 10, includeNsfw)
   const data = response.data

   setCache(cacheKey, data, CACHE_TTL.LANDING);
   return data
 }

export const fetchAnimeByGenre = async (genreIds: number | number[], page = 1, limit = 20, includeNsfw = false, sort?: string, order?: string): Promise<AnimeResponse> => {
  const genresStr = Array.isArray(genreIds) ? genreIds.join(',') : genreIds
  let url = `anime?genres=${genresStr}&page=${page}&limit=${limit}`
  url = buildSortParams(url, sort, order);

  const response = await fetchFromApi<AnimeResponse>(url, `genre_${genresStr}_${page}_${limit}_${sort || 'default'}_${order || 'default'}`)
  if (!includeNsfw) {
    response.data = response.data.filter((anime: AnimeData) => !isNsfwAnime(anime))
  }
  return response
}

export const fetchMovies = async (page = 1, limit = 20, includeNsfw = false, sort?: string, order?: string): Promise<AnimeResponse> => {
  let url = `anime?type=movie&page=${page}&limit=${limit}`
  url = buildSortParams(url, sort, order);

  const response = await fetchFromApi<AnimeResponse>(url, `movies_${page}_${limit}_${sort || 'default'}_${order || 'default'}`)
  if (!includeNsfw) {
    response.data = response.data.filter((anime: AnimeData) => !isNsfwAnime(anime))
  }
  return response
}

export const fetchGenres = async (): Promise<GenresResponse> => {
  return await fetchFromApi<GenresResponse>(`genres/anime`, `genres_anime`)
}

export const searchAnime = async (query: string, page = 1, limit = 20, includeNsfw = false): Promise<AnimeResponse> => {
  // Input validation & sanitization
  if (typeof query !== 'string') {
    throw new Error('Search query must be a string')
  }
  const sanitizedQuery = query.trim().slice(0, 200)
  const safeQuery = sanitizedQuery.replace(/[\x00-\x1F\x7F]/g, '')
  if (!safeQuery) {
    throw new Error('Search query cannot be empty')
  }
  const safePage = Math.max(1, Math.min(Math.floor(page), 100))
  const safeLimit = Math.max(1, Math.min(Math.floor(limit), 25))

  const response = await fetchFromApi<AnimeResponse>(
    `anime?q=${encodeURIComponent(safeQuery)}&page=${safePage}&limit=${safeLimit}`,
    `search_${safeQuery}_${safePage}_${safeLimit}`
  )
  if (!includeNsfw) {
    response.data = response.data.filter((anime: AnimeData) => !isNsfwAnime(anime))
  }
  return response
}

export const fetchSeasonalAnime = async (year: number, season: string, page = 1, limit = 20, includeNsfw = false, sort?: string, order?: string): Promise<AnimeResponse> => {
  let url = `seasons/${year}/${season}?page=${page}&limit=${limit}`
  url = buildSortParams(url, sort, order);

  const response = await fetchFromApi<AnimeResponse>(url, `seasonal_${year}_${season}_${page}_${limit}_${sort || 'default'}_${order || 'default'}`)
  if (!includeNsfw) {
    response.data = response.data.filter((anime: AnimeData) => !isNsfwAnime(anime))
  }
  return response
}

// Helper function for sorting anime by popularity and score (non-mutating)
const sortAnimeByPopularityAndScore = (animeList: AnimeData[]): AnimeData[] => {
  return [...animeList].sort((a, b) => {
    if (a.popularity !== undefined && b.popularity !== undefined) {
      return a.popularity - b.popularity
    }
    if (a.popularity !== undefined) return -1
    if (b.popularity !== undefined) return 1

    const scoreA = a.score || 0
    const scoreB = b.score || 0
    return scoreB - scoreA
  })
}

export const fetchSeasonalAnimeSorted = async (year: number, season: string, includeNsfw = false): Promise<AnimeData[]> => {
   try {
     let allAnime: AnimeData[] = []
     const maxPages = 3
     const itemsPerPage = 15

     for (let currentPage = 1; currentPage <= maxPages; currentPage++) {
       try {
         const response = await fetchSeasonalAnime(year, season, currentPage, itemsPerPage, includeNsfw)
         allAnime = [...allAnime, ...response.data]

         if (!response.pagination.has_next_page || currentPage >= maxPages) {
           break
         }

         if (currentPage < maxPages) {
           await new Promise(resolve => setTimeout(resolve, 2000))
         }
       } catch (error) {
         break
       }
     }

     return sortAnimeByPopularityAndScore(allAnime)
   } catch (error) {
     throw error
   }
 }

// Optimized version for landing page - fetches less data but faster
export const fetchSeasonalAnimeFast = async (year: number, season: string, includeNsfw = false, limit = 10): Promise<AnimeData[]> => {
   try {
     const response = await fetchSeasonalAnime(year, season, 1, Math.max(limit, 20), includeNsfw)
     const anime = response.data.slice(0, limit)
     return sortAnimeByPopularityAndScore(anime)
   } catch (error) {
     throw error
   }
 }

// Optimized landing page function for seasonal anime with longer cache
export const fetchSeasonalAnimeForLanding = async (year: number, season: string, includeNsfw = false, limit = 10): Promise<AnimeData[]> => {
   const cacheKey = generateCacheKey('landing_seasonal_anime', { year, season, includeNsfw, limit });
   const cached = getCache<AnimeData[]>(cacheKey);

   if (cached) {
     return cached;
   }

   const data = await fetchSeasonalAnimeFast(year, season, includeNsfw, limit)

   setCache(cacheKey, data, CACHE_TTL.LANDING);
   return data
 }

export const fetchAnimeById = (id: number): Promise<{ data: AnimeData }> => {
   return fetchFromApi(`anime/${id}`, `anime_${id}`)
}

export const fetchAnimeCharacters = async (id: number): Promise<{ data: CharacterWithRole[] }> => {
   return await fetchFromApi<{ data: CharacterWithRole[] }>(`anime/${id}/characters`, `anime_characters_${id}`);
}

// Image optimization utilities
export const getOptimizedImageUrl = (anime: AnimeData): string => {
  // Try to get the highest quality WebP image first
  if (anime.images.webp?.large_image_url) {
    return anime.images.webp.large_image_url;
  }
  if (anime.images.webp?.image_url) {
    return anime.images.webp.image_url;
  }
  if (anime.images.jpg?.large_image_url) {
    return anime.images.jpg.large_image_url;
  }
  if (anime.images.jpg?.image_url) {
    return anime.images.jpg.image_url;
  }

  return '/placeholder-anime.jpg';
};

// Image preloading utility
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

// Batch preload images for better performance
export const preloadAnimeImages = async (animeList: AnimeData[], priorityCount = 2): Promise<void> => {
  const highPriorityImages = animeList.slice(0, priorityCount).map(anime => getOptimizedImageUrl(anime))
  const lowPriorityImages = animeList.slice(priorityCount).map(anime => getOptimizedImageUrl(anime))

  await Promise.all(highPriorityImages.map(preloadImage))

  setTimeout(() => {
    Promise.all(lowPriorityImages.map(preloadImage)).catch(() => {
      // Ignore errors for low priority images
    })
  }, 100)
}

// NSFW filtering utility
export const isNsfwAnime = (anime: AnimeData): boolean => {
  if (anime.rating) {
    const nsfwRatings = ['Rx - Hentai', 'R+ - Mild Nudity'];
    if (nsfwRatings.includes(anime.rating)) {
      return true;
    }
  }

  if (anime.genres) {
    const nsfwGenres = ['Hentai', 'Ecchi'];
    const genreNames = anime.genres.map(genre => genre.name);
    if (genreNames.some(genre => nsfwGenres.includes(genre))) {
      return true;
    }
  }

  if (anime.themes) {
    const nsfwThemes = ['Hentai', 'Ecchi'];
    const themeNames = anime.themes.map(theme => theme.name);
    if (themeNames.some(theme => nsfwThemes.includes(theme))) {
      return true;
    }
  }

  return false;
}

// Utility functions
export const formatScore = (score?: number): string => {
  return score ? score.toFixed(2) : 'N/A'
}

export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return 'N/A'

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Use UTC parts to keep SSR and hydration output identical across time zones.
  const month = monthNames[date.getUTCMonth()]
  const day = date.getUTCDate()
  const year = date.getUTCFullYear()

  return `${month} ${day}, ${year}`
}

// Schedule API functions
export const fetchAnimeSchedule = async (day?: string, includeNsfw = false): Promise<AnimeResponse> => {
  let url = 'schedules'

  if (day) {
    url += `?filter=${day}`
  }

  const response = await fetchFromApi<AnimeResponse>(url, `schedule_${day || 'all'}`)
  if (!includeNsfw) {
    response.data = response.data.filter((anime: AnimeData) => !isNsfwAnime(anime))
  }
  return response
}

// Get anime airing on the next day based on current date
export const fetchNextDayAnime = async (includeNsfw = false): Promise<AnimeData[]> => {
  if (typeof window === 'undefined') return []
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const dayName = tomorrow.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

  try {
    const response = await fetchAnimeSchedule(dayName, includeNsfw)
    return response.data
  } catch (error) {
    return []
  }
}

// Get anime airing on the current day
export const fetchTodayAnime = async (includeNsfw = false): Promise<AnimeData[]> => {
  if (typeof window === 'undefined') return []
  const now = new Date()
  const today = new Date(now)

  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

  try {
    const response = await fetchAnimeSchedule(dayName, includeNsfw)
    return response.data
  } catch (error) {
    return []
  }
}

// Helper function to get current season information
export const getCurrentSeasonInfo = (): { year: number; season: string; displayName: string } => {
  const now = new Date()
  const currentMonth = now.getMonth() + 1 // getMonth() returns 0-11
  const currentYear = now.getFullYear()

  let season: string
  if (currentMonth >= 3 && currentMonth <= 5) season = 'spring'
  else if (currentMonth >= 6 && currentMonth <= 8) season = 'summer'
  else if (currentMonth >= 9 && currentMonth <= 11) season = 'fall'
  else season = 'winter'

  return {
    year: currentYear,
    season: season,
    displayName: season.charAt(0).toUpperCase() + season.slice(1)
  }
}
