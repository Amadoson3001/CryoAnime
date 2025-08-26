'use client'
import React, { useState, useEffect } from 'react'
import { AnimeGrid } from './anime_cards'
import Link from 'next/link'

import { fetchTopAnimeForLanding, fetchSeasonalAnimeForLanding, AnimeData, preloadAnimeImages, isNsfwAnime } from '@/lib/api'
import { getNsfwPreference } from '@/lib/userPreferences'
import { ChevronRight, Trophy, Calendar, Star } from 'lucide-react'
import {
  Box,
  Container,
  Flex,
  Grid,
  Text,
  Button,
  Separator
} from '@radix-ui/themes'

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

const FeaturedSection = () => {
  const [featuredAnime, setFeaturedAnime] = useState<AnimeData[]>([])
  const [seasonalAnime, setSeasonalAnime] = useState<AnimeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadFeaturedAnime = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get current year and season
        const { year, season } = getCurrentYearAndSeason()

        // Get NSFW preference
        const includeNsfw = getNsfwPreference()

        // Fetch both top anime and seasonal anime in parallel using optimized functions
        const [featuredData, seasonalData] = await Promise.all([
          fetchTopAnimeForLanding(includeNsfw),
          fetchSeasonalAnimeForLanding(year, season, includeNsfw, 10)
        ])

        setFeaturedAnime(featuredData)
        setSeasonalAnime(seasonalData)

        // Preload images for better performance
        if (featuredData.length > 0) {
          preloadAnimeImages([...featuredData, ...seasonalData], 6).catch(() => {
            // Ignore preload errors - not critical for functionality
          })
        }
      } catch (err) {
        setError('Failed to load featured anime. Please try again later.')
        // Log error details only in development
        if (process.env.NODE_ENV === 'development') {
        }
      } finally {
        setLoading(false)
      }
    }

    loadFeaturedAnime()
  }, [])



  const sections = [
    {
      title: 'Top Rated Anime',
      icon: <Trophy className="text-yellow-500" size={24} />,
      data: featuredAnime,
      loading: loading,
      error: error
    },
    {
      title: 'Popular This Season',
      icon: <Calendar className="text-blue-500" size={24} />,
      data: seasonalAnime,
      loading: loading,
      error: error
    }
  ]

  return (
    <Box
      py={{ initial: '2', md: '4' }}
      style={{
        backgroundColor: '#0f172a'
      }}
    >
      <Container size="4" px="2">
        {sections.map((section, index) => (
          <Box key={index} mb={{ initial: '2', md: '4' }}>
            {/* Section Header with divider */}
            <Flex align="center" justify="between" mb={{ initial: '5', md: '6' }}>
              <Flex align="center" gap="3">
                {section.icon}
                <Text
                  size={{ initial: '5', md: '6' }}
                  weight="bold"
                  style={{ color: 'white' }}
                >
                  {section.title}
                </Text>
              </Flex>
              <Link
                href={section.title === 'Top Rated Anime' ? '/top-rated' : '/trending'}
                passHref
              >
                <Button variant="ghost" size="2" style={{ color: '#3b82f6' }}>
                  <Flex align="center" gap="2">
                    <Text size="2" weight="medium" style={{ color: '#cbd5e1' }}>View All</Text>
                    <ChevronRight size={16} style={{ color: '#cbd5e1' }} />
                  </Flex>
                </Button>
              </Link>
            </Flex>

            {/* Anime Grid */}
            <AnimeGrid
              animeList={section.data}
              loading={section.loading}
              error={section.error}
            />

            {/* Section divider */}
            <Separator my={{ initial: '2', md: '4' }} size="4" style={{ backgroundColor: '#1e293b' }} />
          </Box>
        ))}

        {/* Call to Action */}
        <Box style={{ textAlign: 'center' }} py={{ initial: '1', md: '2' }}>
          <Box
            p={{ initial: '4', md: '6' }}
            style={{
              borderRadius: 'var(--radius-5)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              color: 'white',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}
          >
            <Text
              as="p"
              size={{ initial: '5', md: '6' }}
              weight="bold"
              mb="4"
            >
              Ready to explore more anime?
            </Text>
            <Text as="p" size="4" mb="6" style={{ color: '#cbd5e1' }}>
              Join thousands of anime fans and discover your next favorite series.
            </Text>
            <Link href="/Explore" passHref>
              <Button
                size="3"
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              >
                Browse All Anime
              </Button>
            </Link>
          </Box>
        </Box>
      </Container>

    </Box>
  )
}

export default FeaturedSection