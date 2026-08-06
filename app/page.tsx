import { Suspense } from 'react'
import Hero from '@/components/hero'
import FeaturedSection, { FeaturedSectionFallback } from '@/components/featured-section'

export default function Home() {
  return (
    <main>
        <Hero />
        {/* FeaturedSection streams independently so the hero stays immediate. */}
        <Suspense fallback={<FeaturedSectionFallback />}>
          <FeaturedSection />
        </Suspense>
    </main>
  )
}
