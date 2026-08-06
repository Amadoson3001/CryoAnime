import Link from 'next/link'
import { ChevronRight, Trophy, Calendar } from 'lucide-react'
import { Container, Button } from '@/components/ui-primitives'
import { AnimeGrid } from '@/components/anime_cards'
import { getAnimeList, getCurrentSeasonInfo } from '@/lib/anilist'
import { readContentPreferences } from '@/lib/contentPreferences'

/** Server-rendered landing sections keep AniList off the browser network path. */
export default async function FeaturedSection() {
  const preferences = await readContentPreferences()
  const { year, season } = getCurrentSeasonInfo()
  const [top, seasonal] = await Promise.allSettled([
    getAnimeList({ page: 1, limit: 12, preferences, sort: 'score' }),
    getAnimeList({ page: 1, limit: 12, preferences, season, seasonYear: year }),
  ])
  const topItems = top.status === 'fulfilled' ? top.value.items : []
  const seasonalItems = seasonal.status === 'fulfilled' ? seasonal.value.items : []

  const sections = [
    { title: 'Top Rated Anime', eyebrow: 'Community favorites', icon: Trophy, data: topItems, error: top.status === 'rejected' ? 'Top-rated anime is temporarily unavailable.' : null, href: '/top-rated' },
    { title: 'Popular This Season', eyebrow: 'Airing now', icon: Calendar, data: seasonalItems, error: seasonal.status === 'rejected' ? 'Seasonal anime is temporarily unavailable.' : null, href: '/trending' },
  ]

  return (
    <section className="featured-sections" aria-label="Featured anime">
      <Container size="4">
        {sections.map((section, sectionIndex) => (
          <section key={section.title} className="featured-section" aria-labelledby={`${section.title.toLowerCase().replace(/\s+/g, '-')}-heading`}>
            <header className="section-heading-row">
              <div className="section-heading-copy">
                <span className="section-heading-icon" aria-hidden="true"><section.icon size={20} /></span>
                <div>
                  <p>{section.eyebrow}</p>
                  <h2 id={`${section.title.toLowerCase().replace(/\s+/g, '-')}-heading`}>{section.title}</h2>
                </div>
              </div>
              <Button asChild variant="ghost" size="2" className="section-view-all">
                <Link href={section.href} prefetch={false}>
                  <span>View all</span><ChevronRight size={16} aria-hidden="true" />
                </Link>
              </Button>
            </header>
            <AnimeGrid animeList={section.data} error={section.error} priorityCount={sectionIndex === 0 ? 2 : 0} />
          </section>
        ))}
        <aside className="featured-cta">
          <div><strong>Still deciding?</strong><p>Mix genres, themes, and tags to narrow the catalog around your mood.</p></div>
          <Button asChild size="3" className="featured-cta-button"><Link href="/Explore" prefetch={false}>Open advanced explore</Link></Button>
        </aside>
      </Container>
    </section>
  )
}

/** Keeps the original landing-page skeleton visible while the cached server
 * sections stream in, instead of leaving a blank gap below the hero. */
export function FeaturedSectionFallback() {
  return (
    <section className="featured-sections" aria-label="Featured anime loading">
      <Container size="4">
        {["Top Rated Anime", "Popular This Season"].map(title => (
          <section key={title} className="featured-section" aria-label={`${title} loading`}>
            <header className="section-heading-row"><h2>{title}</h2></header>
            <AnimeGrid animeList={[]} loading />
          </section>
        ))}
      </Container>
    </section>
  )
}
