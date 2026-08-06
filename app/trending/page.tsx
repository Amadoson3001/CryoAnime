import { TrendingUp } from 'lucide-react'
import { Suspense } from 'react'
import ServerListingPage from '@/components/server-listing-page'
import { getAnimeList, getCurrentSeasonInfo } from '@/lib/anilist'
import { readContentPreferences } from '@/lib/contentPreferences'
import { parsePage, parseLimit, parseSort, parseOrder, type QueryParams } from '@/lib/query'

async function TrendingContent({ searchParams }: { searchParams?: Promise<QueryParams> }) {
  const params = await searchParams || {}
  const page = parsePage(params.page)
  const limit = parseLimit(params.limit)
  const sort = parseSort(params.sort)
  const order = parseOrder(params.order ?? params.sort)
  const { year, season, displayName } = getCurrentSeasonInfo()
  let result: Awaited<ReturnType<typeof getAnimeList>> | null = null
  let error: string | null = null
  try { result = await getAnimeList({ page, limit, preferences: await readContentPreferences(), season, seasonYear: year, sort, order }) }
  catch { error = 'Seasonal anime is temporarily unavailable. Please try again.' }
  return <ServerListingPage title={`${displayName} ${year} Anime`} description="Discover the latest releases and the most popular shows this season." icon={<TrendingUp size={32} style={{ color: '#3b82f6' }} aria-hidden="true" />} result={result} error={error} basePath="/trending" query={{ limit, sort, order }} sort={sort} order={order} />
}

export default function TrendingPage({ searchParams }: { searchParams?: Promise<QueryParams> }) {
  return <Suspense fallback={<main className="page-shell"><div className="empty-state">Loading trending anime…</div></main>}><TrendingContent searchParams={searchParams} /></Suspense>
}
