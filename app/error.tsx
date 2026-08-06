'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Box, Container, Text, Button, Flex } from '@/components/ui-primitives'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main style={{ backgroundColor: '#0f172a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Container size="3" px="4">
        <Box style={{ textAlign: 'center' }}>
          <Box
            style={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 'var(--radius-5)',
              padding: '3rem',
              maxWidth: '500px',
              margin: '0 auto'
            }}
          >
            <AlertTriangle size={48} style={{ color: '#ef4444', marginBottom: '1.5rem' }} />

            <Text as="p" size="6" weight="bold" mb="3" style={{ color: 'white' }}>
              Something went wrong
            </Text>

            <Text as="p" size="3" mb="6" style={{ color: '#94a3b8', lineHeight: '1.6' }}>
              An unexpected error occurred while loading this page. Please try again.
            </Text>

            <Flex gap="3" justify="center">
              <Button
                onClick={reset}
                style={{ backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer' }}
              >
                <RefreshCw size={16} />
                Try Again
              </Button>
              <Button variant="soft" asChild>
                <Link href="/">
                  <ArrowLeft size={16} />
                  Back to Home
                </Link>
              </Button>
            </Flex>
          </Box>
        </Box>
      </Container>
    </main>
  )
}
