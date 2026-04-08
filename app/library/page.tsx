'use client'

import React from 'react'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import { AnimeGrid } from '@/components/anime_cards'
import { useLibrary } from '@/hooks/useLibrary'
import { 
  Container, 
  Box, 
  Text, 
  Tabs, 
  Flex,
  Heading
} from '@radix-ui/themes'
import { Heart, Bookmark, Library as LibraryIcon } from 'lucide-react'

export default function LibraryPage() {
  const { favorites, watchlist } = useLibrary()

  return (
    <>
      <Header />
      <main style={{ backgroundColor: '#0f172a', minHeight: '100vh', paddingTop: '5rem' }}>
        <Container size="4" px="4" py={{ initial: '12', md: '10' }}>
          {/* Page Header */}
          <Box mb="8" style={{ textAlign: 'center' }}>
            <Flex align="center" justify="center" gap="3" mb="4">
              <LibraryIcon size={32} style={{ color: '#3b82f6' }} />
              <h1 style={{
                fontSize: 'var(--font-size-8)',
                fontWeight: 'bold',
                color: 'white',
                margin: 0
              }}>
                My Library
              </h1>
            </Flex>
            <Text as="p" size="4" style={{ color: '#cbd5e1', maxWidth: '600px', margin: '0 auto' }}>
              Your personal collection of favorites and saved anime
            </Text>
          </Box>

          {/* Library Content Tabs */}
          <Tabs.Root defaultValue="watchlist">
            <Flex justify="center" mb="8">
              <Tabs.List size="2" style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '4px', borderRadius: '12px' }}>
                <Tabs.Trigger value="watchlist" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <Bookmark size={16} />
                  Watchlist ({watchlist.length})
                </Tabs.Trigger>
                <Tabs.Trigger value="favorites" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <Heart size={16} />
                  Favorites ({favorites.length})
                </Tabs.Trigger>
              </Tabs.List>
            </Flex>

            <Box mt="6">
              <Tabs.Content value="watchlist">
                <Box>
                  {watchlist.length > 0 ? (
                    <AnimeGrid animeList={watchlist} />
                  ) : (
                    <EmptyState 
                      icon={<Bookmark size={48} />} 
                      title="Your watchlist is empty" 
                      description="Start adding anime you want to watch by clicking the plus icon on any anime card or detail page." 
                    />
                  )}
                </Box>
              </Tabs.Content>

              <Tabs.Content value="favorites">
                <Box>
                  {favorites.length > 0 ? (
                    <AnimeGrid animeList={favorites} />
                  ) : (
                    <EmptyState 
                      icon={<Heart size={48} />} 
                      title="No favorites yet" 
                      description="Mark your favorite anime with a heart to see them listed here for quick access." 
                    />
                  )}
                </Box>
              </Tabs.Content>
            </Box>
          </Tabs.Root>
        </Container>
      </main>
      <Footer />
    </>
  )
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <Box style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <Flex direction="column" align="center" gap="4">
        <Box style={{ color: '#334155', opacity: 0.5 }}>
          {icon}
        </Box>
        <Heading as="h3" size="5" style={{ color: 'white' }}>
          {title}
        </Heading>
        <Text as="p" size="3" style={{ color: '#94a3b8', maxWidth: '400px' }}>
          {description}
        </Text>
      </Flex>
    </Box>
  )
}
