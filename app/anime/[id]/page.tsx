'use client'
import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { fetchAnimeById, fetchAnimeCharacters, AnimeData, CharacterData, getImageUrl, formatScore, formatDate } from '@/lib/api'
import { ArrowLeft, Star, Calendar, Clock, PlayCircle, Info, Heart, Share2, ChevronDown, ChevronUp, Users } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import CharacterCard from '@/components/CharacterCard'
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

    // All hooks must be called before any conditional returns
    const [anime, setAnime] = useState<AnimeData | null>(null)
    const [characters, setCharacters] = useState<CharacterData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [synopsisExpanded, setSynopsisExpanded] = useState(false)
    const [isClient, setIsClient] = useState(false)

    // Utility function to truncate text
    const truncateText = (text: string, maxLength: number = 300) => {
        if (text.length <= maxLength) return text
        return text.substring(0, maxLength).trim() + '...'
    }

    // Ensure component only renders on client
    useEffect(() => {
        setIsClient(true)
    }, [])

    useEffect(() => {
        const loadAnimeDetails = async () => {
            if (!id) return

            try {
                setLoading(true)
                setError(null)
                const response = await fetchAnimeById(parseInt(id))
                setAnime(response.data)

                // Fetch characters separately
                try {
                    const charactersResponse = await fetchAnimeCharacters(parseInt(id));

                    if (charactersResponse.data && charactersResponse.data.length > 0) {
                        setCharacters(charactersResponse.data.slice(0, 12)); // Limit to 12 characters
                    } else {
                        setCharacters([]);
                    }
                } catch (charErr) {
                    setCharacters([]); // Set empty array if character fetch fails
                }
            } catch (err) {
                setError('Failed to load anime details. Please try again.')
            } finally {
                setLoading(false)
            }
        }

        loadAnimeDetails()
    }, [id])

    // Don't render anything until we're on the client
    if (!isClient) {
        return (
            <div style={{ backgroundColor: '#0f172a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Skeleton width="200px" height="24px" />
            </div>
        )
    }

    if (loading) {
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
                            top: '15%',
                            left: '10%',
                            width: '50px',
                            height: '50px',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            borderRadius: '50%',
                            animation: 'float 3s ease-in-out infinite'
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            top: '70%',
                            right: '12%',
                            width: '35px',
                            height: '35px',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderRadius: '50%',
                            animation: 'float 4s ease-in-out infinite reverse'
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '25%',
                            left: '25%',
                            width: '25px',
                            height: '25px',
                            backgroundColor: 'rgba(251, 191, 36, 0.1)',
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
                        <PlayCircle size={48} style={{ color: '#10b981', animation: 'bounce 1.5s ease-in-out infinite' }} />
                    </div>

                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color: 'white',
                        marginBottom: '8px',
                        animation: 'fadeIn 1s ease-out'
                    }}>
                        Loading Anime Details
                    </h2>

                    <p style={{
                        color: '#cbd5e1',
                        fontSize: '0.875rem',
                        animation: 'fadeIn 1s ease-out 0.2s both'
                    }}>
                        Fetching detailed information and characters...
                    </p>

                    {/* Loading spinner */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: '24px'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            border: '3px solid rgba(51, 65, 85, 0.3)',
                            borderTop: '3px solid #10b981',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                    </div>

                    {/* Pulsing dots */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '8px',
                        marginTop: '20px'
                    }}>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            backgroundColor: '#10b981',
                            borderRadius: '50%',
                            animation: 'pulse 1.4s ease-in-out infinite'
                        }} />
                        <div style={{
                            width: '8px',
                            height: '8px',
                            backgroundColor: '#10b981',
                            borderRadius: '50%',
                            animation: 'pulse 1.4s ease-in-out infinite 0.2s'
                        }} />
                        <div style={{
                            width: '8px',
                            height: '8px',
                            backgroundColor: '#10b981',
                            borderRadius: '50%',
                            animation: 'pulse 1.4s ease-in-out infinite 0.4s'
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

                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }

                    @keyframes bounce {
                        0%, 20%, 50%, 80%, 100% {
                            transform: translateY(0);
                        }
                        40% {
                            transform: translateY(-10px);
                        }
                        60% {
                            transform: translateY(-5px);
                        }
                    }

                    @keyframes pulse {
                        0%, 80%, 100% {
                            opacity: 0.3;
                            transform: scale(1);
                        }
                        40% {
                            opacity: 1;
                            transform: scale(1.2);
                        }
                    }
                `}</style>
            </div>
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
                                        aspectRatio: '300/450',
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
                                <div style={{ position: 'relative' }}>
                                    <Text
                                        as="p"
                                        size="3"
                                        style={{
                                            color: '#cbd5e1',
                                            lineHeight: '1.6',
                                            marginBottom: anime.synopsis && anime.synopsis.length > 300 ? '1rem' : '0'
                                        }}
                                    >
                                        {anime.synopsis
                                            ? (synopsisExpanded ? anime.synopsis : truncateText(anime.synopsis))
                                            : 'No synopsis available.'
                                        }
                                    </Text>
                                    {anime.synopsis && anime.synopsis.length > 300 && (
                                        <Button
                                            variant="ghost"
                                            size="2"
                                            onClick={() => setSynopsisExpanded(!synopsisExpanded)}
                                            style={{
                                                color: '#3b82f6',
                                                padding: '0.25rem 0.5rem',
                                                fontSize: '0.875rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                                marginTop: '0.5rem'
                                            }}
                                        >
                                            {synopsisExpanded ? (
                                                <>
                                                    <ChevronUp size={14} />
                                                    Show Less
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown size={14} />
                                                    Read More
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </Box>

                            <Separator mb="6" style={{ backgroundColor: '#1e293b' }} />

                            {/* Additional Information */}
                            <Box mb="6">
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: 'white' }}>
                                    Statistics & Information
                                </div>

                                <Grid columns={{ initial: '1', sm: '2', lg: '3' }} gap="6">
                                    {/* Basic Info */}
                                    <Box>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#94a3b8' }}>
                                            Basic Information
                                        </div>
                                        <Flex direction="column" gap="3">
                                            {anime.aired?.from && (
                                                <Box>
                                                    <Text as="p" size="2" mb="1" style={{ color: '#64748b' }}>
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
                                                    <Text as="p" size="2" mb="1" style={{ color: '#64748b' }}>
                                                        Duration
                                                    </Text>
                                                    <Text as="p" size="3" style={{ color: 'white' }}>
                                                        {anime.duration}
                                                    </Text>
                                                </Box>
                                            )}

                                            {anime.season && anime.year && (
                                                <Box>
                                                    <Text as="p" size="2" mb="1" style={{ color: '#64748b' }}>
                                                        Season
                                                    </Text>
                                                    <Text as="p" size="3" style={{ color: 'white' }}>
                                                        {anime.season} {anime.year}
                                                    </Text>
                                                </Box>
                                            )}

                                            {anime.rating && (
                                                <Box>
                                                    <Text as="p" size="2" mb="1" style={{ color: '#64748b' }}>
                                                        Rating
                                                    </Text>
                                                    <Text as="p" size="3" style={{ color: 'white' }}>
                                                        {anime.rating}
                                                    </Text>
                                                </Box>
                                            )}
                                        </Flex>
                                    </Box>

                                    {/* Rankings & Stats */}
                                    <Box>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#94a3b8' }}>
                                            Rankings & Popularity
                                        </div>
                                        <Flex direction="column" gap="3">
                                            {anime.rank && (
                                                <Box>
                                                    <Text as="p" size="2" mb="1" style={{ color: '#64748b' }}>
                                                        Rank
                                                    </Text>
                                                    <Text as="p" size="3" style={{ color: '#fbbf24', fontWeight: 'bold' }}>
                                                        #{anime.rank}
                                                    </Text>
                                                </Box>
                                            )}

                                            {anime.popularity && (
                                                <Box>
                                                    <Text as="p" size="2" mb="1" style={{ color: '#64748b' }}>
                                                        Popularity
                                                    </Text>
                                                    <Text as="p" size="3" style={{ color: '#3b82f6', fontWeight: 'bold' }}>
                                                        #{anime.popularity}
                                                    </Text>
                                                </Box>
                                            )}

                                            {anime.score && (
                                                <Box>
                                                    <Text as="p" size="2" mb="1" style={{ color: '#64748b' }}>
                                                        Score
                                                    </Text>
                                                    <Flex align="center" gap="2">
                                                        <Star size={16} style={{ color: '#fbbf24' }} />
                                                        <Text as="p" size="3" style={{ color: 'white', fontWeight: 'bold' }}>
                                                            {formatScore(anime.score)}
                                                        </Text>
                                                        {anime.scored_by && (
                                                            <Text as="p" size="2" style={{ color: '#64748b' }}>
                                                                ({anime.scored_by.toLocaleString()} users)
                                                            </Text>
                                                        )}
                                                    </Flex>
                                                </Box>
                                            )}

                                            {anime.members && (
                                                <Box>
                                                    <Text as="p" size="2" mb="1" style={{ color: '#64748b' }}>
                                                        Members
                                                    </Text>
                                                    <Text as="p" size="3" style={{ color: 'white' }}>
                                                        {anime.members.toLocaleString()}
                                                    </Text>
                                                </Box>
                                            )}

                                            {typeof anime.favorites === 'number' && (
                                                <Box>
                                                    <Text as="p" size="2" mb="1" style={{ color: '#64748b' }}>
                                                        Favorites
                                                    </Text>
                                                    <Text as="p" size="3" style={{ color: '#ef4444' }}>
                                                        {anime.favorites.toLocaleString()} ♥
                                                    </Text>
                                                </Box>
                                            )}
                                        </Flex>
                                    </Box>

                                    {/* Episode Info */}
                                    <Box>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#94a3b8' }}>
                                            Episode Information
                                        </div>
                                        <Flex direction="column" gap="3">
                                            {anime.episodes && (
                                                <Box>
                                                    <Text as="p" size="2" mb="1" style={{ color: '#64748b' }}>
                                                        Episodes
                                                    </Text>
                                                    <Text as="p" size="3" style={{ color: 'white', fontWeight: 'bold' }}>
                                                        {anime.episodes}
                                                    </Text>
                                                </Box>
                                            )}

                                            <Box>
                                                <Text as="p" size="2" mb="1" style={{ color: '#64748b' }}>
                                                    Status
                                                </Text>
                                                <Badge
                                                    variant="soft"
                                                    style={{
                                                        backgroundColor: anime.status === 'Finished Airing' ? '#10b981' :
                                                            anime.status === 'Currently Airing' ? '#3b82f6' : '#f59e0b',
                                                        color: 'white',
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    {anime.status}
                                                </Badge>
                                            </Box>

                                            <Box>
                                                <Text as="p" size="2" mb="1" style={{ color: '#64748b' }}>
                                                    Type
                                                </Text>
                                                <Badge
                                                    variant="soft"
                                                    style={{
                                                        backgroundColor: '#1e293b',
                                                        color: '#3b82f6',
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    {anime.type}
                                                </Badge>
                                            </Box>
                                        </Flex>
                                    </Box>
                                </Grid>
                            </Box>

                            {/* Genres, Themes, and Demographics */}
                            <Box mb="6">
                                <div style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', color: 'white' }}>
                                    Categories
                                </div>

                                <Flex gap="6" direction={{ initial: 'column', md: 'row' }}>
                                    {/* Genres */}
                                    {anime.genres && anime.genres.length > 0 && (
                                        <Box style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#94a3b8' }}>
                                                Genres
                                            </div>
                                            <Flex gap="2" wrap="wrap">
                                                {anime.genres.map((genre) => (
                                                    <Badge key={genre.mal_id} variant="soft" style={{ backgroundColor: '#1e293b', color: '#3b82f6', fontSize: '0.75rem' }}>
                                                        {genre.name}
                                                    </Badge>
                                                ))}
                                            </Flex>
                                        </Box>
                                    )}

                                    {/* Themes */}
                                    {anime.themes && anime.themes.length > 0 && (
                                        <Box style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#94a3b8' }}>
                                                Themes
                                            </div>
                                            <Flex gap="2" wrap="wrap">
                                                {anime.themes.map((theme) => (
                                                    <Badge key={theme.mal_id} variant="soft" style={{ backgroundColor: '#1e293b', color: '#10b981', fontSize: '0.75rem' }}>
                                                        {theme.name}
                                                    </Badge>
                                                ))}
                                            </Flex>
                                        </Box>
                                    )}

                                    {/* Demographics */}
                                    {anime.demographics && anime.demographics.length > 0 && (
                                        <Box style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#94a3b8' }}>
                                                Demographics
                                            </div>
                                            <Flex gap="2" wrap="wrap">
                                                {anime.demographics.map((demo) => (
                                                    <Badge key={demo.mal_id} variant="soft" style={{ backgroundColor: '#1e293b', color: '#f59e0b', fontSize: '0.75rem' }}>
                                                        {demo.name}
                                                    </Badge>
                                                ))}
                                            </Flex>
                                        </Box>
                                    )}
                                </Flex>
                            </Box>

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

                            {/* Characters */}
                            {characters && characters.length > 0 && (
                                <Box mb="6">
                                    <Flex align="center" gap="2" mb="6">
                                        <Users size={20} style={{ color: '#3b82f6' }} />
                                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>
                                            Characters ({characters.length})
                                        </div>
                                    </Flex>
                                    <Grid columns={{ initial: '2', sm: '3', md: '4', lg: '4' }} gap="4">
                                        {characters.slice(0, 8).map((character, index) => (
                                            <CharacterCard key={`char_${index}`} character={character} />
                                        ))}
                                    </Grid>
                                    {characters.length > 8 && (
                                        <Box style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
                                            <Text size="3" style={{ color: '#94a3b8' }}>
                                                And {characters.length - 8} more characters...
                                            </Text>
                                        </Box>
                                    )}
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
