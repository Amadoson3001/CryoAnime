'use client'

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { AnimeGrid } from '@/components/anime_cards'
import PaginationLinks from '@/components/PaginationLinks'
import type { AnimeListItem } from '@/lib/anime-models'

type SearchPayload = {
  data?: AnimeListItem[]
  error?: string
  pagination?: {
    current_page?: number
    last_visible_page?: number
    has_next_page?: boolean
    items?: { total?: number }
  }
}

export default function SearchResultsClient() {
  const params = useSearchParams()
  const query = (params.get('q') || '').trim().slice(0, 100)
  const requestedPage = Math.max(1, Math.min(100, Number(params.get('page')) || 1))
  const limit = Math.max(1, Math.min(24, Number(params.get('limit')) || 24))
  const [payload, setPayload] = useState<SearchPayload | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (query.length < 2) {
      setPayload(null)
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setPayload(null)
    const search = new URLSearchParams({ q: query, page: String(requestedPage), limit: String(limit) })
    void fetch(`/api/search?${search.toString()}`, {
      credentials: 'same-origin',
      headers: { accept: 'application/json' },
      signal: controller.signal,
    })
      .then(async response => {
        const next = await response.json() as SearchPayload
        if (!response.ok && !next.error) next.error = 'Search is temporarily unavailable. Please try again.'
        if (!controller.signal.aborted) setPayload(next)
      })
      .catch(() => {
        if (!controller.signal.aborted) setPayload({ error: 'Search is temporarily unavailable. Please try again.', data: [] })
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [limit, query, requestedPage])

  if (query.length < 2) {
    return (
      <div className="empty-state">
        <Search size={40} aria-hidden="true" />
        <p>Enter at least two characters to search AniList.</p>
      </div>
    )
  }

  const items = payload?.data || []
  const page = payload?.pagination?.current_page || requestedPage
  const totalPages = payload?.pagination?.last_visible_page || page
  const hasNextPage = Boolean(payload?.pagination?.has_next_page)

  return (
    <section aria-live="polite" aria-busy={loading}>
      {!loading && !payload?.error && (
        <p className="page-result-count">
          Found {payload?.pagination?.items?.total ?? items.length} results for “{query}”
        </p>
      )}
      <AnimeGrid animeList={items} loading={loading} error={payload?.error || null} priorityCount={2} />
      {!loading && !payload?.error && payload && (
        <PaginationLinks
          basePath="/search"
          query={{ q: query, limit }}
          page={page}
          totalPages={totalPages}
          hasNextPage={hasNextPage}
        />
      )}
    </section>
  )
}
