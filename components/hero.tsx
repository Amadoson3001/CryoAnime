'use client'
import React, { memo } from 'react'
import Link from 'next/link'
import { Compass, Star, TrendingUp } from 'lucide-react'
import {
  Box,
  Container,
  Flex,
  Grid,
  Text,
  Button
} from '@radix-ui/themes'

const Hero = () => {
  const animationStyle = `
    @keyframes bounce {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-4px);
      }
    }
    .bouncing-icon {
      animation: bounce 2s infinite ease-in-out;
    }
    .animated-button {
      transition: all 0.2s ease-in-out;
    }
    .animated-button:hover {
      transform: scale(1.05);
      filter: brightness(1.1);
    }
  `

  return (
    <Box
      style={{
        backgroundColor: '#0f172a',
        color: 'white',
        overflow: 'hidden',
        position: 'relative',
        paddingTop: "6rem"
      }}
      py={{ initial: '9', sm: '9' }}
    >
      <style>{animationStyle}</style>
      <style>{`
        @keyframes clickAnimation {
          0% { transform: scale(1); }
          50% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        .click-animation {
          animation: clickAnimation 0.3s ease;
        }
      `}</style>
      {/* Enhanced animated background */}
      <Box
        position="absolute"
        inset="0"
      >
        {/* Grid pattern */}
        <Box
          position="absolute"
          inset="0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        ></Box>

        {/* Floating animated elements */}
        <Box
          position="absolute"
          top="25%"
          left="10"
          width="8"
          height="8"
          style={{
            borderRadius: '50%',
            background: 'var(--blue-a5)',
            filter: 'blur(24px)',
            opacity: 0.2
          }}
        ></Box>
        <Box
          position="absolute"
          top="33%"
          right="20"
          width="12"
          height="12"
          style={{
            borderRadius: '50%',
            background: 'var(--indigo-a4)',
            filter: 'blur(24px)',
            opacity: 0.2
          }}
        ></Box>
        <Box
          position="absolute"
          bottom="25%"
          left="25%"
          width="6"
          height="6"
          style={{
            borderRadius: '50%',
            background: 'var(--slate-a3)',
            filter: 'blur(24px)',
            opacity: 0.2
          }}
        ></Box>
        <Box
          position="absolute"
          top="50%"
          right="33%"
          width="10"
          height="10"
          style={{
            borderRadius: '50%',
            background: 'var(--blue-a4)',
            filter: 'blur(24px)',
            opacity: 0.2
          }}
        ></Box>
      </Box>

      <Container
        size="4"
        px={{ initial: '3', sm: '4' }}
        position="relative"
        mx="auto"
        style={{ maxWidth: '1024px' }}
      >
        <Box style={{ textAlign: 'center' }}>
          {/* Main heading */}
          <Text
            as="p"
            size={{ initial: '8', md: '9' }}
            weight="bold"
            mb={{ initial: '5', sm: '7' }}
            style={{ lineHeight: '1.2' }}
          >
            Discover Your Next
            <Box
              as="span"
              display="block"
              style={{
                color: '#3b82f6'
              }}
            >
              Favorite Anime with CryoAnime
            </Box>
          </Text>

          {/* Subtitle */}
          <Text
            as="p"
            size={{ initial: '4', md: '5' }}
            mb={{ initial: '9', sm: '9' }}
            style={{
              color: '#cbd5e1',
              maxWidth: '768px',
              margin: '0 auto',
              lineHeight: '1.6',
              paddingBottom: "1rem"
            }}
          >
            Explore thousands of anime series, movies, and OVAs. Find detailed information,
            reviews, recommendations, and connect with a passionate anime community.
          </Text>

          {/* CTA Buttons */}
          <Flex
            direction={{ initial: 'column', sm: 'row' }}
            gap={{ initial: '3', sm: '4' }}
            justify="center"
            align="center"
            mb={{ initial: '6', sm: '9' }}
          >
            <Link href="/Explore">
              <Button
                size={{ initial: '3', sm: '3' }}
                className="animated-button"
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  fontWeight: 'bold',
                  minHeight: '44px',
                  width: '100%',
                  maxWidth: '200px'
                }}
                onClick={(e) => {
                  const element = e.currentTarget;
                  element.classList.add('click-animation');
                  setTimeout(() => {
                    element.classList.remove('click-animation');
                  }, 300);
                }}
              >
                <Compass size={20} />
                Explore Anime
              </Button>
            </Link>
            <Link href="/trending" passHref>
              <Button
                size={{ initial: '3', sm: '3' }}
                variant="soft"
                className="animated-button"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontWeight: 'bold',
                  minHeight: '44px',
                  width: '100%',
                  maxWidth: '200px'
                }}
                onClick={(e) => {
                  const element = e.currentTarget;
                  element.classList.add('click-animation');
                  setTimeout(() => {
                    element.classList.remove('click-animation');
                  }, 300);
                }}
              >
                <TrendingUp size={20} className="bouncing-icon" />
                View Trending
              </Button>
            </Link>
          </Flex>

          {/* Stats cards */}
          <Grid
            columns={{ initial: '1', sm: '3' }}
            gap={{ initial: '4', sm: '5' }}
            style={{ maxWidth: '900px', margin: '0 auto' }}
          >
            <Box
              py="5"
              px="7"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 'var(--radius-5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center'
              }}
            >
              <Text
                as="div"
                size="7"
                weight="bold"
                mb="2"
                style={{
                  color: '#3b82f6',
                  fontSize: '2.5rem'
                }}
              >
                10K+
              </Text>
              <Text as="div" size="3" style={{ color: '#cbd5e1' }}>
                Anime Series
              </Text>
            </Box>
            <Box
              py="5"
              px="7"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 'var(--radius-5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center'
              }}
            >
              <Text
                as="div"
                size="7"
                weight="bold"
                mb="2"
                style={{
                  color: '#3b82f6',
                  fontSize: '2.5rem'
                }}
              >
                1M+
              </Text>
              <Text as="div" size="3" style={{ color: '#cbd5e1' }}>
                Fun things.
              </Text>
            </Box>
            <Box
              py="5"
              px="7"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 'var(--radius-5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center'
              }}
            >
              <Flex align="center" justify="center" gap="2" mb="2">
                <Text
                  as="div"
                  size="7"
                  weight="bold"
                  style={{
                    color: '#3b82f6',
                    fontSize: '2.5rem'
                  }}
                >
                  1K+
                </Text>
                <Star size={24} style={{ color: '#fbbf24' }} fill="currentColor" />
              </Flex>
              <Text as="div" size="3" style={{ color: '#cbd5e1' }}>
                Anime stars.
              </Text>
            </Box>
          </Grid>
        </Box>
      </Container>
    </Box>
  )
}

// Memoize the component to prevent unnecessary re-renders
export default memo(Hero)
