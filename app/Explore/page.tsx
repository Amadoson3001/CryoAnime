'use client'

import React, { useState, useEffect } from 'react'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import { AnimeGrid } from '@/components/anime_cards'
import { fetchGenres, fetchAnimeByGenre, Genre, AnimeData, AnimeResponse } from '@/lib/api'
import { getNsfwPreference } from '@/lib/userPreferences'
import {
  Container,
  Flex,
  Box,
  Text,
  Select,
  Button,
  DropdownMenu
} from '@radix-ui/themes'
import { ArrowLeft, ChevronDown } from 'lucide-react'

const GenresPage = () => {
  const [genres, setGenres] = useState<Genre[]>([])
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null)
  const [animeList, setAnimeList] = useState<AnimeData[]>([])
  const [loading, setLoading] = useState(true)
  const [animeLoading, setAnimeLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [animeError, setAnimeError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [sortBy, setSortBy] = useState('popularity') // Default sort by popularity
  const [sortOrder, setSortOrder] = useState('desc') // Default descending order

  const itemsPerPage = 24

  // Fetch all genres on component mount
  useEffect(() => {
    const loadGenres = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetchGenres()
        setGenres(response.data)
      } catch (err) {
        setError('Failed to load genres. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadGenres()
  }, [])

  // Fetch anime by genre when a genre is selected or sort options change
  const fetchAnimeForGenre = async (genreId: number, page: number = 1, sort: string = sortBy, order: string = sortOrder) => {
    try {
      setAnimeLoading(true)
      setAnimeError(null)
      
      const includeNsfw = getNsfwPreference()
      const response: AnimeResponse = await fetchAnimeByGenre(genreId, page, itemsPerPage, includeNsfw, sort, order)
      
      setAnimeList(response.data)
      setTotalPages(response.pagination.last_visible_page)
      setHasNextPage(response.pagination.has_next_page)
      setCurrentPage(page)
    } catch (err) {
      setAnimeError('Failed to load anime for this genre. Please try again.')
    } finally {
      setAnimeLoading(false)
    }
  }

  // Handle genre selection
  const handleGenreChange = (genreId: string) => {
    const id = parseInt(genreId)
    if (!isNaN(id)) {
      setSelectedGenre(id)
      fetchAnimeForGenre(id, 1, sortBy, sortOrder)
    } else {
      setSelectedGenre(null)
      setAnimeList([])
    }
  }

  // Handle sort change
  const handleSortChange = (sort: string, order: string) => {
    setSortBy(sort)
    setSortOrder(order)
    if (selectedGenre) {
      fetchAnimeForGenre(selectedGenre, 1, sort, order)
    }
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    if (selectedGenre && page >= 1 && page <= totalPages && page !== currentPage) {
      fetchAnimeForGenre(selectedGenre, page, sortBy, sortOrder)
      // Smooth scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Render pagination
  const renderPagination = () => {
    if (!selectedGenre || totalPages <= 1) return null

    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    // Previous button
    pages.push(
      <Button
        key="prev"
        variant="soft"
        disabled={currentPage === 1 || animeLoading}
        onClick={() => handlePageChange(currentPage - 1)}
        style={{
          backgroundColor: currentPage === 1 ? '#1e293b' : '#3b82f6',
          color: currentPage === 1 ? '#64748b' : 'white',
          border: '1px solid #334155',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
        }}
      >
        <ArrowLeft size={16} />
        Previous
      </Button>
    )

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={currentPage === i ? "solid" : "soft"}
          onClick={() => handlePageChange(i)}
          disabled={animeLoading}
          style={{
            backgroundColor: currentPage === i ? '#3b82f6' : '#1e293b',
            color: currentPage === i ? 'white' : '#cbd5e1',
            border: '1px solid #334155',
            minWidth: '40px',
            cursor: animeLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {i}
        </Button>
      )
    }

    // Next button
    pages.push(
      <Button
        key="next"
        variant="soft"
        disabled={currentPage === totalPages || !hasNextPage || animeLoading}
        onClick={() => handlePageChange(currentPage + 1)}
        style={{
          backgroundColor: (currentPage === totalPages || !hasNextPage) ? '#1e293b' : '#3b82f6',
          color: (currentPage === totalPages || !hasNextPage) ? '#64748b' : 'white',
          border: '1px solid #334155',
          cursor: (currentPage === totalPages || !hasNextPage) ? 'not-allowed' : 'pointer'
        }}
      >
        Next
        <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
      </Button>
    )

    return pages
  }

  return (
    <>
      <Header />
      <main style={{ backgroundColor: '#0f172a', minHeight: '100vh', paddingTop: '5rem' }}>
        <Container size="4" px="4" py={{ initial: '12', md: '10' }}>
          {/* Page Header */}
          <Box mb="8" style={{ textAlign: 'center' }}>
            <h1 style={{
              fontSize: 'var(--font-size-8)',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 1rem 0'
            }}>
              Anime by Genre
            </h1>
            <Text as="p" size="4" style={{ color: '#cbd5e1', maxWidth: '600px', margin: '0 auto' }}>
              Explore anime by selecting a genre from the dropdown below
            </Text>
          </Box>

          {/* Controls Row */}
          <Flex mb="8" gap="4" justify="center" wrap="wrap">
            {/* Genre Selector */}
            <Box style={{ minWidth: '200px', flex: '1 1 200px' }}>
              <Text as="label" size="2" weight="bold" style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>
                Select a Genre
              </Text>
              <Select.Root 
                value={selectedGenre?.toString() || ''} 
                onValueChange={handleGenreChange}
                disabled={loading}
              >
                <Select.Trigger 
                  style={{ 
                    width: '100%', 
                    backgroundColor: '#1e293b', 
                    color: 'white', 
                    borderColor: '#334155' 
                  }} 
                  placeholder={loading ? "Loading genres..." : "Choose a genre"}
                />
                <Select.Content>
                  {genres.map((genre) => (
                    <Select.Item key={genre.mal_id} value={genre.mal_id.toString()}>
                      {genre.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>

            {/* Sort Selector */}
            <Box style={{ minWidth: '200px', flex: '1 1 200px' }}>
              <Text as="label" size="2" weight="bold" style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>
                Sort By
              </Text>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  <Button 
                    variant="soft" 
                    style={{ 
                      width: '100%', 
                      backgroundColor: '#1e293b', 
                      color: 'white', 
                      borderColor: '#334155',
                      justifyContent: 'space-between'
                    }}
                  >
                    {sortBy === 'popularity' ? 'Popularity' : 
                     sortBy === 'score' ? 'Score' : 
                     sortBy === 'recent' ? 'Recent' : 
                     sortBy === 'title' ? 'Title' : 'Popularity'}
                    <ChevronDown size={16} />
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                  <DropdownMenu.Item onSelect={() => handleSortChange('popularity', 'desc')}>
                    Popularity (High to Low)
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onSelect={() => handleSortChange('popularity', 'asc')}>
                    Popularity (Low to High)
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item onSelect={() => handleSortChange('score', 'desc')}>
                    Score (High to Low)
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onSelect={() => handleSortChange('score', 'asc')}>
                    Score (Low to High)
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item onSelect={() => handleSortChange('recent', 'desc')}>
                    Recent (New to Old)
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onSelect={() => handleSortChange('recent', 'asc')}>
                    Recent (Old to New)
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item onSelect={() => handleSortChange('title', 'asc')}>
                    Title (A to Z)
                  </DropdownMenu.Item>
                  <DropdownMenu.Item onSelect={() => handleSortChange('title', 'desc')}>
                    Title (Z to A)
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </Box>
          </Flex>

          {/* Stats */}
          {selectedGenre && !animeLoading && !animeError && animeList.length > 0 && (
            <Box mb="6" style={{ textAlign: 'center' }}>
              <Text as="p" size="2" style={{ color: '#94a3b8' }}>
                Showing page {currentPage} of {totalPages} • {animeList.length} anime
              </Text>
            </Box>
          )}

          {/* Anime Grid */}
          <Box>
            <AnimeGrid
              animeList={animeList}
              loading={animeLoading}
              error={animeError}
            />
          </Box>

          {/* Pagination */}
          {selectedGenre && !animeLoading && !animeError && animeList.length > 0 && totalPages > 1 && (
            <Box mt="8">
              <Flex align="center" justify="center" gap="2" wrap="wrap">
                {renderPagination()}
              </Flex>
            </Box>
          )}

          {/* Empty State */}
          {selectedGenre && !animeLoading && !animeError && animeList.length === 0 && (
            <Box style={{ textAlign: 'center', padding: '2rem' }}>
              <Text as="p" size="4" style={{ color: '#94a3b8' }}>
                No anime found for this genre. Try selecting another genre.
              </Text>
            </Box>
          )}
        </Container>
      </main>
      <Footer />
    </>
  )
}

export default GenresPage