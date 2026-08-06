// app/layout.tsx (or pages/_app.tsx)
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Theme } from '@/components/ui-primitives'
import { Suspense } from 'react'
import CookieConsent from '@/components/cookie-consent'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import { ContentPreferenceProvider } from '@/components/content-preference-provider'
import { DEFAULT_CONTENT_PREFERENCES } from '@/lib/contentRatings'

import Live2dWaifuWrapper from '@/components/Live2dWaifuWrapper'

const inter = Inter({ subsets: ['latin'] })

function ApplicationFrame({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#page-content">Skip to content</a>
      <Header />
      <div id="page-content" tabIndex={-1}>{children}</div>
      <Footer />
      <Suspense fallback={null}>
        <Live2dWaifuWrapper />
      </Suspense>
      <Suspense fallback={null}>
        <CookieConsent />
      </Suspense>
    </>
  )
}

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={inter.className}
      >
        {/* Keep theme values stable so the shell can hydrate without layout shifts. */}
        <Theme
          accentColor="blue"
          grayColor="slate"
          panelBackground="solid"
          radius="large"
          scaling="100%"
        >
          <ContentPreferenceProvider initial={DEFAULT_CONTENT_PREFERENCES}>
            <ApplicationFrame>{children}</ApplicationFrame>
          </ContentPreferenceProvider>
        </Theme>
      </body>
    </html>
  )
}
