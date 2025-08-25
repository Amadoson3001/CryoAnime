'use client'
import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import { fetchAnimeById, AnimeData, getImageUrl, formatScore, formatDate } from '@/lib/api'
import { ArrowLeft, Star, Calendar, Clock, PlayCircle, Info, Heart, Share2 } from 'lucide-react'
import Link from 'next/link'
import {
    Box,
    Container,
    Flex,
    Text,
    Badge,
    Button,
    Separator,
    Skeleton,
    Grid
} from '@radix-ui/themes'

const AnimeDetailsPage = () => {
    const params = useParams()
    const id = params.id as string

    const [anime, setAnime] = useState<AnimeData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const loadAnimeDetails = async () => {
            if (!id) return

            try {
                setLoading(true)
                setError(null)
                const response = await fetchAnimeById(parseInt(id))
                setAnime(response.data)
            } catch (err) {
                setError('Failed to load anime details. Please try again.')
                console.error('Error loading anime details:', err)
            } finally {
                setLoading(false)
            }
        }

        loadAnimeDetails()
    }, [id])

    if (loading) {
        return (
            <>
                <Header />
                <main style={{ backgroundColor: '#0f172a', minHeight: '100vh' }}>
                    <Container size="4" px="4" py="8">
                        <Box mb="6">
                            <Button variant="ghost" asChild>
                                <Link href="/" style={{ color: '#3b82f6' }}>
                                    <ArrowLeft size={20} />
                                    Back to Home
                                </Link>
                            </Button>
                        </Box>

                        {/* Loading skeleton */}
                        <Flex gap="8" direction={{ initial: 'column', md: 'row' }}>
                            {/* Image skeleton */}
                            <Box style={{ flex: '0 0 300px' }}>
                                <Skeleton width="300px" height="450px" style={{ borderRadius: 'var(--radius-3)' }} />
                            </Box>

                            {/* Content skeleton */}
                            <Box style={{ flex: 1 }}>
                                <Skeleton width="60%" height="32px" mb="4" />
                                <Skeleton width="40%" height="24px" mb="6" />

                                <Flex gap="4" mb="6">
                                    <Skeleton width="80px" height="32px" />
                                    <Skeleton width="80px" height="32px" />
                                    <Skeleton width="80px" height="32px" />
                                </Flex>

                                <Skeleton width="100%" height="120px" mb="6" />

                                <Flex gap="4" mb="4">
                                    <Skeleton width="100px" height="20px" />
                                    <Skeleton width="100px" height="20px" />
                                    <Skeleton width="100px" height="20px" />
                                </Flex>

                                <Skeleton width="150px" height="20px" mb="6" />

                                <Skeleton width="100%" height="200px" />
                            </Box>
                        </Flex>
                    </Container>
                </main>
                <Footer />
            </>
        )
    }

    if (error || !anime) {
        return (
            <>
                <Header />
                <main style={{ backgroundColor: '#0f172a', minHeight: '100vh' }}>
                    <Container size="4" px="4" py="8">
                        <Box mb="6">
                            <Button variant="ghost" asChild>
                                <Link href="/" style={{ color: '#3b82f6' }}>
                                    <ArrowLeft size={20} />
                                    Back to Home
                                </Link>
                            </Button>
                        </Box>

                        <Box style={{ textAlign: 'center' }} py="12">
                            <Box
                                style={{
                                    backgroundColor: '#fee2e2',
                                    border: '1px solid #fecaca',
                                    borderRadius: 'var(--radius-3)',
                                    padding: 'var(--space-6)',
                                    maxWidth: '400px',
                                    margin: '0 auto'
                                }}
                            >
                                <Text as="p" size="3" weight="bold" mb="2" style={{ color: '#b91c1c' }}>
                                    {error || 'Anime not found'}
                                </Text>
                                <Text as="p" size="2" style={{ color: '#dc2626' }}>
                                    {error ? 'Please try again later.' : 'The anime you\'re looking for doesn\'t exist.'}
                                </Text>
                            </Box>
                        </Box>
                    </Container>
                </main>
                <Footer />
            </>
        )
    }

    const imageUrl = getImageUrl(anime)

    return (
        <>
            <Header />
            <main style={{ backgroundColor: '#0f172a', minHeight: '100vh', paddingTop: '5rem' }}>
                <Container size="4" px="4" py={{ initial: '12', md: '10' }}>
                    {/* Back button */}
                    <Box mb="6">
                        <Button variant="ghost" asChild>
                            <Link href="/" style={{ color: '#3b82f6' }}>
                                <ArrowLeft size={20} />
                                Back to Home
                            </Link>
                        </Button>
                    </Box>

                    <Flex gap="8" direction={{ initial: 'column', md: 'row' }}>
                        {/* Anime Image */}
                        <Box style={{ flex: '0 0 300px' }}>
                            <Box
                                style={{
                                    position: 'relative',
                                    borderRadius: 'var(--radius-3)',
                                    overflow: 'hidden',
                                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
                                }}
                            >
                                <Image
                                    src={imageUrl}
                                    alt={anime.title}
                                    width={300}
                                    height={450}
                                    style={{
                                        width: '100%',
                                        height: 'auto',
                                        objectFit: 'cover'
                                    }}
                                />
                                {anime.trailer?.embed_url && (
                                    <Button
                                        variant="soft"
                                        style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                            color: 'white',
                                            borderRadius: '50%',
                                            width: '60px',
                                            height: '60px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        onClick={() => window.open(anime.trailer!.embed_url!, '_blank')}
                                    >
                                        <PlayCircle size={32} />
                                    </Button>
                                )}
                            </Box>

                            {/* Action buttons */}
                            <Flex gap="3" mt="4">
                                <Button style={{ flex: 1, backgroundColor: '#ef4444', color: 'white' }}>
                                    <Heart size={16} />
                                    Add to Favorites
                                </Button>
                                <Button variant="soft" style={{ backgroundColor: '#1e293b', color: 'white' }}>
                                    <Share2 size={16} />
                                    Share
                                </Button>
                            </Flex>
                        </Box>

                        {/* Anime Details */}
                        <Box style={{ flex: 1 }}>
                            {/* Title */}
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'white' }}>
                                {anime.title_english || anime.title}
                            </div>

                            {anime.title_english && anime.title !== anime.title_english && (
                                <Text as="p" size="4" mb="4" style={{ color: '#94a3b8' }}>
                                    {anime.title}
                                </Text>
                            )}

                            {/* Rating and basic info */}
                            <Flex align="center" gap="4" mb="6" wrap="wrap">
                                {anime.score && (
                                    <Flex align="center" gap="2">
                                        <Star size={20} style={{ color: '#fbbf24' }} />
                                        <Text size="4" weight="bold" style={{ color: 'white' }}>
                                            {formatScore(anime.score)}
                                        </Text>
                                    </Flex>
                                )}

                                <Badge variant="soft" style={{ backgroundColor: '#1e293b', color: '#3b82f6' }}>
                                    {anime.type}
                                </Badge>

                                {anime.episodes && (
                                    <Badge variant="soft" style={{ backgroundColor: '#1e293b', color: '#10b981' }}>
                                        {anime.episodes} episodes
                                    </Badge>
                                )}

                                <Badge variant="soft" style={{ backgroundColor: '#1e293b', color: '#f59e0b' }}>
                                    {anime.status}
                                </Badge>
                            </Flex>

                            {/* Synopsis */}
                            <Box mb="6">
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem', color: 'white' }}>
                                    Synopsis
                                </div>
                                <Text as="p" size="3" style={{ color: '#cbd5e1', lineHeight: '1.6' }}>
                                    {anime.synopsis || 'No synopsis available.'}
                                </Text>
                            </Box>

                            <Separator mb="6" style={{ backgroundColor: '#1e293b' }} />

                            {/* Additional Information */}
                            <Box mb="6">
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: 'white' }}>
                                    Information
                                </div>

                                <Grid columns="2" gap="4">
                                    {anime.aired?.from && (
                                        <Box>
                                            <Text as="p" size="2" mb="1" style={{ color: '#94a3b8' }}>
                                                Aired
                                            </Text>
                                            <Text as="p" size="3" style={{ color: 'white' }}>
                                                {formatDate(anime.aired.from)}
                                                {anime.aired.to && ` to ${formatDate(anime.aired.to)}`}
                                            </Text>
                                        </Box>
                                    )}

                                    {anime.duration && (
                                        <Box>
                                            <Text as="p" size="2" mb="1" style={{ color: '#94a3b8' }}>
                                                Duration
                                            </Text>
                                            <Text as="p" size="3" style={{ color: 'white' }}>
                                                {anime.duration}
                                            </Text>
                                        </Box>
                                    )}

                                    {anime.season && anime.year && (
                                        <Box>
                                            <Text as="p" size="2" mb="1" style={{ color: '#94a3b8' }}>
                                                Season
                                            </Text>
                                            <Text as="p" size="3" style={{ color: 'white' }}>
                                                {anime.season} {anime.year}
                                            </Text>
                                        </Box>
                                    )}

                                    {anime.rating && (
                                        <Box>
                                            <Text as="p" size="2" mb="1" style={{ color: '#94a3b8' }}>
                                                Rating
                                            </Text>
                                            <Text as="p" size="3" style={{ color: 'white' }}>
                                                {anime.rating}
                                            </Text>
                                        </Box>
                                    )}

                                    {anime.rank && (
                                        <Box>
                                            <Text as="p" size="2" mb="1" style={{ color: '#94a3b8' }}>
                                                Rank
                                            </Text>
                                            <Text as="p" size="3" style={{ color: 'white' }}>
                                                #{anime.rank}
                                            </Text>
                                        </Box>
                                    )}

                                    {anime.popularity && (
                                        <Box>
                                            <Text as="p" size="2" mb="1" style={{ color: '#94a3b8' }}>
                                                Popularity
                                            </Text>
                                            <Text as="p" size="3" style={{ color: 'white' }}>
                                                #{anime.popularity}
                                            </Text>
                                        </Box>
                                    )}
                                </Grid>
                            </Box>

                            {/* Genres */}
                            {anime.genres && anime.genres.length > 0 && (
                                <Box mb="6">
                                    <div style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.75rem', color: 'white' }}>
                                        Genres
                                    </div>
                                    <Flex gap="2" wrap="wrap">
                                        {anime.genres.map((genre) => (
                                            <Badge key={genre.mal_id} variant="soft" style={{ backgroundColor: '#1e293b', color: '#3b82f6' }}>
                                                {genre.name}
                                            </Badge>
                                        ))}
                                    </Flex>
                                </Box>
                            )}

                            {/* Studios */}
                            {anime.studios && anime.studios.length > 0 && (
                                <Box mb="6">
                                    <div style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.75rem', color: 'white' }}>
                                        Studios
                                    </div>
                                    <Flex gap="2" wrap="wrap">
                                        {anime.studios.map((studio) => (
                                            <Badge key={studio.mal_id} variant="soft" style={{ backgroundColor: '#1e293b', color: '#10b981' }}>
                                                {studio.name}
                                            </Badge>
                                        ))}
                                    </Flex>
                                </Box>
                            )}
                        </Box>
                    </Flex>
                </Container>
            </main>
            <Footer />
        </>
    )
}

export default AnimeDetailsPage