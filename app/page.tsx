'use client'

import React, { Suspense, useEffect } from 'react'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import dynamic from 'next/dynamic'

// Above-the-fold Hero: keep as a lightweight client component, with a minimal skeleton
const Hero = dynamic(() => import('@/components/hero'), {
  ssr: true,
  loading: () => (
    <div
      style={{
        backgroundColor: '#0f172a',
        paddingTop: '6rem',
        paddingBottom: '4rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          width: '80%',
          maxWidth: 800,
          height: 160,
          borderRadius: 16,
          background:
            'linear-gradient(90deg, rgba(148,163,253,0.04), rgba(37,99,235,0.08))'
        }}
      />
    </div>
  )
})

// Below-the-fold FeaturedSection: defer loading on slow devices until after first paint/idle
const FeaturedSection = dynamic(
  () => import('@/components/featured-section'),
  {
    ssr: false,
    loading: () => null
  }
)

export default function Home() {
  // Optional: mild hint for very low-end devices to pre-warm JS after idle
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      ; (window as any).requestIdleCallback(() => {
        // placeholder for any future low-priority work
      })
    }
  }, [])

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
