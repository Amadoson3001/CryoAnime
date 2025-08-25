'use client'
import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import { AnimeGrid } from '@/components/anime_cards'
import { AnimeSearchResults } from '@/components/animesearchcard'
import { searchAnime, AnimeData } from '@/lib/api'
import { getNsfwPreference } from '@/lib/userPreferences'
import { Search, Filter } from 'lucide-react'
import {
  Container,
  Flex,
  Box,
  TextField,
  Button,
  Text
} from '@radix-ui/themes'

// Component that uses useSearchParams - needs to be wrapped in Suspense
const SearchContent = () => {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [query, setQuery] = useState(initialQuery)
  const [searchResults, setSearchResults] = useState<AnimeData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, 1)
    }
  }, [initialQuery])

  const performSearch = async (searchQuery: string, page: number = 1) => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const includeNsfw = getNsfwPreference()
      const response = await searchAnime(searchQuery, page, 24, includeNsfw)
      setSearchResults(response.data)
      setHasNextPage(response.pagination.has_next_page)
      setCurrentPage(page)
    } catch (err) {
      setError('Failed to search anime. Please try again.')
      console.error('Error searching anime:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(query)
  }

  const loadMore = () => {
    performSearch(query, currentPage + 1)
  }

  return (
    <main style={{ backgroundColor: '#0f172a', minHeight: '100vh', paddingTop: '5rem' }}>
      <Container size="4" px="4" py={{ initial: '12', md: '10' }}>
        {/* Search Header */}
        <Box mb="8">
          <Text as="p" size="8" weight="bold" mb="6" style={{ color: 'white' }}>
            Search Results
          </Text>

          {/* Search Form */}
          <Flex gap="4" mb="6" onSubmit={handleSearch}>
            <Box flexGrow="1">
              <TextField.Root
                placeholder="Search for anime..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(e as any)
                  }
                }}
                style={{ width: '100%' }}
              >
                <TextField.Slot
                  side="left"
                  style={{ cursor: 'pointer' }}
                  onClick={handleSearch}
                >
                  <Search size={20} style={{ color: '#94a3b8' }} />
                </TextField.Slot>
              </TextField.Root>
            </Box>
            <Button type="submit" style={{ backgroundColor: '#3b82f6', color: 'white' }}>
              <Search size={20} />
              Search
            </Button>
          </Flex>

          {/* Search Stats */}
          {query && !loading && !error && (
            <Text as="p" size="2" style={{ color: '#cbd5e1' }}>
              Found {searchResults.length} results for &quot;<span>{query}</span>&quot;
            </Text>
          )}
        </Box>

        {/* Search Results */}
        {searchResults.length > 0 ? (
          <AnimeSearchResults
            results={searchResults}
            loading={loading}
            error={error}
            query={query}
            variant="page"
            maxResults={24}
          />
        ) : (
          <AnimeGrid
            animeList={searchResults}
            loading={loading}
            error={error}
          />
        )}

        {/* Load More Button */}
        {hasNextPage && !loading && searchResults.length > 0 && (
          <Box style={{ textAlign: 'center' }} mt="8">
            <Button onClick={loadMore} variant="soft" style={{ backgroundColor: '#1e293b', color: 'white' }}>
              Load More Results
            </Button>
          </Box>
        )}

        {/* No Results State */}
        {!loading && !error && query && searchResults.length === 0 && (
          <Box style={{ textAlign: 'center' }} py="12">
            <Box maxWidth="400px" mx="auto" p="8" style={{ borderRadius: 'var(--radius-3)', backgroundColor: '#1e293b', border: '1px solid #334155' }}>
              <Search style={{ margin: '0 auto 16px', color: '#94a3b8' }} size={48} />
              <Text as="p" size="5" weight="bold" mb="2" style={{ color: 'white' }}>
                No results found
              </Text>
              <Text as="p" size="2" style={{ color: '#cbd5e1' }}>
                Try adjusting your search terms or browse our featured anime.
              </Text>
            </Box>
          </Box>
        )}
      </Container>
    </main>
  )
}

// Loading fallback component
const SearchLoadingFallback = () => (
  <main style={{ backgroundColor: '#0f172a', minHeight: '100vh' }}>
    <Container size="4" px="4" py="8">
      <Box mb="8">
        <Text as="p" size="8" weight="bold" mb="6" style={{ color: 'white' }}>
          Search Results
        </Text>
        <Text as="p" size="4" style={{ color: '#cbd5e1' }}>
          Loading search...
        </Text>
      </Box>
    </Container>
  </main>
)

const SearchPage = () => {
  return (
    <>
      <Header />
      <Suspense fallback={<SearchLoadingFallback />}>
        <SearchContent />
      </Suspense>
      <Footer />
    </>
  )
}

export default SearchPage