import { describe, it, expect, vi } from 'vitest'
import { formatScore, formatDate } from '@/lib/api'

describe('API Utilities', () => {
  describe('formatScore', () => {
    it('should format score with 2 decimal places', () => {
      expect(formatScore(8.5)).toBe('8.50')
      expect(formatScore(9)).toBe('9.00')
    })

    it('should return N/A if score is undefined', () => {
      expect(formatScore(undefined)).toBe('N/A')
    })
  })

  describe('formatDate', () => {
    it('should format valid date strings', () => {
      // Use toContain because locale formats can vary
      expect(formatDate('2023-01-01')).toContain('2023')
      expect(formatDate('2023-01-01')).toContain('January')
    })

    it('should return N/A for undefined dates', () => {
      expect(formatDate(undefined)).toBe('N/A')
    })
  })
})
