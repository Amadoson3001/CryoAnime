import Link from 'next/link'
import { Suspense } from 'react'
import { Filter, Search, Plus, Minus } from 'lucide-react'
import { Badge, Box, Container, Flex, Text } from '@/components/ui-primitives'
import { getAnimeList, getTags } from '@/lib/anilist'
import { readContentPreferences } from '@/lib/contentPreferences'
import ServerListingPage from '@/components/server-listing-page'
import { firstQueryValue, parseLimit, parseOrder, parsePage, parseSort, type QueryParams } from '@/lib/query'

const CATEGORIES = ['genres', 'all_tags', 'themes', 'demographics', 'explicit_genres'] as const
type Category = (typeof CATEGORIES)[number]

const CATEGORY_LABELS: Record<Category, string> = {
  genres: 'Genres',
  all_tags: 'All tags',
  themes: 'Themes',
  demographics: 'Demographics',
  explicit_genres: 'Explicit',
}

const categoryFor = (tag: { category?: string; isAdult?: boolean }): Category => {
  if (tag.isAdult) return 'explicit_genres'
  const category = tag.category || ''
  if (category === 'genre') return 'genres'
  if (category.startsWith('theme')) return 'themes'
  if (category.startsWith('demographic')) return 'demographics'
  return 'all_tags'
}

const ids = (value: string | undefined): number[] => value?.split(',').map(Number).filter(item => Number.isSafeInteger(item) && item > 0).slice(0, 12) || []

const filterHref = (
  category: Category,
  include: number[],
  exclude: number[],
  id: number,
  mode: 'include' | 'exclude',
  preserved: Record<string, string | number | undefined>,
) => {
  const isIncluded = include.includes(id)
  const isExcluded = exclude.includes(id)
  const nextInclude = mode === 'include'
    ? isIncluded ? include.filter(item => item !== id) : Array.from(new Set([...include, id]))
    : include.filter(item => item !== id)
  const nextExclude = mode === 'exclude'
    ? isExcluded ? exclude.filter(item => item !== id) : Array.from(new Set([...exclude, id]))
    : exclude.filter(item => item !== id)
  const params = new URLSearchParams({ category })
  if (nextInclude.length) params.set('include', nextInclude.join(','))
  if (nextExclude.length) params.set('exclude', nextExclude.join(','))
  Object.entries(preserved).forEach(([key, value]) => {
    if (value !== undefined && String(value).length > 0) params.set(key, String(value))
  })
  return `/Explore?${params.toString()}`
}

async function ExploreContent({ searchParams }: { searchParams?: Promise<QueryParams> }) {
  const params = await searchParams || {}
  const categoryValue = firstQueryValue(params.category)
  const category: Category = CATEGORIES.includes(categoryValue as Category) ? categoryValue as Category : 'genres'
  const include = ids(firstQueryValue(params.include))
  const exclude = ids(firstQueryValue(params.exclude))
  const legacyId = Number(firstQueryValue(params.tagId))
  const selectedIds = include.length ? include : Number.isSafeInteger(legacyId) && legacyId > 0 ? [legacyId] : []
  const tagSearch = firstQueryValue(params.tag)?.trim().slice(0, 100).toLowerCase() || ''
  const minimumTagRank = Math.max(0, Math.min(100, Number(firstQueryValue(params.minimumTagRank)) || 0))
  const page = parsePage(params.page)
  const limit = parseLimit(params.limit)
  const sort = parseSort(params.sort)
  const order = parseOrder(params.order ?? params.sort)
  const tagsResult = await getTags().then(data => ({ data, failed: false })).catch(() => ({ data: [], failed: true }))
  const tags = tagsResult.data
  const visibleTags = tags
    .filter(tag => category === 'all_tags' || categoryFor(tag) === category)
    .filter(tag => !tag.isAdult || category === 'explicit_genres')
    .filter(tag => !tagSearch || tag.name.toLowerCase().includes(tagSearch))
  const selected = tags.filter(tag => selectedIds.includes(tag.mal_id))
  const names = selected.map(tag => tag.name)
  const excludedTags = tags.filter(tag => exclude.includes(tag.mal_id))
  const excludedNames = excludedTags.map(tag => tag.name)
  const result = selected.length > 0
    ? await getAnimeList({
        page,
        limit,
        sort,
        order,
        preferences: await readContentPreferences(),
        filters: category === 'genres'
          ? { genreNames: names, excludedGenreNames: excludedNames }
          : { tagNames: names, excludedTagNames: excludedNames, minimumTagRank },
      }).catch(() => null)
    : null
  const preserved = { tag: tagSearch || undefined, minimumTagRank: minimumTagRank || undefined, sort, order, limit }

  return (
    <main className="page-shell">
      <Container size="4" px="3" py={{ initial: '7', md: '9' }}>
        <Box mb="7" className="page-heading">
          <p className="page-kicker">Shape your discovery</p>
          <h1 className="page-title">Explore Anime</h1>
          <Text as="p" size="4" className="page-description">Combine genres and AniList tags. Every filter stays in the URL, ready to bookmark or share.</Text>
        </Box>

        <nav className="explore-tabs" aria-label="Explore categories">
          {CATEGORIES.map(item => (
            <Link key={item} prefetch={false} className={item === category ? 'active' : ''} aria-current={item === category ? 'page' : undefined} href={`/Explore?category=${item}`}>
              {CATEGORY_LABELS[item]}
            </Link>
          ))}
        </nav>

        <Box className="explore-panel" mb="7">
          <Flex align="center" gap="2" mb="4"><Filter size={18} aria-hidden="true" /><h2>Choose filters</h2></Flex>
          <Text as="label" htmlFor="explore-tag-search" size="2" className="explore-label">Filter visible {CATEGORY_LABELS[category].toLowerCase()}</Text>
          <form method="get" action="/Explore" className="explore-search">
            <input id="explore-tag-search" name="tag" defaultValue={firstQueryValue(params.tag) || ''} placeholder="Search tags…" />
            <input type="hidden" name="category" value={category} />
            <input type="hidden" name="include" value={selectedIds.join(',')} />
            <input type="hidden" name="exclude" value={exclude.join(',')} />
            <input type="hidden" name="minimumTagRank" value={minimumTagRank} />
            <input type="hidden" name="sort" value={sort} />
            <input type="hidden" name="order" value={order} />
            <input type="hidden" name="limit" value={limit} />
            <button type="submit" aria-label="Search visible tags"><Search size={17} aria-hidden="true" /></button>
          </form>

          {tagsResult.failed ? (
            <div className="feedback-state feedback-state-error" role="alert"><strong>Filters are temporarily unavailable</strong><p>Refresh the page to try loading the tag catalog again.</p></div>
          ) : (
            <div className="explore-tag-grid">
              {visibleTags.slice(0, 120).map(tag => {
                const active = selectedIds.includes(tag.mal_id)
                const blocked = exclude.includes(tag.mal_id)
                return (
                  <div key={tag.mal_id} className={`explore-tag ${active ? 'is-included' : ''} ${blocked ? 'is-excluded' : ''}`}>
                    <span>{tag.name}</span>
                    {tag.isAdult && <Badge size="1" color="red">18+</Badge>}
                    <Link prefetch={false} className="explore-include" href={filterHref(category, selectedIds, exclude, tag.mal_id, 'include', preserved)} aria-label={`${active ? 'Remove' : 'Include'} ${tag.name}`} data-selected={active || undefined}><Plus size={14} /></Link>
                    <Link prefetch={false} className="explore-exclude" href={filterHref(category, selectedIds, exclude, tag.mal_id, 'exclude', preserved)} aria-label={`${blocked ? 'Remove exclusion for' : 'Exclude'} ${tag.name}`} data-selected={blocked || undefined}><Minus size={14} /></Link>
                  </div>
                )
              })}
            </div>
          )}

          {category !== 'genres' && selected.length > 0 && (
            <form method="get" action="/Explore" className="tag-rank-control">
              <input type="hidden" name="category" value={category} />
              <input type="hidden" name="include" value={selectedIds.join(',')} />
              <input type="hidden" name="exclude" value={exclude.join(',')} />
              <input type="hidden" name="sort" value={sort} />
              <input type="hidden" name="order" value={order} />
              <input type="hidden" name="limit" value={limit} />
              <label htmlFor="minimum-tag-rank"><span>Minimum tag relevance</span><strong>{minimumTagRank}%</strong></label>
              <input id="minimum-tag-rank" className="tag-rank-slider" type="range" name="minimumTagRank" min="0" max="100" step="5" defaultValue={minimumTagRank} />
              <button type="submit">Apply relevance</button>
            </form>
          )}

          {(selected.length > 0 || exclude.length > 0) && (
            <Flex gap="2" wrap="wrap" mt="4" align="center">
              {selected.map(tag => <Badge key={`selected-${tag.mal_id}`} size="2" className="filter-chip filter-chip-include">{tag.name}</Badge>)}
              {excludedTags.map(tag => <Badge key={`excluded-${tag.mal_id}`} size="2" className="filter-chip filter-chip-exclude">Not {tag.name}</Badge>)}
              <Link className="explore-clear" href={`/Explore?category=${category}`}>Clear filters</Link>
            </Flex>
          )}
        </Box>

        <ServerListingPage
          title="Matching Anime"
          description={selected.length ? `Results for ${names.join(', ')}` : 'Select a genre or tag to see matching anime.'}
          icon={<Filter size={28} aria-hidden="true" />}
          result={result}
          error={selected.length && !result ? 'These filters are temporarily unavailable.' : null}
          basePath="/Explore"
          query={{ category, include: selectedIds.join(','), exclude: exclude.join(','), minimumTagRank, sort, order, limit }}
          sort={sort}
          order={order}
          showControls={selected.length > 0}
          asSection
        />
      </Container>
    </main>
  )
}

export default function ExplorePage({ searchParams }: { searchParams?: Promise<QueryParams> }) {
  return <Suspense fallback={<main className="page-shell"><div className="empty-state">Loading filters…</div></main>}><ExploreContent searchParams={searchParams} /></Suspense>
}
