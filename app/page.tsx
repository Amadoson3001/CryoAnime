'use client'

import React, { Suspense } from 'react'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import dynamic from 'next/dynamic'

// Lazy load the Hero component
const Hero = dynamic(() => import('@/components/hero'), {
  loading: () => (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      padding: '2rem',
      backgroundColor: '#0f172a'
    }}>
      <div>Loading hero section...</div>
    </div>
  )
})

// Lazy load the FeaturedSection component
const FeaturedSection = dynamic(() => import('@/components/featured-section'), {
  loading: () => (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      padding: '2rem',
      backgroundColor: '#0f172a'
    }}>
      <div>Loading featured anime...</div>
    </div>
  )
})

export default function Home() {
  return (
    <>
      <Header />
      <main style={{ backgroundColor: '#0f172a' }}>
        <Suspense fallback={
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            padding: '2rem',
            backgroundColor: '#0f172a'
          }}>
            <div>Loading hero section...</div>
          </div>
        }>
          <Hero />
        </Suspense>
        <Suspense fallback={
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            padding: '2rem',
            backgroundColor: '#0f172a'
          }}>
            <div>Loading featured anime...</div>
          </div>
        }>
          <FeaturedSection />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
