// Jikan API service for fetching anime data
const JIKAN_API_BASE = 'https://api.jikan.moe/v4'

// Request deduplication map to prevent concurrent requests for the same endpoint
const pendingRequests = new Map<string, Promise<any>>();

// Types for API responses
export interface AnimeData {
  mal_id: number
  title: string
  title_english?: string
  title_japanese?: string
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
  synopsis?: string
  score?: number
  scored_by?: number
  rank?: number
  popularity?: number
  members?: number
  favorites?: number
  type: string
  episodes?: number
  status: string
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
  genres: Array<{
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
  studios: Array<{
    mal_id: number
    type: string
    name: string
    url: string
  }>
  trailer?: {
    youtube_id?: string
    url?: string
    embed_url?: string
  }
  characters?: CharacterData[]
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

// Import cache utilities
import { getCache, setCache } from './cache'

// Request caching and optimization
// In-memory cache for server-side requests
const API_CACHE = new Map<string, { data: any; timestamp: number }>()
// Cache durations based on data type
const CACHE_DURATIONS = {
  STATIC: 24 * 60 * 60 * 1000,     // 24 hours for relatively static data
  SEMI_STATIC: 60 * 60 * 1000,     // 1 hour for semi-static data
  DYNAMIC: 15 * 60 * 1000,         // 15 minutes for frequently changing data
  LANDING: 30 * 60 * 1000          // 30 minutes for landing page data
}

// Rate limiting controls
const REQUEST_DELAY = 1000 // 1 second between requests (reduced from 1.5)
const MAX_RETRIES = 2      // Reduced retries
const BASE_RETRY_DELAY = 1000 // 1 second base delay for retries (reduced from 2)
let lastRequestTime = 0

// Helper function to build sorted URL parameters
const buildSortParams = (url: string, sort?: string, order?: string): string => {
  let result = url;
  
  // Map our sort options to Jikan API parameters
  if (sort) {
    switch (sort) {
      case 'popularity':
        result += `&order_by=popularity`
        // Invert the sort direction for popularity since lower numbers = more popular
        if (order) {
          result += `&sort=${order === 'desc' ? 'asc' : 'desc'}`
        } else {
          result += `&sort=asc` // Default to asc for popularity (most popular first)
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
        // Default to popularity if invalid sort option
        result += `&order_by=popularity`
    }

    // Add sort direction for non-popularity sorts
    if (sort !== 'popularity') {
      if (order) {
        result += `&sort=${order}`
      } else {
        // Default to descending order for other sorts
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
    return CACHE_DURATIONS.STATIC;
  }
  
  if (endpoint.includes('seasons')) {
    return CACHE_DURATIONS.SEMI_STATIC;
  }
  
  if (endpoint.includes('landing')) {
    return CACHE_DURATIONS.LANDING;
  }
  
  return CACHE_DURATIONS.DYNAMIC;
}

// Enhanced cache management with localStorage fallback
const getCachedData = (cacheKey: string): any | null => {
  // Try in-memory cache first (faster)
  const memoryCached = API_CACHE.get(cacheKey);
  if (memoryCached && Date.now() - memoryCached.timestamp < getCacheDuration(cacheKey)) {
    return memoryCached.data;
  }
  
  // Try localStorage cache for client-side
  if (typeof window !== 'undefined') {
    const localStorageCached = getCache(cacheKey);
    if (localStorageCached) {
      // Update in-memory cache
      API_CACHE.set(cacheKey, { data: localStorageCached, timestamp: Date.now() });
      return localStorageCached;
    }
  }
  
  return null;
};

const setCachedData = (cacheKey: string, data: any): void => {
  const timestamp = Date.now();
  
  // Update in-memory cache
  API_CACHE.set(cacheKey, { data, timestamp });
  
  // Update localStorage cache for client-side
  if (typeof window !== 'undefined') {
    setCache(cacheKey, data);
  }
};

async function fetchFromApi<T>(endpoint: string, cacheKey: string): Promise<T> {
  // Check cache first
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }

  // Check if there's already a pending request for this endpoint
  if (pendingRequests.has(endpoint)) {
    // Return the existing promise to deduplicate the request
    return pendingRequests.get(endpoint);
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
            const delay = BASE_RETRY_DELAY * Math.pow(2, attempt) // Exponential backoff starting at 1 second
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
          setCachedData(cacheKey, data);
          return data
        } catch (error) {
          // If this is the final attempt or a non-retryable error, throw it
          if (attempt === MAX_RETRIES || (error instanceof Error && !error.message.includes('429'))) {
            throw error
          }

          // Wait before retrying (except on final attempt)
          if (attempt < MAX_RETRIES) {
            const delay = BASE_RETRY_DELAY * Math.pow(2, attempt)
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }
      }

      // This should never be reached, but TypeScript needs it
      throw new Error(`Failed to fetch ${endpoint} after ${MAX_RETRIES} attempts`)
    } finally {
      // Remove the pending request when completed (success or error)
      pendingRequests.delete(endpoint);
    }
  })();

  // Store the promise in the pending requests map
  pendingRequests.set(endpoint, requestPromise);

  // Return the promise
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
   const cached = getCachedData(cacheKey);

   if (cached) {
     return cached;
   }

   const response = await fetchTopAnime(1, 10, includeNsfw)
   const data = response.data

   // Cache with longer duration for landing page
   setCachedData(cacheKey, data);
   return data
 }

export const fetchAnimeByGenre = async (genreId: number, page = 1, limit = 20, includeNsfw = false, sort?: string, order?: string): Promise<AnimeResponse> => {
  let url = `anime?genres=${genreId}&page=${page}&limit=${limit}`
  url = buildSortParams(url, sort, order);

  const response = await fetchFromApi<AnimeResponse>(url, `genre_${genreId}_${page}_${limit}_${sort || 'default'}_${order || 'default'}`)
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
  const response = await fetchFromApi<AnimeResponse>(`anime?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, `search_${query}_${page}_${limit}`)
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

// Helper function for sorting anime by popularity and score
const sortAnimeByPopularityAndScore = (animeList: AnimeData[]): AnimeData[] => {
  return animeList.sort((a, b) => {
    // If both have popularity, sort by that
    if (a.popularity !== undefined && b.popularity !== undefined) {
      return a.popularity - b.popularity
    }

    // If only one has popularity, it comes first
    if (a.popularity !== undefined) return -1
    if (b.popularity !== undefined) return 1

    // If neither has popularity, sort by score (descending)
    const scoreA = a.score || 0
    const scoreB = b.score || 0
    return scoreB - scoreA
  })
}

export const fetchSeasonalAnimeSorted = async (year: number, season: string, includeNsfw = false): Promise<AnimeData[]> => {
   try {
     // Fetch only the first few pages to avoid rate limiting
     // We'll fetch 3 pages with 15 items each (45 total) which should be sufficient for most use cases
     let allAnime: AnimeData[] = []
     const maxPages = 3
     const itemsPerPage = 15

     for (let currentPage = 1; currentPage <= maxPages; currentPage++) {
       try {
         const response = await fetchSeasonalAnime(year, season, currentPage, itemsPerPage, includeNsfw)
         allAnime = [...allAnime, ...response.data]

         // Check if there are more pages, but limit to maxPages
         if (!response.pagination.has_next_page || currentPage >= maxPages) {
           break
         }

         // Add extra delay between page requests to prevent rate limiting
         if (currentPage < maxPages) {
           await new Promise(resolve => setTimeout(resolve, 2000)) // 2 second delay between pages
         }
       } catch (error) {
         // Continue with other pages even if one fails
         break
       }
     }

     // Sort by popularity (ascending order - lower number means more popular)
     // If popularity is not available, sort by score (descending)
     return sortAnimeByPopularityAndScore(allAnime)
   } catch (error) {
     throw error
   }
 }

// Optimized version for landing page - fetches less data but faster
export const fetchSeasonalAnimeFast = async (year: number, season: string, includeNsfw = false, limit = 10): Promise<AnimeData[]> => {
   try {
     // Use the regular seasonal fetch but with optimized parameters
     const response = await fetchSeasonalAnime(year, season, 1, Math.max(limit, 20), includeNsfw)

     // Take only the requested limit and sort by popularity/score
     const anime = response.data.slice(0, limit)

     // Sort by popularity first, then by score
     return sortAnimeByPopularityAndScore(anime)
   } catch (error) {
     throw error
   }
 }

// Optimized landing page function for seasonal anime with longer cache
export const fetchSeasonalAnimeForLanding = async (year: number, season: string, includeNsfw = false, limit = 10): Promise<AnimeData[]> => {
   const cacheKey = generateCacheKey('landing_seasonal_anime', { year, season, includeNsfw, limit });
   const cached = getCachedData(cacheKey);

   if (cached) {
     return cached;
   }

   const data = await fetchSeasonalAnimeFast(year, season, includeNsfw, limit)

   // Cache with longer duration for landing page
   setCachedData(cacheKey, data);
   return data
 }

export const fetchAnimeById = (id: number): Promise<{ data: AnimeData }> => {
   return fetchFromApi(`anime/${id}`, `anime_${id}`)
}

export const fetchAnimeCharacters = async (id: number): Promise<{ data: CharacterData[] }> => {
   return await fetchFromApi<{ data: CharacterData[] }>(`anime/${id}/characters`, `anime_characters_${id}`);
}

// Image optimization utilities
// Use localStorage for persistent image URL caching
const IMAGE_CACHE_KEY = 'cryoanime_image_cache';
let IMAGE_CACHE: Map<string, string> = new Map();

// Initialize image cache from localStorage
const initImageCache = () => {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(IMAGE_CACHE_KEY);
      if (cached) {
        IMAGE_CACHE = new Map(Object.entries(JSON.parse(cached)));
      }
    } catch (e) {
      // Ignore errors in localStorage parsing
    }
  }
};

// Save image cache to localStorage
const saveImageCache = () => {
  if (typeof window !== 'undefined' && IMAGE_CACHE.size > 0) {
    try {
      const obj = Object.fromEntries(IMAGE_CACHE);
      localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(obj));
    } catch (e) {
      // Ignore errors in localStorage saving
    }
  }
};

// Initialize on load
if (typeof window !== 'undefined') {
  initImageCache();
  // Save cache when page is about to unload
  window.addEventListener('beforeunload', saveImageCache);
}

export const getOptimizedImageUrl = (anime: AnimeData): string => {
  const cacheKey = `anime_${anime.mal_id}`;

  // Check cache first
  if (IMAGE_CACHE.has(cacheKey)) {
    return IMAGE_CACHE.get(cacheKey)!;
  }

  // Fetch only one image format at max resolution
  // Prioritize WebP (if available), otherwise use JPG
  let selectedUrl: string | undefined;
  
  // Try to get the highest quality WebP image first
  if (anime.images.webp?.large_image_url) {
    selectedUrl = anime.images.webp.large_image_url;
  } else if (anime.images.webp?.image_url) {
    // Fallback to regular WebP if large isn't available
    selectedUrl = anime.images.webp.image_url;
  } else if (anime.images.jpg?.large_image_url) {
    // Fallback to large JPG if WebP isn't available
    selectedUrl = anime.images.jpg.large_image_url;
  } else if (anime.images.jpg?.image_url) {
    // Last resort: regular JPG
    selectedUrl = anime.images.jpg.image_url;
  }

  // Cache the result if a URL was found
  if (selectedUrl) {
    IMAGE_CACHE.set(cacheKey, selectedUrl);
    // Save to localStorage periodically
    if (IMAGE_CACHE.size % 10 === 0) {
      saveImageCache();
    }
    return selectedUrl;
  }

  // Return a placeholder if no URL is available
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

  // Preload high priority images first
  await Promise.all(highPriorityImages.map(preloadImage))

  // Preload low priority images in background
  setTimeout(() => {
    Promise.all(lowPriorityImages.map(preloadImage)).catch(() => {
      // Ignore errors for low priority images
    })
  }, 100)
}

// Legacy function for backward compatibility
export const getImageUrl = (anime: AnimeData): string => {
  return getOptimizedImageUrl(anime)
}

// Cache management utilities
export const clearImageCache = (): void => {
  IMAGE_CACHE.clear();
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(IMAGE_CACHE_KEY);
    } catch (e) {
      // Ignore errors in localStorage removal
    }
  }
};

export const clearApiCache = (): void => {
  API_CACHE.clear();
};

export const clearAllCaches = (): void => {
  clearImageCache();
  clearApiCache();
};

// Performance monitoring utilities
export const getCacheStats = () => {
   return {
     imageCache: {
       size: IMAGE_CACHE.size,
       keys: Array.from(IMAGE_CACHE.keys())
     },
     apiCache: {
       size: API_CACHE.size,
       keys: Array.from(API_CACHE.keys())
     }
   }
 }

// Performance metrics for landing page optimization
let landingPageLoadCount = 0
let landingPageCacheHitCount = 0
let landingPageTotalLoadTime = 0

export const recordLandingPageLoad = (loadTime: number, cacheHit: boolean) => {
   landingPageLoadCount++
   landingPageTotalLoadTime += loadTime
   if (cacheHit) {
     landingPageCacheHitCount++
   }
 }

export const getLandingPagePerformanceStats = () => {
   return {
     totalLoads: landingPageLoadCount,
     cacheHits: landingPageCacheHitCount,
     cacheHitRate: landingPageLoadCount > 0 ? (landingPageCacheHitCount / landingPageLoadCount * 100).toFixed(1) + '%' : '0%',
     averageLoadTime: landingPageLoadCount > 0 ? (landingPageTotalLoadTime / landingPageLoadCount).toFixed(0) + 'ms' : '0ms'
   }
 }

// NSFW filtering utility
export const isNsfwAnime = (anime: AnimeData): boolean => {
  // Check rating field for NSFW indicators
  if (anime.rating) {
    const nsfwRatings = ['Rx - Hentai', 'R+ - Mild Nudity'];
    if (nsfwRatings.includes(anime.rating)) {
      return true;
    }
  }
  
  // Check genres for NSFW indicators
  if (anime.genres) {
    const nsfwGenres = ['Hentai', 'Ecchi'];
    const genreNames = anime.genres.map(genre => genre.name);
    if (genreNames.some(genre => nsfwGenres.includes(genre))) {
      return true;
    }
  }
  
  // Check themes for NSFW indicators
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
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Rate limiting utility functions
export const getRateLimitStatus = () => {
  return {
    lastRequestTime,
    timeSinceLastRequest: Date.now() - lastRequestTime,
    requestDelay: REQUEST_DELAY,
    maxRetries: MAX_RETRIES,
    baseRetryDelay: BASE_RETRY_DELAY,
    apiCacheSize: API_CACHE.size,
    imageCacheSize: IMAGE_CACHE.size
  }
}

export const resetRateLimitTimer = (): void => {
  lastRequestTime = 0
}

export const setCustomRequestDelay = (delayMs: number): void => {
  // Allow customization of request delay for different environments
  // This is a global change that affects all API calls
  (global as any).CUSTOM_REQUEST_DELAY = delayMs
}

// Schedule API functions
export const fetchAnimeSchedule = async (day?: string, includeNsfw = false): Promise<AnimeResponse> => {
  let url = 'schedules'

  // If day is specified, fetch schedule for that specific day
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
  const now = new Date()
  // Get tomorrow's date
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Get day name in lowercase (monday, tuesday, etc.)
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
  const now = new Date()
  // Get today's date
  const today = new Date(now)
  
  // Get day name in lowercase (monday, tuesday, etc.)
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