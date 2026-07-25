import { afterEach, describe, it, expect, vi } from 'vitest'
import { formatScore, formatDate } from '@/lib/api'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  if (typeof localStorage?.clear === 'function') {
    localStorage.clear()
  }
})

describe('API Utilities', () => {
  describe('formatScore', () => {
    it('should format score with 2 decimal places', () => {
      expect(formatScore(8.5)).toBe('8.50')
      expect(formatScore(9)).toBe('9.00')
    })

    it('should return N/A if score is undefined', () => {
      expect(formatScore(undefined)).toBe('N/A')
    })
  })

  describe('formatDate', () => {
    it('should format valid date strings', () => {
      // Use toContain because locale formats can vary
      expect(formatDate('2023-01-01')).toContain('2023')
      expect(formatDate('2023-01-01')).toContain('January')
    })

    it('should return N/A for undefined dates', () => {
      expect(formatDate(undefined)).toBe('N/A')
    })
  })
})

describe('Jikan reliability', () => {
  it('uses the official anime search filters for movie pagination and sorting', async () => {
    vi.resetModules()
    const payload = {
      data: [{ mal_id: 1, title: 'Movie', type: 'Movie' }],
      pagination: {
        last_visible_page: 42,
        has_next_page: true,
        current_page: 2,
        items: { count: 1, total: 100, per_page: 24 },
      },
    }
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const { fetchMovies } = await import('@/lib/api')
    const response = await fetchMovies(2, 24, false, 'popularity', 'desc')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/jikan/anime?type=movie&page=2&limit=24&order_by=popularity&sort=asc&sfw=true',
      expect.objectContaining({
        headers: { Accept: 'application/json' },
        signal: expect.any(AbortSignal),
      }),
    )
    expect(response.pagination.last_visible_page).toBe(42)
    expect(response.data).toEqual(payload.data)
  })

  it('keeps the movies page useful when Jikan is temporarily unavailable', async () => {
    vi.useFakeTimers()
    vi.resetModules()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ status: 503, message: 'Service unavailable' }),
          { status: 503 },
        ),
      ),
    )

    const { fetchMovies } = await import('@/lib/api')
    const responsePromise = fetchMovies(1, 24, false, 'score', 'desc')
    await vi.advanceTimersByTimeAsync(1000)
    const response = await responsePromise

    expect(response.data).toHaveLength(24)
    expect(response.data.every(anime => anime.type === 'Movie')).toBe(true)
    expect(
      response.data.every(anime =>
        anime.images.jpg.large_image_url.startsWith(
          'https://cdn.myanimelist.net/',
        ),
      ),
    ).toBe(true)
    expect(response.pagination.has_next_page).toBe(false)
  })

  it('uses Jikan top movies when the general movie search returns 504', async () => {
    vi.useFakeTimers()
    vi.resetModules()
    const topPayload = {
      data: [
        {
          mal_id: 57555,
          title: 'Chainsaw Man Movie: Reze Arc',
          type: 'Movie',
          images: {
            jpg: {
              image_url: 'https://cdn.myanimelist.net/cover.jpg',
              small_image_url: 'https://cdn.myanimelist.net/cover.jpg',
              large_image_url: 'https://cdn.myanimelist.net/cover-large.jpg',
            },
          },
          status: 'Finished Airing',
          aired: { prop: { from: {}, to: {} } },
          duration: 'Unknown',
          genres: [],
          producers: [],
          licensors: [],
          studios: [],
        },
      ],
      pagination: {
        last_visible_page: 211,
        has_next_page: true,
        current_page: 1,
        items: { count: 1, total: 5046, per_page: 24 },
      },
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: 504 }), { status: 504 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(topPayload), { status: 200 }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const { fetchMovies } = await import('@/lib/api')
    const responsePromise = fetchMovies(1, 24, false, 'score', 'desc')
    await vi.advanceTimersByTimeAsync(1000)
    const response = await responsePromise

    expect(fetchMock.mock.calls[1][0]).toBe(
      '/api/jikan/top/anime?type=movie&page=1&limit=24',
    )
    expect(response.data[0].images.jpg.large_image_url).toContain(
      'cdn.myanimelist.net',
    )
    expect(response.pagination.last_visible_page).toBe(211)
    expect(response.pagination.items.total).toBe(5046)
  })

  it('retries a transient upstream 503 in the same-origin proxy', async () => {
    vi.useFakeTimers()
    vi.resetModules()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: 503 }), { status: 503 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const { GET } = await import('@/app/api/jikan/[...path]/route')
    const request = {
      nextUrl: new URL('http://localhost/api/jikan/anime?type=movie'),
    }
    const responsePromise = GET(
      request as never,
      { params: Promise.resolve({ path: ['anime'] }) },
    )
    await vi.advanceTimersByTimeAsync(1000)
    const response = await responsePromise

    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0][0].toString()).toBe(
      'https://api.jikan.moe/v4/anime?type=movie',
    )
  })

  it('builds Wednesday schedule from current-season data when schedules returns 504', async () => {
    vi.useFakeTimers()
    vi.resetModules()
    const createScheduledAnime = (id: number, day: string) => ({
      mal_id: id,
      title: `Anime ${id}`,
      type: 'TV',
      images: {
        jpg: {
          image_url: 'https://cdn.myanimelist.net/image.jpg',
          small_image_url: 'https://cdn.myanimelist.net/image.jpg',
          large_image_url: 'https://cdn.myanimelist.net/image.jpg',
        },
      },
      status: 'Currently Airing',
      aired: { prop: { from: {}, to: {} } },
      broadcast: { day },
      duration: '24 min',
      genres: [],
      producers: [],
      licensors: [],
      studios: [],
    })
    const seasonPayload = {
      data: [
        createScheduledAnime(1, 'Wednesdays'),
        createScheduledAnime(2, 'Mondays'),
      ],
      pagination: {
        last_visible_page: 3,
        has_next_page: true,
        current_page: 1,
        items: { count: 2, total: 2, per_page: 25 },
      },
    }
    const secondSeasonPage = {
      data: [createScheduledAnime(3, 'Wednesdays')],
      pagination: {
        last_visible_page: 3,
        has_next_page: true,
        current_page: 2,
        items: { count: 1, total: 3, per_page: 25 },
      },
    }
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: 504 }), { status: 504 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(seasonPayload), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(secondSeasonPage), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: 504 }), { status: 504 }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const { fetchAnimeSchedule } = await import('@/lib/api')
    const responsePromise = fetchAnimeSchedule('wednesday')
    await vi.advanceTimersByTimeAsync(3000)
    const response = await responsePromise

    expect(fetchMock.mock.calls[0][0]).toBe(
      '/api/jikan/schedules?page=1',
    )
    expect(fetchMock.mock.calls[1][0]).toBe(
      '/api/jikan/seasons/now?page=1',
    )
    expect(fetchMock.mock.calls[2][0]).toBe(
      '/api/jikan/seasons/now?page=2',
    )
    expect(fetchMock.mock.calls[3][0]).toBe(
      '/api/jikan/seasons/now?page=3',
    )
    expect(response.data.map(anime => anime.mal_id)).toEqual([1, 3])
  })

  it('rejects invalid schedule weekday values instead of returning fake empty data', async () => {
    vi.resetModules()
    const { fetchAnimeSchedule } = await import('@/lib/api')

    await expect(fetchAnimeSchedule('not-a-day')).rejects.toThrow(
      'Invalid schedule day',
    )
  })
})
