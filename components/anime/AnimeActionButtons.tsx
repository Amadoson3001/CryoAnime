'use client'

import React from 'react'
import { Flex, Button, Tooltip } from '@radix-ui/themes'
import { Heart, Share2, Plus, Check } from 'lucide-react'
import { AnimeData } from '@/lib/api'
import { useLibrary } from '@/hooks/useLibrary'

interface AnimeActionButtonsProps {
  anime: AnimeData
}

export default function AnimeActionButtons({ anime }: AnimeActionButtonsProps) {
  const { isFavorite, isInWatchlist, toggleFavorite, toggleWatchlist } = useLibrary(anime)

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: anime.title_english || anime.title,
        text: `Check out ${anime.title_english || anime.title} on CryoAnime!`,
        url: window.location.href
      }).catch(() => {
        // Fallback or ignore error
      })
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  return (
    <Flex direction="column" gap="3" mt="4">
      <Flex gap="3">
        <Button 
          style={{ 
            flex: 1, 
            backgroundColor: isFavorite ? '#ef4444' : '#1e293b', 
            color: 'white',
            transition: 'all 0.2s ease'
          }}
          onClick={toggleFavorite}
        >
          <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
          {isFavorite ? 'In Favorites' : 'Add to Favorites'}
        </Button>
        
        <Button 
          variant="soft" 
          style={{ 
            flex: 1,
            backgroundColor: isInWatchlist ? '#10b981' : '#1e293b', 
            color: 'white',
            transition: 'all 0.2s ease'
          }}
          onClick={toggleWatchlist}
        >
          {isInWatchlist ? <Check size={16} /> : <Plus size={16} />}
          {isInWatchlist ? 'Waitlisted' : 'Watchlist'}
        </Button>
      </Flex>
      
      <Button 
        variant="ghost" 
        style={{ 
          width: '100%',
          backgroundColor: 'rgba(59, 130, 246, 0.1)', 
          color: '#3b82f6',
          border: '1px solid rgba(59, 130, 246, 0.2)' 
        }}
        onClick={handleShare}
      >
        <Share2 size={16} />
        Share Anime
      </Button>
    </Flex>
  )
}
