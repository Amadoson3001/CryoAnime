'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import { AnimeGrid } from '@/components/anime_cards'
import { fetchMovies, AnimeData, AnimeResponse } from '@/lib/api'
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
            if (isInitialLoad) {
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
        fetchMoviesData(1, sort, order)
    }

    // Handle page change
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            fetchMoviesData(page, sortBy, sortOrder)
            // Smooth scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
    }

    // Render pagination
    const renderPagination = () => {
        if (totalPages <= 1) return null

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
                disabled={currentPage === 1 || loading}
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
                    disabled={loading}
                    style={{
                        backgroundColor: currentPage === i ? '#3b82f6' : '#1e293b',
                        color: currentPage === i ? 'white' : '#cbd5e1',
                        border: '1px solid #334155',
                        minWidth: '40px',
                        cursor: loading ? 'not-allowed' : 'pointer'
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
                disabled={currentPage === totalPages || !hasNextPage || loading}
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

                <style jsx global>{`
                    @keyframes float {
                        0%, 100% { transform: translateY(0px) rotate(0deg); }
                        50% { transform: translateY(-20px) rotate(180deg); }
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

                    @keyframes bounce {
                        0%, 20%, 50%, 80%, 100% {
                            transform: translateY(0);
                        }
                        40% {
                            transform: translateY(-8px);
                        }
                        60% {
                            transform: translateY(-4px);
                        }
                    }

                    @keyframes filmStrip {
                        0%, 100% {
                            opacity: 0.3;
                            transform: scaleY(1);
                        }
                        50% {
                            opacity: 1;
                            transform: scaleY(1.2);
                        }
                    }

                    @keyframes dots {
                        0%, 80%, 100% {
                            opacity: 0.3;
                            transform: scale(1);
                        }
                        40% {
                            opacity: 1;
                            transform: scale(1.3);
                        }
                    }
                `}</style>
            </div>
        )
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
                    <Box>
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