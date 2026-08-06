'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ContentPreferences } from '@/lib/contentRatings'
import { saveContentPreferences } from '@/app/actions/preferences'
import {
  clearLegacyContentPreferences,
  getContentPreferences,
  hasLegacyContentPreferences,
} from '@/lib/userPreferences'

const PreferenceContext = createContext<{
  preferences: ContentPreferences
  setPreferences: (next: ContentPreferences) => void
  bootstrapPreferences: () => void
} | null>(null)

export function ContentPreferenceProvider({
  initial,
  children,
}: {
  initial: ContentPreferences
  children: React.ReactNode
}) {
  const [preferences, setPreferencesState] = useState(initial)
  const [, startTransition] = useTransition()
  const router = useRouter()
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve())
  const saveVersionRef = useRef(0)
  const bootstrapStartedRef = useRef(false)

  const queuePreferenceSave = useCallback((next: ContentPreferences, onSaved?: () => void) => {
    const version = ++saveVersionRef.current
    const save = saveQueueRef.current.then(() => saveContentPreferences(next))
    saveQueueRef.current = save.catch(() => undefined)
    void save.then(() => {
      onSaved?.()
      if (version === saveVersionRef.current) {
        startTransition(() => router.refresh())
      }
    }).catch(() => undefined)
  }, [router, startTransition])

  const bootstrapPreferences = useCallback(() => {
    if (bootstrapStartedRef.current) return
    bootstrapStartedRef.current = true

    if (hasLegacyContentPreferences()) {
      const legacy = getContentPreferences()
      setPreferencesState(legacy)
      queuePreferenceSave(legacy, clearLegacyContentPreferences)
      return
    }

    const controller = new AbortController()
    void fetch('/api/preferences', {
      credentials: 'same-origin',
      headers: { accept: 'application/json' },
      signal: controller.signal,
    })
      .then(response => response.ok ? response.json() : null)
      .then((payload: { data?: ContentPreferences } | null) => {
        if (!payload?.data || controller.signal.aborted) return
        const next = payload.data
        setPreferencesState(current => (
          current.showMature === next.showMature && current.showExplicit === next.showExplicit
            ? current
            : next
        ))
      })
      .catch(() => undefined)
  }, [queuePreferenceSave])

  const setPreferences = useCallback((next: ContentPreferences) => {
    setPreferencesState(next)
    queuePreferenceSave(next)
    window.dispatchEvent(new CustomEvent('content-preferences-change', { detail: next }))
  }, [queuePreferenceSave])

  const value = useMemo(() => ({
    preferences,
    setPreferences,
    bootstrapPreferences,
  }), [bootstrapPreferences, preferences, setPreferences])

  return <PreferenceContext.Provider value={value}>{children}</PreferenceContext.Provider>
}

export function useContentPreferences() {
  const value = useContext(PreferenceContext)
  if (!value) throw new Error('useContentPreferences must be used inside ContentPreferenceProvider')
  return value
}
