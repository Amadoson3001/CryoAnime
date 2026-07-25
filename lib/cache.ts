// Unified cache utility — works on both server and client
// No 'use client' directive so server components share the same module instance

const MAX_ENTRIES = 500
const DEFAULT_TTL = 15 * 60 * 1000 // 15 minutes

interface CacheEntry {
  data: unknown
  expires: number
}

// In-memory cache (works on both server and client)
const memoryCache = new Map<string, CacheEntry>()

// Pending request deduplication
const pendingRequests = new Map<string, Promise<unknown>>()

// Cache duration presets
export const CACHE_TTL = {
  STATIC: 24 * 60 * 60 * 1000,      // 24 hours
  SEMI_STATIC: 60 * 60 * 1000,      // 1 hour
  DYNAMIC: 15 * 60 * 1000,          // 15 minutes
  LANDING: 30 * 60 * 1000,          // 30 minutes
} as const

/**
 * Get a value from the cache. Checks in-memory first, then localStorage.
 */
export function getCache<T = unknown>(key: string): T | null {
  // Check in-memory cache
  const entry = memoryCache.get(key)
  if (entry && Date.now() <= entry.expires) {
    return entry.data as T
  }
  if (entry) {
    memoryCache.delete(key)
  }

  // Check localStorage (client-side only)
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        const item = JSON.parse(stored)
        if (Date.now() <= item.expiry) {
          // Promote to memory cache
          memoryCache.set(key, { data: item.data, expires: item.expiry })
          return item.data as T
        }
        // Expired — clean up
        localStorage.removeItem(key)
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  return null
}

/**
 * Return an expired cache entry while an upstream service is unavailable.
 * Entries older than maxStaleMs past their normal expiry are discarded.
 */
export function getStaleCache<T = unknown>(
  key: string,
  maxStaleMs: number,
): T | null {
  const entry = memoryCache.get(key)
  if (entry) {
    if (Date.now() <= entry.expires + maxStaleMs) {
      return entry.data as T
    }
    memoryCache.delete(key)
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        const item = JSON.parse(stored) as { data: T; expiry: number }
        if (Date.now() <= item.expiry + maxStaleMs) {
          return item.data
        }
        localStorage.removeItem(key)
      }
    } catch {
      // Ignore malformed or inaccessible localStorage data.
    }
  }

  return null
}

/**
 * Set a value in both in-memory and localStorage caches.
 */
export function setCache<T = unknown>(key: string, data: T, ttlMs: number = DEFAULT_TTL): void {
  const expires = Date.now() + ttlMs

  // Enforce max size with simple eviction (delete oldest)
  if (memoryCache.size >= MAX_ENTRIES) {
    const oldest = memoryCache.keys().next().value
    if (oldest !== undefined) memoryCache.delete(oldest)
  }

  // Set in-memory
  memoryCache.set(key, { data, expires })

  // Set in localStorage (client-side only)
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify({ data, expiry: expires }))
    } catch {
      // Ignore quota errors
    }
  }
}

/**
 * Remove a specific key from both caches.
 */
export function deleteCache(key: string): void {
  memoryCache.delete(key)
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(key)
    } catch {
      // Ignore
    }
  }
}

/**
 * Clear all cached data.
 */
export function clearCache(): void {
  memoryCache.clear()
  pendingRequests.clear()
  if (typeof window !== 'undefined') {
    try {
      // Only clear cryoanime-prefixed keys to avoid nuking other app data
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (
          key.startsWith('schedule_') ||
          key.startsWith('top_anime') ||
          key.startsWith('landing_') ||
          key.startsWith('genre_') ||
          key.startsWith('movies_') ||
          key.startsWith('search_') ||
          key.startsWith('seasonal_') ||
          key.startsWith('anime_') ||
          key.startsWith('genres_') ||
          key.startsWith('tags_') ||
          key.startsWith('schedule_')
        )) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k))
    } catch {
      // Ignore
    }
  }
}

/**
 * Get or create a deduplicated request. If a request for the same key is already
 * in-flight, return its promise instead of starting a new one.
 */
export function getPendingRequest<T>(key: string): Promise<T> | null {
  return (pendingRequests.get(key) as Promise<T>) ?? null
}

export function setPendingRequest<T>(key: string, promise: Promise<T>): void {
  pendingRequests.set(key, promise)
}

export function deletePendingRequest(key: string): void {
  pendingRequests.delete(key)
}
