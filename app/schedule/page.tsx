'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import { AnimeCard } from '@/components/anime_cards'
import { fetchAnimeSchedule, getCurrentSeasonInfo, AnimeData } from '@/lib/api'
import { getNsfwPreference } from '@/lib/userPreferences'
import { getCache, setCache } from '@/lib/cache'
import { Box, Container, Flex, Text, Heading, Card, Grid, Badge } from '@radix-ui/themes'
import { Calendar, Clock, Info } from 'lucide-react'

interface DaySchedule {
    day: string
    displayName: string
    anime: AnimeData[]
    loading: boolean
}

const SchedulePage = () => {
    const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [seasonInfo, setSeasonInfo] = useState<{ year: number; season: string; displayName: string } | null>(null)
    const [todayInfo, setTodayInfo] = useState<string>('')
    const [initialLoadComplete, setInitialLoadComplete] = useState(false)

    // Days of the week for the schedule - will be reordered to start from today
    const baseDaysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

    // Get season information and today on component mount
    useEffect(() => {
        const seasonData = getCurrentSeasonInfo()
        setSeasonInfo(seasonData)

        // Get today's information
        const today = new Date()
        const dayName = today.toLocaleDateString('en-US', { weekday: 'long' })
        const dateString = today.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        setTodayInfo(`${dayName}, ${dateString}`)

        // Get today's day to start the weekly schedule from
        const todayDay = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
        const todayIndex = baseDaysOfWeek.indexOf(todayDay)
        const reorderedDays = [
            ...baseDaysOfWeek.slice(todayIndex),
            ...baseDaysOfWeek.slice(0, todayIndex)
        ]

        // Initialize weekly schedule structure
        const initialSchedule = reorderedDays.map((day) => {
            const displayName = day.charAt(0).toUpperCase() + day.slice(1);
            return {
                day,
                displayName,
                anime: [],
                loading: true
            };
        });
        setWeeklySchedule(initialSchedule);
    }, [])


    // Fetch weekly schedule data
    useEffect(() => {
        const fetchWeeklySchedule = async () => {
            if (!seasonInfo) return

            setLoading(true)
            setError(null)

            const includeNsfw = getNsfwPreference()

            // Helper to process items in batches to avoid rate-limiting
            const processInBatches = async (items: DaySchedule[], batchSize: number, delay: number) => {
                let results: DaySchedule[] = []
                for (let i = 0; i < items.length; i += batchSize) {
                    const batch = items.slice(i, i + batchSize)
                    const batchPromises = batch.map(async daySchedule => {
                        const cacheKey = `schedule_${daySchedule.day}_${includeNsfw}`
                        const cachedData = getCache(cacheKey)

                        if (cachedData) {
                            return {
                                ...daySchedule,
                                anime: cachedData,
                                loading: false
                            }
                        }

                        try {
                            const response = await fetchAnimeSchedule(daySchedule.day, includeNsfw)
                            setCache(cacheKey, response.data)
                            return {
                                ...daySchedule,
                                anime: response.data,
                                loading: false
                            }
                        } catch (error) {
                            console.error(`Failed to load schedule for ${daySchedule.day}:`, error)
                            return {
                                ...daySchedule,
                                anime: [],
                                loading: false
                            }
                        }
                    })
                    results = results.concat(await Promise.all(batchPromises))

                    if (i + batchSize < items.length) {
                        // Only delay if the next batch is not fully cached
                        const nextBatch = items.slice(i + batchSize, i + 2 * batchSize)
                        const isNextBatchCached = nextBatch.every(
                            d => !!getCache(`schedule_${d.day}_${includeNsfw}`)
                        )
                        if (!isNextBatchCached) {
                            await new Promise(res => setTimeout(res, delay))
                        }
                    }
                }
                return results
            }

            try {
                // Process in batches of 3 with a 1-second delay between batches
                const updatedSchedule = await processInBatches(weeklySchedule, 3, 1000)
                setWeeklySchedule(updatedSchedule)
            } catch (err) {
                setError('Failed to load weekly schedule. Please try again.')
                setWeeklySchedule(currentSchedule =>
                    currentSchedule.map(day => ({ ...day, loading: false }))
                )
            } finally {
                setLoading(false)
            }
        }

        // Fetch only when the schedule is initialized and needs loading.
        // This check prevents re-fetching after the initial load.
        if (weeklySchedule.length > 0 && weeklySchedule.some(day => day.loading)) {
            fetchWeeklySchedule()
        }
    }, [seasonInfo, weeklySchedule])

    // Track initial load completion
    useEffect(() => {
        if (seasonInfo && !loading) {
            setInitialLoadComplete(true)
        }
    }, [seasonInfo, loading])

    // Show loading screen until initial data is loaded
    if (!initialLoadComplete) {
        return (
            <>
                <Header />
                <main
                    style={{
                        backgroundColor: '#0f172a',
                        minHeight: '100vh',
                        paddingTop: '5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Container size="4" px="4" py={{ initial: '12', md: '10' }}>
                        <Box style={{ textAlign: 'center' }}>
                            <Flex align="center" justify="center" gap="3" mb="4">
                                <Clock size={32} style={{ color: '#3b82f6' }} />
                                <Heading as="h2" size="6" style={{ color: 'white' }}>
                                    Loading Anime Schedule
                                </Heading>
                                <Clock size={32} style={{ color: '#3b82f6' }} />
                            </Flex>
                            <Text as="p" size="4" style={{ color: '#cbd5e1' }}>
                                Please wait while we fetch the latest anime schedule...
                            </Text>
                            <Box mt="6">
                                <div style={{
                                    width: '200px',
                                    height: '4px',
                                    backgroundColor: '#334155',
                                    borderRadius: '2px',
                                    margin: '0 auto',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: '100%',
                                        height: '100%',
                                        backgroundColor: '#3b82f6',
                                        borderRadius: '2px',
                                        animation: 'loading 2s ease-in-out infinite'
                                    }} />
                                </div>
                            </Box>
                        </Box>
                    </Container>
                    <style jsx global>{`
                        @keyframes loading {
                            0% { transform: translateX(-100%); }
                            50% { transform: translateX(0%); }
                            100% { transform: translateX(100%); }
                        }
                    `}</style>
                </main>
                <Footer />
            </>
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
            animation: fadeInUp 0.6s ease-out;
          }

          .anime-grid-enter {
            animation: fadeInUp 0.4s ease-out 0.2s both;
          }
        `}</style>

                <Container size="4" px="4" py={{ initial: '12', md: '10' }} className="page-enter">
                    {/* Page Header */}
                    <Box mb="8" style={{ textAlign: 'center' }}>
                        <Flex align="center" justify="center" gap="2" mb="4">
                            <Calendar size={32} style={{ color: '#3b82f6' }} />
                            <h1 style={{
                                fontSize: 'var(--font-size-8)',
                                fontWeight: 'bold',
                                color: 'white',
                                margin: 0
                            }}>
                                Anime Schedule
                            </h1>
                            <Calendar size={32} style={{ color: '#3b82f6' }} />
                        </Flex>
                        <Text as="p" size="4" style={{ color: '#cbd5e1', maxWidth: '600px', margin: '0 auto' }}>
                            Anime schedule starting from today - {todayInfo}
                        </Text>
                    </Box>

                    {/* Season Information */}
                    {seasonInfo && (
                        <Box mb="6" style={{ textAlign: 'center' }}>
                            <Flex align="center" justify="center" gap="2" mb="2">
                                <Info size={20} style={{ color: '#3b82f6' }} />
                                <Text as="p" size="3" style={{ color: '#cbd5e1' }}>
                                    Current Season: {seasonInfo.displayName} {seasonInfo.year}
                                </Text>
                            </Flex>
                        </Box>
                    )}


                    {/* Weekly Schedule Section */}
                    <Box mb="8">
                        <Box mb="6" style={{ textAlign: 'center' }}>
                            <Heading as="h2" size="6" style={{ color: 'white' }}>
                                Weekly Schedule
                            </Heading>
                            <Text as="p" size="3" style={{ color: '#cbd5e1' }}>
                                Anime airing throughout the week
                            </Text>
                        </Box>

                        {error && (
                            <Box style={{ textAlign: 'center' }} py="8">
                                <Text as="p" size="3" style={{ color: '#ef4444' }}>
                                    {error}
                                </Text>
                            </Box>
                        )}

                        <Flex direction="column" gap="8">
                            {weeklySchedule.map((daySchedule, index) => (
                                index === 0 ? (
                                    // Today's section (integrated with rest of page)
                                    <Box
                                        key={daySchedule.day}
                                        mb="8"
                                    >
                                        <Flex align="center" gap="3" mb="6">
                                            <Heading as="h2" size="7" style={{ color: 'white', fontWeight: 'bold' }}>
                                                Airing Today
                                            </Heading>
                                            <Calendar size={36} style={{ color: '#3b82f6' }} />
                                        </Flex>

                                        <Text as="p" size="5" mb="8" style={{ color: '#cbd5e1', maxWidth: '600px' }}>
                                            Fresh episodes from your favorite shows are dropping today
                                        </Text>

                                        {daySchedule.loading ? (
                                            <Grid columns={{ initial: '2', sm: '2', md: '3', lg: '4' }} gap="6" style={{ maxWidth: '1200px' }}>
                                                {Array.from({ length: 4 }).map((_, index) => (
                                                    <Card key={index} style={{ overflow: 'hidden', backgroundColor: '#1e293b', border: '1px solid #334155' }}>
                                                        <Box style={{ aspectRatio: '2/3', backgroundColor: '#334155' }} />
                                                        <Box p="3" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                            <Box style={{ height: '16px', backgroundColor: '#334155', borderRadius: '4px' }} />
                                                            <Box style={{ height: '12px', backgroundColor: '#334155', borderRadius: '4px', width: '75%' }} />
                                                        </Box>
                                                    </Card>
                                                ))}
                                            </Grid>
                                        ) : daySchedule.anime.length > 0 ? (
                                            <Grid columns={{ initial: '2', sm: '2', md: '3', lg: '4' }} gap="6" style={{ maxWidth: '1200px' }}>
                                                {daySchedule.anime.map((anime, animeIndex) => (
                                                    <Box key={`${anime.mal_id}-${animeIndex}`}>
                                                        <AnimeCard anime={anime} priority={true} />
                                                    </Box>
                                                ))}
                                            </Grid>
                                        ) : (
                                            <Box
                                                style={{
                                                    textAlign: 'center',
                                                    padding: '3rem 1rem',
                                                    backgroundColor: '#1e293b',
                                                    border: '1px solid #334155',
                                                    borderRadius: '8px',
                                                    maxWidth: '60px',
                                                    margin: '0 auto'
                                                }}
                                            >
                                                <Text as="p" size="4" style={{ color: '#cbd5e1' }}>
                                                    No anime scheduled for today
                                                </Text>
                                            </Box>
                                        )}
                                    </Box>
                                ) : (
                                    // Regular days
                                    <Box key={daySchedule.day}>
                                        <Flex align="center" gap="3" mb="4">
                                            <Heading as="h3" size="5" style={{ color: 'white' }}>
                                                {daySchedule.displayName}
                                            </Heading>
                                            <Badge
                                                variant="soft"
                                                style={{
                                                    backgroundColor: '#3b82f6',
                                                    color: 'white'
                                                }}
                                            >
                                                {daySchedule.anime.length} anime
                                            </Badge>
                                        </Flex>

                                        {daySchedule.loading ? (
                                            <Grid columns={{ initial: '2', sm: '3', md: '4', lg: '5' }} gap="4">
                                                {Array.from({ length: 5 }).map((_, index) => (
                                                    <Card key={index} style={{ overflow: 'hidden', backgroundColor: '#1e293b', border: '1px solid #334155' }}>
                                                        <Box style={{ aspectRatio: '3/4', backgroundColor: '#334155' }} />
                                                        <Box p="3" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                            <Box style={{ height: '16px', backgroundColor: '#334155', borderRadius: '4px' }} />
                                                            <Box style={{ height: '12px', backgroundColor: '#334155', borderRadius: '4px', width: '75%' }} />
                                                        </Box>
                                                    </Card>
                                                ))}
                                            </Grid>
                                        ) : daySchedule.anime.length > 0 ? (
                                            <Box style={{
                                                overflowX: 'auto',
                                                paddingBottom: '8px',
                                                scrollbarWidth: 'thin',
                                                scrollbarColor: '#334155 transparent'
                                            }}>
                                                <Flex gap="4" style={{
                                                    width: 'max-content',
                                                    minWidth: '100%'
                                                }}>
                                                    {daySchedule.anime.map((anime, animeIndex) => (
                                                        <Box
                                                            key={`${anime.mal_id}-${animeIndex}`}
                                                            style={{
                                                                width: '200px',
                                                                flexShrink: 0
                                                            }}
                                                        >
                                                            <AnimeCard anime={anime} priority={false} />
                                                        </Box>
                                                    ))}
                                                </Flex>
                                            </Box>
                                        ) : (
                                            <Box
                                                style={{
                                                    textAlign: 'center',
                                                    padding: '32px',
                                                    backgroundColor: '#1e293b',
                                                    border: '1px solid #334155',
                                                    borderRadius: '8px'
                                                }}
                                            >
                                                <Text as="p" size="3" style={{ color: '#64748b' }}>
                                                    No anime scheduled for {daySchedule.day}
                                                </Text>
                                            </Box>
                                        )}
                                    </Box>
                                )
                            ))}
                        </Flex>
                    </Box>
                </Container>
            </main>
            <Footer />
        </>
    )
}

export default SchedulePage