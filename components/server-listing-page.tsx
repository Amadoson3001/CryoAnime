import type { ReactNode } from 'react'
import { Box, Container, Flex, Text } from '@/components/ui-primitives'
import { AnimeGrid } from '@/components/anime_cards'
import PaginationLinks from '@/components/PaginationLinks'
import ListingControls from '@/components/listing-controls'
import type { PageResult, AnimeListItem } from '@/lib/anime-models'

export default function ServerListingPage({
  title,
  description,
  icon,
  result,
  error,
  basePath,
  query,
  sort,
  order,
  showControls = true,
  showSeason = false,
  season,
  year,
  asSection = false,
}: {
  title: string
  description: string
  icon?: ReactNode
  result: PageResult<AnimeListItem> | null
  error?: string | null
  basePath: string
  query?: Record<string, string | number | undefined>
  sort?: string
  order?: 'asc' | 'desc'
  showControls?: boolean
  showSeason?: boolean
  season?: string
  year?: number
  asSection?: boolean
}) {
  const content = (
    <>
        <Box mb="8" className="page-heading">
          <Flex align="center" justify="center" gap="3" mb="3">
            {icon}
            <h1 className="page-title">{title}</h1>
          </Flex>
          <Text as="p" size="4" className="page-description">{description}</Text>
          {result && !error && <Text as="p" size="2" mt="3" className="page-result-count">Page {result.page} of {result.totalPages} <span aria-hidden="true">·</span> {result.items.length} titles</Text>}
        </Box>
        {showControls && <ListingControls basePath={basePath} query={query} sort={sort} order={order} showSeason={showSeason} season={season} year={year} />}
        <AnimeGrid animeList={result?.items || []} error={error || null} priorityCount={2} />
        {result && <PaginationLinks basePath={basePath} query={query} page={result.page} totalPages={result.totalPages} hasNextPage={result.hasNextPage} />}
    </>
  )

  if (asSection) return <section className="listing-section page-enter">{content}</section>

  return (
    <main className="page-shell">
      <Container size="4" px="3" py={{ initial: '7', md: '9' }} className="page-enter">
        {content}
      </Container>
    </main>
  )
}
