'use client'
import React from 'react'
import Link from 'next/link'
import { Heart, Github, ExternalLink } from 'lucide-react'
import {
  Box,
  Container,
  Flex,
  Grid,
  Text,
  Separator
} from '@radix-ui/themes'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    explore: [
      { name: 'Top Anime', href: '/top-rated' },
      { name: 'Genres', href: '/Explore' },
      { name: 'Seasons', href: '/seasons' },
      { name: 'Schedule', href: '/schedule' },
    ],
    community: [
      { name: 'Forums', href: '/forums' },
      { name: 'Reviews', href: '/reviews' },
      { name: 'Recommendations', href: '/recommendations' },
      { name: 'Clubs', href: '/clubs' },
    ],
    help: [
      { name: 'About Us', href: '/about' },
      { name: 'Contact', href: '/contact' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Privacy Policy', href: '/privacy' },
    ],
  }

  return (
    <Box
      style={{
        backgroundColor: '#0f172a',
        color: '#94a3b8',
        borderTop: '1px solid #1e293b'
      }}
      py={{ initial: '4', md: '4' }}
      px={{ initial: '3', md: '4' }}
    >
      <Container size="4" px={{ initial: '0', sm: '4' }}>
        {/* Main footer content */}
        <Grid
          columns={{ initial: '1', md: '2', lg: '4' }}
          gap={{ initial: '4', md: '6' }}
          py={{ initial: '3', md: '4' }}
        >
          {/* Brand section */}
          <Box>
            <Flex align="center" gap="2" mb="3">
              <Text size="6" weight="bold" style={{ color: '#3b82f6' }}>
                CryoAnime
              </Text>
            </Flex>
            <Text as="p" size="2" mb="4" style={{ color: '#cbd5e1' }}>
              Your ultimate destination for discovering, tracking, and enjoying anime with CryoAnime.
            </Text>
            <Flex align="center" gap="4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#94a3b8', textDecoration: 'none' }}
              >
                <Github size={20} />
              </a>
            </Flex>
          </Box>

          {/* Explore section */}
          <Box>
            <Text
              as="p"
              size="4"
              weight="bold"
              mb="3"
              style={{
                color: 'white'
              }}
            >
              Explore
            </Text>
            <Flex direction="column" gap="2">
              {footerLinks.explore.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  style={{
                    color: '#cbd5e1',
                    fontSize: 'var(--font-size-2)',
                    textDecoration: 'none'
                  }}
                >
                  {link.name}
                </Link>
              ))}
            </Flex>
          </Box>

          {/* Community section */}
          <Box>
            <Text
              as="p"
              size="4"
              weight="bold"
              mb="3"
              style={{
                color: 'white'
              }}
            >
              Community
            </Text>
            <Flex direction="column" gap="2">
              {footerLinks.community.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  style={{
                    color: '#cbd5e1',
                    fontSize: 'var(--font-size-2)',
                    textDecoration: 'none'
                  }}
                >
                  {link.name}
                </Link>
              ))}
            </Flex>
          </Box>

          {/* Help section */}
          <Box>
            <Text
              as="p"
              size="4"
              weight="bold"
              mb="3"
              style={{
                color: 'white'
              }}
            >
              Help & Support
            </Text>
            <Flex direction="column" gap="2">
              {footerLinks.help.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  style={{
                    color: '#cbd5e1',
                    fontSize: 'var(--font-size-2)',
                    textDecoration: 'none'
                  }}
                >
                  {link.name}
                </Link>
              ))}
            </Flex>
          </Box>
        </Grid>

        {/* Bottom section */}
        <Separator size="4" my="4" style={{ backgroundColor: '#1e293b' }} />

        <Flex
          direction={{ initial: 'column', md: 'row' }}
          justify="between"
          align="center"
          py={{ initial: '3', md: '4' }}
          wrap="wrap"
          gap="2"
          style={{ width: '100%' }}
        >
          <Text as="p" size="2" mb={{ initial: '2', md: '0' }} style={{ color: '#94a3b8' }}>
            © {currentYear} CryoAnime. All rights reserved.
          </Text>
          <Text
            as="p"
            size="1"
            style={{
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1)'
            }}
          >
            <span>Made with</span>
            <Heart size={12} style={{ color: '#ef4444' }} fill="currentColor" />
            <span>for anime fans worldwide</span>
          </Text>
          <Flex align="center" gap="4" style={{ color: '#94a3b8' }}>
            <Text size="2">Powered by</Text>
            <a
              href="https://jikan.moe/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-1)',
                textDecoration: 'none'
              }}
            >
              <Text size="2">Jikan API</Text>
              <ExternalLink size={14} />
            </a>
          </Flex>
        </Flex>
      </Container>
    </Box>
  )
}

export default Footer