'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import CryoSelect from '@/components/ui-select'

type Query = Record<string, string | number | undefined>

const SORT_OPTIONS = [
  ['popularity-desc', 'Popularity (high to low)'],
  ['popularity-asc', 'Popularity (low to high)'],
  ['score-desc', 'Score (high to low)'],
  ['score-asc', 'Score (low to high)'],
  ['recent-desc', 'Recent (new to old)'],
  ['recent-asc', 'Recent (old to new)'],
  ['title-asc', 'Title (A to Z)'],
  ['title-desc', 'Title (Z to A)'],
] as const

const SEASONS = [
  ['winter', 'Winter'],
  ['spring', 'Spring'],
  ['summer', 'Summer'],
  ['fall', 'Fall'],
] as const

export default function ListingControls({
  basePath,
  query = {},
  sort = 'popularity',
  order = 'desc',
  showSort = true,
  season,
  year,
  showSeason = false,
  children,
}: {
  basePath: string
  query?: Query
  sort?: string
  order?: 'asc' | 'desc'
  showSort?: boolean
  season?: string
  year?: number
  showSeason?: boolean
  children?: ReactNode
}) {
  const currentSort = `${sort}-${order}`
  const queryEntries = Object.entries(query).filter(([key, value]) => !['page', 'sort', 'order', 'limit', 'season', 'year'].includes(key) && value !== undefined)
  const currentYear = year ?? new Date().getUTCFullYear()
  const years = Array.from({ length: 8 }, (_, index) => currentYear + 1 - index)

  const [sortValue, setSortValue] = useState(currentSort)
  const [limitValue, setLimitValue] = useState(String(query.limit ?? 24))
  const [seasonValue, setSeasonValue] = useState(season ?? 'winter')
  const [yearValue, setYearValue] = useState(String(year ?? currentYear))

  return (
    <form method="get" action={basePath} className="listing-controls" aria-label="Listing controls">
      {queryEntries.map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={String(value)} />
      ))}
      {showSort && (
        <label>
          <span>Sort by</span>
          <CryoSelect
            name="sort"
            value={sortValue}
            onValueChange={setSortValue}
            ariaLabel="Sort by"
            options={SORT_OPTIONS.map(([value, label]) => ({ value, label }))}
          />
        </label>
      )}
      {showSort && (
        <label>
          <span>Per page</span>
          <CryoSelect
            name="limit"
            value={limitValue}
            onValueChange={setLimitValue}
            ariaLabel="Results per page"
            options={[12, 24, 36, 48].map(value => ({ value: String(value), label: String(value) }))}
          />
        </label>
      )}
      {showSeason && (
        <>
          <label>
            <span>Season</span>
            <CryoSelect
              name="season"
              value={seasonValue}
              onValueChange={setSeasonValue}
              ariaLabel="Season"
              options={SEASONS.map(([value, label]) => ({ value, label }))}
            />
          </label>
          <label>
            <span>Year</span>
            <CryoSelect
              name="year"
              value={yearValue}
              onValueChange={setYearValue}
              ariaLabel="Year"
              options={years.map(value => ({ value: String(value), label: String(value) }))}
            />
          </label>
        </>
      )}
      {children}
      <button type="submit">Apply</button>
    </form>
  )
}
