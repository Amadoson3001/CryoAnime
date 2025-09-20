'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import Pagination from '@/components/Pagination'
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

  // Full-page loading screen
  if (loading && isInitialLoad) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          flexDirection: 'column'
        }}
      >
        {/* Animated background elements */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              top: '25%',
              left: '8%',
              width: '45px',
              height: '45px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '50%',
              animation: 'float 3.5s ease-in-out infinite'
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '55%',
              right: '18%',
              width: '55px',
              height: '55px',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              borderRadius: '50%',
              animation: 'float 4.5s ease-in-out infinite reverse'
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '35%',
              left: '15%',
              width: '35px',
              height: '35px',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              borderRadius: '50%',
              animation: 'float 3s ease-in-out infinite'
            }}
          />
        </div>

        {/* Main loading content */}
        <div
          style={{
            backgroundColor: 'rgba(30, 41, 59, 0.9)',
            padding: '48px',
            borderRadius: '24px',
            border: '1px solid rgba(51, 65, 85, 0.5)',
            textAlign: 'center',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
            animation: 'slideInUp 0.8s ease-out',
            position: 'relative',
            zIndex: 1
          }}
        >
          <div style={{ marginBottom: '24px' }}>
            <TrendingUp size={48} style={{ color: '#3b82f6', animation: 'pulse 2s ease-in-out infinite' }} />
          </div>

          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '8px',
            animation: 'fadeIn 1s ease-out'
          }}>
            Loading {currentSeason.charAt(0).toUpperCase() + currentSeason.slice(1)} {currentYear} Anime
          </h2>

          <p style={{
            color: '#cbd5e1',
            fontSize: '0.875rem',
            animation: 'fadeIn 1s ease-out 0.2s both'
          }}>
            Discovering the latest seasonal releases...
          </p>

          {/* Wave loading animation */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '24px',
            gap: '4px'
          }}>
            <div style={{
              width: '6px',
              height: '20px',
              backgroundColor: '#3b82f6',
              borderRadius: '3px',
              animation: 'wave 1.2s ease-in-out infinite'
            }} />
            <div style={{
              width: '6px',
              height: '20px',
              backgroundColor: '#3b82f6',
              borderRadius: '3px',
              animation: 'wave 1.2s ease-in-out infinite 0.1s'
            }} />
            <div style={{
              width: '6px',
              height: '20px',
              backgroundColor: '#3b82f6',
              borderRadius: '3px',
              animation: 'wave 1.2s ease-in-out infinite 0.2s'
            }} />
            <div style={{
              width: '6px',
              height: '20px',
              backgroundColor: '#3b82f6',
              borderRadius: '3px',
              animation: 'wave 1.2s ease-in-out infinite 0.3s'
            }} />
            <div style={{
              width: '6px',
              height: '20px',
              backgroundColor: '#3b82f6',
              borderRadius: '3px',
              animation: 'wave 1.2s ease-in-out infinite 0.4s'
            }} />
          </div>

          {/* Progress indicator */}
          <div style={{
            marginTop: '20px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'scalePulse 1.5s ease-in-out infinite'
            }} />
            <div style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'scalePulse 1.5s ease-in-out infinite 0.2s'
            }} />
            <div style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'scalePulse 1.5s ease-in-out infinite 0.4s'
            }} />
          </div>
        </div>

        <style jsx global>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-25px) rotate(180deg); }
          }

          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.8;
            }
          }

          @keyframes wave {
            0%, 60%, 100% {
              transform: scaleY(1);
            }
            30% {
              transform: scaleY(1.8);
            }
          }

          @keyframes scalePulse {
            0%, 100% {
              transform: scale(1);
              opacity: 0.6;
            }
            50% {
              transform: scale(1.3);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    )
  }

  return (
    <>
      <Header />
      <main
        style={{
          backgroundColor: '#0f172a',
          minHeight: '100vh',
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
          <Box mt="8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              hasNextPage={hasNextPage}
              onPageChange={handlePageChange}
              loading={loading}
            />
          </Box>

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