import { afterEach, describe, expect, it, vi } from 'vitest'

const media = (overrides: Record<string, unknown> = {}) => ({
  id: 100,
  idMal: 200,
  type: 'ANIME',
  format: 'TV',
  status: 'FINISHED',
  title: { romaji: 'Example', english: 'Example English', native: '例' },
  synonyms: [],
  genres: ['Action'],
  tags: [{ id: 42, name: 'Time Travel', category: 'theme', rank: 87, isAdult: false }],
  averageScore: 85,
  popularity: 1000,
  favourites: 20,
  coverImage: { extraLarge: 'https://s4.anilist.co/file/anilistcdn/large.jpg', large: 'https://s4.anilist.co/file/anilistcdn/large.jpg', medium: 'https://s4.anilist.co/file/anilistcdn/medium.jpg' },
  startDate: { year: 2024, month: 1, day: 2 },
  endDate: { year: 2024, month: 6, day: 30 },
  studios: { edges: [] },
  relations: { edges: [] },
  rankings: [],
  ...overrides,
})

const page = (items: unknown[] = [media()]) => ({
  Page: {
    pageInfo: { total: items.length, currentPage: 1, lastPage: 1, hasNextPage: false, perPage: items.length },
    media: items,
  },
})

const mockGraphql = (data: unknown) => {
  const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ data }), { status: 200, headers: { 'Content-Type': 'application/json' } })))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const mockGraphqlByAdultFlag = (nonAdultItems: unknown[], adultItems: unknown[]) => {
  const fetchMock = vi.fn().mockImplementation((_url: string, init: RequestInit) => {
    const request = JSON.parse(String(init.body)) as { variables?: { isAdult?: boolean } }
    const items = request.variables?.isAdult ? adultItems : nonAdultItems
    return Promise.resolve(new Response(JSON.stringify({ data: page(items) }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.resetModules()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  localStorage.clear()
})

describe('API utilities', () => {
  it('formats scores and dates for the existing UI', async () => {
    const { formatScore, formatDate } = await import('@/lib/api')
    expect(formatScore(8.5)).toBe('8.50')
    expect(formatScore(undefined)).toBe('N/A')
    expect(formatDate('2023-01-01')).toContain('January')
    expect(formatDate(undefined)).toBe('N/A')
  })
})

describe('AniList GraphQL integration', () => {
  it('uses the AniList endpoint and normalizes movie results', async () => {
    const fetchMock = mockGraphql(page([media({ format: 'MOVIE' })]))
    const { fetchMovies } = await import('@/lib/api')
    const response = await fetchMovies(1, 24, false, 'popularity', 'desc')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe('https://graphql.anilist.co')
    const requests = fetchMock.mock.calls.map(call => JSON.parse(call[1].body as string))
    expect(requests.map(request => request.variables.isAdult)).toEqual([false])
    expect(requests[0].variables).toMatchObject({ format: ['MOVIE'], isAdult: false })
    expect(response.data[0]).toMatchObject({ mal_id: 200, anilist_id: 100, title: 'Example English', type: 'Movie', score: 8.5, score_percentage: 85, tags: [{ name: 'Time Travel', rank: 87, category: 'theme' }] })
  })

  it('builds a seasonal GraphQL query with AniList season variables', async () => {
    const fetchMock = mockGraphql(page([media({ season: 'SUMMER', seasonYear: 2018 })]))
    const { fetchSeasonalAnime } = await import('@/lib/api')
    const response = await fetchSeasonalAnime(2018, 'summer', 1, 24, false)

    const request = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(request.variables).toMatchObject({ season: 'SUMMER', seasonYear: 2018, isAdult: false })
    expect(response.data[0].year).toBe(2018)
  })

  it('searches AniList without a proxy endpoint', async () => {
    const fetchMock = mockGraphql(page())
    const { searchAnime } = await import('@/lib/api')
    await searchAnime('cowboy bebop')

    expect(fetchMock.mock.calls[0][0]).toBe('https://graphql.anilist.co')
    const request = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(request.variables.search).toBe('cowboy bebop')
  })

  it('maps AniList airing timestamps into the weekly schedule contract', async () => {
    const airingAt = Math.floor(new Date('2026-08-03T12:00:00Z').getTime() / 1000)
    const fetchMock = mockGraphql(page([media({ status: 'RELEASING', nextAiringEpisode: { airingAt, episode: 4 } })]))
    const { fetchAnimeSchedule } = await import('@/lib/api')
    const response = await fetchAnimeSchedule('monday')

    expect(fetchMock.mock.calls[0][0]).toBe('https://graphql.anilist.co')
    expect(response.data[0].status).toBe('Currently Airing')
    expect(response.data[0].broadcast?.day?.toLowerCase()).toBe('monday')
  })

  it('normalizes category prefixes and rejects unsafe streaming URLs', async () => {
    const sample = media({
      tags: [
        { id: 42, name: 'Time Travel', category: 'Theme-Sci-Fi', rank: 87, isAdult: false },
        { id: 43, name: 'Shounen', category: 'Demographic-Male', rank: 80, isAdult: false },
      ],
      streamingEpisodes: [
        { site: 'Crunchyroll', url: 'https://www.crunchyroll.com/series/example' },
        { site: 'Injected', url: 'javascript:alert(1)' },
        { site: 'Unknown', url: 'https://evil.example/watch' },
      ],
    })
    const fetchMock = mockGraphql(page([sample]))
    const { fetchTopAnime } = await import('@/lib/api')
    const response = await fetchTopAnime()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(response.data[0].themes).toEqual([expect.objectContaining({ name: 'Time Travel' })])
    expect(response.data[0].demographics).toEqual([expect.objectContaining({ name: 'Shounen' })])
    expect(response.data[0].members).toBeUndefined()
    expect(response.data[0].streaming).toEqual([{ name: 'Crunchyroll', url: 'https://www.crunchyroll.com/series/example' }])
  })

  it('keeps explicit and mature content separate', async () => {
    const mature = media({
      id: 101,
      idMal: 201,
      tags: [{ id: 43, name: 'Ecchi', category: 'theme', rank: 90, isAdult: false }],
    })
    const explicit = media({
      id: 102,
      idMal: 202,
      isAdult: false,
      genres: ['Hentai'],
      tags: [{ id: 44, name: 'Hentai', category: 'content', rank: 100, isAdult: true }],
    })
    const fetchMock = mockGraphql(page([mature, explicit]))
    const { fetchTopAnime } = await import('@/lib/api')
    const response = await fetchTopAnime(1, 24, { showMature: true, showExplicit: false })

    expect(fetchMock.mock.calls[0][1]).toBeDefined()
    const request = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(request.variables.isAdult).toBe(false)
    expect(response.data).toHaveLength(1)
    expect(response.data[0]).toMatchObject({ contentRating: 'mature', rating: 'R+ - Mild Nudity', isAdult: false })
  })

  it('maps AniList adult signals to explicit Rx content', async () => {
    mockGraphql(page([media({ isAdult: true, tags: [{ id: 44, name: 'Hentai', category: 'content', isAdult: true }] })]))
    const { fetchTopAnime } = await import('@/lib/api')
    const response = await fetchTopAnime(1, 24, { showMature: false, showExplicit: true })

    expect(response.data[0]).toMatchObject({ contentRating: 'explicit', rating: 'Rx - Hentai', isAdult: true })
  })

  it('uses the Hentai genre rather than broad AniList adult signals', async () => {
    const tolerableAdult = media({
      id: 103,
      idMal: 203,
      isAdult: true,
      genres: ['Action', 'Ecchi'],
      tags: [{ id: 45, name: 'Rape', category: 'Sexual Content', rank: 70, isAdult: true }],
    })
    const hentai = media({
      id: 104,
      idMal: 204,
      isAdult: false,
      genres: ['Hentai'],
      tags: [{ id: 46, name: 'Nudity', category: 'Cast-Traits', rank: 90, isAdult: false }],
    })
    const fetchMock = mockGraphqlByAdultFlag([tolerableAdult], [hentai])
    const { fetchTopAnime } = await import('@/lib/api')
    const response = await fetchTopAnime(1, 24, { showMature: true, showExplicit: true })

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(response.data).toHaveLength(2)
    expect(response.data.find(anime => anime.anilist_id === 103)).toMatchObject({ contentRating: 'mature', isAdult: true })
    expect(response.data.find(anime => anime.anilist_id === 104)).toMatchObject({ contentRating: 'explicit', rating: 'Rx - Hentai' })
  })

  it('does not hide non-Hentai adult-tagged titles when explicit content is disabled', async () => {
    const tolerableAdult = media({
      id: 105,
      idMal: 205,
      isAdult: true,
      genres: ['Action'],
      tags: [{ id: 47, name: 'Rape', category: 'Sexual Content', rank: 70, isAdult: true }],
    })
    mockGraphqlByAdultFlag([], [tolerableAdult])
    const { fetchTopAnime } = await import('@/lib/api')
    const response = await fetchTopAnime(1, 24, { showMature: true, showExplicit: false })

    expect(response.data).toHaveLength(1)
    expect(response.data[0]).toMatchObject({ contentRating: 'mature', isAdult: true })
  })

  it('exposes Hentai and every AniList adult tag in the explicit Explore category', async () => {
    mockGraphql({
      MediaTagCollection: [
        { id: 279, name: 'Ahegao', category: 'Sexual Content', isAdult: true },
        { id: 533, name: 'Omegaverse', category: 'Setting-Universe', isAdult: true },
        { id: 42, name: 'Time Travel', category: 'Theme-Sci-Fi', isAdult: false },
      ],
    })
    const { fetchTagsByCategory } = await import('@/lib/api')
    const response = await fetchTagsByCategory('explicit_genres')

    expect(response.data).toEqual([
      expect.objectContaining({ name: 'Hentai', filterKind: 'genre', isAdult: true }),
      expect.objectContaining({ name: 'Ahegao', filterKind: 'tag', isAdult: true }),
      expect.objectContaining({ name: 'Omegaverse', filterKind: 'tag', isAdult: true }),
    ])
    expect(response.data).not.toContainEqual(expect.objectContaining({ name: 'Time Travel' }))
  })

  it('reuses the cached AniList tag collection across categories', async () => {
    const fetchMock = mockGraphql({
      MediaTagCollection: [
        { id: 1, name: 'Time Travel', category: 'Theme-Sci-Fi', isAdult: false },
        { id: 2, name: 'Shounen', category: 'Demographic-Male', isAdult: false },
      ],
    })
    const { fetchTagsByCategory } = await import('@/lib/api')
    await fetchTagsByCategory('themes')
    await fetchTagsByCategory('demographics')

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('does not enqueue an already-aborted search', async () => {
    const fetchMock = mockGraphql(page())
    const { searchAnime } = await import('@/lib/api')
    const controller = new AbortController()
    controller.abort()

    await expect(searchAnime('stale query', 1, 20, false, controller.signal)).rejects.toMatchObject({ name: 'AbortError' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('loads details and characters through AniList media queries', async () => {
    const fetchMock = mockGraphql({ Media: media({ characters: { edges: [] } }) })
    const { fetchAnimeById, fetchAnimeCharacters } = await import('@/lib/api')
    const details = await fetchAnimeById(200)
    const characters = await fetchAnimeCharacters(200)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(details.data.title).toBe('Example English')
    expect(characters.data).toEqual([])
  })
})

describe('cache migration', () => {
  it('keeps compatibility responses in memory without browser persistence', async () => {
    const { getCache, setCache } = await import('@/lib/cache')
    setCache('top_anime_current', { data: ['fresh'] }, 10000)

    expect(getCache('top_anime_current')).toEqual({ data: ['fresh'] })
    expect(localStorage.getItem('cryoanime:anilist:v1:top_anime_current')).toBeNull()
  })
})

describe('content preferences', () => {
  it('migrates the legacy NSFW switch and persists independent choices', async () => {
    localStorage.setItem('nsfw_enabled', 'true')
    const { getContentPreferences, setContentPreferences } = await import('@/lib/userPreferences')

    expect(getContentPreferences()).toEqual({ showMature: true, showExplicit: true })
    setContentPreferences({ showMature: true, showExplicit: false })
    expect(getContentPreferences()).toEqual({ showMature: true, showExplicit: false })
    expect(localStorage.getItem('nsfw_enabled')).toBeNull()
  })
})

describe('library storage', () => {
  it('ignores malformed records and deduplicates bounded entries', async () => {
    localStorage.setItem('cryoanime_favorites', JSON.stringify([
      null,
      { mal_id: 'not-a-number', title: 'bad' },
      { mal_id: 42, title: 'First', images: { jpg: { image_url: '/one.svg' } }, added_at: 1 },
      { mal_id: 42, title: 'Duplicate', images: { jpg: { image_url: '/two.svg' } }, added_at: 2 },
    ]))
    const { getFavorites } = await import('@/lib/library')

    expect(getFavorites()).toHaveLength(1)
    expect(getFavorites()[0]).toMatchObject({ mal_id: 42, title: 'First', added_at: 1 })
    expect(getFavorites()[0].images.jpg.small_image_url).toBe('/one.svg')
  })
})
