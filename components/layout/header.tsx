'use client'
import React, { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  Menu,
  X,
  Home,
  Star,
  TrendingUp,
  Heart,
  Shield,
  Calendar,
  Leaf
} from 'lucide-react'
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

/**
 * Extremely lightweight device hint so we can degrade behaviour on "potato" devices.
 * Uses only synchronous, cheap checks and caches result.
 */
const useIsLowEndDevice = () => {
  const [isLowEnd, setIsLowEnd] = useState(false)

  useEffect(() => {
    try {
      // Cache in memory only; no extra storage calls
      const hw = navigator.hardwareConcurrency || 2
      const mem = (navigator as any).deviceMemory || 2
      const isSlow = hw <= 4 || mem <= 2
      setIsLowEnd(isSlow)
    } catch {
      setIsLowEnd(false)
    }
  }, [])

  return isLowEnd
}

const Header: React.FC = () => {
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
  const isLowEnd = useIsLowEndDevice()

  // Stable navigation items to avoid re-allocations
  const navigationItems = useMemo(
    () => [
      { href: '/', label: 'Home', icon: Home },
      { href: '/trending', label: 'Trending', icon: TrendingUp },
      { href: '/seasonal', label: 'Seasonal', icon: Leaf },
      { href: '/movies', label: 'Movies', icon: Heart },
      { href: '/top-rated', label: 'Top Rated', icon: Star },
      { href: '/schedule', label: 'Schedule', icon: Calendar }
    ],
    []
  )

  // Dropdown anchored relative to search container.
  // On low-end devices we avoid fixed positioning and use a simpler layout.
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number
    left: string | number
    width?: number
  }>({ top: 70, left: '50%' })

  useEffect(() => {
    if (!showSuggestions || !searchContainerRef.current) return

    const rect = searchContainerRef.current.getBoundingClientRect()

    if (isLowEnd) {
      // Cheaper: attach directly under search input, no transforms or fixed coord math.
      setDropdownPosition({
        top: rect.height + 8,
        left: 0,
        width: rect.width
      })
      return
    }

    const updatePosition = () => {
      const r = searchContainerRef.current!.getBoundingClientRect()
      setDropdownPosition({
        top: r.bottom + 8,
        left: r.left + r.width / 2,
        width: r.width
      })
    }

    const rafId = requestAnimationFrame(updatePosition)
    return () => cancelAnimationFrame(rafId)
  }, [showSuggestions, searchQuery, isLowEnd])

  // Scroll effect: tiny, throttled; disabled on "potato" devices.
  useEffect(() => {
    if (isLowEnd) return

    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 10)
          ticking = false
        })
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isLowEnd])

  // Close mobile menu when screen width changes to desktop size (debounced)
  useEffect(() => {
    let resizeTimeout: number | null = null

    const handleResize = () => {
      if (resizeTimeout !== null) {
        window.clearTimeout(resizeTimeout)
      }
      resizeTimeout = window.setTimeout(() => {
        if (window.innerWidth >= 768 && isMenuOpen) {
          setIsMenuOpen(false)
        }
      }, 150)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (resizeTimeout !== null) {
        window.clearTimeout(resizeTimeout)
      }
    }
  }, [isMenuOpen])

  // Initialize NSFW preference (no re-runs)
  useEffect(() => {
    setIsNsfwEnabled(getNsfwPreference())
  }, [])

  // Click outside to close suggestions
  useEffect(() => {
    if (!showSuggestions) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showSuggestions])

  // Debounced search for suggestions with stronger guardrails
  const performSearchSuggestions = async (query: string) => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setSearchSuggestions([])
      setShowSuggestions(false)
      return
    }

    // On very low-end devices, skip live suggestions entirely to save CPU/network.
    if (isLowEnd) {
      setShowSuggestions(false)
      return
    }

    try {
      setSearchLoading(true)
      setSearchError(null)
      const response = await searchAnime(trimmed, 1, 6, isNsfwEnabled)
      setSearchSuggestions(response.data)
      setShowSuggestions(response.data.length > 0)
    } catch {
      setSearchError('Failed to search anime')
      setShowSuggestions(false)
    } finally {
      setSearchLoading(false)
    }
  }

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Slightly longer debounce to reduce chatter on slow devices.
    const delay = isLowEnd ? 500 : 300
    searchTimeoutRef.current = setTimeout(() => {
      performSearchSuggestions(value)
    }, delay)
  }

  const handleSearch = (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault()
    const trimmed = searchQuery.trim()
    if (!trimmed) return
    setShowSuggestions(false)
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  const toggleNsfw = () => {
    const newNsfwState = !isNsfwEnabled
    setIsNsfwEnabled(newNsfwState)
    setNsfwPreference(newNsfwState)
    // Use location.assign instead of reload for slightly cheaper navigation.
    window.location.assign(window.location.pathname + window.location.search)
  }

  return (
    <Box
      style={{
        backgroundColor: isMenuOpen ? 'rgba(15, 23, 42, 0.98)' : 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: isScrolled
          ? '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.4)'
          : 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        transition: 'background-color 0.25s ease, box-shadow 0.25s ease',
        willChange: 'background-color, box-shadow',
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
              <Flex align="center" gap="3">
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
                        padding: '6px 12px',
                        borderRadius: '6px',
                        position: 'relative'
                      }}
                      className="nav-link"
                    >
                      <item.icon size={16} />
                      <span style={{ fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap' }}>
                        {item.label}
                      </span>
                    </Flex>
                  </Link>
                ))}
              </Flex>

              {/* Search */}
              <Box flexGrow="1" mx="8" style={{ position: 'relative', zIndex: 1002, isolation: 'isolate' }} ref={searchContainerRef}>
                <form onSubmit={handleSearch}>
                  <Box style={{ maxWidth: '800px', position: 'relative' }}>
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

                    {/* Search Suggestions Dropdown - anchored and constrained for mobile performance */}
                    {showSuggestions && (
                      <div
                        style={{
                          position: 'fixed',
                          top: dropdownPosition.top,
                          left: dropdownPosition.left,
                          transform: 'translateX(-50%)',
                          zIndex: 1200,
                          maxHeight: '320px',
                          overflowY: 'auto',
                          WebkitOverflowScrolling: 'touch',
                          boxShadow: '0 16px 32px rgba(0, 0, 0, 0.85)',
                          borderRadius: '12px',
                          border: '1px solid rgba(148, 163, 253, 0.18)',
                          maxWidth: '640px',
                          width: '100%',
                          backgroundColor: '#0f172a',
                          willChange: 'transform'
                        }}
                      >
                        <AnimeSearchResults
                          results={searchSuggestions}
                          loading={searchLoading}
                          error={searchError}
                          query={searchQuery}
                          variant="dropdown"
                          maxResults={12}
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

      {/* Mobile menu with animated slide/scale on mobile */}
      <Box
        display={{ initial: 'block', md: 'none' }}
        className={`mobile-menu-container ${isMenuOpen ? 'open' : 'closed'}`}
        style={{
          position: 'fixed',
          top: '3rem',
          left: 0,
          right: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 999,
          maxHeight: '100vh',
          overflow: 'auto',
          transformOrigin: 'top',
          transform: isMenuOpen ? 'translateY(0) scaleY(1)' : 'translateY(-8px) scaleY(0.9)',
          opacity: isMenuOpen ? 1 : 0,
          pointerEvents: isMenuOpen ? 'auto' : 'none',
          transition: 'opacity 0.22s ease-out, transform 0.22s ease-out'
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
                    padding: '12px 14px',
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
                  <span style={{ fontSize: '16px', fontWeight: '500', whiteSpace: 'nowrap' }}>
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