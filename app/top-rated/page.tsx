import { Star } from 'lucide-react'
import { Suspense } from 'react'
import ServerListingPage from '@/components/server-listing-page'
import { getAnimeList } from '@/lib/anilist'
import { readContentPreferences } from '@/lib/contentPreferences'
import { parsePage, parseLimit, type QueryParams } from '@/lib/query'

async function TopRatedContent({ searchParams }: { searchParams?: Promise<QueryParams> }) {
  const params = await searchParams || {}
  const page = parsePage(params.page)
  const limit = parseLimit(params.limit)
  let result: Awaited<ReturnType<typeof getAnimeList>> | null = null
  let error: string | null = null
  try { result = await getAnimeList({ page, limit, preferences: await readContentPreferences(), sort: 'score' }) }
  catch { error = 'Top-rated anime is temporarily unavailable. Please try again.' }
  return <ServerListingPage title="Top Rated Anime" description="Discover the highest-rated anime masterpieces, ranked by AniList fans." icon={<Star size={32} style={{ color: '#fbbf24' }} aria-hidden="true" />} result={result} error={error} basePath="/top-rated" query={{ limit }} showControls={false} />
}

export default function TopRatedPage({ searchParams }: { searchParams?: Promise<QueryParams> }) {
  return <Suspense fallback={<main className="page-shell"><div className="empty-state">Loading top-rated anime…</div></main>}><TopRatedContent searchParams={searchParams} /></Suspense>
}
