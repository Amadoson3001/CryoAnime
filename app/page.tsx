import { Suspense } from 'react'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import Hero from '@/components/hero'
import FeaturedSection from '@/components/featured-section'

export default function Home() {
  return (
    <>
      <Header />
      <main style={{ backgroundColor: '#0f172a' }}>
        <Suspense
          fallback={
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '2rem',
                backgroundColor: '#0f172a'
              }}
            >
              <div>Loading hero section...</div>
            </div>
          }
        >
          <Hero />
        </Suspense>

        {/* FeaturedSection is non-critical; it lazy-loads without blocking TTI */}
        <Suspense fallback={null}>
          <FeaturedSection />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
