'use client'
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
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
  Leaf,
  Bookmark,
  ChevronRight
} from 'lucide-react'
import type { AnimeListItem } from '@/lib/anime-models'
import type { ContentPreferences } from '@/lib/contentRatings'
import { usePerformance } from '@/lib/usePerformance'
import { AnimeSearchResults } from '@/components/animesearchcard'
import { useContentPreferences } from '@/components/content-preference-provider'

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSuggestions, setSearchSuggestions] = useState<AnimeListItem[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchAbortRef = useRef<AbortController | null>(null)
  const desktopSearchRef = useRef<HTMLDivElement>(null)
  const mobileSearchRef = useRef<HTMLDivElement>(null)
  const mobileSearchInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [pathname, setPathname] = useState('')
  const { isLowEnd } = usePerformance()
  const {
    preferences: contentPreferences,
    setPreferences: setContentPreferences,
    bootstrapPreferences,
  } = useContentPreferences()

  useEffect(() => {
    bootstrapPreferences()
  }, [bootstrapPreferences])

  useEffect(() => {
    const syncPathname = () => setPathname(window.location.pathname)
    syncPathname()
    window.addEventListener('popstate', syncPathname)
    return () => window.removeEventListener('popstate', syncPathname)
  }, [])

  // Stable navigation items to avoid re-allocations
  const navigationItems = useMemo(
    () => [
      { href: '/', label: 'Home', icon: Home },
      { href: '/trending', label: 'Trending', icon: TrendingUp },
      { href: '/seasonal', label: 'Seasonal', icon: Leaf },
      { href: '/movies', label: 'Movies', icon: Heart },
      { href: '/top-rated', label: 'Top Rated', icon: Star },
      { href: '/schedule', label: 'Schedule', icon: Calendar },
      { href: '/library', label: 'Library', icon: Bookmark }
    ],
    []
  )

  // A single media-query subscription replaces resize polling.
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)')
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsMenuOpen(false)
        setIsMobileSearchOpen(false)
      }
    }
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  // Close overlays on route change
  useEffect(() => {
    setIsMenuOpen(false)
    setIsMobileSearchOpen(false)
    setShowSuggestions(false)
    searchAbortRef.current?.abort()
  }, [pathname])

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      searchAbortRef.current?.abort()
    }
  }, [])

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    if (!isMenuOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [isMenuOpen])

  // Escape key closes suggestions / mobile search / menu
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setShowSuggestions(false)
      setIsMobileSearchOpen(false)
      setIsMenuOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Autofocus the mobile search input when the panel opens
  useEffect(() => {
    if (isMobileSearchOpen) {
      // Small delay lets the panel render before focusing so the keyboard opens reliably
      const id = window.setTimeout(() => mobileSearchInputRef.current?.focus(), 60)
      return () => window.clearTimeout(id)
    }
  }, [isMobileSearchOpen])

  // Click outside to close suggestions (checks both desktop & mobile containers)
  useEffect(() => {
    if (!showSuggestions) return

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node
      const inDesktop = desktopSearchRef.current?.contains(target)
      const inMobile = mobileSearchRef.current?.contains(target)
      if (!inDesktop && !inMobile) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)
    return () => document.removeEventListener('pointerdown', handleClickOutside)
  }, [showSuggestions])

  // Debounced search for suggestions with stronger guardrails
  const performSearchSuggestions = useCallback(async (query: string) => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setSearchSuggestions([])
      setShowSuggestions(false)
      return
    }

    searchAbortRef.current?.abort()
    const controller = new AbortController()
    searchAbortRef.current = controller

    try {
      setSearchLoading(true)
      setSearchError(null)
      setShowSuggestions(true)
      const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&limit=6`, {
        signal: controller.signal,
        credentials: 'same-origin',
        headers: { accept: 'application/json' },
      })
      if (!response.ok) throw new Error('Search request failed')
      const payload = await response.json() as { data?: AnimeListItem[] }
      if (controller.signal.aborted) return
      setSearchSuggestions(Array.isArray(payload.data) ? payload.data : [])
      setShowSuggestions(true)

    } catch (error) {
      if (controller.signal.aborted) return
      setSearchError('Failed to search anime')
      setShowSuggestions(true)
    } finally {
      if (searchAbortRef.current === controller) {
        searchAbortRef.current = null
        setSearchLoading(false)
      }
    }
  }, [])

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value)

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (value.trim().length < 2) {
      searchAbortRef.current?.abort()
      setSearchSuggestions([])
      setSearchError(null)
      setSearchLoading(false)
      setShowSuggestions(false)
      return
    }

    // Wait for a deliberate pause so every typed character does not become a
    // unique upstream search request.
    const delay = isLowEnd ? 650 : 500
    searchTimeoutRef.current = setTimeout(() => {
      performSearchSuggestions(value)
    }, delay)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchSuggestions([])
    setShowSuggestions(false)
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchAbortRef.current?.abort()
    searchAbortRef.current = null
    setSearchLoading(false)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = searchQuery.trim()
    if (!trimmed) return
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
      searchTimeoutRef.current = null
    }
    searchAbortRef.current?.abort()
    searchAbortRef.current = null
    setShowSuggestions(false)
    setIsMobileSearchOpen(false)
    setIsMenuOpen(false)
    setPathname('/search')
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  const toggleContentPreference = (key: keyof ContentPreferences) => {
    const next = { ...contentPreferences, [key]: !contentPreferences[key] }
    setContentPreferences(next)
  }

  const openMobileSearch = () => {
    setIsMenuOpen(false)
    setIsMobileSearchOpen((open) => !open)
  }

  const openMobileMenu = () => {
    setIsMobileSearchOpen(false)
    setShowSuggestions(false)
    setIsMenuOpen((open) => !open)
  }

  const renderSuggestionsDropdown = (extraClass = '') => {
    if (!showSuggestions) return null
    return (
      <div className={`search-dropdown ${extraClass}`} aria-label="Search suggestions" aria-live="polite">
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
    )
  }

  const renderSearchForm = (isMobile: boolean) => (
    <form className="header-search" onSubmit={handleSearch} role="search">
      <button type="submit" className="search-submit" aria-label="Search">
        <Search size={isMobile ? 19 : 17} />
      </button>
      <input
        ref={isMobile ? mobileSearchInputRef : undefined}
        type="text"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        placeholder="Search anime..."
        aria-label="Search anime"
        value={searchQuery}
        onChange={(e) => handleSearchInputChange(e.target.value)}
        onFocus={() => {
          if (searchQuery.length >= 2 && searchSuggestions.length > 0) {
            setShowSuggestions(true)
          }
        }}
      />
      {searchQuery.length > 0 && (
        <button
          type="button"
          className="search-clear"
          aria-label="Clear search"
          onClick={() => {
            clearSearch()
            if (isMobile) mobileSearchInputRef.current?.focus()
          }}
        >
          <X size={16} />
        </button>
      )}
    </form>
  )

  return (
    <header className={`anime-header ${isMenuOpen ? 'menu-open' : ''}`}>
      <div className="header-inner">
        <div className="header-bar">
          {/* Logo */}
          <Link href="/" className="header-logo" aria-label="CryoAnime - Home">
            CryoAnime
          </Link>

          {/* Desktop Navigation */}
          <nav className="desktop-nav" aria-label="Primary navigation">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setPathname(item.href)}
                >
                  <item.icon size={16} className="nav-link-icon" aria-hidden="true" />
                  <span className="nav-link-label">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Desktop Search */}
          <div className="desktop-search" ref={desktopSearchRef}>
            {renderSearchForm(false)}
            {renderSuggestionsDropdown('desktop')}
          </div>

          {/* Desktop content filters */}
          <div className="content-toggle-group desktop-only" aria-label="Content filters">
            <details className="content-filter-details">
              <summary
                className={`icon-btn nsfw-toggle-btn ${contentPreferences.showMature || contentPreferences.showExplicit ? 'nsfw-on' : ''}`}
                title="Content filters"
                aria-label="Open content filters"
              >
                <Shield size={19} />
              </summary>
              <div className="content-filter-menu">
                <button
                  type="button"
                  onClick={() => toggleContentPreference('showMature')}
                  className={contentPreferences.showMature ? 'is-on' : ''}
                  aria-pressed={contentPreferences.showMature}
                >
                  <span>Mature content</span>
                  <span aria-hidden="true">{contentPreferences.showMature ? 'On' : 'Off'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleContentPreference('showExplicit')}
                  className={contentPreferences.showExplicit ? 'is-on' : ''}
                  aria-pressed={contentPreferences.showExplicit}
                >
                  <span>Explicit content</span>
                  <span aria-hidden="true">{contentPreferences.showExplicit ? 'On' : 'Off'}</span>
                </button>
              </div>
            </details>
          </div>

          {/* Mobile actions */}
          <div className="mobile-actions">
            <button
              type="button"
              className={`icon-btn ${isMobileSearchOpen ? 'is-active' : ''}`}
              onClick={openMobileSearch}
              aria-label={isMobileSearchOpen ? 'Close search' : 'Open search'}
              aria-expanded={isMobileSearchOpen}
              aria-controls={isMobileSearchOpen ? 'mobile-search-panel' : undefined}
            >
              {isMobileSearchOpen ? <X size={22} /> : <Search size={22} />}
            </button>
            <button
              type="button"
              className={`icon-btn ${isMenuOpen ? 'is-active' : ''}`}
              onClick={openMobileMenu}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-nav-panel"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile expandable search row */}
        {isMobileSearchOpen && (
          <div id="mobile-search-panel" className="mobile-search-panel" ref={mobileSearchRef}>
            {renderSearchForm(true)}
            {renderSuggestionsDropdown('mobile')}
          </div>
        )}
      </div>

      {/* Mobile navigation panel */}
      <div
        id="mobile-nav-panel"
        className={`mobile-menu-container ${isMenuOpen ? 'open' : 'closed'}`}
        aria-hidden={!isMenuOpen}
      >
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mobile-nav-link ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => {
                  setPathname(item.href)
                  setIsMenuOpen(false)
                }}
              >
                <item.icon size={20} className="mobile-nav-icon" aria-hidden="true" />
                <span className="mobile-nav-label">{item.label}</span>
                <ChevronRight size={16} className="mobile-nav-chevron" aria-hidden="true" />
              </Link>
            )
          })}
        </nav>

        {/* Content filters for Mobile */}
        <button
          type="button"
          className={`mobile-nsfw-row ${contentPreferences.showMature ? 'nsfw-on' : ''}`}
          onClick={() => toggleContentPreference('showMature')}
          aria-pressed={contentPreferences.showMature}
        >
          <span className="mobile-nsfw-info">
            <Shield size={20} aria-hidden="true" />
            <span>{contentPreferences.showMature ? 'Mature content visible' : 'Mature content hidden'}</span>
          </span>
          <span className="nsfw-switch" aria-hidden="true">
            <span className="nsfw-switch-knob" />
          </span>
        </button>
        <button
          type="button"
          className={`mobile-nsfw-row ${contentPreferences.showExplicit ? 'nsfw-on' : ''}`}
          onClick={() => toggleContentPreference('showExplicit')}
          aria-pressed={contentPreferences.showExplicit}
        >
          <span className="mobile-nsfw-info">
            <Shield size={20} aria-hidden="true" />
            <span>{contentPreferences.showExplicit ? 'Explicit content visible' : 'Explicit content hidden'}</span>
          </span>
          <span className="nsfw-switch" aria-hidden="true">
            <span className="nsfw-switch-knob" />
          </span>
        </button>
      </div>
    </header>
  )
}

export default Header
