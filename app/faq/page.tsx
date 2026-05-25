'use client'

import React, { useState } from 'react'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import {
  Container,
  Flex,
  Box,
  Text,
  Card,
  Separator
} from '@radix-ui/themes'
import { ChevronDown, HelpCircle } from 'lucide-react'
import * as Accordion from '@radix-ui/react-accordion'

const FAQPage = () => {
  const [openItem, setOpenItem] = useState<string | null>(null)

  const toggleItem = (value: string) => {
    setOpenItem(openItem === value ? null : value)
  }

  const faqData = [
    {
      question: "What is CryoAnime?",
      answer: "CryoAnime is a comprehensive anime discovery platform that helps you find and explore anime series, movies, and OVAs. We provide detailed information, ratings, schedules, and genre-based browsing to enhance your anime watching experience."
    },
    {
      question: "Is CryoAnime free to use?",
      answer: "Yes, CryoAnime is completely free to use. We believe anime fans worldwide should have access to quality information and discovery tools without any cost."
    },
    {
      question: "How often is the anime data updated?",
      answer: "Our anime data comes from the Jikan API (MyAnimeList), which is updated regularly. We cache data locally to improve performance, and the cache refreshes automatically."
    },
    {
      question: "Can I save my favorite anime?",
      answer: "Yes! You can add anime to your Favorites or Watchlist. These are stored locally in your browser, so they persist across sessions without requiring an account."
    },
    {
      question: "How does the NSFW content filter work?",
      answer: "CryoAnime includes an NSFW toggle in the header. When disabled, anime with mature content ratings (Hentai, Ecchi) are filtered out of all listings. Your preference is saved locally."
    },
    {
      question: "Where does the anime data come from?",
      answer: "All anime information is fetched from the Jikan API, which is a free, open-source API for MyAnimeList data. We do not host or store any anime content ourselves."
    },
    {
      question: "How can I report incorrect information?",
      answer: "Since our data comes from MyAnimeList via the Jikan API, incorrect information should be reported directly to MyAnimeList. Our data reflects their database."
    },
    {
      question: "Can I contribute to the platform?",
      answer: "Absolutely! CryoAnime is open-source. You can contribute by reporting issues or submitting code improvements on our GitHub repository."
    }
  ]

  return (
    <>
      <Header />
      <main style={{ backgroundColor: '#0f172a', minHeight: '100vh', paddingTop: '5rem' }}>
        {/* Hero Section */}
        <Box
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            padding: '4rem 0',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Container size="4" px="4">
            <Flex direction="column" align="center" gap="6" style={{ position: 'relative', zIndex: 1 }}>
              {/* FAQ Icon */}
              <Box
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 40px rgba(59, 130, 246, 0.3)',
                }}
              >
                <HelpCircle size={48} style={{ color: 'white' }} />
              </Box>

              {/* Title */}
              <Box style={{ textAlign: 'center' }}>
                <h1
                  style={{
                    fontSize: 'var(--font-size-9)',
                    fontWeight: 'bold',
                    color: 'white',
                    margin: '0 0 1rem 0',
                  }}
                >
                  Frequently Asked Questions
                </h1>
                <Text
                  size="5"
                  style={{
                    color: '#60a5fa',
                    maxWidth: '600px'
                  }}
                >
                  Find answers to common questions about using CryoAnime
                </Text>
              </Box>

              {/* Description */}
              <Box style={{ maxWidth: '700px', textAlign: 'center' }}>
                <Text size="4" style={{ color: '#cbd5e1', lineHeight: '1.6' }}>
                  Whether you&apos;re new to CryoAnime or a long-time user, we&apos;re here to help.
                  Browse our FAQ section to find quick answers to the most common questions.
                </Text>
              </Box>
            </Flex>
          </Container>
        </Box>

        {/* FAQ Section */}
        <Container size="3" px="4" py="8" className="page-enter">
          <Box style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Accordion.Root
              type="single"
              value={openItem || undefined}
              onValueChange={setOpenItem}
              collapsible
            >
              {faqData.map((faq, index) => (
                <Accordion.Item
                  key={index}
                  value={`item-${index}`}
                  style={{
                    marginBottom: '1rem',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: '#1e293b'
                  }}
                >
                  <Accordion.Header>
                    <Accordion.Trigger
                      style={{
                        width: '100%',
                        padding: '1.5rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        color: 'white',
                        fontSize: 'var(--font-size-4)',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      <span>{faq.question}</span>
                      <ChevronDown
                        size={20}
                        style={{
                          transition: 'transform 0.3s ease',
                          transform: openItem === `item-${index}` ? 'rotate(180deg)' : 'rotate(0deg)'
                        }}
                      />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content
                    style={{
                      padding: '0 1.5rem 1.5rem 1.5rem',
                      color: '#cbd5e1',
                      lineHeight: '1.6',
                      fontSize: 'var(--font-size-3)'
                    }}
                  >
                    {faq.answer}
                  </Accordion.Content>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          </Box>
        </Container>

        {/* Still need help section */}
        <Container size="3" px="4" py="4" mb="8">
          <Card
            style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
              border: '1px solid #3b82f6',
              padding: '3rem',
              textAlign: 'center',
            }}
          >
            <h3
              style={{
                fontSize: 'var(--font-size-7)',
                fontWeight: 'bold',
                color: 'white',
                margin: '0 0 1rem 0'
              }}
            >
              Still Have Questions?
            </h3>
            <Text size="4" style={{ color: '#cbd5e1', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem auto' }}>
              If you can&apos;t find the answer you&apos;re looking for, please reach out to our support team.
            </Text>
            <Flex gap="4" justify="center" wrap="wrap">
              <button
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '0.75rem 2rem',
                  borderRadius: '8px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
                onClick={() => window.location.href = '/about'}
              >
                Contact Support
              </button>
            </Flex>
          </Card>
        </Container>
      </main>
      <Footer />
    </>
  )
}

export default FAQPage