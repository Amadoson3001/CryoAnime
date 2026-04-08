'use client'

import React, { useState, useEffect } from 'react'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import { AnimeGrid } from '@/components/anime_cards'
import Pagination from '@/components/Pagination'
import { fetchGenres, fetchAnimeByGenre, Genre, AnimeData, AnimeResponse } from '@/lib/api'
import { getNsfwPreference } from '@/lib/userPreferences'
import {
  Container,
  Flex,
  Box,
  Text,
  Heading,
  Button,
  DropdownMenu,
  Badge,
  ScrollArea,
  TextField
} from '@radix-ui/themes'
import { ChevronDown, Filter, X, Check, Search } from 'lucide-react'

const GenresPage = () => {
  const [genres, setGenres] = useState<Genre[]>([])
  const [selectedGenres, setSelectedGenres] = useState<number[]>([])
  const [animeList, setAnimeList] = useState<AnimeData[]>([])
  const [loading, setLoading] = useState(true)
  const [animeLoading, setAnimeLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [animeError, setAnimeError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [sortBy, setSortBy] = useState('popularity')
  const [sortOrder, setSortOrder] = useState('desc')
  const [genreSearch, setGenreSearch] = useState('')

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

  // Fetch anime by genres when selection or sort options change
  const fetchAnimeForGenres = async (genreIds: number[], page: number = 1, sort: string = sortBy, order: string = sortOrder) => {
    if (genreIds.length === 0) {
      setAnimeList([])
      setTotalPages(1)
      setHasNextPage(false)
      return
    }

    try {
      setAnimeLoading(true)
      setAnimeError(null)
      
      const includeNsfw = getNsfwPreference()
      const response: AnimeResponse = await fetchAnimeByGenre(genreIds, page, itemsPerPage, includeNsfw, sort, order)
      
      setAnimeList(response.data)
      setTotalPages(response.pagination.last_visible_page)
      setHasNextPage(response.pagination.has_next_page)
      setCurrentPage(page)
    } catch (err) {
      setAnimeError('Failed to load anime for these genres. Please try again.')
    } finally {
      setAnimeLoading(false)
    }
  }

  // Handle genre toggle
  const toggleGenre = (genreId: number) => {
    setSelectedGenres(prev => {
      const next = prev.includes(genreId) 
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
      
      // Auto-fetch when selection changes
      fetchAnimeForGenres(next, 1, sortBy, sortOrder)
      return next
    })
  }

  const clearGenres = () => {
    setSelectedGenres([])
    setAnimeList([])
  }

  // Handle sort change
  const handleSortChange = (sort: string, order: string) => {
    setSortBy(sort)
    setSortOrder(order)
    if (selectedGenres.length > 0) {
      fetchAnimeForGenres(selectedGenres, 1, sort, order)
    }
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    if (selectedGenres.length > 0 && page >= 1 && page <= totalPages && page !== currentPage) {
      fetchAnimeForGenres(selectedGenres, page, sortBy, sortOrder)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const filteredGenres = genres.filter(g => 
    g.name.toLowerCase().includes(genreSearch.toLowerCase())
  )

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
              Explore by Genre
            </h1>
            <Text as="p" size="4" style={{ color: '#cbd5e1', maxWidth: '600px', margin: '0 auto' }}>
              Select one or more genres to discover your next favorite anime
            </Text>
          </Box>

          {/* Controls Row */}
          <Flex direction="column" gap="4" mb="8">
            <Flex gap="4" wrap="wrap" justify="center" align="start">
              {/* Genre Multi-Select Popover */}
              <Box style={{ minWidth: '300px', flex: '1 1 300px' }}>
                <Text as="label" size="2" weight="bold" style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>
                  Filter by Genres ({selectedGenres.length})
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
                        justifyContent: 'space-between',
                        height: '40px'
                      }}
                    >
                      <Flex gap="2" align="center">
                        <Filter size={16} />
                        <Text>
                          {selectedGenres.length === 0 
                            ? "Select genres..." 
                            : `${selectedGenres.length} genres selected`}
                        </Text>
                      </Flex>
                      <ChevronDown size={16} />
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content style={{ width: '300px', padding: '8px', backgroundColor: '#1e293b', border: '1px solid #334155' }}>
                    <Box p="2">
                      <TextField.Root 
                        placeholder="Search genres..." 
                        value={genreSearch}
                        onChange={(e) => setGenreSearch(e.target.value)}
                        mb="3"
                        style={{ backgroundColor: '#0f172a' }}
                      >
                        <TextField.Slot>
                          <Search size={14} />
                        </TextField.Slot>
                      </TextField.Root>
                    </Box>
                    <ScrollArea scrollbars="vertical" style={{ height: '300px' }}>
                      <Flex direction="column" gap="1">
                        {filteredGenres.map(genre => {
                          const isSelected = selectedGenres.includes(genre.mal_id)
                          return (
                            <Box 
                              key={genre.mal_id}
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                toggleGenre(genre.mal_id)
                              }}
                              style={{
                                padding: '8px 12px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'between',
                                backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                color: isSelected ? '#60a5fa' : '#cbd5e1',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <Text size="2">{genre.name}</Text>
                              {isSelected && <Check size={14} style={{ marginLeft: 'auto' }} />}
                            </Box>
                          )
                        })}
                      </Flex>
                    </ScrollArea>
                    {selectedGenres.length > 0 && (
                      <Box mt="2" pt="2" style={{ borderTop: '1px solid #334155' }}>
                        <Button 
                          variant="ghost" 
                          size="1" 
                          color="red" 
                          onClick={clearGenres}
                          style={{ width: '100%' }}
                        >
                          Clear Selection
                        </Button>
                      </Box>
                    )}
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </Box>

              {/* Sort Selector */}
              <Box style={{ minWidth: '200px', flex: '0 1 200px' }}>
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
                        justifyContent: 'space-between',
                        height: '40px'
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
                    <DropdownMenu.Item onSelect={() => handleSortChange('popularity', 'desc')}>Popularity (High-Low)</DropdownMenu.Item>
                    <DropdownMenu.Item onSelect={() => handleSortChange('popularity', 'asc')}>Popularity (Low-High)</DropdownMenu.Item>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item onSelect={() => handleSortChange('score', 'desc')}>Score (High-Low)</DropdownMenu.Item>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item onSelect={() => handleSortChange('recent', 'desc')}>Recent (New-Old)</DropdownMenu.Item>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item onSelect={() => handleSortChange('title', 'asc')}>Title (A-Z)</DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </Box>
            </Flex>

            {/* Selected Genre Badges */}
            {selectedGenres.length > 0 && (
              <Flex gap="2" wrap="wrap" justify="center">
                {selectedGenres.map(id => {
                  const genre = genres.find(g => g.mal_id === id)
                  if (!genre) return null
                  return (
                    <Badge 
                      key={id} 
                      size="2" 
                      variant="solid" 
                      style={{ 
                        backgroundColor: '#3b82f6', 
                        padding: '4px 10px', 
                        borderRadius: '20px',
                        cursor: 'default',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {genre.name}
                      <Box 
                        onClick={() => toggleGenre(id)} 
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        <X size={12} />
                      </Box>
                    </Badge>
                  )
                })}
              </Flex>
            )}
          </Flex>

          {/* Anime Grid */}
          <Box>
            {selectedGenres.length > 0 ? (
              <>
                <Box mb="6" style={{ textAlign: 'center' }}>
                  {!animeLoading && animeList.length > 0 && (
                    <Text as="p" size="2" style={{ color: '#94a3b8' }}>
                      Found {animeList.length} anime on this page
                    </Text>
                  )}
                </Box>
                <AnimeGrid
                  animeList={animeList}
                  loading={animeLoading}
                  error={animeError}
                />
                <Box mt="8">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    hasNextPage={hasNextPage}
                    onPageChange={handlePageChange}
                    loading={animeLoading}
                  />
                </Box>
              </>
            ) : (
              <Box style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'rgba(30, 41, 59, 0.3)', borderRadius: '16px', border: '2px dashed #334155' }}>
                <Filter size={48} style={{ color: '#334155', marginBottom: '1rem', opacity: 0.5 }} />
                <Heading as="h3" size="5" mb="2" style={{ color: 'white' }}>No genres selected</Heading>
                <Text as="p" style={{ color: '#94a3b8' }}>
                  Select one or more anime genres above to start exploring.
                </Text>
              </Box>
            )}
          </Box>
        </Container>
      </main>
      <Footer />
    </>
  )
}

export default GenresPage