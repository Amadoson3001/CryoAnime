'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import Pagination from '@/components/Pagination'
import { AnimeGrid } from '@/components/anime_cards'
import { fetchMovies, AnimeData, AnimeResponse } from '@/lib/api'
import { getNsfwPreference } from '@/lib/userPreferences'
import {
    Container,
    Flex,
    Box,
    Text,
    Button,
    DropdownMenu
} from '@radix-ui/themes'
import { ChevronDown } from 'lucide-react'

const MoviesPage = () => {
    const [animeList, setAnimeList] = useState<AnimeData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [hasNextPage, setHasNextPage] = useState(false)
    const [sortBy, setSortBy] = useState('popularity') // Default sort by popularity
    const [sortOrder, setSortOrder] = useState('desc') // Default descending order
    const [isInitialLoad, setIsInitialLoad] = useState(true)
    const isInitialLoadRef = useRef(true)

    const itemsPerPage = 24

    // Fetch movies when sort options change or page changes
    const fetchMoviesData = useCallback(async (page: number = 1, sort: string = sortBy, order: string = sortOrder) => {
        try {
            setLoading(true)
            setError(null)

            const includeNsfw = getNsfwPreference()
            const response: AnimeResponse = await fetchMovies(page, itemsPerPage, includeNsfw, sort, order)

            setAnimeList(response.data)
            setTotalPages(response.pagination.last_visible_page)
            setHasNextPage(response.pagination.has_next_page)
            setCurrentPage(page)

            // Add a small delay for better UX on initial load
            if (isInitialLoadRef.current) {
                isInitialLoadRef.current = false
                setTimeout(() => {
                    setIsInitialLoad(false)
                }, 300)
            }
        } catch (err) {
            setError('Failed to load movies. Please try again.')
        } finally {
            setLoading(false)
        }
    }, [sortBy, sortOrder])

    // Initial load
    useEffect(() => {
        fetchMoviesData(1, sortBy, sortOrder)
    }, [fetchMoviesData, sortBy, sortOrder])

    // Handle sort change
    const handleSortChange = (sort: string, order: string) => {
        setSortBy(sort)
        setSortOrder(order)
    }

    // Handle page change
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            fetchMoviesData(page, sortBy, sortOrder)
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
                            top: '20%',
                            left: '12%',
                            width: '50px',
                            height: '50px',
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            borderRadius: '50%',
                            animation: 'float 3s ease-in-out infinite'
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            top: '65%',
                            right: '15%',
                            width: '40px',
                            height: '40px',
                            backgroundColor: 'rgba(168, 85, 247, 0.1)',
                            borderRadius: '50%',
                            animation: 'float 4s ease-in-out infinite reverse'
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '30%',
                            left: '25%',
                            width: '30px',
                            height: '30px',
                            backgroundColor: 'rgba(236, 72, 153, 0.1)',
                            borderRadius: '50%',
                            animation: 'float 2.5s ease-in-out infinite'
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
                        <div style={{
                            fontSize: '48px',
                            animation: 'bounce 1.5s ease-in-out infinite',
                            color: '#10b981'
                        }}>
                            🎬
                        </div>
                    </div>

                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: 'white',
                        marginBottom: '8px',
                        animation: 'fadeIn 1s ease-out'
                    }}>
                        Loading Anime Movies
                    </h2>

                    <p style={{
                        color: '#cbd5e1',
                        fontSize: '0.875rem',
                        animation: 'fadeIn 1s ease-out 0.2s both'
                    }}>
                        Discovering cinematic anime masterpieces...
                    </p>

                    {/* Film strip animation */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: '24px',
                        gap: '2px'
                    }}>
                        <div style={{
                            width: '4px',
                            height: '30px',
                            backgroundColor: '#10b981',
                            borderRadius: '1px',
                            animation: 'filmStrip 1.5s ease-in-out infinite'
                        }} />
                        <div style={{
                            width: '4px',
                            height: '30px',
                            backgroundColor: '#10b981',
                            borderRadius: '1px',
                            animation: 'filmStrip 1.5s ease-in-out infinite 0.1s'
                        }} />
                        <div style={{
                            width: '4px',
                            height: '30px',
                            backgroundColor: '#10b981',
                            borderRadius: '1px',
                            animation: 'filmStrip 1.5s ease-in-out infinite 0.2s'
                        }} />
                        <div style={{
                            width: '4px',
                            height: '30px',
                            backgroundColor: '#10b981',
                            borderRadius: '1px',
                            animation: 'filmStrip 1.5s ease-in-out infinite 0.3s'
                        }} />
                        <div style={{
                            width: '4px',
                            height: '30px',
                            backgroundColor: '#10b981',
                            borderRadius: '1px',
                            animation: 'filmStrip 1.5s ease-in-out infinite 0.4s'
                        }} />
                        <div style={{
                            width: '4px',
                            height: '30px',
                            backgroundColor: '#10b981',
                            borderRadius: '1px',
                            animation: 'filmStrip 1.5s ease-in-out infinite 0.5s'
                        }} />
                    </div>

                    {/* Loading dots */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '6px',
                        marginTop: '20px'
                    }}>
                        <div style={{
                            width: '6px',
                            height: '6px',
                            backgroundColor: '#10b981',
                            borderRadius: '50%',
                            animation: 'dots 1.4s ease-in-out infinite'
                        }} />
                        <div style={{
                            width: '6px',
                            height: '6px',
                            backgroundColor: '#10b981',
                            borderRadius: '50%',
                            animation: 'dots 1.4s ease-in-out infinite 0.2s'
                        }} />
                        <div style={{
                            width: '6px',
                            height: '6px',
                            backgroundColor: '#10b981',
                            borderRadius: '50%',
                            animation: 'dots 1.4s ease-in-out infinite 0.4s'
                        }} />
                        <div style={{
                            width: '6px',
                            height: '6px',
                            backgroundColor: '#10b981',
                            borderRadius: '50%',
                            animation: 'dots 1.4s ease-in-out infinite 0.6s'
                        }} />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            <Header />
            <main style={{ backgroundColor: '#0f172a', minHeight: '100vh', paddingTop: '5rem' }}>
                <Container size="4" px="3" py={{ initial: '12', md: '10' }} className="page-enter">
                    {/* Page Header */}
                    <Box mb="8" style={{ textAlign: 'center' }}>
                        <h1 style={{
                            fontSize: 'var(--font-size-8)',
                            fontWeight: 'bold',
                            color: 'white',
                            margin: '0 0 1rem 0'
                        }}>
                            Anime Movies
                        </h1>
                        <Text as="p" size="4" style={{ color: '#cbd5e1', maxWidth: '600px', margin: '0 auto' }}>
                            Discover the best anime movies with advanced sorting and filtering options
                        </Text>
                    </Box>

                    {/* Controls Row */}
                    <Flex mb="8" justify="center">
                        {/* Sort Selector */}
                        <Box style={{ minWidth: '300px', flex: '1 1 300px' }}>
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
                    {!loading && !error && animeList.length > 0 && (
                        <Box mb="6" style={{ textAlign: 'center' }}>
                            <Text as="p" size="2" style={{ color: '#94a3b8' }}>
                                Showing page {currentPage} of {totalPages} • {animeList.length} movies
                            </Text>
                        </Box>
                    )}

                    {/* Anime Grid */}
                    <Box className="anime-grid-enter" key={`grid-${currentPage}`}>
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

                    {/* Empty State */}
                    {!loading && !error && animeList.length === 0 && (
                        <Box style={{ textAlign: 'center', padding: '2rem' }}>
                            <Text as="p" size="4" style={{ color: '#94a3b8' }}>
                                No movies found. Please try adjusting your filters.
                            </Text>
                        </Box>
                    )}
                </Container>
            </main>
            <Footer />
        </>
    )
}

export default MoviesPage
