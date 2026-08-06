import { Search } from 'lucide-react'
import { Suspense } from 'react'
import { Container } from '@/components/ui-primitives'
import SearchResultsClient from '@/components/search-results-client'

export default function SearchPage() {
  return (
    <main className="page-shell">
      <Container size="4" px="3" py={{ initial: '7', md: '9' }} className="page-enter">
        <div className="page-heading">
          <h1 className="page-title">Search Anime</h1>
          <form action="/search" method="get" role="search" className="page-search-form">
            <label htmlFor="anime-search-query" className="sr-only">Search anime</label>
            <input id="anime-search-query" name="q" type="search" minLength={2} maxLength={100} required placeholder="Search for anime…" autoComplete="off" />
            <button type="submit"><Search size={18} aria-hidden="true" /> Search</button>
          </form>
        </div>
        <Suspense fallback={<div className="empty-state">Preparing search…</div>}>
          <SearchResultsClient />
        </Suspense>
      </Container>
    </main>
  )
}
