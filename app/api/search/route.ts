import { NextResponse } from 'next/server'
import { searchAnimeServer } from '@/lib/anilist'
import { readContentPreferences } from '@/lib/contentPreferences'

const json = (body: unknown, status = 200) => NextResponse.json(body, {
  status,
  headers: { 'cache-control': 'private, no-store', 'x-content-type-options': 'nosniff' },
})

export async function GET(request: Request) {
  const url = new URL(request.url)
  const query = url.searchParams.get('q')?.trim() || ''
  const rawLimit = Number(url.searchParams.get('limit') || 6)
  const rawPage = Number(url.searchParams.get('page') || 1)
  const limit = Number.isInteger(rawLimit) ? Math.max(1, Math.min(24, rawLimit)) : 6
  const page = Number.isInteger(rawPage) ? Math.max(1, Math.min(100, rawPage)) : 1
  if (query.length < 2 || query.length > 100) {
    return json({ error: 'q must be between 2 and 100 characters', data: [], pagination: { has_next_page: false } }, 400)
  }

  try {
    const result = await searchAnimeServer(query, page, limit, await readContentPreferences())
    return json({
      data: result.items,
      pagination: {
        current_page: result.page,
        last_visible_page: result.totalPages,
        has_next_page: result.hasNextPage,
        items: { total: result.totalItems, count: result.items.length, per_page: limit },
      },
    })
  } catch {
    return json({ error: 'Search is temporarily unavailable. Please try again.', data: [], pagination: { has_next_page: false } }, 503)
  }
}
