import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Anime Details - CryoAnime',
  description: 'Explore detailed anime information, synopsis, genres, and character cards on CryoAnime.',
}

export default function AnimeDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
