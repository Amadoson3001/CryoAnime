import React from 'react';
import Image from 'next/image';
import { Box, Badge, Flex, Text } from '@radix-ui/themes';
import { Heart } from 'lucide-react';
import { CharacterData } from '@/lib/api';

interface CharacterWithRole {
  character: CharacterData;
  role: string;
  favorites?: number;
  voice_actors?: any[];
}

interface CharacterCardProps {
  character: CharacterData | CharacterWithRole;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ character }) => {
  // Handle both possible character data structures
  // The Jikan API returns characters in format: { character: CharacterData, role: string, favorites?: number, voice_actors: [...] }
  // We need to extract the character data and handle the role properly
  const charData = 'character' in character ? character.character : character;
  const role = 'role' in character ? character.role : charData.role || 'Unknown Role';

  // Skip characters without required data
  if (!charData || !charData.mal_id) {
    return null;
  }

  // Ensure we have a valid favorites count
  // Check both the character data and the wrapper object for favorites
  const characterFavorites = charData?.favorites;
  const wrapperFavorites = 'favorites' in character ? character.favorites : undefined;
  const favoritesCount = wrapperFavorites || characterFavorites;
  const displayFavorites = (typeof favoritesCount === 'number' && !isNaN(favoritesCount) && favoritesCount > 0)
    ? favoritesCount.toLocaleString()
    : '0';

  return (
    <Box
      key={charData.mal_id}
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-3)',
        overflow: 'hidden',
        cursor: 'pointer',
        transform: 'scale(1)',
        transition: 'transform 0.3s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {/* Character Image - Full size without padding */}
      <Box
        style={{
          position: 'relative',
          borderRadius: 'var(--radius-3)',
          overflow: 'hidden',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
          width: '100%',
          height: '200px',
          marginBottom: '0.75rem'
        }}
      >
        <Image
          src={
            charData.images?.webp?.image_url ||
            charData.images?.jpg?.image_url ||
            '/placeholder-character.jpg'
          }
          alt={charData.name || 'Character'}
          fill
          style={{
            objectFit: 'cover'
          }}
        />

        {/* Overlay with character info */}
        <Box
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.95))',
            padding: '1rem 0.75rem 0.75rem',
            color: 'white'
          }}
        >
          <div style={{
            fontSize: '1rem',
            fontWeight: 'bold',
            marginBottom: '0.25rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.9)',
            color: '#ffffff'
          }}>
            {charData.name || 'Unknown Character'}
          </div>
          <div style={{
            fontSize: '0.8rem',
            color: '#e2e8f0',
            marginBottom: '0.75rem',
            fontWeight: '500',
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.9)',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            padding: '0.25rem 0.5rem',
            borderRadius: '0.25rem',
            display: 'inline-block'
          }}>
            {role}
          </div>
          <Flex justify="center">
            <Badge
              variant="soft"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.98)',
                color: 'white',
                fontSize: '0.8rem',
                padding: '0.375rem 0.75rem',
                borderRadius: 'var(--radius-2)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontWeight: '600',
                backdropFilter: 'blur(4px)',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <Heart size={12} fill="currentColor" />
              {displayFavorites}
            </Badge>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
};

export default CharacterCard;