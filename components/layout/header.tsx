'use client'
import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Menu, X, Home, Star, TrendingUp, Heart, Shield } from 'lucide-react'
import {
  Box,
  Flex,
  Container,
  IconButton,
  TextField,
  Button
} from '@radix-ui/themes'
import { searchAnime, AnimeData } from '@/lib/api'
import { getNsfwPreference, setNsfwPreference } from '@/lib/userPreferences'
import { AnimeSearchResults } from '@/components/animesearchcard'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<AnimeData[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [isNsfwEnabled, setIsNsfwEnabled] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Calculate dropdown position
  const [dropdownPosition, setDropdownPosition] = useState({ top: 70, left: '50%' as string | number })

  // Update dropdown position when search container changes
  useEffect(() => {
    if (searchContainerRef.current && showSuggestions) {
      const rect = searchContainerRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left + (rect.width / 2)
      })
    }
  }, [showSuggestions, searchQuery])

  // Add scroll effect for header animation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Initialize NSFW preference
  useEffect(() => {
    setIsNsfwEnabled(getNsfwPreference())
  }, [])

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search for suggestions
  const performSearchSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      setSearchLoading(true)
      setSearchError(null)
      const response = await searchAnime(query, 1, 6, isNsfwEnabled)
      setSearchSuggestions(response.data)
      setShowSuggestions(true)
    } catch (err) {
      setSearchError('Failed to search anime')
      console.error('Error searching anime:', err)
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value)

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Debounce search suggestions
    searchTimeoutRef.current = setTimeout(() => {
      performSearchSuggestions(value)
    }, 300)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const toggleNsfw = () => {
    const newNsfwState = !isNsfwEnabled
    setIsNsfwEnabled(newNsfwState)
    setNsfwPreference(newNsfwState)
    // Reload the page to apply the filter
    window.location.reload()
  }

  const navigationItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/trending', label: 'Trending', icon: TrendingUp },
    { href: '/favorites', label: 'Favorites', icon: Heart },
    { href: '/top-rated', label: 'Top Rated', icon: Star }
  ]

  return (
    <Box
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: isScrolled ? 'blur(10px)' : 'blur(10px)',
        boxShadow: isScrolled
          ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          : 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        WebkitBackdropFilter: isScrolled ? 'blur(10px)' : 'none',
        overflow: 'visible'
      }}
      py={{ initial: "4", sm: "3" }}
      px={{ initial: "2", sm: "2" }}
      className="anime-header"
    >
      <Container size="4" px={{ initial: "2", sm: "4" }}>
        <Flex align="center" justify="between" gap={{ initial: "2", sm: "4" }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Flex align="center" gap="2">
              <span style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: isScrolled ? '#3b82f6' : '#60a5fa',
                transition: 'color 0.3s ease',
                textShadow: isScrolled ? 'none' : '0 0 20px rgba(59, 130, 246, 0.2)'
              }}>
                CryoAnime
              </span>
            </Flex>
          </Link>

          {/* Desktop Navigation */}
          <Box display={{ initial: 'none', md: 'block' }} flexGrow="1">
            <Flex align="center" gap="6">
              {/* Navigation Links */}
              <Flex align="center" gap="4">
                {navigationItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{ textDecoration: 'none' }}
                  >
                    <Flex
                      align="center"
                      gap="1"
                      style={{
                        color: '#94a3b8',
                        transition: 'all 0.2s ease',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        position: 'relative'
                      }}
                      className="nav-link"
                    >
                      <item.icon size={16} />
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>
                        {item.label}
                      </span>
                    </Flex>
                  </Link>
                ))}
              </Flex>

              {/* Search */}
              <Box flexGrow="1" mx="8" style={{ position: 'relative', zIndex: 1002, isolation: 'isolate' }} ref={searchContainerRef}>
                <form onSubmit={handleSearch}>
                  <Box style={{ maxWidth: '600px', position: 'relative' }}>
                    <TextField.Root
                      placeholder="Search anime..."
                      value={searchQuery}
                      onChange={(e) => handleSearchInputChange(e.target.value)}
                      onFocus={() => {
                        if (searchQuery.length >= 2 && searchSuggestions.length > 0) {
                          setShowSuggestions(true)
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearch(e as any)
                        }
                      }}
                      style={{
                        width: '100%',
                        transition: 'all 0.3s ease'
                      }}
                      className="search-input"
                    >
                      <TextField.Slot
                        side="right"
                        style={{ cursor: 'pointer' }}
                        onClick={handleSearch}
                      >
                        <Search size={20} style={{ color: '#94a3b8' }} />
                      </TextField.Slot>
                    </TextField.Root>

                    {/* Search Suggestions Dropdown */}
                    {showSuggestions && (
                      <div
                        style={{
                          position: 'fixed',
                          top: dropdownPosition.top,
                          left: dropdownPosition.left,
                          transform: typeof dropdownPosition.left === 'number' ? 'translateX(-50%)' : 'translateX(-50%)',
                          zIndex: 9999,
                          maxHeight: 'calc(100vh - 90px)',
                          overflow: 'auto',
                          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          maxWidth: '700px',
                          width: '100%',
                          backgroundColor: '#1e293b'
                        }}
                      >
                        <AnimeSearchResults
                          results={searchSuggestions}
                          loading={searchLoading}
                          error={searchError}
                          query={searchQuery}
                          variant="dropdown"
                          onClose={() => setShowSuggestions(false)}
                        />
                      </div>
                    )}
                  </Box>
                </form>
              </Box>

              {/* NSFW Toggle */}
              <Box position="relative" className="nsfw-toggle-container">
                <IconButton
                  variant="ghost"
                  onClick={toggleNsfw}
                  style={{
                    color: isNsfwEnabled ? '#ef4444' : '#94a3b8',
                    transition: 'all 0.3s ease',
                    border: isNsfwEnabled ? '1px solid #ef4444' : '1px solid transparent',
                    backgroundColor: isNsfwEnabled ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                    cursor: 'pointer',
                    transform: isNsfwEnabled ? 'scale(1.1)' : 'scale(1)',
                    boxShadow: isNsfwEnabled ? '0 0 10px rgba(239, 68, 68, 0.3)' : 'none'
                  }}
                  className="nsfw-toggle-btn"
                  title={isNsfwEnabled ? 'Click to hide NSFW content' : 'Click to show NSFW content'}
                >
                  <Shield size={20} />
                </IconButton>
                {/* Tooltip for desktop */}
                <Box
                  display={{ initial: 'none', md: 'block' }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginTop: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#1e293b',
                    color: 'white',
                    fontSize: '12px',
                    borderRadius: '4px',
                    whiteSpace: 'nowrap',
                    zIndex: 1000,
                    opacity: 0,
                    visibility: 'hidden',
                    transition: 'opacity 0.2s, visibility 0.2s',
                    pointerEvents: 'none'
                  }}
                  className="nsfw-tooltip"
                >
                  {isNsfwEnabled ? 'Hide NSFW content' : 'Show NSFW content'}
                  <Box
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#1e293b',
                      transformOrigin: 'center',
                      rotate: '45deg'
                    }}
                  />
                </Box>
              </Box>
            </Flex>
          </Box>

          {/* Mobile menu button */}
          <Box display={{ initial: 'block', md: 'none' }}>
            <IconButton
              variant="ghost"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              style={{
                color: '#94a3b8',
                transition: 'all 0.2s ease'
              }}
              className="mobile-menu-btn"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </IconButton>
          </Box>
        </Flex>
      </Container>

      {/* Mobile menu */}
      <Box
        display={{ initial: isMenuOpen ? 'block' : 'none', md: 'none' }}
        style={{
          backgroundColor: 'rgba(30, 41, 59, 0.2)',
          borderTop: '1px solid #1e293b',
          maxHeight: isMenuOpen ? '400px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          position: 'relative',
          zIndex: 40
        }}
        py={{ initial: "3", sm: "4" }}
      >
        <Container size="4" px="4">
          {/* Mobile navigation links */}
          <Flex direction="column" gap="2" mb="4">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{ textDecoration: 'none' }}
              >
                <Flex
                  align="center"
                  gap="3"
                  style={{
                    color: '#94a3b8',
                    padding: '14px 16px',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    border: '1px solid transparent',
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    backdropFilter: 'none',
                    WebkitBackdropFilter: 'none'
                  }}
                  className="mobile-nav-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon size={20} />
                  <span style={{ fontSize: '16px', fontWeight: '500' }}>
                    {item.label}
                  </span>
                </Flex>
              </Link>
            ))}
          </Flex>

          {/* Mobile search */}
          <form onSubmit={handleSearch}>
            <TextField.Root
              placeholder="Search anime..."
              value={searchQuery}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(e as any)
                }
              }}
              style={{
                width: '100%',
                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid #1e293b',
                borderRadius: '8px'
              }}
              className="mobile-search"
            >
              <TextField.Slot
                side="left"
                style={{ cursor: 'pointer' }}
                onClick={handleSearch}
              >
                <Search size={20} style={{ color: '#94a3b8' }} />
              </TextField.Slot>
            </TextField.Root>
          </form>

          {/* NSFW Toggle for Mobile */}
          <Flex align="center" justify="center" mt="4">
            <Button
              variant="ghost"
              onClick={toggleNsfw}
              style={{
                color: isNsfwEnabled ? '#ef4444' : '#94a3b8',
                border: isNsfwEnabled ? '1px solid #ef4444' : '1px solid #334155',
                backgroundColor: isNsfwEnabled ? 'rgba(239, 68, 68, 0.1)' : 'rgba(30, 41, 59, 0.9)',
                width: '100%',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                transform: isNsfwEnabled ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isNsfwEnabled ? '0 0 10px rgba(239, 68, 68, 0.3)' : 'none'
              }}
              className="mobile-nsfw-toggle-btn"
              title={isNsfwEnabled ? 'Tap to hide NSFW content' : 'Tap to show NSFW content'}
            >
              <Flex align="center" gap="2">
                <Shield size={20} />
                <span>{isNsfwEnabled ? 'Hide NSFW Content' : 'Show NSFW Content'}</span>
              </Flex>
            </Button>
          </Flex>
        </Container>
      </Box>
    </Box>
  )
}

export default Header