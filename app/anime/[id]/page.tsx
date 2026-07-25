import React from 'react'
import Image from 'next/image'
import { Metadata } from 'next'
import Link from 'next/link'
import {
    fetchAnimeById,
    fetchAnimeCharacters,
    getOptimizedImageUrl,
    formatScore,
    formatDate,
    CharacterWithRole
} from '@/lib/api'
import {
    ArrowLeft,
    Star,
    PlayCircle,
    Users,
    Tv,
    Globe,
    Music,
    Film,
    ExternalLink,
    Info,
    Calendar,
    Clock,
    Award,
    Hash,
    TrendingUp,
    Eye,
    Heart,
    Building2,
    Mic,
    Radio,
    BookOpen,
    Link as LinkIcon,
    Disc
} from 'lucide-react'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import CharacterGrid from '@/components/CharacterGrid'
import AnimeSynopsis from '@/components/anime/AnimeSynopsis'
import AnimeActionButtons from '@/components/anime/AnimeActionButtons'
import {
    Box,
    Container,
    Flex,
    Text,
    Badge,
    Button,
    Separator,
    Grid
} from '@radix-ui/themes'

interface PageProps {
    params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params
    const parsedId = parseInt(id, 10)
    if (isNaN(parsedId) || parsedId <= 0) {
        return { title: 'Invalid Anime ID - CryoAnime' }
    }
    try {
        const response = await fetchAnimeById(parsedId)
        const anime = response.data

        if (!anime) return { title: 'Anime Not Found - CryoAnime' }

        const title = anime.title_english || anime.title
        const description = anime.synopsis?.substring(0, 160) || `Learn everything about ${title} on CryoAnime.`
        const imageUrl = getOptimizedImageUrl(anime)

        return {
            title: `${title} - CryoAnime`,
            description,
            openGraph: {
                title: `${title} - CryoAnime`,
                description,
                images: [imageUrl],
                type: 'video.tv_show'
            },
            twitter: {
                card: 'summary_large_image',
                title: `${title} - CryoAnime`,
                description,
                images: [imageUrl],
            }
        }
    } catch {
        return { title: 'CryoAnime - Discover Anime' }
    }
}

export default async function AnimeDetailsPage({ params }: PageProps) {
    const { id } = await params
    const animeId = parseInt(id, 10)

    if (isNaN(animeId) || animeId <= 0) {
        return (
            <>
                <Header />
                <main style={{ backgroundColor: '#0f172a', minHeight: '100vh' }}>
                    <Container size="4" px="4" py="8">
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
                                    Invalid anime ID
                                </Text>
                                <Text as="p" size="2" style={{ color: '#dc2626' }}>
                                    The anime ID provided is not valid.
                                </Text>
                            </Box>
                        </Box>
                    </Container>
                </main>
                <Footer />
            </>
        )
    }

    const [animeResponse, charactersResponse] = await Promise.allSettled([
        fetchAnimeById(animeId),
        fetchAnimeCharacters(animeId)
    ])

    const anime = animeResponse.status === 'fulfilled' ? animeResponse.value.data : null
    const characters = charactersResponse.status === 'fulfilled' ? charactersResponse.value.data : []

    if (!anime) {
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
                                    Anime not found
                                </Text>
                                <Text as="p" size="2" style={{ color: '#dc2626' }}>
                                    The anime you&apos;re looking for doesn&apos;t exist or there was an error fetching it.
                                </Text>
                            </Box>
                        </Box>
                    </Container>
                </main>
                <Footer />
            </>
        )
    }

    const imageUrl = getOptimizedImageUrl(anime)

    const mainCharacters = characters?.filter(
        (c: CharacterWithRole) => c.role === 'Main'
    ).sort((a, b) => (b.favorites || b.character.favorites || 0) - (a.favorites || a.character.favorites || 0)) || []

    const supportingCharacters = characters?.filter(
        (c: CharacterWithRole) => c.role !== 'Main'
    ).sort((a, b) => (b.favorites || b.character.favorites || 0) - (a.favorites || a.character.favorites || 0)) || []

    return (
        <>
            <Header />
            <main style={{ backgroundColor: '#0f172a', minHeight: '100vh', paddingTop: '5rem' }}>
                <Container size="4" px="4" py={{ initial: '12', md: '10' }} className="page-enter">
                    <Box mb="6">
                        <Button variant="ghost" asChild>
                            <Link href="/" style={{ color: '#3b82f6' }}>
                                <ArrowLeft size={20} />
                                Back to Home
                            </Link>
                        </Button>
                    </Box>

                    <Flex gap="8" direction={{ initial: 'column', md: 'row' }}>
                        {/* Left Column - Image & Actions */}
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
                                    priority
                                    style={{
                                        width: '100%',
                                        height: 'auto',
                                        aspectRatio: '300/450',
                                        objectFit: 'cover'
                                    }}
                                />
                                {anime.trailer?.embed_url && (
                                    <a
                                        href={anime.trailer.embed_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
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
                                            justifyContent: 'center',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <PlayCircle size={32} />
                                    </a>
                                )}
                            </Box>

                            <AnimeActionButtons anime={anime} />
                        </Box>

                        {/* Right Column - Details */}
                        <Box style={{ flex: 1 }}>
                            {/* Titles */}
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'white' }}>
                                {anime.title_english || anime.title}
                            </div>

                            {anime.title_english && anime.title !== anime.title_english && (
                                <Text as="p" size="4" mb="2" style={{ color: '#94a3b8' }}>
                                    {anime.title}
                                </Text>
                            )}

                            {anime.title_japanese && (
                                <Text as="p" size="3" mb="4" style={{ color: '#64748b' }}>
                                    {anime.title_japanese}
                                </Text>
                            )}

                            {anime.title_synonyms && anime.title_synonyms.length > 0 && (
                                <Text as="p" size="2" mb="4" style={{ color: '#475569' }}>
                                    Also known as: {anime.title_synonyms.join(', ')}
                                </Text>
                            )}

                            {/* Rating and Quick Stats */}
                            <Flex align="center" gap="4" mb="6" wrap="wrap">
                                {anime.score && (
                                    <Flex align="center" gap="2">
                                        <Star size={20} style={{ color: '#fbbf24' }} />
                                        <Text size="4" weight="bold" style={{ color: 'white' }}>
                                            {formatScore(anime.score)}
                                        </Text>
                                        {anime.scored_by && (
                                            <Text size="2" style={{ color: '#64748b' }}>
                                                ({anime.scored_by.toLocaleString('en-US')} votes)
                                            </Text>
                                        )}
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

                                {anime.rating && (
                                    <Badge variant="soft" style={{ backgroundColor: '#1e293b', color: '#f97316' }}>
                                        {anime.rating}
                                    </Badge>
                                )}
                            </Flex>

                            {/* Synopsis */}
                            <AnimeSynopsis synopsis={anime.synopsis} />

                            <Separator mb="6" style={{ backgroundColor: '#1e293b' }} />

                            {/* Genres */}
                            {anime.genres && anime.genres.length > 0 && (
                                <Box mb="5">
                                    <div style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.625rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                        <Hash size={14} style={{ color: '#3b82f6' }} />
                                        Genres
                                    </div>
                                    <Flex gap="2" wrap="wrap">
                                        {anime.genres.map((genre) => (
                                            <Badge key={`genre_${genre.mal_id}`} variant="soft" style={{ backgroundColor: '#1e293b', color: '#3b82f6' }}>
                                                {genre.name}
                                            </Badge>
                                        ))}
                                    </Flex>
                                </Box>
                            )}

                            {/* Themes */}
                            {anime.themes && anime.themes.length > 0 && (
                                <Box mb="5">
                                    <div style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.625rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                        <Hash size={14} style={{ color: '#10b981' }} />
                                        Themes
                                    </div>
                                    <Flex gap="2" wrap="wrap">
                                        {anime.themes.map((theme) => (
                                            <Badge key={`theme_${theme.mal_id}`} variant="soft" style={{ backgroundColor: '#1e293b', color: '#10b981' }}>
                                                {theme.name}
                                            </Badge>
                                        ))}
                                    </Flex>
                                </Box>
                            )}

                            {/* Demographics */}
                            {anime.demographics && anime.demographics.length > 0 && (
                                <Box mb="5">
                                    <div style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.625rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                        <Hash size={14} style={{ color: '#a855f7' }} />
                                        Demographics
                                    </div>
                                    <Flex gap="2" wrap="wrap">
                                        {anime.demographics.map((demo) => (
                                            <Badge key={`demo_${demo.mal_id}`} variant="soft" style={{ backgroundColor: '#1e293b', color: '#a855f7' }}>
                                                {demo.name}
                                            </Badge>
                                        ))}
                                    </Flex>
                                </Box>
                            )}

                            {/* Explicit Genres */}
                            {anime.explicit_genres && anime.explicit_genres.length > 0 && (
                                <Box mb="5">
                                    <div style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.625rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                        <Hash size={14} style={{ color: '#ef4444' }} />
                                        Explicit Genres
                                    </div>
                                    <Flex gap="2" wrap="wrap">
                                        {anime.explicit_genres.map((eg) => (
                                            <Badge key={`eg_${eg.mal_id}`} variant="soft" style={{ backgroundColor: '#1e293b', color: '#ef4444' }}>
                                                {eg.name}
                                            </Badge>
                                        ))}
                                    </Flex>
                                </Box>
                            )}

                            {anime.source && (
                                <Flex gap="2" mt="2" align="center">
                                    <BookOpen size={14} style={{ color: '#64748b' }} />
                                    <Text size="2" style={{ color: '#94a3b8' }}>Source: {anime.source}</Text>
                                </Flex>
                            )}

                            <Separator mb="6" style={{ backgroundColor: '#1e293b' }} />

                            {/* Detailed Information Grid */}
                            <Box mb="6">
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Info size={18} style={{ color: '#3b82f6' }} />
                                    Information
                                </div>

                                <Grid columns={{ initial: '1', sm: '2', lg: '3' }} gap="6">
                                    {/* Basic Info */}
                                    <Box>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                            <Calendar size={14} />
                                            Air Dates
                                        </div>
                                        <Flex direction="column" gap="3">
                                            {anime.aired?.from && (
                                                <Box>
                                                    <Text as="p" size="2" mb="1" style={{ color: '#64748b' }}>Premiered</Text>
                                                    <Text as="p" size="3" style={{ color: 'white' }}>
                                                        {formatDate(anime.aired.from)}
                                                    </Text>
                                                </Box>
                                            )}
                                            {anime.aired?.to && (
                                                <Box>
                                                    <Text as="p" size="2" mb="1" style={{ color: '#64748b' }}>Ended</Text>
                                                    <Text as="p" size="3" style={{ color: 'white' }}>
                                                        {formatDate(anime.aired.to)}
                                                    </Text>
                                                </Box>
                                            )}
                                            {anime.season && anime.year && (
                                                <Box>
                                                    <Text as="p" size="2" mb="1" style={{ color: '#64748b' }}>Season</Text>
                                                    <Text as="p" size="3" style={{ color: 'white' }}>
                                                        {anime.season.charAt(0).toUpperCase() + anime.season.slice(1)} {anime.year}
                                                    </Text>
                                                </Box>
                                            )}
                                        </Flex>
                                    </Box>

                                    {/* Duration & Episodes */}
                                    <Box>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                            <Clock size={14} />
                                            Format
                                        </div>
                                        <Flex direction="column" gap="3">
                                            {anime.duration && (
                                                <Box>
                                                    <Text as="p" size="2" mb="1" style={{ color: '#64748b' }}>Duration</Text>
                                                    <Text as="p" size="3" style={{ color: 'white' }}>{anime.duration}</Text>
                                                </Box>
                                            )}
                                            {anime.episodes && (
                                                <Box>
                                                    <Text as="p" size="2" mb="1" style={{ color: '#64748b' }}>Episodes</Text>
                                                    <Text as="p" size="3" style={{ color: 'white' }}>{anime.episodes}</Text>
                                                </Box>
                                            )}
                                            {anime.type && (
                                                <Box>
                                                    <Text as="p" size="2" mb="1" style={{ color: '#64748b' }}>Type</Text>
                                                    <Text as="p" size="3" style={{ color: 'white' }}>{anime.type}</Text>
                                                </Box>
                                            )}
                                        </Flex>
                                    </Box>

                                    {/* Rankings & Stats */}
                                    <Box>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                            <Award size={14} />
                                            Rankings
                                        </div>
                                        <Flex direction="column" gap="3">
                                            {anime.rank && (
                                                <Box>
                                                    <Text as="p" size="2" mb="1" style={{ color: '#64748b' }}>Rank</Text>
                                                    <Text as="p" size="3" style={{ color: '#fbbf24', fontWeight: 'bold' }}>#{anime.rank}</Text>
                                                </Box>
                                            )}
                                            {anime.popularity && (
                                                <Box>
                                                    <Text as="p" size="2" mb="1" style={{ color: '#64748b' }}>Popularity</Text>
                                                    <Text as="p" size="3" style={{ color: '#3b82f6', fontWeight: 'bold' }}>#{anime.popularity}</Text>
                                                </Box>
                                            )}
                                            {anime.members && (
                                                <Box>
                                                    <Text as="p" size="2" mb="1" style={{ color: '#64748b' }}>Members</Text>
                                                    <Text as="p" size="3" style={{ color: 'white' }}>{anime.members.toLocaleString('en-US')}</Text>
                                                </Box>
                                            )}
                                            {anime.favorites && (
                                                <Box>
                                                    <Text as="p" size="2" mb="1" style={{ color: '#64748b' }}>Favorites</Text>
                                                    <Text as="p" size="3" style={{ color: '#ef4444', fontWeight: 'bold' }}>
                                                        <Heart size={12} style={{ display: 'inline', marginRight: '4px' }} fill="currentColor" />
                                                        {anime.favorites.toLocaleString('en-US')}
                                                    </Text>
                                                </Box>
                                            )}
                                        </Flex>
                                    </Box>
                                </Grid>
                            </Box>

                            <Separator mb="6" style={{ backgroundColor: '#1e293b' }} />

                            {/* Broadcast Schedule */}
                            {anime.broadcast && (
                                <Box mb="6">
                                    <div style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Radio size={18} style={{ color: '#f97316' }} />
                                        Broadcast Schedule
                                    </div>
                                    <Box
                                        style={{
                                            backgroundColor: '#1e293b',
                                            borderRadius: 'var(--radius-3)',
                                            padding: '1rem'
                                        }}
                                    >
                                        {anime.broadcast.string && (
                                            <Text as="p" size="3" style={{ color: 'white' }}>{anime.broadcast.string}</Text>
                                        )}
                                        {!anime.broadcast.string && anime.broadcast.day && (
                                            <Text as="p" size="3" style={{ color: 'white' }}>
                                                {anime.broadcast.day}
                                                {anime.broadcast.time && ` at ${anime.broadcast.time}`}
                                                {anime.broadcast.timezone && ` (${anime.broadcast.timezone})`}
                                            </Text>
                                        )}
                                    </Box>
                                </Box>
                            )}

                            {/* Streaming Platforms */}
                            {anime.streaming && anime.streaming.length > 0 && (
                                <Box mb="6">
                                    <div style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Globe size={18} style={{ color: '#10b981' }} />
                                        Streaming Platforms
                                    </div>
                                    <Flex gap="2" wrap="wrap">
                                        {anime.streaming.map((stream, index) => (
                                            <a
                                                key={index}
                                                href={stream.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    backgroundColor: '#1e293b',
                                                    color: '#3b82f6',
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: 'var(--radius-2)',
                                                    textDecoration: 'none',
                                                    fontSize: '0.875rem',
                                                    fontWeight: '500',
                                                    transition: 'background-color 0.2s'
                                                }}
                                            >
                                                <ExternalLink size={14} />
                                                {stream.name}
                                            </a>
                                        ))}
                                    </Flex>
                                </Box>
                            )}

                            {/* Studios, Producers & Licensors */}
                            <Box mb="6">
                                <div style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Building2 size={18} style={{ color: '#a855f7' }} />
                                    Production
                                </div>
                                <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                                    {anime.studios && anime.studios.length > 0 && (
                                        <Box
                                            style={{
                                                backgroundColor: '#1e293b',
                                                borderRadius: 'var(--radius-3)',
                                                padding: '1rem'
                                            }}
                                        >
                                            <Text as="p" size="2" mb="2" style={{ color: '#94a3b8', fontWeight: 'bold' }}>Studios</Text>
                                            <Flex gap="2" wrap="wrap">
                                                {anime.studios.map((studio) => (
                                                    <Badge key={studio.mal_id} variant="soft" style={{ backgroundColor: '#0f172a', color: '#3b82f6' }}>
                                                        {studio.name}
                                                    </Badge>
                                                ))}
                                            </Flex>
                                        </Box>
                                    )}

                                    {anime.producers && anime.producers.length > 0 && (
                                        <Box
                                            style={{
                                                backgroundColor: '#1e293b',
                                                borderRadius: 'var(--radius-3)',
                                                padding: '1rem'
                                            }}
                                        >
                                            <Text as="p" size="2" mb="2" style={{ color: '#94a3b8', fontWeight: 'bold' }}>Producers</Text>
                                            <Flex gap="2" wrap="wrap">
                                                {anime.producers.map((producer) => (
                                                    <Badge key={producer.mal_id} variant="soft" style={{ backgroundColor: '#0f172a', color: '#10b981' }}>
                                                        {producer.name}
                                                    </Badge>
                                                ))}
                                            </Flex>
                                        </Box>
                                    )}

                                    {anime.licensors && anime.licensors.length > 0 && (
                                        <Box
                                            style={{
                                                backgroundColor: '#1e293b',
                                                borderRadius: 'var(--radius-3)',
                                                padding: '1rem'
                                            }}
                                        >
                                            <Text as="p" size="2" mb="2" style={{ color: '#94a3b8', fontWeight: 'bold' }}>Licensors</Text>
                                            <Flex gap="2" wrap="wrap">
                                                {anime.licensors.map((licensor) => (
                                                    <Badge key={licensor.mal_id} variant="soft" style={{ backgroundColor: '#0f172a', color: '#f59e0b' }}>
                                                        {licensor.name}
                                                    </Badge>
                                                ))}
                                            </Flex>
                                        </Box>
                                    )}
                                </Grid>
                            </Box>

                            {/* Opening & Ending Themes */}
                            {anime.theme && ((anime.theme.openings && anime.theme.openings.length > 0) || (anime.theme.endings && anime.theme.endings.length > 0)) && (
                                <Box mb="6">
                                    <div style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Music size={18} style={{ color: '#ec4899' }} />
                                        Themes
                                    </div>
                                    <Grid columns={{ initial: '1', sm: '2' }} gap="4">
                                        {anime.theme.openings && anime.theme.openings.length > 0 && (
                                            <Box
                                                style={{
                                                    backgroundColor: '#1e293b',
                                                    borderRadius: 'var(--radius-3)',
                                                    padding: '1rem'
                                                }}
                                            >
                                                <Text as="p" size="2" mb="2" style={{ color: '#94a3b8', fontWeight: 'bold' }}>Opening Themes</Text>
                                                <Flex direction="column" gap="2">
                                                    {anime.theme.openings.map((op, index) => (
                                                        <Text key={index} as="p" size="2" style={{ color: 'white' }}>
                                                            {op}
                                                        </Text>
                                                    ))}
                                                </Flex>
                                            </Box>
                                        )}

                                        {anime.theme.endings && anime.theme.endings.length > 0 && (
                                            <Box
                                                style={{
                                                    backgroundColor: '#1e293b',
                                                    borderRadius: 'var(--radius-3)',
                                                    padding: '1rem'
                                                }}
                                            >
                                                <Text as="p" size="2" mb="2" style={{ color: '#94a3b8', fontWeight: 'bold' }}>Ending Themes</Text>
                                                <Flex direction="column" gap="2">
                                                    {anime.theme.endings.map((ed, index) => (
                                                        <Text key={index} as="p" size="2" style={{ color: 'white' }}>
                                                            {ed}
                                                        </Text>
                                                    ))}
                                                </Flex>
                                            </Box>
                                        )}
                                    </Grid>
                                </Box>
                            )}

                            {/* Background */}
                            {anime.background && (
                                <Box mb="6">
                                    <div style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <BookOpen size={18} style={{ color: '#f59e0b' }} />
                                        Background
                                    </div>
                                    <Box
                                        style={{
                                            backgroundColor: '#1e293b',
                                            borderRadius: 'var(--radius-3)',
                                            padding: '1rem'
                                        }}
                                    >
                                        <Text as="p" size="3" style={{ color: '#cbd5e1', lineHeight: '1.6' }}>
                                            {anime.background}
                                        </Text>
                                    </Box>
                                </Box>
                            )}

                            {/* Related Anime */}
                            {anime.relations && anime.relations.length > 0 && (
                                <Box mb="6">
                                    <div style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <LinkIcon size={18} style={{ color: '#06b6d4' }} />
                                        Related Anime
                                    </div>
                                    <Flex direction="column" gap="3">
                                        {anime.relations.map((relation, index) => (
                                            <Box
                                                key={index}
                                                style={{
                                                    backgroundColor: '#1e293b',
                                                    borderRadius: 'var(--radius-3)',
                                                    padding: '1rem'
                                                }}
                                            >
                                                <Text as="p" size="2" mb="2" style={{ color: '#94a3b8', fontWeight: 'bold' }}>
                                                    {relation.relation}
                                                </Text>
                                                <Flex gap="2" wrap="wrap">
                                                    {relation.entry.map((entry) => (
                                                        <Badge key={entry.mal_id} variant="soft" style={{ backgroundColor: '#0f172a', color: '#06b6d4' }}>
                                                            {entry.name}
                                                        </Badge>
                                                    ))}
                                                </Flex>
                                            </Box>
                                        ))}
                                    </Flex>
                                </Box>
                            )}

                            <Separator mb="6" style={{ backgroundColor: '#1e293b' }} />

                            {/* Characters Section - Show 12 initially with Show More */}
                            {(mainCharacters.length > 0 || (supportingCharacters && supportingCharacters.length > 0)) && (
                                <CharacterGrid
                                    mainCharacters={mainCharacters}
                                    supportingCharacters={supportingCharacters}
                                    initialVisible={12}
                                />
                            )}

                            {/* Fallback if no characters at all */}
                            {mainCharacters.length === 0 && (!characters || characters.length === 0) && (
                                <Box mb="6">
                                    <Flex align="center" gap="2" mb="4">
                                        <Users size={20} style={{ color: '#64748b' }} />
                                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#64748b' }}>
                                            No character information available
                                        </div>
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
