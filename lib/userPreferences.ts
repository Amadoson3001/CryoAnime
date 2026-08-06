// These helpers remain for one-time migration and backwards compatibility.
// The active preference source is the secure server cookie.
'use client'

import {
  ContentPreferences,
  DEFAULT_CONTENT_PREFERENCES,
} from './contentRatings'

const MATURE_PREFERENCE_KEY = 'mature_content_enabled'
const EXPLICIT_PREFERENCE_KEY = 'explicit_content_enabled'
const LEGACY_NSFW_PREFERENCE_KEY = 'nsfw_enabled'
const PREFERENCE_KEYS = [MATURE_PREFERENCE_KEY, EXPLICIT_PREFERENCE_KEY, LEGACY_NSFW_PREFERENCE_KEY] as const

/** True when the one-time browser migration has something to move to the
 * server cookie. This avoids replacing a valid cookie with default values. */
export const hasLegacyContentPreferences = (): boolean =>
  typeof window !== 'undefined' && PREFERENCE_KEYS.some(key => readStorage(key) !== null)

/** Remove the pre-cookie preference keys after a successful migration. */
export const clearLegacyContentPreferences = (): void => {
  PREFERENCE_KEYS.forEach(removeStorage)
}

const readStorage = (key: string): string | null => {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

const writeStorage = (key: string, value: string): boolean => {
  if (typeof window === 'undefined') return false
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

const removeStorage = (key: string): void => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Ignore disabled or quota-exhausted storage.
  }
}

const hasAcceptedCookieConsent = (): boolean => {
  if (typeof window === 'undefined') return false
  return readStorage('cookie_consent_choice') === 'accepted'
}

const readCookie = (key: string): string | null => {
  if (typeof document === 'undefined' || !hasAcceptedCookieConsent()) return null
  try {
    const cookie = document.cookie.split(';').find(value => value.trim().startsWith(`${key}=`))
    return cookie ? decodeURIComponent(cookie.trim().slice(key.length + 1)) : null
  } catch {
    return null
  }
}

const readBooleanPreference = (key: string): boolean | null => {
  if (typeof window === 'undefined') return null
  const stored = readStorage(key)
  if (stored !== null) return stored === 'true'
  const cookie = readCookie(key)
  return cookie === null ? null : cookie === 'true'
}

export const getContentPreferences = (): ContentPreferences => {
  if (typeof window === 'undefined') return { ...DEFAULT_CONTENT_PREFERENCES }

  const mature = readBooleanPreference(MATURE_PREFERENCE_KEY)
  const explicit = readBooleanPreference(EXPLICIT_PREFERENCE_KEY)
  if (mature !== null || explicit !== null) {
    return { showMature: mature ?? false, showExplicit: explicit ?? false }
  }

  // Migrate the old one-switch preference only when no new preference exists.
  const legacy = readBooleanPreference(LEGACY_NSFW_PREFERENCE_KEY)
  return legacy === null
    ? { ...DEFAULT_CONTENT_PREFERENCES }
    : { showMature: legacy, showExplicit: legacy }
}

const writeCookie = (key: string, value: boolean): void => {
  if (typeof document === 'undefined') return
  try {
    if (hasAcceptedCookieConsent()) {
      const expiry = new Date()
      expiry.setDate(expiry.getDate() + 30)
      document.cookie = `${key}=${value}; expires=${expiry.toUTCString()}; path=/; Secure; SameSite=Lax`
    } else {
      document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; Secure; SameSite=Lax`
    }
  } catch {
    // Ignore blocked cookie writes; localStorage remains the best-effort store.
  }
}

export const setContentPreferences = (preferences: ContentPreferences): void => {
  if (typeof window === 'undefined') return
  const next = {
    showMature: Boolean(preferences.showMature),
    showExplicit: Boolean(preferences.showExplicit),
  }
  writeStorage(MATURE_PREFERENCE_KEY, String(next.showMature))
  writeStorage(EXPLICIT_PREFERENCE_KEY, String(next.showExplicit))
  removeStorage(LEGACY_NSFW_PREFERENCE_KEY)
  writeCookie(MATURE_PREFERENCE_KEY, next.showMature)
  writeCookie(EXPLICIT_PREFERENCE_KEY, next.showExplicit)
  writeCookie(LEGACY_NSFW_PREFERENCE_KEY, false)
  window.dispatchEvent(new CustomEvent('content-preferences-change', { detail: next }))
}

/** Backwards-compatible helper for callers that still need the old switch. */
export const getNsfwPreference = (): boolean => {
  const preferences = getContentPreferences()
  return preferences.showMature && preferences.showExplicit
}

/** Backwards-compatible helper: enabling it enables both content categories. */
export const setNsfwPreference = (enabled: boolean): void => {
  setContentPreferences({ showMature: enabled, showExplicit: enabled })
}

export const clearContentPreferences = (): void => {
  if (typeof window === 'undefined') return
  PREFERENCE_KEYS.forEach(removeStorage)
  PREFERENCE_KEYS.forEach(key => writeCookie(key, false))
  window.dispatchEvent(new Event('content-preferences-change'))
}
