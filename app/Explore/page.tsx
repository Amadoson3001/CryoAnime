'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import { AnimeGrid } from '@/components/anime_cards'
import Pagination from '@/components/Pagination'
import { fetchTagsByCategory, fetchAnimeByTags, Genre, AnimeData, AnimeResponse, TagCategory } from '@/lib/api'
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
  TextField,
  Tabs
} from '@radix-ui/themes'
import { ChevronDown, Filter, X, Check, Search, Tags } from 'lucide-react'

const CATEGORIES: { key: TagCategory; label: string; color: string }[] = [
  { key: 'genres', label: 'Genres', color: '#3b82f6' },
  { key: 'themes', label: 'Themes', color: '#10b981' },
  { key: 'demographics', label: 'Demographics', color: '#a855f7' },
  { key: 'explicit_genres', label: 'Explicit', color: '#ef4444' },
]

const ExplorePage = () => {
  const [tagCategory, setTagCategory] = useState<TagCategory>('genres')
  const [tags, setTags] = useState<Genre[]>([])
  const [selectedTags, setSelectedTags] = useState<number[]>([])
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
  const [tagSearch, setTagSearch] = useState('')

  const itemsPerPage = 24

  const loadTags = useCallback(async (category: TagCategory) => {
    try {
      setLoading(true)
      setError(null)
      setSelectedTags([])
      setAnimeList([])
      const response = await fetchTagsByCategory(category)
      setTags(response.data)
    } catch (err) {
      setError(`Failed to load ${category}. Please try again.`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTags(tagCategory)
  }, [tagCategory, loadTags])

  const fetchAnimeForTags = async (tagIds: number[], page: number = 1, sort: string = sortBy, order: string = sortOrder) => {
    if (tagIds.length === 0) {
      setAnimeList([])
      setTotalPages(1)
      setHasNextPage(false)
      return
    }

    try {
      setAnimeLoading(true)
      setAnimeError(null)

      const includeNsfw = getNsfwPreference()
      const response: AnimeResponse = await fetchAnimeByTags(tagIds, tagCategory, page, itemsPerPage, includeNsfw, sort, order)

      setAnimeList(response.data)
      setTotalPages(response.pagination.last_visible_page)
      setHasNextPage(response.pagination.has_next_page)
      setCurrentPage(page)
    } catch (err) {
      setAnimeError(`Failed to load anime for these ${tagCategory}. Please try again.`)
    } finally {
      setAnimeLoading(false)
    }
  }

  const toggleTag = (tagId: number) => {
    setSelectedTags(prev => {
      const next = prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]

      fetchAnimeForTags(next, 1, sortBy, sortOrder)
      return next
    })
  }

  const clearTags = () => {
    setSelectedTags([])
    setAnimeList([])
  }

  const handleSortChange = (sort: string, order: string) => {
    setSortBy(sort)
    setSortOrder(order)
    if (selectedTags.length > 0) {
      fetchAnimeForTags(selectedTags, 1, sort, order)
    }
  }

  const handlePageChange = (page: number) => {
    if (selectedTags.length > 0 && page >= 1 && page <= totalPages && page !== currentPage) {
      fetchAnimeForTags(selectedTags, page, sortBy, sortOrder)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const filteredTags = tags.filter(t =>
    t.name.toLowerCase().includes(tagSearch.toLowerCase())
  )

  const currentCategory = CATEGORIES.find(c => c.key === tagCategory)!

  return (
    <>
      <Header />
      <main style={{ backgroundColor: '#0f172a', minHeight: '100vh', paddingTop: '5rem' }}>
        <Container size="4" px="3" py={{ initial: '12', md: '10' }} className="page-enter">
          {/* Page Header */}
          <Box mb="6" style={{ textAlign: 'center' }}>
            <h1 style={{
              fontSize: 'var(--font-size-8)',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 0 0.75rem 0'
            }}>
              Explore Anime
            </h1>
            <Text as="p" size="4" style={{ color: '#cbd5e1', maxWidth: '600px', margin: '0 auto' }}>
              Browse by genres, themes, demographics, and more
            </Text>
          </Box>

          {/* Category Tabs */}
          <Flex justify="center" mb="6">
            <Tabs.Root value={tagCategory} onValueChange={(value) => setTagCategory(value as TagCategory)}>
              <Tabs.List size="2" style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '4px', borderRadius: '12px' }}>
                {CATEGORIES.map(cat => (
                  <Tabs.Trigger
                    key={cat.key}
                    value={cat.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      color: tagCategory === cat.key ? cat.color : undefined
                    }}
                  >
                    <Tags size={14} />
                    {cat.label}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
            </Tabs.Root>
          </Flex>

          {/* Controls Row */}
          <Flex direction="column" gap="4" mb="8">
            <Flex gap="4" wrap="wrap" justify="center" align="start">
              {/* Tag Multi-Select Popover */}
              <Box style={{ minWidth: '300px', flex: '1 1 300px' }}>
                <Text as="label" size="2" weight="bold" style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>
                  Filter by {currentCategory.label} ({selectedTags.length})
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
                          {selectedTags.length === 0
                            ? `Select ${currentCategory.label.toLowerCase()}...`
                            : `${selectedTags.length} ${currentCategory.label.toLowerCase()} selected`}
                        </Text>
                      </Flex>
                      <ChevronDown size={16} />
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content style={{ width: '300px', padding: '8px', backgroundColor: '#1e293b', border: '1px solid #334155' }}>
                    <Box p="2">
                      <TextField.Root
                        placeholder={`Search ${currentCategory.label.toLowerCase()}...`}
                        value={tagSearch}
                        onChange={(e) => setTagSearch(e.target.value)}
                        mb="3"
                        style={{ backgroundColor: '#0f172a' }}
                      >
                        <TextField.Slot>
                          <Search size={14} />
                        </TextField.Slot>
                      </TextField.Root>
                    </Box>
                    {loading ? (
                      <Box p="4" style={{ textAlign: 'center' }}>
                        <Text size="2" style={{ color: '#64748b' }}>Loading...</Text>
                      </Box>
                    ) : error ? (
                      <Box p="4" style={{ textAlign: 'center' }}>
                        <Text size="2" style={{ color: '#ef4444' }}>{error}</Text>
                      </Box>
                    ) : (
                      <ScrollArea scrollbars="vertical" style={{ height: '300px' }}>
                        <Flex direction="column" gap="1">
                          {filteredTags.map(tag => {
                            const isSelected = selectedTags.includes(tag.mal_id)
                            return (
                              <Box
                                key={tag.mal_id}
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  toggleTag(tag.mal_id)
                                }}
                                style={{
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'between',
                                  backgroundColor: isSelected ? `${currentCategory.color}33` : 'transparent',
                                  color: isSelected ? currentCategory.color : '#cbd5e1',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <Text size="2">{tag.name}</Text>
                                {isSelected && <Check size={14} style={{ marginLeft: 'auto' }} />}
                              </Box>
                            )
                          })}
                        </Flex>
                      </ScrollArea>
                    )}
                    {selectedTags.length > 0 && (
                      <Box mt="2" pt="2" style={{ borderTop: '1px solid #334155' }}>
                        <Button
                          variant="ghost"
                          size="1"
                          color="red"
                          onClick={clearTags}
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

            {/* Selected Tag Badges */}
            {selectedTags.length > 0 && (
              <Flex gap="2" wrap="wrap" justify="center">
                {selectedTags.map(id => {
                  const tag = tags.find(t => t.mal_id === id)
                  if (!tag) return null
                  return (
                    <Badge
                      key={id}
                      size="2"
                      variant="solid"
                      style={{
                        backgroundColor: currentCategory.color,
                        padding: '4px 10px',
                        borderRadius: '20px',
                        cursor: 'default',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {tag.name}
                      <Box
                        onClick={() => toggleTag(id)}
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
            {selectedTags.length > 0 ? (
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
                <Heading as="h3" size="5" mb="2" style={{ color: 'white' }}>
                  No {currentCategory.label.toLowerCase()} selected
                </Heading>
                <Text as="p" style={{ color: '#94a3b8' }}>
                  Select one or more {currentCategory.label.toLowerCase()} above to start exploring.
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

export default ExplorePage