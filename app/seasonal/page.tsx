import { CalendarDays } from 'lucide-react'
import { Suspense } from 'react'
import ServerListingPage from '@/components/server-listing-page'
import { getAnimeList, getCurrentSeasonInfo } from '@/lib/anilist'
import { readContentPreferences } from '@/lib/contentPreferences'
import { parsePage, parseLimit, parseSeason, parseSort, parseOrder, firstQueryValue, type QueryParams } from '@/lib/query'

async function SeasonalContent({ searchParams }: { searchParams?: Promise<QueryParams> }) {
  const params = await searchParams || {}
  const current = getCurrentSeasonInfo()
  const yearValue = Number(firstQueryValue(params.year))
  const year = Number.isInteger(yearValue) && yearValue >= 1940 && yearValue <= current.year + 1 ? yearValue : current.year
  const season = parseSeason(params.season) || current.season
  const page = parsePage(params.page)
  const limit = parseLimit(params.limit)
  const sort = parseSort(params.sort)
  const order = parseOrder(params.order ?? params.sort)
  let result: Awaited<ReturnType<typeof getAnimeList>> | null = null
  let error: string | null = null
  try { result = await getAnimeList({ page, limit, preferences: await readContentPreferences(), season, seasonYear: year, sort, order }) }
  catch { error = 'Seasonal anime is temporarily unavailable. Please try again.' }
  return <ServerListingPage title={`${season[0].toUpperCase() + season.slice(1)} ${year}`} description="Browse every anime scheduled for the selected season." icon={<CalendarDays size={32} style={{ color: '#34d399' }} aria-hidden="true" />} result={result} error={error} basePath="/seasonal" query={{ year, season, limit, sort, order }} sort={sort} order={order} showControls={true} showSeason season={season} year={year} />
}

export default function SeasonalPage({ searchParams }: { searchParams?: Promise<QueryParams> }) {
  return <Suspense fallback={<main className="page-shell"><div className="empty-state">Loading seasonal anime…</div></main>}><SeasonalContent searchParams={searchParams} /></Suspense>
}
