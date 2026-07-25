// Jikan API service for fetching anime data
const JIKAN_API_BASE = (
  process.env.NEXT_PUBLIC_JIKAN_BASE_URL || 'https://api.jikan.moe/v4'
).replace(/\/+$/, '')
const JIKAN_API_PROXY = '/api/jikan'

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

export type TagCategory = 'genres' | 'themes' | 'demographics' | 'explicit_genres'

// Jikan API uses the 'genres' param for all tag types (genres, themes, demographics, explicit_genres)
// since IDs are globally unique across all categories
const TAG_PARAM_MAP: Record<TagCategory, string> = {
  genres: 'genres',
  themes: 'genres',
  demographics: 'genres',
  explicit_genres: 'genres',
}

// Import unified cache utilities
import {
  CACHE_TTL,
  deletePendingRequest,
  getCache,
  getPendingRequest,
  getStaleCache,
  setCache,
  setPendingRequest,
} from './cache'

// Rate limiting controls
const REQUEST_DELAY = 1000 // 1 second between requests
const MAX_RETRIES = 2
const BASE_RETRY_DELAY = 1000
const REQUEST_TIMEOUT = 15000
const MAX_STALE_AGE = 7 * 24 * 60 * 60 * 1000
let lastRequestTime = 0
let requestQueue: Promise<void> = Promise.resolve()
const FALLBACK_ANIME_CACHE_KEY = 'anime_last_known_good'
const FALLBACK_MOVIE_CACHE_KEY = 'movies_last_known_good'

class ApiRequestError extends Error {
  constructor(message: string, readonly retryable: boolean) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

const rememberAnimeFallback = (anime: AnimeData[]): void => {
  if (anime.length > 0) {
    setCache(FALLBACK_ANIME_CACHE_KEY, anime, CACHE_TTL.LANDING)
  }
}

const getRememberedAnimeFallback = (): AnimeData[] => {
  return (
    getCache<AnimeData[]>(FALLBACK_ANIME_CACHE_KEY) ||
    getStaleCache<AnimeData[]>(FALLBACK_ANIME_CACHE_KEY, MAX_STALE_AGE) ||
    []
  )
}

const rememberMovieFallback = (anime: AnimeData[]): void => {
  if (anime.length > 0) {
    setCache(FALLBACK_MOVIE_CACHE_KEY, anime, CACHE_TTL.STATIC)
  }
}

const getRememberedMovieFallback = (): AnimeData[] => {
  return (
    getCache<AnimeData[]>(FALLBACK_MOVIE_CACHE_KEY) ||
    getStaleCache<AnimeData[]>(FALLBACK_MOVIE_CACHE_KEY, MAX_STALE_AGE) ||
    []
  )
}

const createSinglePageResponse = (anime: AnimeData[], perPage: number): AnimeResponse => ({
  data: anime,
  pagination: {
    last_visible_page: 1,
    has_next_page: false,
    current_page: 1,
    items: {
      count: anime.length,
      total: anime.length,
      per_page: perPage,
    },
  },
})

const createFallbackMovie = (
  malId: number,
  title: string,
  year: number,
  score: number,
  imageUrl: string,
): AnimeData => ({
  mal_id: malId,
  title,
  images: {
    jpg: {
      image_url: imageUrl,
      small_image_url: imageUrl,
      large_image_url: imageUrl,
    },
  },
  synopsis: 'Anime information is temporarily limited while the live data service recovers.',
  score,
  type: 'Movie',
  status: 'Finished Airing',
  aired: {
    prop: {
      from: { year },
      to: { year },
    },
  },
  duration: 'Unknown',
  year,
  genres: [],
  producers: [],
  licensors: [],
  studios: [],
})

const CURATED_MOVIE_FALLBACK: AnimeData[] = [
  createFallbackMovie(57555, 'Chainsaw Man Movie: Reze Arc', 2025, 9.06, 'https://cdn.myanimelist.net/images/anime/1763/150638l.jpg'),
  createFallbackMovie(39486, 'Gintama: The Final', 2021, 9.05, 'https://cdn.myanimelist.net/images/anime/1245/116760l.jpg'),
  createFallbackMovie(28851, 'A Silent Voice', 2016, 8.93, 'https://cdn.myanimelist.net/images/anime/1122/96435l.jpg'),
  createFallbackMovie(15335, 'Gintama Movie 2: The Final Chapter', 2013, 8.89, 'https://cdn.myanimelist.net/images/anime/10/51723l.jpg'),
  createFallbackMovie(59571, 'Attack on Titan: The Last Attack', 2024, 8.83, 'https://cdn.myanimelist.net/images/anime/1379/145452l.jpg'),
  createFallbackMovie(37987, 'Violet Evergarden: The Movie', 2020, 8.83, 'https://cdn.myanimelist.net/images/anime/1825/110716l.jpg'),
  createFallbackMovie(32281, 'Your Name.', 2016, 8.82, 'https://cdn.myanimelist.net/images/anime/5/87048l.jpg'),
  createFallbackMovie(31758, 'Kizumonogatari Part 3: Reiketsu', 2017, 8.78, 'https://cdn.myanimelist.net/images/anime/1084/112813l.jpg'),
  createFallbackMovie(199, 'Spirited Away', 2001, 8.77, 'https://cdn.myanimelist.net/images/anime/6/79597l.jpg'),
  createFallbackMovie(52198, 'Kaguya-sama: The First Kiss Never Ends', 2022, 8.71, 'https://cdn.myanimelist.net/images/anime/1670/130060l.jpg'),
  createFallbackMovie(45649, 'The First Slam Dunk', 2022, 8.70, 'https://cdn.myanimelist.net/images/anime/1745/129284l.jpg'),
  createFallbackMovie(431, "Howl's Moving Castle", 2004, 8.67, 'https://cdn.myanimelist.net/images/anime/1470/138723l.jpg'),
  createFallbackMovie(164, 'Princess Mononoke', 1997, 8.67, 'https://cdn.myanimelist.net/images/anime/1355/147277l.jpg'),
  createFallbackMovie(61952, 'The Legend of Hei 2', 2025, 8.66, 'https://cdn.myanimelist.net/images/anime/1288/151853l.jpg'),
  createFallbackMovie(59192, 'Demon Slayer: Infinity Castle', 2025, 8.66, 'https://cdn.myanimelist.net/images/anime/1681/148216l.jpg'),
  createFallbackMovie(57647, 'Uma Musume: Beginning of a New Era', 2024, 8.64, 'https://cdn.myanimelist.net/images/anime/1427/142210l.jpg'),
  createFallbackMovie(33050, "Fate/stay night: Heaven's Feel III", 2020, 8.63, 'https://cdn.myanimelist.net/images/anime/1142/112957l.jpg'),
  createFallbackMovie(52742, 'Haikyu!! The Dumpster Battle', 2024, 8.62, 'https://cdn.myanimelist.net/images/anime/1665/140360l.jpg'),
  createFallbackMovie(58125, 'Look Back', 2024, 8.61, 'https://cdn.myanimelist.net/images/anime/1716/142633l.jpg'),
  createFallbackMovie(4565, 'Gurren Lagann the Movie: The Lights in the Sky Are Stars', 2009, 8.61, 'https://cdn.myanimelist.net/images/anime/12/19698l.jpg'),
  createFallbackMovie(36862, 'Made in Abyss: Dawn of the Deep Soul', 2020, 8.60, 'https://cdn.myanimelist.net/images/anime/1803/117183l.jpg'),
  createFallbackMovie(38329, 'Rascal Does Not Dream of a Dreaming Girl', 2019, 8.59, 'https://cdn.myanimelist.net/images/anime/1613/102179l.jpg'),
  createFallbackMovie(7311, 'The Disappearance of Haruhi Suzumiya', 2010, 8.59, 'https://cdn.myanimelist.net/images/anime/1248/112352l.jpg'),
  createFallbackMovie(3786, 'Evangelion: 3.0+1.0 Thrice Upon a Time', 2021, 8.58, 'https://cdn.myanimelist.net/images/anime/1422/113533l.jpg'),
]

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

const wait = (delay: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, delay))

const parseRetryAfter = (value: string | null): number | null => {
  if (!value) return null

  const seconds = Number(value)
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000
  }

  const retryDate = Date.parse(value)
  return Number.isNaN(retryDate) ? null : Math.max(0, retryDate - Date.now())
}

const scheduleRequest = <T>(request: () => Promise<T>): Promise<T> => {
  const scheduled = requestQueue.then(async () => {
    const elapsed = Date.now() - lastRequestTime
    if (elapsed < REQUEST_DELAY) {
      await wait(REQUEST_DELAY - elapsed)
    }
    lastRequestTime = Date.now()
    return request()
  })

  requestQueue = scheduled.then(
    () => undefined,
    () => undefined,
  )
  return scheduled
}

const fetchWithTimeout = async (url: string): Promise<Response> => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
  try {
    return await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchFromApi<T>(endpoint: string, cacheKey: string): Promise<T> {
  const stale = getStaleCache<T>(cacheKey, MAX_STALE_AGE)

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
      // Browser requests already pass through the retrying same-origin proxy.
      // Server-side calls go directly to Jikan and retry here.
      const retries = typeof window === 'undefined' ? MAX_RETRIES : 0
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const apiBase = typeof window === 'undefined' ? JIKAN_API_BASE : JIKAN_API_PROXY
          const response = await scheduleRequest(
            () => fetchWithTimeout(`${apiBase}/${endpoint}`),
          )

          const retryableStatus = response.status === 429 || response.status >= 500
          if (!response.ok && retryableStatus && attempt < retries) {
            const retryAfter = parseRetryAfter(response.headers.get('retry-after'))
            const delay = retryAfter ?? BASE_RETRY_DELAY * Math.pow(2, attempt)
            await wait(delay)
            continue
          }

          if (!response.ok) {
            throw new ApiRequestError(
              `HTTP error! status: ${response.status}`,
              retryableStatus
            )
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
          const isRetryable = !(error instanceof ApiRequestError) || error.retryable
          if (attempt === retries || !isRetryable) {
            if (isRetryable && stale !== null) {
              return stale
            }
            throw error
          }

          const delay = BASE_RETRY_DELAY * Math.pow(2, attempt)
          await wait(delay)
        }
      }

      if (stale !== null) {
        return stale
      }
      throw new Error(`Failed to fetch ${endpoint} after ${retries + 1} attempts`)
    } finally {
      deletePendingRequest(endpoint);
    }
  })();

  setPendingRequest(endpoint, requestPromise);

  return requestPromise;
}

// Optimized API functions
export const fetchTopAnime = async (page = 1, limit = 20, includeNsfw = false): Promise<AnimeResponse> => {
   const response = await fetchFromApi<AnimeResponse>(
     `top/anime?page=${page}&limit=${limit}`,
     `top_anime_${page}_${limit}`
   )
   rememberAnimeFallback(response.data)
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

   const response = await fetchFromApi<AnimeResponse>(
     'top/anime?filter=bypopularity&page=1&limit=20',
     'landing_top_anime_popular'
   )
   const filteredData = includeNsfw
     ? response.data
     : response.data.filter((anime: AnimeData) => !isNsfwAnime(anime))
   rememberAnimeFallback(response.data)
   const data = [...filteredData]
     .sort((a, b) => (b.score || 0) - (a.score || 0))
     .slice(0, 10)

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

export const fetchAnimeByTags = async (tagIds: number | number[], tagType: TagCategory = 'genres', page = 1, limit = 20, includeNsfw = false, sort?: string, order?: string): Promise<AnimeResponse> => {
  const idsStr = Array.isArray(tagIds) ? tagIds.join(',') : tagIds
  const param = TAG_PARAM_MAP[tagType]
  let url = `anime?${param}=${idsStr}&page=${page}&limit=${limit}`
  url = buildSortParams(url, sort, order);

  const response = await fetchFromApi<AnimeResponse>(url, `${tagType}_${idsStr}_${page}_${limit}_${sort || 'default'}_${order || 'default'}`)
  if (!includeNsfw) {
    response.data = response.data.filter((anime: AnimeData) => !isNsfwAnime(anime))
  }
  return response
}

const sortMoviePage = (
  anime: AnimeData[],
  sort = 'popularity',
  order = 'desc',
): AnimeData[] => {
  const sorted = [...anime]

  switch (sort) {
    case 'score':
      return sorted.sort((a, b) =>
        order === 'asc'
          ? (a.score || 0) - (b.score || 0)
          : (b.score || 0) - (a.score || 0),
      )
    case 'recent':
      return sorted.sort((a, b) => {
        const aDate = new Date(a.aired?.from || 0).getTime()
        const bDate = new Date(b.aired?.from || 0).getTime()
        return order === 'asc' ? aDate - bDate : bDate - aDate
      })
    case 'title':
      return sorted.sort((a, b) =>
        order === 'desc'
          ? b.title.localeCompare(a.title)
          : a.title.localeCompare(b.title),
      )
    case 'popularity':
    default:
      // A lower Jikan popularity rank means a more popular title.
      return sorted.sort((a, b) =>
        order === 'asc'
          ? (b.popularity ?? Number.MAX_SAFE_INTEGER) -
            (a.popularity ?? Number.MAX_SAFE_INTEGER)
          : (a.popularity ?? Number.MAX_SAFE_INTEGER) -
            (b.popularity ?? Number.MAX_SAFE_INTEGER),
      )
  }
}

export const fetchMovies = async (page = 1, limit = 20, includeNsfw = false, sort?: string, order?: string): Promise<AnimeResponse> => {
  const safePage = Math.max(1, Math.floor(page))
  const safeLimit = Math.max(1, Math.min(25, Math.floor(limit)))
  let url = `anime?type=movie&page=${safePage}&limit=${safeLimit}`
  url = buildSortParams(url, sort, order)
  if (!includeNsfw) {
    url += '&sfw=true'
  }

  try {
    const response = await fetchFromApi<AnimeResponse>(
      url,
      `movies_${safePage}_${safeLimit}_${includeNsfw}_${sort || 'default'}_${order || 'default'}`,
    )
    rememberMovieFallback(response.data)
    return response
  } catch {
    try {
      // Jikan's cached top endpoint often remains available when its MAL-backed
      // search endpoint is returning 503/504. It also provides real covers and
      // the complete paginated movie catalog.
      const topResponse = await fetchFromApi<AnimeResponse>(
        `top/anime?type=movie&page=${safePage}&limit=${safeLimit}`,
        `movies_top_${safePage}_${safeLimit}`,
      )
      const safeMovies = includeNsfw
        ? topResponse.data
        : topResponse.data.filter(anime => !isNsfwAnime(anime))
      const response: AnimeResponse = {
        ...topResponse,
        data: sortMoviePage(safeMovies, sort, order),
        pagination: { ...topResponse.pagination },
      }
      rememberMovieFallback(response.data)
      return response
    } catch {
      // Both live Jikan listing endpoints are unavailable; use local data below.
    }

    const fallback = Array.from(
      new Map(
        [...getRememberedMovieFallback(), ...CURATED_MOVIE_FALLBACK]
          .map(anime => [anime.mal_id, anime]),
      ).values(),
    ).slice(0, safeLimit)

    const response = createSinglePageResponse(
      sortMoviePage(fallback, sort, order),
      safeLimit,
    )
    response.pagination.current_page = safePage
    return response
  }
}

export const fetchGenres = async (): Promise<GenresResponse> => {
  return await fetchFromApi<GenresResponse>(`genres/anime`, `genres_anime`)
}

export const fetchTagsByCategory = async (category: TagCategory): Promise<GenresResponse> => {
  return await fetchFromApi<GenresResponse>(`genres/anime?filter=${category}`, `tags_${category}`)
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

  let response: AnimeResponse
  try {
    response = await fetchFromApi<AnimeResponse>(
      `anime?q=${encodeURIComponent(safeQuery)}&page=${safePage}&limit=${safeLimit}`,
      `search_${safeQuery}_${safePage}_${safeLimit}`
    )
  } catch {
    let fallbackAnime = getRememberedAnimeFallback()
    try {
      const fallback = await fetchFromApi<AnimeResponse>(
        'top/anime?filter=bypopularity&page=1&limit=25',
        'search_popular_fallback_source'
      )
      const mergedAnime = [...fallback.data, ...fallbackAnime]
      fallbackAnime = Array.from(
        new Map(mergedAnime.map(anime => [anime.mal_id, anime])).values()
      )
      rememberAnimeFallback(fallbackAnime)
    } catch {
      // Use the last known-good pool when Jikan is temporarily unavailable.
    }
    const normalizedQuery = safeQuery.toLocaleLowerCase()
    const matches = fallbackAnime.filter(anime => {
      const searchableTitles = [
        anime.title,
        anime.title_english,
        anime.title_japanese,
        ...(anime.title_synonyms || []),
      ]
      return searchableTitles.some(title => title?.toLocaleLowerCase().includes(normalizedQuery))
    }).slice(0, safeLimit)

    response = createSinglePageResponse(matches, safeLimit)
  }
  if (!includeNsfw) {
    response.data = response.data.filter((anime: AnimeData) => !isNsfwAnime(anime))
  }
  return response
}

export const fetchSeasonalAnime = async (year: number, season: string, page = 1, limit = 20, includeNsfw = false, sort?: string, order?: string): Promise<AnimeResponse> => {
  const currentSeason = getCurrentSeasonInfo()
  const isCurrentSeason = year === currentSeason.year && season.toLowerCase() === currentSeason.season
  let url = isCurrentSeason
    ? `seasons/now?page=${page}&limit=${limit}`
    : `seasons/${year}/${season}?page=${page}&limit=${limit}`

  if (!isCurrentSeason) {
    url = buildSortParams(url, sort, order)
  }

  const response = await fetchFromApi<AnimeResponse>(
    url,
    `seasonal_${year}_${season}_${page}_${limit}_${sort || 'default'}_${order || 'default'}`
  )
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
     const response = await fetchFromApi<AnimeResponse>(
       `seasons/now?page=1&limit=${Math.max(limit, 20)}`,
       `seasonal_now_1_${Math.max(limit, 20)}`
     )
     const filteredAnime = includeNsfw
       ? response.data
       : response.data.filter((anime: AnimeData) => !isNsfwAnime(anime))
     rememberAnimeFallback(response.data)
     const anime = filteredAnime.slice(0, limit)
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

  return '/placeholder-anime.svg';
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
export const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

export type Weekday = (typeof WEEKDAYS)[number]
export type WeeklyAnimeSchedule = Record<Weekday, AnimeData[]>

const createEmptyWeeklySchedule = (): WeeklyAnimeSchedule => ({
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
})

const normalizeBroadcastDay = (day?: string): Weekday | null => {
  if (!day) return null
  const normalized = day.trim().toLowerCase().replace(/s$/, '')
  return WEEKDAYS.includes(normalized as Weekday)
    ? (normalized as Weekday)
    : null
}

const groupAnimeByBroadcastDay = (anime: AnimeData[]): WeeklyAnimeSchedule => {
  const grouped = createEmptyWeeklySchedule()
  const seen = new Map<Weekday, Set<number>>(
    WEEKDAYS.map(day => [day, new Set<number>()]),
  )

  for (const item of anime) {
    const day = normalizeBroadcastDay(item.broadcast?.day)
    if (!day || seen.get(day)?.has(item.mal_id)) continue
    seen.get(day)?.add(item.mal_id)
    grouped[day].push(item)
  }

  return grouped
}

const fetchPaginatedAnime = async (
  endpoint: string,
  cachePrefix: string,
  maxPages = 10,
): Promise<AnimeData[]> => {
  const firstPage = await fetchFromApi<AnimeResponse>(
    `${endpoint}?page=1`,
    `${cachePrefix}_1`,
  )
  const anime = [...firstPage.data]
  const lastPage = Math.min(
    Math.max(1, firstPage.pagination.last_visible_page),
    maxPages,
  )

  for (let page = 2; page <= lastPage; page++) {
    try {
      const response = await fetchFromApi<AnimeResponse>(
        `${endpoint}?page=${page}`,
        `${cachePrefix}_${page}`,
      )
      anime.push(...response.data)
      if (!response.pagination.has_next_page) break
    } catch {
      // Keep the successful pages. Partial live schedule data is more accurate
      // than reporting every weekday as empty during an upstream outage.
      break
    }
  }

  return anime
}

export const fetchWeeklyAnimeSchedule = async (
  includeNsfw = false,
): Promise<WeeklyAnimeSchedule> => {
  const cacheKey = `weekly_schedule_v3_${includeNsfw}`
  const cached = getCache<WeeklyAnimeSchedule>(cacheKey)
  if (cached) return cached

  let anime: AnimeData[]
  try {
    anime = await fetchPaginatedAnime('schedules', 'schedule_all')
  } catch {
    // The schedules parser depends on live MAL availability and frequently
    // returns 503/504. Current-season entries contain the same broadcast.day
    // field and provide a reliable official fallback.
    anime = await fetchPaginatedAnime('seasons/now', 'schedule_season_now')

    const rememberedAiring = getRememberedAnimeFallback().filter(
      item => item.status === 'Currently Airing' && item.broadcast?.day,
    )
    anime = [...anime, ...rememberedAiring]
  }

  const safeAnime = includeNsfw
    ? anime
    : anime.filter(item => !isNsfwAnime(item))
  const grouped = groupAnimeByBroadcastDay(safeAnime)
  setCache(cacheKey, grouped, CACHE_TTL.DYNAMIC)
  return grouped
}

export const fetchAnimeSchedule = async (
  day?: string,
  includeNsfw = false,
): Promise<AnimeResponse> => {
  const normalizedDay = day ? normalizeBroadcastDay(day) : null
  if (day && !normalizedDay) {
    throw new Error(`Invalid schedule day: ${day}`)
  }

  const weekly = await fetchWeeklyAnimeSchedule(includeNsfw)
  const data = normalizedDay
    ? weekly[normalizedDay]
    : WEEKDAYS.flatMap(weekday => weekly[weekday])

  return createSinglePageResponse(data, data.length)
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
