// app/layout.tsx (or pages/_app.tsx)
import './globals.css'
import './anime-theme.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Theme } from '@radix-ui/themes'
import '@radix-ui/themes/styles.css'
import Script from 'next/script'
import Live2dWaifu from '@/components/live2d-waifu'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CryoAnime - Discover Your Next Favorite Anime',
  description: 'Explore thousands of anime series, movies, and OVAs with CryoAnime. Find detailed information, reviews, recommendations, and connect with a passionate anime community.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent dark theme hydration mismatch
              document.documentElement.classList.add('dark');
            `,
          }}
        />
      </head>
      <body className={inter.className} style={{ backgroundColor: '#0f172a', color: '#f1f5f9' }}>
        <Theme
          accentColor="blue"
          grayColor="slate"
          panelBackground="solid"
          radius="large"
          scaling="100%"
        >
          {children}
          <Live2dWaifu />
        </Theme>
      </body>
    </html>
  )
}
