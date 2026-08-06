import AnimeDetailsClient from '@/components/anime/AnimeDetailsClient'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getAnimeDetails } from '@/lib/anilist'
import { readContentPreferences } from '@/lib/contentPreferences'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id: rawId } = await params
  const id = /^\d+$/.test(rawId || '') ? Number(rawId) : Number.NaN
  if (!Number.isSafeInteger(id) || id <= 0) return { title: 'Anime Details - CryoAnime' }
  try {
    const anime = await getAnimeDetails(id, await readContentPreferences())
    const title = anime.title_english || anime.title
    const description = anime.synopsis?.slice(0, 155) || `View ${title} details, ratings, tags, and characters on CryoAnime.`
    return {
      title: `${title} - CryoAnime`,
      description,
      openGraph: {
        title: `${title} - CryoAnime`,
        description,
        images: anime.cover ? [{ url: anime.cover, alt: `${title} cover` }] : undefined,
      },
    }
  } catch {
    return { title: 'Anime Details - CryoAnime' }
  }
}

async function AnimeDetailsContent({ params }: { params: Promise<{ id: string }> }) {
  const route = await params
  const rawId = route.id || ''
  const id = /^\d+$/.test(rawId) ? Number(rawId) : Number.NaN
  if (!Number.isSafeInteger(id) || id <= 0) return <AnimeDetailsClient anime={null} error="The anime ID provided is not valid." />

  let anime: Awaited<ReturnType<typeof getAnimeDetails>> | null = null
  let errorMessage: string | null = null
  let restricted = false
  try { anime = await getAnimeDetails(id, await readContentPreferences()) }
  catch (error) {
    restricted = error instanceof Error && error.message.includes('hidden by your content preferences')
    if (!restricted) errorMessage = 'Anime details are temporarily unavailable. Please try again.'
  }
  return <AnimeDetailsClient anime={anime} characters={anime?.characters || []} contentRestricted={restricted} error={errorMessage} />
}

export default function AnimeDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<main className="page-shell"><div className="empty-state">Loading anime details…</div></main>}><AnimeDetailsContent params={params} /></Suspense>
}
