'use client'
import React, { memo } from 'react'
import Image from 'next/image'
import { Star, Calendar, Clock, PlayCircle } from 'lucide-react'
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
  Button
} from '@radix-ui/themes'

interface AnimeCardProps {
  anime: AnimeData
  priority?: boolean
}

const AnimeCard: React.FC<AnimeCardProps> = ({ anime, priority = false }) => {
  const imageUrl = getImageUrl(anime)
  const [isHovered, setIsHovered] = React.useState(false)
  const [imageLoaded, setImageLoaded] = React.useState(false)
  const [imageError, setImageError] = React.useState(false)

  return (
    <Link href={`/anime/${anime.mal_id}`} style={{ textDecoration: 'none' }}>
      <Card
        asChild
        style={{
          position: 'relative',
          height: '400px',
          overflow: 'hidden',
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div>
          <Image
            src={imageUrl}
            alt={anime.title}
            fill
            unoptimized
            style={{
              objectFit: 'cover',
              transition: 'transform 0.5s ease',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              opacity: imageLoaded ? 1 : 0
            }}
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            loading={priority ? 'eager' : 'lazy'}
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
              <Text size="2" style={{ color: '#64748b' }}>
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
              <Text size="2" style={{ color: '#64748b' }}>
                Image not available
              </Text>
            </Box>
          )}
          <Box
            position="absolute"
            bottom="0"
            left="0"
            right="0"
            p="3"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,1) 20%, rgba(0,0,0,0.7) 70%, transparent 100%)',
              color: 'white',
              transition: 'all 0.5s linear',
              opacity: isHovered ? 1 : 0.9,
              transform: isHovered ? 'translateY(0)' : 'translateY(10px)'
            }}
          >
            <Text as="p" size="3" weight="bold" truncate>
              {anime.title_english || anime.title}
            </Text>
            <Flex align="center" gap="3" mt="1">
              {anime.score && (
                <Flex align="center" gap="1">
                  <Star size={14} style={{ color: '#fbbf24' }} />
                  <Text size="1">{formatScore(anime.score)}</Text>
                </Flex>
              )}
              <Flex align="center" gap="1">
                <Calendar size={14} style={{ color: '#94a3b8' }} />
                <Text size="1" style={{ color: '#cbd5e1' }}>{anime.year || 'TBA'}</Text>
              </Flex>
            </Flex>
            <Text
              as="p"
              size="1"
              color="gray"
              mt="2"
              style={{
                height: isHovered ? 'auto' : '0',
                overflow: 'hidden',
                transition: 'height 0.3s ease'
              }}
            >
              {anime.synopsis
                ? anime.synopsis.length > 150
                  ? `${anime.synopsis.substring(0, 150)}...`
                  : anime.synopsis
                : 'No synopsis available.'}
            </Text>
          </Box>
        </div>
      </Card>
    </Link>
  )
}

// Memoize AnimeCard component to prevent unnecessary re-renders
const MemoizedAnimeCard = memo(AnimeCard, (prevProps, nextProps) => {
  // Custom comparison function to check if props have changed
  return (
    prevProps.anime.mal_id === nextProps.anime.mal_id &&
    prevProps.anime.title === nextProps.anime.title &&
    prevProps.anime.title_english === nextProps.anime.title_english &&
    prevProps.anime.score === nextProps.anime.score &&
    prevProps.anime.year === nextProps.anime.year &&
    prevProps.priority === nextProps.priority
  );
});

interface AnimeGridProps {
  animeList: AnimeData[]
  loading?: boolean
  error?: string | null
}

const AnimeGrid: React.FC<AnimeGridProps> = ({ animeList, loading = false, error = null }) => {
  if (error) {
    return (
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
            Error loading anime
          </Text>
          <Text as="p" size="2" style={{ color: '#dc2626' }}>
            {error}
          </Text>
        </Box>
      </Box>
    )
  }

  if (loading) {
    return (
      <Grid
        columns={{ initial: '2', sm: '3', md: '4', lg: '5', xl: '6' }}
        gap={{ initial: '4', md: '6' }}
      >
        {Array.from({ length: 12 }).map((_, index) => (
          <Card key={index} style={{ overflow: 'hidden', backgroundColor: '#1e293b', border: '1px solid #334155' }}>
            <Skeleton style={{ aspectRatio: '3/4', backgroundColor: '#334155' }} />
            <Box p="4" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Skeleton width="100%" height="16px" style={{ backgroundColor: '#334155' }} />
              <Skeleton width="75%" height="12px" style={{ backgroundColor: '#334155' }} />
              <Skeleton width="50%" height="12px" style={{ backgroundColor: '#334155' }} />
            </Box>
          </Card>
        ))}
      </Grid>
    )
  }

  if (animeList.length === 0) {
    return (
      <Box style={{ textAlign: 'center' }} py="12">
        <Box
          style={{
            backgroundColor: '#1e293b',
            borderRadius: 'var(--radius-3)',
            padding: 'var(--space-8)',
            maxWidth: '400px',
            margin: '0 auto',
            border: '1px solid #334155'
          }}
        >
          <Text as="p" size="3" weight="bold" mb="2" style={{ color: 'white' }}>
            No anime found
          </Text>
          <Text as="p" size="2" style={{ color: '#94a3b8' }}>
            Try adjusting your search criteria.
          </Text>
        </Box>
      </Box>
    )
  }

  return (
    <Grid
      columns={{ initial: '2', sm: '3', md: '4', lg: '5', xl: '6' }}
      gap={{ initial: '4', md: '6' }}
    >
      {animeList.map((anime, index) => (
        <MemoizedAnimeCard key={`${anime.mal_id}-${index}`} anime={anime} priority={index < 6} />
      ))}
    </Grid>
  )
}

export { AnimeCard, AnimeGrid, MemoizedAnimeCard }