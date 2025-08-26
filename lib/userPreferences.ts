// lib/userPreferences.ts
'use client'

// NSFW preference key
const NSFW_PREFERENCE_KEY = 'nsfw_enabled'

// Get NSFW preference from localStorage or cookies
export const getNsfwPreference = (): boolean => {
  if (typeof window !== 'undefined') {
    // Check if user has rejected cookies
    const consentChoice = localStorage.getItem('cookie_consent_choice')

    // Check localStorage first (always available)
    const stored = localStorage.getItem(NSFW_PREFERENCE_KEY)
    if (stored !== null) {
      return stored === 'true'
    }

    // Only check cookies if user has accepted them
    if (consentChoice === 'accepted') {
      const cookies = document.cookie.split(';').find(c => c.trim().startsWith(NSFW_PREFERENCE_KEY))
      if (cookies) {
        return cookies.split('=')[1] === 'true'
      }
    }

    // If user rejected cookies, don't read cookie values
    // If no consent given yet, also don't read cookies
  }

  // Default to false (disabled)
  return false
}

// Set NSFW preference in localStorage and cookies (only if consent given)
export const setNsfwPreference = (enabled: boolean): void => {
  if (typeof window !== 'undefined') {
    // Check if user has given consent for cookies
    const consentChoice = localStorage.getItem('cookie_consent_choice')

    // Always set in localStorage (this is not a cookie)
    localStorage.setItem(NSFW_PREFERENCE_KEY, enabled.toString())

    // Only set cookie if user has accepted cookies
    if (consentChoice === 'accepted') {
      const expiry = new Date()
      expiry.setDate(expiry.getDate() + 30)
      document.cookie = `${NSFW_PREFERENCE_KEY}=${enabled}; expires=${expiry.toUTCString()}; path=/`
    } else if (consentChoice === 'rejected' || consentChoice === 'necessary_only') {
      // Clear cookie if it exists
      document.cookie = `${NSFW_PREFERENCE_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    }
  }
}