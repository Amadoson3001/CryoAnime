import { NextResponse } from 'next/server'
import { readContentPreferences } from '@/lib/contentPreferences'

export async function GET() {
  const data = await readContentPreferences()
  return NextResponse.json(
    { data },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
