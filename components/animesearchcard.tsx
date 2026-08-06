'use client'
import React from 'react'
import Image from 'next/image'
import { Star, Calendar, Clock, PlayCircle, Search } from 'lucide-react'
import type { AnimeListItem } from '@/lib/anime-models'
import { formatScore, formatDate, getOptimizedImageUrl } from '@/lib/anime-utils'
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
} from '@/components/ui-primitives'

interface AnimeSearchCardProps {
    anime: AnimeListItem
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
    const [imageLoaded, setImageLoaded] = React.useState(false)
    const [imageError, setImageError] = React.useState(false)

    const imageUrl = getOptimizedImageUrl(anime)

    return (
        <Link href={`/anime/${anime.mal_id}`} prefetch={false} style={{ textDecoration: 'none' }} onClick={onClose}>
            <Card
                className="search-result-card"
                style={{
                    position: 'relative',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease, background-color 0.15s ease',
                    borderRadius: '8px',
                    overflow: 'hidden'
                }}
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
                                style={{
                                    objectFit: 'cover',
                                    opacity: imageLoaded ? 1 : 0
                                }}
                                sizes="(max-width: 768px) 90px, 110px"
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
                                    {anime.score_percentage !== undefined && (
                                        <Text size="1" style={{ color: '#fbbf24' }}>
                                            ({Math.round(anime.score_percentage)}%)
                                        </Text>
                                    )}
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
                                {(anime.synopsis?.length ?? 0) > 100
                                    ? `${anime.synopsis?.substring(0, 100)}...`
                                    : anime.synopsis}
                            </Text>
                        )}

                        {/* Tags */}
                        <Flex gap="1" mt="2" wrap="wrap">
                            {anime.genres?.slice(0, 2).map((genre) => (
                                <Badge
                                    key={genre.mal_id}
                                    size="1"
                                    variant="soft"
                                    style={{
                                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                        color: '#93c5fd',
                                        fontSize: '10px'
                                    }}
                                >
                                    {genre.name}
                                </Badge>
                            ))}
                            {anime.themes?.slice(0, 1).map((theme) => (
                                <Badge
                                    key={theme.mal_id}
                                    size="1"
                                    variant="soft"
                                    style={{
                                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                        color: '#6ee7b7',
                                        fontSize: '10px'
                                    }}
                                >
                                    {theme.name}
                                </Badge>
                            ))}
                            {anime.demographics?.slice(0, 1).map((demo) => (
                                <Badge
                                    key={demo.mal_id}
                                    size="1"
                                    variant="soft"
                                    style={{
                                        backgroundColor: 'rgba(168, 85, 247, 0.2)',
                                        color: '#d8b4fe',
                                        fontSize: '10px'
                                    }}
                                >
                                    {demo.name}
                                </Badge>
                            ))}
                            {anime.tags?.filter(tag => {
                                const category = tag.category || ''
                                return !category.startsWith('theme') && !category.startsWith('demographic')
                            }).slice(0, 2).map((tag) => (
                                <Badge
                                    key={`tag_${tag.mal_id}`}
                                    size="1"
                                    variant="soft"
                                    title={tag.rank !== undefined ? `${Math.round(tag.rank)}% relevance` : 'AniList tag'}
                                    style={{
                                        backgroundColor: 'rgba(245, 158, 11, 0.2)',
                                        color: '#fcd34d',
                                        fontSize: '10px'
                                    }}
                                >
                                    {tag.name}{tag.rank !== undefined ? ` · ${Math.round(tag.rank)}%` : ''}
                                </Badge>
                            ))}
                        </Flex>
                    </Box>

                </Flex>
            </Card>
        </Link>
    )
}

interface AnimeSearchResultsProps {
    results: AnimeListItem[]
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


