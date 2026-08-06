import { Film } from 'lucide-react'
import { Suspense } from 'react'
import ServerListingPage from '@/components/server-listing-page'
import { getAnimeList } from '@/lib/anilist'
import { readContentPreferences } from '@/lib/contentPreferences'
import { parsePage, parseLimit, parseSort, parseOrder, type QueryParams } from '@/lib/query'

async function MoviesContent({ searchParams }: { searchParams?: Promise<QueryParams> }) {
  const params = await searchParams || {}
  const page = parsePage(params.page)
  const limit = parseLimit(params.limit)
  const sort = parseSort(params.sort)
  const order = parseOrder(params.order ?? params.sort)
  let result: Awaited<ReturnType<typeof getAnimeList>> | null = null
  let error: string | null = null
  try { result = await getAnimeList({ page, limit, preferences: await readContentPreferences(), format: 'MOVIE', sort, order }) }
  catch { error = 'Movies are temporarily unavailable. Please try again.' }
  return <ServerListingPage title="Anime Movies" description="Find acclaimed anime films, from timeless classics to new releases." icon={<Film size={32} style={{ color: '#a78bfa' }} aria-hidden="true" />} result={result} error={error} basePath="/movies" query={{ limit, sort, order }} sort={sort} order={order} />
}

export default function MoviesPage({ searchParams }: { searchParams?: Promise<QueryParams> }) {
  return <Suspense fallback={<main className="page-shell"><div className="empty-state">Loading movies…</div></main>}><MoviesContent searchParams={searchParams} /></Suspense>
}
