// lib/userPreferences.ts
'use client'

// NSFW preference key
const NSFW_PREFERENCE_KEY = 'nsfw_enabled'

// Get NSFW preference from localStorage or cookies
export const getNsfwPreference = (): boolean => {
  // Check localStorage first
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(NSFW_PREFERENCE_KEY)
    if (stored !== null) {
      return stored === 'true'
    }
    
    // Check cookies as fallback
    const cookies = document.cookie.split(';').find(c => c.trim().startsWith(NSFW_PREFERENCE_KEY))
    if (cookies) {
      return cookies.split('=')[1] === 'true'
    }
  }
  
  // Default to false (disabled)
  return false
}

// Set NSFW preference in localStorage and cookies
export const setNsfwPreference = (enabled: boolean): void => {
  if (typeof window !== 'undefined') {
    // Set in localStorage
    localStorage.setItem(NSFW_PREFERENCE_KEY, enabled.toString())
    
    // Set in cookies with 30-day expiry
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + 30)
    document.cookie = `${NSFW_PREFERENCE_KEY}=${enabled}; expires=${expiry.toUTCString()}; path=/`
  }
}