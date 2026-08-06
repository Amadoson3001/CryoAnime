'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Box, Badge, Flex, Text } from '@/components/ui-primitives';
import { Heart, Mic, ChevronDown, ChevronUp } from 'lucide-react';
import type { CharacterData, VoiceActorData } from '@/lib/anime-models';

interface CharacterWithRole {
  character: CharacterData;
  role: string;
  favorites?: number;
  voice_actors?: VoiceActorData[];
}

interface CharacterCardProps {
  character: CharacterData | CharacterWithRole;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ character }) => {
  const [showVoiceActors, setShowVoiceActors] = useState(false);

  const charData = 'character' in character ? character.character : character;
  const role = 'role' in character ? character.role : charData.role || 'Unknown Role';
  const voiceActors: VoiceActorData[] = ('voice_actors' in character && character.voice_actors)
    ? character.voice_actors
    : [];

  if (!charData || !charData.mal_id) {
    return null;
  }

  const characterFavorites = charData?.favorites;
  const wrapperFavorites = 'favorites' in character ? character.favorites : undefined;
  const favoritesCount = wrapperFavorites || characterFavorites;
  const displayFavorites = (typeof favoritesCount === 'number' && !isNaN(favoritesCount) && favoritesCount > 0)
    ? favoritesCount.toLocaleString('en-US')
    : '0';

  // Get Japanese voice actors
  const japaneseVA = voiceActors.filter(va => va.language === 'Japanese');

  return (
    <Box
      key={charData.mal_id}
      className="character-card"
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-3)',
        overflow: 'hidden'
      }}
    >
      {/* Character Image */}
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
            '/placeholder-anime.svg'
          }
          alt={charData.name || 'Character'}
          fill
          sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
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

          {charData.name_kanji && (
            <div style={{
              fontSize: '0.75rem',
              color: '#cbd5e1',
              marginBottom: '0.5rem',
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.9)'
            }}>
              {charData.name_kanji}
            </div>
          )}

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

          {/* Voice Actor Toggle */}
          {japaneseVA.length > 0 && (
            <button
              type="button"
              className="character-va-toggle"
              aria-expanded={showVoiceActors}
              aria-controls={`character-${charData.mal_id}-voice-actors`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                cursor: 'pointer',
                padding: '0.25rem 0',
                marginTop: '0.25rem'
              }}
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                setShowVoiceActors(!showVoiceActors);
              }}
            >
              <Mic size={10} style={{ color: '#a855f7' }} />
              <span style={{ fontSize: '0.7rem', color: '#a855f7' }}>
                {japaneseVA.length} VA{japaneseVA.length > 1 ? 's' : ''}
              </span>
              {showVoiceActors ? <ChevronUp size={10} style={{ color: '#a855f7' }} /> : <ChevronDown size={10} style={{ color: '#a855f7' }} />}
            </button>
          )}

          <Flex justify="center" mt="2">
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

      {/* Voice Actors Expandable Section */}
      {showVoiceActors && japaneseVA.length > 0 && (
        <Box
          id={`character-${charData.mal_id}-voice-actors`}
          style={{
            backgroundColor: '#1e293b',
            borderRadius: 'var(--radius-3)',
            padding: '0.75rem',
            marginTop: '-0.5rem'
          }}
        >
          <Text as="p" size="1" mb="2" style={{ color: '#94a3b8', fontWeight: 'bold' }}>
            Voice Actors
          </Text>
          <Flex direction="column" gap="2">
            {japaneseVA.map((va, index) => (
              <Flex key={index} align="center" gap="2">
                <Box
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    position: 'relative',
                    flexShrink: 0
                  }}
                >
                  {va.person.images?.jpg?.image_url ? (
                    <Image
                      src={va.person.images.jpg.image_url}
                      alt={va.person.name}
                      fill
                      sizes="24px"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Mic size={10} style={{ color: '#64748b' }} />
                    </div>
                  )}
                </Box>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{
                    fontSize: '0.7rem',
                    color: 'white',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {va.person.name}
                  </div>
                  <div style={{
                    fontSize: '0.6rem',
                    color: '#94a3b8'
                  }}>
                    {va.language}
                  </div>
                </div>
              </Flex>
            ))}
          </Flex>
        </Box>
      )}

      {/* Nicknames */}
      {charData.nicknames && charData.nicknames.length > 0 && !showVoiceActors && (
        <Box
          style={{
            backgroundColor: '#1e293b',
            borderRadius: 'var(--radius-3)',
            padding: '0.5rem 0.75rem',
            marginTop: '-0.5rem'
          }}
        >
          <Text as="p" size="1" style={{ color: '#94a3b8' }}>
            <span style={{ fontWeight: 'bold' }}>Also known as:</span> {charData.nicknames.join(', ')}
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default CharacterCard;
