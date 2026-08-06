import { describe, expect, it } from 'vitest'
import { parseContentPreferenceCookie, serializeContentPreferences } from '@/lib/contentPreferences'
import { parseLimit, parsePage, parseSeason, parseSort } from '@/lib/query'
import { normalizeAniListMedia } from '@/lib/anilist-normalizers'

describe('validated server query state', () => {
  it('clamps pages and limits and rejects unknown sort/season values', () => {
    expect(parsePage(['0'])).toBe(1)
    expect(parsePage(['999'])).toBe(100)
    expect(parseLimit(['999'])).toBe(50)
    expect(parseSeason('autumn')).toBeUndefined()
    expect(parseSort('unexpected')).toBe('popularity')
  })
})

describe('functional content preference cookie', () => {
  it('round-trips normalized independent flags', () => {
    const value = serializeContentPreferences({ showMature: true, showExplicit: false })
    expect(parseContentPreferenceCookie(value)).toEqual({ showMature: true, showExplicit: false })
    expect(parseContentPreferenceCookie('garbage')).toEqual({ showMature: false, showExplicit: false })
  })
})

describe('raw AniList mapping', () => {
  it('keeps the public MAL route id and reserves an AniList fallback id', () => {
    const mapped = normalizeAniListMedia({
      id: 42,
      idMal: null,
      type: 'ANIME',
      format: 'TV',
      status: 'FINISHED',
      title: { romaji: 'Example' },
      coverImage: { large: 'https://s4.anilist.co/file/anilistcdn/example.jpg' },
      genres: [],
      tags: [],
      startDate: { year: 2024, month: 1, day: 1 },
    })
    expect(mapped.anilist_id).toBe(42)
    expect(mapped.mal_id).toBeGreaterThan(1_000_000_000)
    expect(mapped.images.jpg.large_image_url).toContain('anilistcdn')
  })
})
