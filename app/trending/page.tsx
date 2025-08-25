'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import { AnimeGrid } from '@/components/anime_cards'
import { fetchSeasonalAnime, AnimeData } from '@/lib/api'
import { getNsfwPreference } from '@/lib/userPreferences'
import { Box, Container, Flex, Text, Heading, Button } from '@radix-ui/themes'
import { TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'

// Helper function to get the current season based on month
const getCurrentSeason = (month: number): string => {
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'fall'
  return 'winter'
}

// Helper function to get the current year and season
const getCurrentYearAndSeason = (): { year: number; season: string } => {
  const now = new Date()
  const currentMonth = now.getMonth() + 1 // getMonth() returns 0-11
  const currentYear = now.getFullYear()

  // For December, January, February - check if it's early in the year to show previous year's winter
  if (currentMonth === 1 || currentMonth === 2) {
    return { year: currentYear, season: 'winter' }
  } else if (currentMonth === 12) {
    return { year: currentYear + 1, season: 'winter' }
  }

  return { year: currentYear, season: getCurrentSeason(currentMonth) }
}

const TrendingPage = () => {
  const [animeList, setAnimeList] = useState<AnimeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [currentYear, setCurrentYear] = useState(0)
  const [currentSeason, setCurrentSeason] = useState('')

  const itemsPerPage = 24

  // Get current year and season on component mount
  useEffect(() => {
    const { year, season } = getCurrentYearAndSeason()
    setCurrentYear(year)
    setCurrentSeason(season)
  }, [])

  const fetchSeasonalAnimeData = useCallback(async (page: number = 1, showPageLoading = true) => {
    if (!currentYear || !currentSeason) return

    try {
      if (showPageLoading) {
        setIsPageLoading(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const includeNsfw = getNsfwPreference()
      const response = await fetchSeasonalAnime(currentYear, currentSeason, page, itemsPerPage, includeNsfw)

      setAnimeList(response.data)
      setTotalPages(response.pagination.last_visible_page)
      setHasNextPage(response.pagination.has_next_page)
      setCurrentPage(page)

      // Add a small delay for better UX on initial load
      if (isInitialLoad) {
        setTimeout(() => {
          setIsInitialLoad(false)
        }, 300)
      }
    } catch (err) {
      setError('Failed to load seasonal anime. Please try again.')
      console.error('Error fetching seasonal anime:', err)
    } finally {
      setLoading(false)
      setIsPageLoading(false)
    }
  }, [currentYear, currentSeason, isInitialLoad, itemsPerPage])

  useEffect(() => {
    if (currentYear && currentSeason) {
      fetchSeasonalAnimeData(1, false)
    }
  }, [currentYear, currentSeason, fetchSeasonalAnimeData])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      fetchSeasonalAnimeData(page)
      // Smooth scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const renderPagination = () => {
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
        disabled={currentPage === 1 || isPageLoading}
        onClick={() => handlePageChange(currentPage - 1)}
        style={{
          backgroundColor: currentPage === 1 ? '#1e293b' : '#3b82f6',
          color: currentPage === 1 ? '#64748b' : 'white',
          border: '1px solid #334155',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
        }}
      >
        <ChevronLeft size={16} />
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
          disabled={isPageLoading}
          style={{
            backgroundColor: currentPage === i ? '#3b82f6' : '#1e293b',
            color: currentPage === i ? 'white' : '#cbd5e1',
            border: '1px solid #334155',
            minWidth: '40px',
            cursor: isPageLoading ? 'not-allowed' : 'pointer'
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
        disabled={currentPage === totalPages || !hasNextPage || isPageLoading}
        onClick={() => handlePageChange(currentPage + 1)}
        style={{
          backgroundColor: (currentPage === totalPages || !hasNextPage) ? '#1e293b' : '#3b82f6',
          color: (currentPage === totalPages || !hasNextPage) ? '#64748b' : 'white',
          border: '1px solid #334155',
          cursor: (currentPage === totalPages || !hasNextPage) ? 'not-allowed' : 'pointer'
        }}
      >
        Next
        <ChevronRight size={16} />
      </Button>
    )

    return pages
  }

  return (
    <>
      <Header />
      <main
        style={{
          backgroundColor: '#0f172a',
          minHeight: '100vh',
          opacity: isInitialLoad ? 0 : 1,
          animation: isInitialLoad ? 'none' : 'fadeInUp 0.6s ease-out',
          paddingTop: '5rem'
        }}
      >
        <style jsx global>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .page-enter {
            animation: slideInFromBottom 0.8s ease-out;
          }

          @keyframes slideInFromBottom {
            from {
              opacity: 0;
              transform: translateY(50px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .anime-grid-enter {
            animation: fadeInGrid 0.4s ease-out 0.2s both;
          }

          @keyframes fadeInGrid {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
        `}</style>

        <Container size="4" px="4" py={{ initial: '12', md: '10' }} className="page-enter">
          {/* Page Header */}
          <Box mb="8" style={{ textAlign: 'center' }}>
            <Flex align="center" justify="center" gap="2" mb="4">
              <TrendingUp size={32} style={{ color: '#3b82f6' }} />
              <h1 style={{
                fontSize: 'var(--font-size-8)',
                fontWeight: 'bold',
                color: 'white',
                margin: 0
              }}>
                {currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)} {currentYear} Anime
              </h1>
              <TrendingUp size={32} style={{ color: '#3b82f6' }} />
            </Flex>
            <Text as="p" size="4" style={{ color: '#cbd5e1', maxWidth: '600px', margin: '0 auto' }}>
              Discover the latest anime releases from this season
            </Text>
          </Box>

          {/* Stats */}
          {!loading && !error && animeList.length > 0 && (
            <Box mb="6" style={{ textAlign: 'center' }}>
              <Text as="p" size="2" style={{ color: '#94a3b8' }}>
                Showing page {currentPage} of {totalPages} • {animeList.length} anime
              </Text>
            </Box>
          )}

          {/* Anime Grid with Animation */}
          <Box className="anime-grid-enter">
            <AnimeGrid
              animeList={animeList}
              loading={loading}
              error={error}
            />
          </Box>

          {/* Pagination */}
          {!loading && !error && animeList.length > 0 && totalPages > 1 && (
            <Box mt="8">
              <Flex align="center" justify="center" gap="2" wrap="wrap">
                {renderPagination()}
              </Flex>
            </Box>
          )}

          {/* Page Loading Overlay */}
          {isPageLoading && (
            <Box
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                backdropFilter: 'blur(4px)'
              }}
            >
              <Box
                style={{
                  backgroundColor: '#1e293b',
                  padding: '32px',
                  borderRadius: '16px',
                  border: '1px solid #334155',
                  textAlign: 'center',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }}
              >
                <TrendingUp size={32} style={{ color: '#3b82f6', marginBottom: '16px' }} />
                <Text as="p" size="4" weight="bold" style={{ color: 'white', marginBottom: '8px' }}>
                  Loading Seasonal Anime
                </Text>
                <Text as="p" size="2" style={{ color: '#cbd5e1' }}>
                  Please wait...
                </Text>
              </Box>
            </Box>
          )}
        </Container>
      </main>
      <Footer />
    </>
  )
}

export default TrendingPage