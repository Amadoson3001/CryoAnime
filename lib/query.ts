export type QueryValue = string | string[] | undefined
export type QueryParams = Record<string, QueryValue>

export const firstQueryValue = (value: QueryValue): string | undefined => Array.isArray(value) ? value[0] : value

const integerQueryValue = (value: QueryValue): number => {
  const text = firstQueryValue(value)?.trim() || ''
  return /^\d+$/.test(text) ? Number(text) : Number.NaN
}

export const parsePage = (value: QueryValue): number => {
  const parsed = integerQueryValue(value)
  return Number.isInteger(parsed) ? Math.max(1, Math.min(100, parsed)) : 1
}

export const parseLimit = (value: QueryValue, fallback = 24): number => {
  const parsed = integerQueryValue(value)
  return Number.isInteger(parsed) ? Math.max(1, Math.min(50, parsed)) : fallback
}

export const parseSeason = (value: QueryValue): 'winter' | 'spring' | 'summer' | 'fall' | undefined => {
  const season = firstQueryValue(value)?.toLowerCase()
  return season === 'winter' || season === 'spring' || season === 'summer' || season === 'fall' ? season : undefined
}

export const parseSort = (value: QueryValue): 'popularity' | 'score' | 'recent' | 'title' => {
  const sort = firstQueryValue(value)?.split('-')[0]
  return sort === 'score' || sort === 'recent' || sort === 'title' || sort === 'popularity' ? sort : 'popularity'
}

export const parseOrder = (value: QueryValue): 'asc' | 'desc' => {
  const raw = firstQueryValue(value) || ''
  if (raw.endsWith('-asc')) return 'asc'
  return firstQueryValue(value) === 'asc' ? 'asc' : 'desc'
}
