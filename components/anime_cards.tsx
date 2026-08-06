import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Star } from 'lucide-react'
import type { AnimeListItem } from '@/lib/anime-models'
import { formatScore, getOptimizedImageUrl } from '@/lib/anime-utils'
import { Grid } from '@/components/ui-primitives'

interface AnimeCardProps {
  anime: AnimeListItem
  priority?: boolean
}

const AnimeCard = ({ anime, priority = false }: AnimeCardProps) => {
  const title = anime.title_english || anime.title

  return (
    <Link
      href={`/anime/${anime.mal_id}`}
      prefetch={false}
      className="anime-grid-item"
      aria-label={`${title}${anime.year ? `, ${anime.year}` : ''}`}
    >
      <article className="anime-card">
        <Image
          src={getOptimizedImageUrl(anime)}
          alt=""
          fill
          className="anime-card-image"
          priority={priority}
          sizes="(max-width: 639px) 44vw, (max-width: 767px) 30vw, (max-width: 1023px) 22vw, (max-width: 1279px) 18vw, 220px"
          quality={65}
        />
        <div className="anime-card-scrim" aria-hidden="true" />
        <div className="anime-card-topline">
          <span>{anime.type || 'Anime'}</span>
          {anime.status && <span className="anime-card-status">{anime.status.replace('Currently ', '')}</span>}
        </div>
        <div className="anime-card-overlay">
          <h3 title={title}>{title}</h3>
          <div className="anime-card-meta">
            {anime.score ? (
              <span className="anime-card-score">
                <Star size={13} aria-hidden="true" />
                {formatScore(anime.score)}
              </span>
            ) : <span>Not rated</span>}
            <span>
              <Calendar size={13} aria-hidden="true" />
              {anime.year || 'TBA'}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}

interface AnimeGridProps {
  animeList: AnimeListItem[]
  loading?: boolean
  error?: string | null
  priorityCount?: number
}

const AnimeGrid = ({ animeList, loading = false, error = null, priorityCount = 0 }: AnimeGridProps) => {
  if (error) {
    return (
      <div className="feedback-state feedback-state-error" role="alert">
        <strong>We couldn&apos;t load this list</strong>
        <p>{error}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <Grid className="anime-grid" columns={{ initial: '2', sm: '3', md: '4', lg: '5', xl: '6' }} gap={{ initial: '3', md: '5' }} aria-hidden="true">
        {Array.from({ length: 12 }).map((_, index) => (
          <div className="anime-card anime-card-skeleton" key={index}>
            <span />
            <span />
          </div>
        ))}
      </Grid>
    )
  }

  if (animeList.length === 0) {
    return (
      <div className="feedback-state">
        <strong>No anime found</strong>
        <p>Try changing the filters or using a broader search.</p>
      </div>
    )
  }

  return (
    <Grid className="anime-grid" columns={{ initial: '2', sm: '3', md: '4', lg: '5', xl: '6' }} gap={{ initial: '3', md: '5' }}>
      {animeList.map((anime, index) => (
        <AnimeCard key={anime.mal_id} anime={anime} priority={index < priorityCount} />
      ))}
    </Grid>
  )
}

export { AnimeCard, AnimeGrid }
