import { NextRequest } from 'next/server'

const JIKAN_API_BASE = (
  process.env.JIKAN_API_BASE_URL ||
  process.env.NEXT_PUBLIC_JIKAN_BASE_URL ||
  'https://api.jikan.moe/v4'
).replace(/\/+$/, '')
const MAX_RETRIES = 2
const REQUEST_TIMEOUT = 15000
const BASE_RETRY_DELAY = 1000

interface RouteContext {
  params: Promise<{ path: string[] }>
}

const wait = (delay: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, delay))

const parseRetryAfter = (value: string | null): number | null => {
  if (!value) return null
  const seconds = Number(value)
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000

  const retryDate = Date.parse(value)
  return Number.isNaN(retryDate) ? null : Math.max(0, retryDate - Date.now())
}

const fetchUpstream = async (url: URL): Promise<Response> => {
  let lastResponse: Response | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
        cache: 'no-store',
      })
      lastResponse = response

      const retryable = response.status === 429 || response.status >= 500
      if (!retryable || attempt === MAX_RETRIES) {
        return response
      }

      const retryAfter = parseRetryAfter(response.headers.get('retry-after'))
      await wait(retryAfter ?? BASE_RETRY_DELAY * Math.pow(2, attempt))
    } catch (error) {
      if (attempt === MAX_RETRIES) throw error
      await wait(BASE_RETRY_DELAY * Math.pow(2, attempt))
    } finally {
      clearTimeout(timeout)
    }
  }

  if (lastResponse) return lastResponse
  throw new Error('Jikan request failed without a response.')
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params

  if (
    !Array.isArray(path) ||
    path.length === 0 ||
    path.some(segment => !/^[a-zA-Z0-9_-]+$/.test(segment))
  ) {
    return Response.json({ error: 'Invalid Jikan API path.' }, { status: 400 })
  }

  const upstreamUrl = new URL(
    `${JIKAN_API_BASE}/${path.map(segment => encodeURIComponent(segment)).join('/')}`
  )
  upstreamUrl.search = request.nextUrl.search

  try {
    const upstreamResponse = await fetchUpstream(upstreamUrl)
    const retryAfter = upstreamResponse.headers.get('retry-after')

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: {
        'Content-Type': upstreamResponse.headers.get('content-type') || 'application/json',
        'Cache-Control': upstreamResponse.ok
          ? 'public, s-maxage=300, stale-while-revalidate=86400'
          : 'no-store',
        ...(retryAfter ? { 'Retry-After': retryAfter } : {}),
      },
    })
  } catch {
    return Response.json(
      { error: 'Unable to reach the anime data service.' },
      {
        status: 502,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  }
}
