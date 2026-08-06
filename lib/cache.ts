/**
 * Legacy in-process request coordination for the compatibility API.
 *
 * Response persistence was deliberately removed: synchronous browser storage
 * made large AniList payloads block the main thread. New
 * server code uses Next Cache Components (`lib/anilist.ts`); this tiny memory
 * cache only keeps old test/compatibility helpers from issuing duplicate
 * requests during one process lifetime.
 */

const MAX_ENTRIES = 250
const DEFAULT_TTL = 15 * 60 * 1000

interface CacheEntry {
  data: unknown
  expires: number
}

const memoryCache = new Map<string, CacheEntry>()
const pendingRequests = new Map<string, Promise<unknown>>()

export const CACHE_TTL = {
  STATIC: 24 * 60 * 60 * 1000,
  SEMI_STATIC: 60 * 60 * 1000,
  DYNAMIC: 15 * 60 * 1000,
  LANDING: 30 * 60 * 1000,
} as const

export function getCache<T = unknown>(key: string): T | null {
  const entry = memoryCache.get(key)
  if (!entry) return null
  if (Date.now() <= entry.expires) return entry.data as T
  return null
}

/** Return an expired response while a retryable upstream request is failing. */
export function getStaleCache<T = unknown>(key: string, maxStaleMs: number): T | null {
  const entry = memoryCache.get(key)
  if (!entry) return null
  if (Date.now() <= entry.expires + maxStaleMs) return entry.data as T
  memoryCache.delete(key)
  return null
}

export function setCache<T = unknown>(key: string, data: T, ttlMs = DEFAULT_TTL): void {
  if (memoryCache.size >= MAX_ENTRIES && !memoryCache.has(key)) {
    const oldest = memoryCache.keys().next().value
    if (oldest !== undefined) memoryCache.delete(oldest)
  }
  memoryCache.set(key, { data, expires: Date.now() + ttlMs })
}

export function deleteCache(key: string): void {
  memoryCache.delete(key)
}

export function clearCache(): void {
  memoryCache.clear()
  pendingRequests.clear()
}

export function getPendingRequest<T>(key: string): Promise<T> | null {
  return (pendingRequests.get(key) as Promise<T>) ?? null
}

export function setPendingRequest<T>(key: string, promise: Promise<T>): void {
  pendingRequests.set(key, promise)
}

export function deletePendingRequest(key: string): void {
  pendingRequests.delete(key)
}
