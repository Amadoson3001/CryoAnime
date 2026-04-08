'use client'

import React, { useState } from 'react'
import { Text, Button, Box } from '@radix-ui/themes'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface AnimeSynopsisProps {
  synopsis?: string
}

export default function AnimeSynopsis({ synopsis }: AnimeSynopsisProps) {
  const [synopsisExpanded, setSynopsisExpanded] = useState(false)

  if (!synopsis) {
    return <Text as="p" size="3" style={{ color: '#cbd5e1' }}>No synopsis available.</Text>
  }

  const truncateText = (text: string, maxLength: number = 300) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }

  const displaySynopsis = synopsisExpanded ? synopsis : truncateText(synopsis)
  const isLong = synopsis.length > 300

  return (
    <Box mb="6">
      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem', color: 'white' }}>
        Synopsis
      </div>
      <div style={{ position: 'relative' }}>
        <Text
          as="p"
          size="3"
          style={{
            color: '#cbd5e1',
            lineHeight: '1.6',
            marginBottom: isLong ? '1rem' : '0'
          }}
        >
          {displaySynopsis}
        </Text>
        {isLong && (
          <Button
            variant="ghost"
            size="2"
            onClick={() => setSynopsisExpanded(!synopsisExpanded)}
            style={{
              color: '#3b82f6',
              padding: '0.25rem 0.5rem',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              marginTop: '0.5rem'
            }}
          >
            {synopsisExpanded ? (
              <>
                <ChevronUp size={14} />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown size={14} />
                Read More
              </>
            )}
          </Button>
        )}
      </div>
    </Box>
  )
}
