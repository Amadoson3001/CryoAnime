// Jikan API service for fetching anime data
const JIKAN_API_BASE = 'https://api.jikan.moe/v4'

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

// Request caching and optimization
const API_CACHE = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const LANDING_CACHE_DURATION = 15 * 60 * 1000 // 15 minutes for landing page data

// Rate limiting controls
const REQUEST_DELAY = 1500 // 1.5 seconds between requests
const MAX_RETRIES = 3
const BASE_RETRY_DELAY = 2000 // 2 seconds base delay for retries
let lastRequestTime = 0

// Centralized API fetcher with caching
const processAnimeData = (anime: AnimeData): AnimeData => {
  if (anime && !anime.year && anime.aired?.prop?.from?.year) {
    anime.year = anime.aired.prop.from.year
  }
  return anime
}

async function fetchFromApi<T>(endpoint: string, cacheKey: string): Promise<T> {
  const cached = API_CACHE.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

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
        const delay = BASE_RETRY_DELAY * Math.pow(2, attempt) // Exponential backoff starting at 2 seconds
        console.warn(`Rate limited. Waiting ${delay}ms before retry ${attempt + 1}/${MAX_RETRIES} for ${endpoint}`)
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

      API_CACHE.set(cacheKey, { data, timestamp: Date.now() })
      return data
    } catch (error) {
      // If this is the final attempt or a non-retryable error, throw it
      if (attempt === MAX_RETRIES || (error instanceof Error && !error.message.includes('429'))) {
        // Log the specific endpoint that failed
        console.error(`Error fetching API endpoint "${endpoint}" after ${attempt + 1} attempts:`, error)
        throw error
      }

      // Wait before retrying (except on final attempt)
      if (attempt < MAX_RETRIES) {
        const delay = BASE_RETRY_DELAY * Math.pow(2, attempt)
        console.warn(`Waiting ${delay}ms before retry ${attempt + 1}/${MAX_RETRIES} for ${endpoint}`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // This should never be reached, but TypeScript needs it
  throw new Error(`Failed to fetch ${endpoint} after ${MAX_RETRIES} attempts`)
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
   const cacheKey = `landing_top_anime_${includeNsfw}`
   const cached = API_CACHE.get(cacheKey)

   if (cached && Date.now() - cached.timestamp < LANDING_CACHE_DURATION) {
     return cached.data
   }

   const response = await fetchTopAnime(1, 10, includeNsfw)
   const data = response.data

   // Cache with longer duration for landing page
   API_CACHE.set(cacheKey, { data, timestamp: Date.now() })
   return data
 }

export const fetchAnimeByGenre = async (genreId: number, page = 1, limit = 20, includeNsfw = false, sort?: string, order?: string): Promise<AnimeResponse> => {
  let url = `anime?genres=${genreId}&page=${page}&limit=${limit}`

  // Map our sort options to Jikan API parameters
  if (sort) {
    switch (sort) {
      case 'popularity':
        url += `&order_by=popularity`
        // Invert the sort direction for popularity since lower numbers = more popular
        if (order) {
          url += `&sort=${order === 'desc' ? 'asc' : 'desc'}`
        } else {
          url += `&sort=asc` // Default to asc for popularity (most popular first)
        }
        break
      case 'score':
        url += `&order_by=score`
        break
      case 'recent':
        url += `&order_by=start_date`
        break
      case 'title':
        url += `&order_by=title`
        break
      default:
        // Default to popularity if invalid sort option
        url += `&order_by=popularity`
    }

    // Add sort direction for non-popularity sorts
    if (sort !== 'popularity') {
      if (order) {
        url += `&sort=${order}`
      } else {
        // Default to descending order for other sorts
        url += `&sort=desc`
      }
    }
  }

  const response = await fetchFromApi<AnimeResponse>(url, `genre_${genreId}_${page}_${limit}_${sort || 'default'}_${order || 'default'}`)
  if (!includeNsfw) {
    response.data = response.data.filter((anime: AnimeData) => !isNsfwAnime(anime))
  }
  return response
}

export const fetchGenres = async (): Promise<GenresResponse> => {
  const response = await fetchFromApi<GenresResponse>(`genres/anime`, `genres_anime`)
  return response
}

export const searchAnime = async (query: string, page = 1, limit = 20, includeNsfw = false): Promise<AnimeResponse> => {
  const response = await fetchFromApi<AnimeResponse>(`anime?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, `search_${query}_${page}_${limit}`)
  if (!includeNsfw) {
    response.data = response.data.filter((anime: AnimeData) => !isNsfwAnime(anime))
  }
  return response
}

export const fetchSeasonalAnime = async (year: number, season: string, page = 1, limit = 20, includeNsfw = false): Promise<AnimeResponse> => {
  const response = await fetchFromApi<AnimeResponse>(`seasons/${year}/${season}?page=${page}&limit=${limit}`, `seasonal_${year}_${season}_${page}_${limit}`)
  if (!includeNsfw) {
    response.data = response.data.filter((anime: AnimeData) => !isNsfwAnime(anime))
  }
  return response
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
         console.warn(`Failed to fetch page ${currentPage} for ${year} ${season}:`, error)
         // Continue with other pages even if one fails
         break
       }
     }

     // Sort by popularity (ascending order - lower number means more popular)
     // If popularity is not available, sort by score (descending)
     return allAnime.sort((a, b) => {
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
   } catch (error) {
     console.error(`Error fetching seasonal anime for ${year} ${season}:`, error)
     throw error
   }
 }

// Optimized version for landing page - fetches less data but faster
export const fetchSeasonalAnimeFast = async (year: number, season: string, includeNsfw = false, limit = 10): Promise<AnimeData[]> => {
   try {
     // Use the regular seasonal fetch but with optimized parameters
     const response = await fetchSeasonalAnime(year, season, 1, Math.max(limit, 20), includeNsfw)

     // Take only the requested limit and sort by popularity/score
     let anime = response.data.slice(0, limit)

     // Sort by popularity first, then by score
     return anime.sort((a, b) => {
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
   } catch (error) {
     console.error(`Error fetching fast seasonal anime for ${year} ${season}:`, error)
     throw error
   }
 }

// Optimized landing page function for seasonal anime with longer cache
export const fetchSeasonalAnimeForLanding = async (year: number, season: string, includeNsfw = false, limit = 10): Promise<AnimeData[]> => {
   const cacheKey = `landing_seasonal_anime_${year}_${season}_${includeNsfw}_${limit}`
   const cached = API_CACHE.get(cacheKey)

   if (cached && Date.now() - cached.timestamp < LANDING_CACHE_DURATION) {
     return cached.data
   }

   const data = await fetchSeasonalAnimeFast(year, season, includeNsfw, limit)

   // Cache with longer duration for landing page
   API_CACHE.set(cacheKey, { data, timestamp: Date.now() })
   return data
 }

export const fetchAnimeById = (id: number): Promise<{ data: AnimeData }> => {
  return fetchFromApi(`anime/${id}`, `anime_${id}`)
}

// Image optimization utilities
const IMAGE_CACHE = new Map<string, string>()

export const getOptimizedImageUrl = (anime: AnimeData): string => {
  const cacheKey = `anime_${anime.mal_id}`

  // Check cache first
  const cachedUrl = IMAGE_CACHE.get(cacheKey)
  if (cachedUrl) {
    return cachedUrl
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
    IMAGE_CACHE.set(cacheKey, selectedUrl)
    return selectedUrl
  }

  // Return a placeholder if no URL is available
  return '/placeholder-anime.jpg'
}

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
  IMAGE_CACHE.clear()
}

export const clearApiCache = (): void => {
  API_CACHE.clear()
}

export const clearAllCaches = (): void => {
  clearImageCache()
  clearApiCache()
}

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