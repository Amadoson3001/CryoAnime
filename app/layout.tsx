// app/layout.tsx (or pages/_app.tsx)
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Theme } from '@radix-ui/themes'
import '@radix-ui/themes/styles.css'
import Script from 'next/script'
import { Suspense } from 'react'
import CookieConsent from '@/components/cookie-consent'

import Live2dWaifuWrapper from '@/components/Live2dWaifuWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CryoAnime - Discover Your Next Favorite Anime',
  description: 'Explore thousands of anime series, movies, and OVAs with CryoAnime. Find detailed information, reviews, recommendations, and connect with a passionate anime community.',
  icons: {
    icon: '/favicon.ico',
  },
  // Security/SEO meta
  robots: {
    index: true,
    follow: true,
    nocache: false,
  },
  // Prevent phone number detection
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'CryoAnime',
    title: 'CryoAnime - Discover Your Next Favorite Anime',
    description: 'Explore thousands of anime series, movies, and OVAs with CryoAnime.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={inter.className}
        style={{ backgroundColor: '#0f172a', color: '#f1f5f9' }}
      >
        {/* Minimal theme guard to avoid extra runtime work */}
        <Script src="/theme-guard.js" strategy="beforeInteractive" />

        {/* Potato-mode: if user previously opted into ultra-low effects, apply class ASAP */}
        {/* Also auto-enable for mobile and low-end devices on first visit */}
        <Script src="/potato-mode.js" strategy="beforeInteractive" />

        {/* Keep Radix Theme but avoid dynamic props that could cause re-renders */}
        <Theme
          accentColor="blue"
          grayColor="slate"
          panelBackground="solid"
          radius="large"
          scaling="100%"
        >
          {children}

          {/* Defer non-critical, heavy UI to reduce initial main-thread work */}
          <Suspense fallback={null}>
            <Live2dWaifuWrapper />
          </Suspense>

          <Suspense fallback={null}>
            <CookieConsent />
          </Suspense>
        </Theme>
      </body>
    </html>
  )
}
