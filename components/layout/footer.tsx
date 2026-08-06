import Link from 'next/link'
import { Heart, Github, ExternalLink } from 'lucide-react'
import {
  Box,
  Container,
  Flex,
  Grid,
  Text,
  Separator
} from '@/components/ui-primitives'

const Footer = () => {
  const footerLinks = {
    explore: [
      { name: 'Top Anime', href: '/top-rated' },
      { name: 'Genres', href: '/Explore' },
      { name: 'Seasons', href: '/seasonal' },
      { name: 'Schedule', href: '/schedule' },
    ],
    community: [
      { name: 'Discord Server (Coming Soon)', href: '#' },
    ],
    help: [
      { name: 'About Us', href: '/about' },
      { name: 'Contact', href: '/about' },
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
      py={{ initial: '5', md: '6' }}
      px={{ initial: '4', md: '6' }}
    >
      <Container size="4" px={{ initial: '0', sm: '4' }}>
        {/* Main footer content */}
        <Grid
          columns={{ initial: '1', md: '2', lg: '4' }}
          gap={{ initial: '6', md: '8' }}
          py={{ initial: '5', md: '6' }}
        >
          {/* Brand section */}
          <Box>
            <Flex align="center" gap="3" mb="4">
              <Text size="7" weight="bold" style={{ color: '#3b82f6' }}>
                CryoAnime
              </Text>
            </Flex>
            <Text as="p" size="3" mb="5" style={{ color: '#cbd5e1', lineHeight: '1.6' }}>
              Your ultimate destination for discovering, tracking, and enjoying anime with CryoAnime.
            </Text>
            <Flex align="center" gap="5">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#94a3b8', textDecoration: 'none' }}
              >
                <Github size={24} />
              </a>
            </Flex>
          </Box>

          {/* Explore section */}
          <Box>
            <Text
              as="p"
              size="5"
              weight="bold"
              mb="4"
              style={{
                color: 'white',
                position: 'relative',
                paddingBottom: '8px'
              }}
            >
              Explore
              <span style={{
                content: '',
                position: 'absolute',
                bottom: '0',
                left: '0',
                width: '40px',
                height: '3px',
                backgroundColor: '#3b82f6',
                borderRadius: '2px'
              }} />
            </Text>
            <Flex direction="column" gap="3">
              {footerLinks.explore.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="footer-link"
                  style={{
                    color: link.href === '#' ? '#64748b' : '#cbd5e1',
                    fontSize: 'var(--font-size-3)',
                    textDecoration: 'none',
                    transition: 'color 0.2s ease',
                    pointerEvents: link.href === '#' ? 'none' : 'auto'
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
              size="5"
              weight="bold"
              mb="4"
              style={{
                color: 'white',
                position: 'relative',
                paddingBottom: '8px'
              }}
            >
              Community
              <span style={{
                content: '',
                position: 'absolute',
                bottom: '0',
                left: '0',
                width: '40px',
                height: '3px',
                backgroundColor: '#3b82f6',
                borderRadius: '2px'
              }} />
            </Text>
            <Flex direction="column" gap="3">
              {footerLinks.community.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="footer-link"
                  style={{
                    color: link.href === '#' ? '#64748b' : '#cbd5e1',
                    fontSize: 'var(--font-size-3)',
                    textDecoration: 'none',
                    transition: 'color 0.2s ease',
                    pointerEvents: link.href === '#' ? 'none' : 'auto'
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
              size="5"
              weight="bold"
              mb="4"
              style={{
                color: 'white',
                position: 'relative',
                paddingBottom: '8px'
              }}
            >
              Help & Support
              <span style={{
                content: '',
                position: 'absolute',
                bottom: '0',
                left: '0',
                width: '40px',
                height: '3px',
                backgroundColor: '#3b82f6',
                borderRadius: '2px'
              }} />
            </Text>
            <Flex direction="column" gap="3">
              {footerLinks.help.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="footer-link"
                  style={{
                    color: link.href === '#' ? '#64748b' : '#cbd5e1',
                    fontSize: 'var(--font-size-3)',
                    textDecoration: 'none',
                    transition: 'color 0.2s ease',
                    pointerEvents: link.href === '#' ? 'none' : 'auto'
                  }}
                >
                  {link.name}
                </Link>
              ))}
            </Flex>
          </Box>
        </Grid>

        {/* Bottom section */}
        <Separator size="4" my="5" style={{ backgroundColor: '#1e293b' }} />

        <Flex
          direction={{ initial: 'column', md: 'row' }}
          justify="between"
          align="center"
          py={{ initial: '4', md: '5' }}
          wrap="wrap"
          gap="3"
          style={{ width: '100%' }}
        >
          <Text as="p" size="3" mb={{ initial: '2', md: '0' }} style={{ color: '#94a3b8' }}>
            © CryoAnime. All rights reserved.
          </Text>
          <Text
            as="p"
            size="2"
            style={{
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)'
            }}
          >
            <span>Made with</span>
            <Heart size={14} style={{ color: '#ef4444' }} fill="currentColor" />
            <span>for anime fans worldwide</span>
          </Text>
          <Flex align="center" gap="5" style={{ color: '#94a3b8' }}>
            <Text size="3">Powered by</Text>
            <a
              className="footer-provider-link"
              href="https://anilist.co/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }}
            >
              <Text size="3">AniList API</Text>
              <ExternalLink size={16} />
            </a>
          </Flex>
        </Flex>
      </Container>
    </Box>
  )
}

export default Footer
