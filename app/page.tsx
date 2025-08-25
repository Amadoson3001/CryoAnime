import React from 'react'
import Header from '@/components/layout/header'
import Hero from '@/components/hero'
import FeaturedSection from '@/components/featured-section'
import Footer from '@/components/layout/footer'


export default function Home() {
  return (
    <>
      <Header />
      <main style={{ backgroundColor: '#0f172a' }}>
        <Hero />
        <FeaturedSection />
      </main>
      <Footer />
    </>
  )
}
