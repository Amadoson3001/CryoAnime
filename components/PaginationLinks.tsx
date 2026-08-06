import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'

const hrefFor = (basePath: string, query: Record<string, string | number | undefined>, page: number) => {
  const params = new URLSearchParams()
  Object.entries({ ...query, page }).forEach(([key, value]) => {
    if (value !== undefined && String(value).length > 0) params.set(key, String(value))
  })
  return `${basePath}?${params.toString()}`
}

export default function PaginationLinks({
  basePath,
  query = {},
  page,
  totalPages,
  hasNextPage,
}: {
  basePath: string
  query?: Record<string, string | number | undefined>
  page: number
  totalPages: number
  hasNextPage: boolean
}) {
  const last = Math.max(1, Math.min(100, totalPages))
  if (last <= 1 && !hasNextPage) return null
  const end = Math.min(last, Math.max(page + 2, 5))
  const start = Math.max(1, Math.min(page - 2, end - 4))
  return (
    <nav className="anime-pagination" aria-label="Pagination">
      {page > 1 ? (
        <Link className="pagination-link" href={hrefFor(basePath, query, page - 1)}><ArrowLeft size={16} aria-hidden="true" /> Previous</Link>
      ) : (
        <span className="pagination-link disabled" aria-disabled="true"><ArrowLeft size={16} aria-hidden="true" /> Previous</span>
      )}
      {Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index).map(value => (
        <Link key={value} className={`pagination-link ${value === page ? 'active' : ''}`} aria-current={value === page ? 'page' : undefined} href={hrefFor(basePath, query, value)}>{value}</Link>
      ))}
      {hasNextPage ? (
        <Link className="pagination-link" href={hrefFor(basePath, query, page + 1)}>Next <ArrowRight size={16} aria-hidden="true" /></Link>
      ) : (
        <span className="pagination-link disabled" aria-disabled="true">Next <ArrowRight size={16} aria-hidden="true" /></span>
      )}
    </nav>
  )
}
