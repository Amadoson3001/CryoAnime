'use client'

import React from 'react'
import { Button, Flex } from '@radix-ui/themes'
import { ArrowLeft } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  hasNextPage?: boolean
  onPageChange: (page: number) => void
  loading?: boolean
  className?: string
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  hasNextPage = true,
  onPageChange,
  loading = false,
  className = ''
}) => {
  // Don't render pagination if there's only one page
  if (totalPages <= 1) return null

  const pages = []
  const maxVisiblePages = 5
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

  // Adjust start page if we're near the end
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1)
  }

  // Previous button
  pages.push(
    <Button
      key="prev"
      variant="soft"
      disabled={currentPage === 1 || loading}
      onClick={() => onPageChange(currentPage - 1)}
      style={{
        backgroundColor: currentPage === 1 ? '#1e293b' : '#3b82f6',
        color: currentPage === 1 ? '#64748b' : 'white',
        border: '1px solid #334155',
        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <ArrowLeft size={16} />
      Previous
    </Button>
  )

  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    pages.push(
      <Button
        key={i}
        variant={currentPage === i ? "solid" : "soft"}
        onClick={() => onPageChange(i)}
        disabled={loading}
        style={{
          backgroundColor: currentPage === i ? '#3b82f6' : '#1e293b',
          color: currentPage === i ? 'white' : '#cbd5e1',
          border: '1px solid #334155',
          minWidth: '40px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {i}
      </Button>
    )
  }

  // Next button
  const isNextDisabled = currentPage === totalPages || !hasNextPage || loading
  pages.push(
    <Button
      key="next"
      variant="soft"
      disabled={isNextDisabled}
      onClick={() => onPageChange(currentPage + 1)}
      style={{
        backgroundColor: isNextDisabled ? '#1e293b' : '#3b82f6',
        color: isNextDisabled ? '#64748b' : 'white',
        border: '1px solid #334155',
        cursor: isNextDisabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      Next
      <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
    </Button>
  )

  return (
    <Flex 
      gap="2" 
      justify="center" 
      className={`anime-pagination ${className}`}
      style={{ 
        flexWrap: 'wrap',
        paddingBottom: '1rem'
      }}
    >
      {pages}
    </Flex>
  )
}

export default Pagination