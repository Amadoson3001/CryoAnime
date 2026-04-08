import React from 'react'
import Image from 'next/image'
import { Metadata } from 'next'
import Link from 'next/link'
import { 
    fetchAnimeById, 
    fetchAnimeCharacters, 
    getImageUrl, 
    formatScore, 
    formatDate 
} from '@/lib/api'
import { 
    ArrowLeft, 
    Star, 
    PlayCircle, 
    Users 
} from 'lucide-react'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import CharacterCard from '@/components/CharacterCard'
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

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params
    try {
        const response = await fetchAnimeById(parseInt(id))
        const anime = response.data
        
        if (!anime) return { title: 'Anime Not Found - CryoAnime' }
        
        const title = anime.title_english || anime.title
        const description = anime.synopsis?.substring(0, 160) || `Learn everything about ${title} on CryoAnime.`
        const imageUrl = getImageUrl(anime)
        
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
    const animeId = parseInt(id)
    
    // Fetch data in parallel on the server
    const [animeResponse, charactersResponse] = await Promise.allSettled([
        fetchAnimeById(animeId),
        fetchAnimeCharacters(animeId)
    ])
    
    const anime = animeResponse.status === 'fulfilled' ? animeResponse.value.data : null
    const characters = charactersResponse.status === 'fulfilled' ? charactersResponse.value.data?.slice(0, 12) : []

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
                        {/* Anime Image Card */}
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

                            {/* Client Action Buttons (Share, Favorite) */}
                            <AnimeActionButtons anime={anime} />
                        </Box>

                        {/* Anime Details Content */}
                        <Box style={{ flex: 1 }}>
                            {/* Titles */}
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'white' }}>
                                {anime.title_english || anime.title}
                            </div>

                            {anime.title_english && anime.title !== anime.title_english && (
                                <Text as="p" size="4" mb="4" style={{ color: '#94a3b8' }}>
                                    {anime.title}
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

                            {/* Expandable Synopsis (Client Component) */}
                            <AnimeSynopsis synopsis={anime.synopsis} />

                            <Separator mb="6" style={{ backgroundColor: '#1e293b' }} />

                            {/* Statistics & Metadata Grid */}
                            <Box mb="6">
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: 'white' }}>
                                    Statistics & Information
                                </div>

                                <Grid columns={{ initial: '1', sm: '2', lg: '3' }} gap="6">
                                    <Box>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#94a3b8' }}>
                                            Basic Information
                                        </div>
                                        <Flex direction="column" gap="3">
                                            {anime.aired?.from && (
                                                <Box>
                                                    <Text as="p" size="2" mb="1" style={{ color: '#64748b' }}>Aired</Text>
                                                    <Text as="p" size="3" style={{ color: 'white' }}>
                                                        {formatDate(anime.aired.from)}
                                                        {anime.aired.to && ` to ${formatDate(anime.aired.to)}`}
                                                    </Text>
                                                </Box>
                                            )}
                                            {anime.duration && (
                                                <Box>
                                                    <Text as="p" size="2" mb="1" style={{ color: '#64748b' }}>Duration</Text>
                                                    <Text as="p" size="3" style={{ color: 'white' }}>{anime.duration}</Text>
                                                </Box>
                                            )}
                                        </Flex>
                                    </Box>

                                    <Box>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#94a3b8' }}>
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
                                        </Flex>
                                    </Box>

                                    <Box>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#94a3b8' }}>
                                            Network
                                        </div>
                                        <Flex direction="column" gap="3">
                                            <Box>
                                                <Text as="p" size="2" mb="1" style={{ color: '#64748b' }}>Source</Text>
                                                <Text as="p" size="3" style={{ color: 'white' }}>{anime.status}</Text>
                                            </Box>
                                        </Flex>
                                    </Box>
                                </Grid>
                            </Box>

                            {/* Categories (Genres, Themes) */}
                            <Box mb="6">
                                <div style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', color: 'white' }}>
                                    Categories
                                </div>
                                <Flex gap="2" wrap="wrap">
                                    {anime.genres?.map((genre) => (
                                        <Badge key={genre.mal_id} variant="soft" style={{ backgroundColor: '#1e293b', color: '#3b82f6' }}>
                                            {genre.name}
                                        </Badge>
                                    ))}
                                    {anime.themes?.map((theme) => (
                                        <Badge key={theme.mal_id} variant="soft" style={{ backgroundColor: '#1e293b', color: '#10b981' }}>
                                            {theme.name}
                                        </Badge>
                                    ))}
                                </Flex>
                            </Box>

                            {/* Characters Section */}
                            {characters && characters.length > 0 && (
                                <Box mb="6">
                                    <Flex align="center" gap="2" mb="4">
                                        <Users size={20} style={{ color: '#3b82f6' }} />
                                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>
                                            Characters
                                        </div>
                                    </Flex>
                                    <Grid columns={{ initial: '2', sm: '3', md: '4' }} gap="4">
                                        {characters.map((character, index) => (
                                            <CharacterCard key={`char_${index}`} character={character} />
                                        ))}
                                    </Grid>
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
