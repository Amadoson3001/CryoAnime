import Link from 'next/link'
import { Bookmark, CalendarDays, Compass, Sparkles, TrendingUp } from 'lucide-react'
import { Button, Container } from '@/components/ui-primitives'

const highlights = [
  {
    icon: Sparkles,
    value: '10K+ titles',
    label: 'A broad catalog, kept quick to browse',
  },
  {
    icon: CalendarDays,
    value: 'Fresh every season',
    label: 'Current charts and weekly schedules',
  },
  {
    icon: Bookmark,
    value: 'Your private library',
    label: 'Favorites stay on this device',
  },
]

export default function Hero() {
  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <Container size="4" className="home-hero-container">
        <div className="home-hero-copy">
          <p className="home-hero-eyebrow">
            <Sparkles size={15} aria-hidden="true" />
            Find the show that fits tonight
          </p>
          <h1 id="home-hero-title" className="home-hero-title">
            Your next favorite anime is <span>closer than you think.</span>
          </h1>
          <p className="home-hero-description">
            Search the full catalog, follow what is airing, and keep a personal shortlist—without an account or a slow, cluttered interface.
          </p>
          <div className="home-hero-actions">
            <Button asChild size="3" className="hero-action hero-action-primary">
              <Link href="/Explore" prefetch={false}>
                <Compass size={19} aria-hidden="true" />
                Explore anime
              </Link>
            </Button>
            <Button asChild size="3" variant="soft" className="hero-action hero-action-secondary">
              <Link href="/trending" prefetch={false}>
                <TrendingUp size={19} aria-hidden="true" />
                See what&apos;s trending
              </Link>
            </Button>
          </div>
        </div>

        <ul className="home-hero-highlights" aria-label="CryoAnime highlights">
          {highlights.map(({ icon: Icon, value, label }) => (
            <li key={value}>
              <span className="home-highlight-icon" aria-hidden="true"><Icon size={19} /></span>
              <span>
                <strong>{value}</strong>
                <small>{label}</small>
              </span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
