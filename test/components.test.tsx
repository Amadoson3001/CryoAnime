import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import PaginationLinks from '@/components/PaginationLinks'
import { parseOrder } from '@/lib/query'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode; [key: string]: unknown }) => <a href={href} {...props}>{children}</a>,
}))

describe('server-rendered pagination links', () => {
  it('preserves validated query state while moving between pages', () => {
    render(<PaginationLinks basePath="/search" query={{ q: 'cow', limit: 6 }} page={2} totalPages={4} hasNextPage />)

    expect(screen.getByRole('link', { name: /Previous/ })).toHaveAttribute('href', '/search?q=cow&limit=6&page=1')
    expect(screen.getByRole('link', { name: /Next/ })).toHaveAttribute('href', '/search?q=cow&limit=6&page=3')
    expect(screen.getByRole('link', { name: '2' })).toHaveAttribute('aria-current', 'page')
  })

  it('renders unavailable directions as non-interactive text', () => {
    render(<PaginationLinks basePath="/movies" page={1} totalPages={2} hasNextPage />)

    expect(screen.queryByRole('link', { name: /Previous/ })).not.toBeInTheDocument()
    expect(screen.getByText(/Previous/)).toHaveAttribute('aria-disabled', 'true')
  })
})

describe('listing query state', () => {
  it('accepts both combined and separate ascending order values', () => {
    expect(parseOrder('score-asc')).toBe('asc')
    expect(parseOrder('asc')).toBe('asc')
    expect(parseOrder('score-desc')).toBe('desc')
  })
})
