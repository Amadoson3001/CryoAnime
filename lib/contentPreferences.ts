import { cookies } from 'next/headers'
import {
  ContentPreferences,
  DEFAULT_CONTENT_PREFERENCES,
  normalizeContentPreferences,
} from '@/lib/contentRatings'

export const CONTENT_PREFERENCE_COOKIE = 'cryoanime_content_preferences'

/** Parse the intentionally tiny, non-account preference cookie. */
export const parseContentPreferenceCookie = (value: string | undefined | null): ContentPreferences => {
  if (!value) return { ...DEFAULT_CONTENT_PREFERENCES }
  try {
    const params = new URLSearchParams(value)
    return normalizeContentPreferences({
      showMature: params.get('mature') === '1',
      showExplicit: params.get('explicit') === '1',
    })
  } catch {
    return { ...DEFAULT_CONTENT_PREFERENCES }
  }
}

export const serializeContentPreferences = (preferences: ContentPreferences): string => {
  const normalized = normalizeContentPreferences(preferences)
  return new URLSearchParams({
    mature: normalized.showMature ? '1' : '0',
    explicit: normalized.showExplicit ? '1' : '0',
  }).toString()
}

export const readContentPreferences = async (): Promise<ContentPreferences> => {
  const store = await cookies()
  return parseContentPreferenceCookie(store.get(CONTENT_PREFERENCE_COOKIE)?.value)
}
