'use client'

import React, { useState } from 'react'
import { Box, Flex, Text, Grid, Button } from '@radix-ui/themes'
import { Users, ChevronDown, ChevronUp } from 'lucide-react'
import CharacterCard from './CharacterCard'
import { CharacterWithRole } from '@/lib/api'

interface CharacterGridProps {
  mainCharacters: CharacterWithRole[]
  supportingCharacters: CharacterWithRole[]
  initialVisible?: number
}

export default function CharacterGrid({ mainCharacters, supportingCharacters, initialVisible = 12 }: CharacterGridProps) {
  const [showAll, setShowAll] = useState(false)

  const sortByImportance = (a: CharacterWithRole, b: CharacterWithRole) => {
    const favA = a.favorites || a.character.favorites || 0
    const favB = b.favorites || b.character.favorites || 0
    return favB - favA
  }

  const sortedMain = [...mainCharacters].sort(sortByImportance)
  const sortedSupporting = [...supportingCharacters].sort(sortByImportance)
  const allCharacters = [...sortedMain, ...sortedSupporting]
  const visibleCharacters = showAll ? allCharacters : allCharacters.slice(0, initialVisible)
  const hasMore = allCharacters.length > initialVisible

  const visibleMain = visibleCharacters.filter(c => c.role === 'Main')
  const visibleSupporting = visibleCharacters.filter(c => c.role !== 'Main')
  const hiddenCount = allCharacters.length - visibleCharacters.length

  return (
    <Box mb="6">
      {/* Main Characters */}
      {visibleMain.length > 0 && (
        <Box mb="6">
          <Flex align="center" gap="2" mb="4">
            <Users size={20} style={{ color: '#3b82f6' }} />
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>
              Main Characters ({mainCharacters.length})
            </div>
          </Flex>
          <Grid columns={{ initial: '2', sm: '3', md: '4' }} gap="4">
            {visibleMain.map((character: CharacterWithRole, index: number) => (
              <CharacterCard key={`main_char_${character.character.mal_id}_${index}`} character={character} />
            ))}
          </Grid>
        </Box>
      )}

      {/* Supporting Characters */}
      {visibleSupporting.length > 0 && (
        <Box mb="6">
          <Flex align="center" gap="2" mb="4">
            <Users size={20} style={{ color: '#10b981' }} />
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white' }}>
              Supporting Characters ({supportingCharacters.length})
            </div>
          </Flex>
          <Grid columns={{ initial: '2', sm: '3', md: '4' }} gap="4">
            {visibleSupporting.map((character: CharacterWithRole, index: number) => (
              <CharacterCard key={`support_char_${character.character.mal_id}_${index}`} character={character} />
            ))}
          </Grid>
        </Box>
      )}

      {/* Show More / Show Less Button */}
      {hasMore && (
        <Flex justify="center" mt="4">
          <Button
            variant="soft"
            onClick={() => setShowAll(!showAll)}
            style={{
              backgroundColor: '#1e293b',
              color: '#3b82f6',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              padding: '0.5rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {showAll ? (
              <>
                <ChevronUp size={16} />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown size={16} />
                Show More ({hiddenCount} more)
              </>
            )}
          </Button>
        </Flex>
      )}
    </Box>
  )
}
