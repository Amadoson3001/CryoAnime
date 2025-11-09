// app/layout.tsx (or pages/_app.tsx)
import './globals.css'
import './anime-theme.css'
import './optimized-animations.css'
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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={inter.className}
        style={{ backgroundColor: '#0f172a', color: '#f1f5f9' }}
      >
        {/* Minimal inline theme guard to avoid extra runtime work */}
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('dark');`,
          }}
        />

        {/* Potato-mode: if user previously opted into ultra-low effects, apply class ASAP */}
        <Script
          id="potato-pref"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const pref = window.localStorage.getItem('cryoanime-potato-mode');
                if (pref === '1') {
                  document.documentElement.classList.add('potato-mode');
                }
              } catch (e) {}
            `
          }}
        />

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
