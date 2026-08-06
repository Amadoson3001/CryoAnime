'use server'

import { cookies } from 'next/headers'
import {
  ContentPreferences,
  normalizeContentPreferences,
} from '@/lib/contentRatings'
import {
  CONTENT_PREFERENCE_COOKIE,
  serializeContentPreferences,
} from '@/lib/contentPreferences'

export async function saveContentPreferences(value: ContentPreferences): Promise<void> {
  const preferences = normalizeContentPreferences(value)
  const store = await cookies()
  store.set(CONTENT_PREFERENCE_COOKIE, serializeContentPreferences(preferences), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}
