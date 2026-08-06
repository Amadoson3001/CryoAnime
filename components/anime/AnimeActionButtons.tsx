'use client'

import { useState } from 'react'
import { Flex, Button } from '@/components/ui-primitives'
import { Heart, Share2, Plus, Check } from 'lucide-react'
import type { AnimeListItem } from '@/lib/anime-models'
import { useLibrary } from '@/hooks/useLibrary'

interface AnimeActionButtonsProps {
  anime: AnimeListItem
}

export default function AnimeActionButtons({ anime }: AnimeActionButtonsProps) {
  const { isFavorite, isInWatchlist, toggleFavorite, toggleWatchlist } = useLibrary(anime)
  const [shareStatus, setShareStatus] = useState<string | null>(null)

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
    if (!shareUrl) return
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: anime.title_english || anime.title,
          text: `Check out ${anime.title_english || anime.title} on CryoAnime!`,
          url: shareUrl,
        })
        return
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return
      }
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = shareUrl
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        const copied = document.execCommand('copy')
        textarea.remove()
        if (!copied) throw new Error('Clipboard is unavailable.')
      }
      setShareStatus('Link copied to clipboard.')
    } catch {
      setShareStatus('Could not copy the link. Copy it from the browser address bar instead.')
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
            transition: 'background-color 0.2s ease, transform 0.2s ease'
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
            transition: 'background-color 0.2s ease, transform 0.2s ease'
          }}
          onClick={toggleWatchlist}
        >
          {isInWatchlist ? <Check size={16} /> : <Plus size={16} />}
          {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
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
      {shareStatus && <p className="share-status" role="status">{shareStatus}</p>}
    </Flex>
  )
}
