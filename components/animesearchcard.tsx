'use client'
import React from 'react'
import Image from 'next/image'
import { Star, Calendar, Clock, PlayCircle, Search, X } from 'lucide-react'
import { AnimeData, formatScore, formatDate, getImageUrl } from '@/lib/api'
import Link from 'next/link'
import {
    Box,
    Card,
    Flex,
    Grid,
    Text,
    Badge,
    Skeleton,
    Inset,
    Button,
    Separator
} from '@radix-ui/themes'

interface AnimeSearchCardProps {
    anime: AnimeData
    onClose?: () => void
    variant?: 'suggestion' | 'result'
    showImage?: boolean
}

const AnimeSearchCard: React.FC<AnimeSearchCardProps> = ({
    anime,
    onClose,
    variant = 'suggestion',
    showImage = true
}) => {
    const [isHovered, setIsHovered] = React.useState(false)
    const [imageLoaded, setImageLoaded] = React.useState(false)
    const [imageError, setImageError] = React.useState(false)

    const imageUrl = getImageUrl(anime)

    return (
        <Link href={`/anime/${anime.mal_id}`} style={{ textDecoration: 'none' }}>
            <Card
                style={{
                    position: 'relative',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    borderRadius: '8px',
                    overflow: 'hidden'
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <Flex gap="4" align="center">
                    {/* Anime Image */}
                    {showImage && (
                        <Box
                            style={{
                                position: 'relative',
                                width: variant === 'suggestion' ? '90px' : '110px',
                                height: variant === 'suggestion' ? '135px' : '165px',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                flexShrink: 0
                            }}
                        >
                            <Image
                                src={imageUrl}
                                alt={anime.title}
                                fill
                                unoptimized
                                style={{
                                    objectFit: 'cover',
                                    opacity: imageLoaded ? 1 : 0
                                }}
                                sizes="60px"
                                onLoad={() => setImageLoaded(true)}
                                onError={() => setImageError(true)}
                            />
                            {/* Loading placeholder */}
                            {!imageLoaded && !imageError && (
                                <Box
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        backgroundColor: '#334155',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Text size="1" style={{ color: '#64748b' }}>
                                        Loading...
                                    </Text>
                                </Box>
                            )}
                            {/* Error placeholder */}
                            {imageError && (
                                <Box
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        backgroundColor: '#334155',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Text size="1" style={{ color: '#64748b' }}>
                                        N/A
                                    </Text>
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* Anime Info */}
                    <Box flexGrow="1" style={{ minWidth: 0 }}>
                        <Text
                            as="p"
                            size="3"
                            weight="bold"
                            style={{
                                color: 'white',
                                marginBottom: '4px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {anime.title_english || anime.title}
                        </Text>

                        {/* Year Display */}
                        {anime.year && (
                            <Text
                                as="p"
                                size="2"
                                style={{
                                    color: '#94a3b8',
                                    marginBottom: '8px',
                                    fontWeight: '500'
                                }}
                            >
                                {anime.year}
                            </Text>
                        )}

                        <Flex align="center" gap="3" mb="2">
                            {anime.score && (
                                <Flex align="center" gap="1">
                                    <Star size={12} style={{ color: '#fbbf24' }} />
                                    <Text size="1" style={{ color: '#cbd5e1' }}>
                                        {formatScore(anime.score)}
                                    </Text>
                                </Flex>
                            )}
                            <Flex align="center" gap="1">
                                <Calendar size={12} style={{ color: '#94a3b8' }} />
                                <Text size="1" style={{ color: '#cbd5e1' }}>
                                    {anime.year || 'TBA'}
                                </Text>
                            </Flex>
                            {anime.episodes && (
                                <Flex align="center" gap="1">
                                    <PlayCircle size={12} style={{ color: '#94a3b8' }} />
                                    <Text size="1" style={{ color: '#cbd5e1' }}>
                                        {anime.episodes} eps
                                    </Text>
                                </Flex>
                            )}
                        </Flex>

                        {variant === 'suggestion' && anime.synopsis && (
                            <Text
                                as="p"
                                size="1"
                                style={{
                                    color: '#94a3b8',
                                    overflow: 'hidden',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    lineHeight: '1.3'
                                }}
                            >
                                {anime.synopsis.length > 100
                                    ? `${anime.synopsis.substring(0, 100)}...`
                                    : anime.synopsis}
                            </Text>
                        )}

                        {/* Genres */}
                        {anime.genres && anime.genres.length > 0 && (
                            <Flex gap="1" mt="2" wrap="wrap">
                                {anime.genres.slice(0, 3).map((genre) => (
                                    <Badge
                                        key={genre.mal_id}
                                        size="1"
                                        variant="soft"
                                        style={{
                                            backgroundColor: '#334155',
                                            color: '#cbd5e1',
                                            fontSize: '10px'
                                        }}
                                    >
                                        {genre.name}
                                    </Badge>
                                ))}
                            </Flex>
                        )}
                    </Box>

                    {/* Close button for suggestions */}
                    {onClose && (
                        <Button
                            size="1"
                            variant="ghost"
                            onClick={(e) => {
                                e.preventDefault()
                                onClose()
                            }}
                            style={{
                                color: '#94a3b8',
                                padding: '4px',
                                opacity: isHovered ? 1 : 0.7
                            }}
                        >
                            <X size={14} />
                        </Button>
                    )}
                </Flex>
            </Card>
        </Link>
    )
}

interface AnimeSearchResultsProps {
    results: AnimeData[]
    loading?: boolean
    error?: string | null
    query?: string
    onClose?: () => void
    variant?: 'dropdown' | 'page'
    maxResults?: number
}

const AnimeSearchResults: React.FC<AnimeSearchResultsProps> = ({
    results,
    loading = false,
    error = null,
    query = '',
    onClose,
    variant = 'dropdown',
    maxResults = variant === 'dropdown' ? 12 : 6
}) => {
    const displayResults = results.slice(0, maxResults)

    if (error) {
        return (
            <Card
                style={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    padding: '16px'
                }}
            >
                <Text size="2" style={{ color: '#ef4444', textAlign: 'center' }}>
                    {error}
                </Text>
            </Card>
        )
    }

    if (loading) {
        return (
            <Card
                style={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    padding: '16px'
                }}
            >
                <Flex direction="column" gap="3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <Flex key={index} gap="3" align="center">
                            <Skeleton width="60px" height="80px" style={{ borderRadius: '4px' }} />
                            <Box flexGrow="1">
                                <Skeleton width="100%" height="16px" style={{ marginBottom: '8px' }} />
                                <Skeleton width="60%" height="12px" style={{ marginBottom: '8px' }} />
                                <Skeleton width="40%" height="12px" />
                            </Box>
                        </Flex>
                    ))}
                </Flex>
            </Card>
        )
    }

    if (results.length === 0 && query) {
        return (
            <Card
                style={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    padding: '16px'
                }}
            >
                <Flex direction="column" align="center" gap="2">
                    <Search size={32} style={{ color: '#94a3b8' }} />
                    <Text size="2" style={{ color: '#cbd5e1', textAlign: 'center' }}>
                        No results found for &quot;{query}&quot;
                    </Text>
                    <Text size="1" style={{ color: '#94a3b8', textAlign: 'center' }}>
                        Try adjusting your search terms
                    </Text>
                </Flex>
            </Card>
        )
    }

    if (results.length === 0) {
        return null
    }

    return (
        <Card
            style={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                maxHeight: variant === 'dropdown' ? 'auto' : 'none',
                overflowY: variant === 'dropdown' ? 'auto' : 'visible',
                borderRadius: '12px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
            }}
        >
            {variant === 'dropdown' && (
                <Box p="1" style={{ borderBottom: '1px solid #334155' }}>
                    <Text size="2" weight="bold" style={{ color: 'white' }}>
                        Search Results ({results.length})
                    </Text>
                </Box>
            )}

            <Flex direction="column" gap="0">
                {displayResults.map((anime, index) => (
                    <React.Fragment key={anime.mal_id}>
                        <Box px="3" py="2">
                            <AnimeSearchCard
                                anime={anime}
                                onClose={onClose}
                                variant={variant === 'dropdown' ? 'suggestion' : 'result'}
                            />
                        </Box>
                        {index < displayResults.length - 1 && (
                            <Separator size="4" style={{ margin: '0 20px', backgroundColor: '#334155' }} />
                        )}
                    </React.Fragment>
                ))}
            </Flex>

            {results.length > maxResults && variant === 'dropdown' && (
                <Box p="3" style={{ borderTop: '1px solid #334155' }}>
                    <Button
                        variant="soft"
                        style={{
                            width: '100%',
                            backgroundColor: '#334155',
                            color: 'white'
                        }}
                        onClick={() => window.location.href = `/search?q=${encodeURIComponent(query)}`}
                    >
                        View all {results.length} results
                    </Button>
                </Box>
            )}
        </Card>
    )
}

export { AnimeSearchCard, AnimeSearchResults }


