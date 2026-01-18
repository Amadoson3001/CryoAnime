'use client'
import { useState, useEffect } from 'react'

interface PerformanceInfo {
  isLowEnd: boolean
  isMobile: boolean
  prefersReducedMotion: boolean
  isPotatoMode: boolean
}

/**
 * Hook for detecting device performance capabilities and user preferences.
 * Used to conditionally disable expensive features on low-end/mobile devices.
 */
export function usePerformance(): PerformanceInfo {
  const [info, setInfo] = useState<PerformanceInfo>({
    isLowEnd: false,
    isMobile: false,
    prefersReducedMotion: false,
    isPotatoMode: false
  })

  useEffect(() => {
    try {
      // Detect mobile via user agent (cheap check)
      const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )

      // Detect low-end device via hardware concurrency and device memory
      const hardwareConcurrency = navigator.hardwareConcurrency || 4
      const deviceMemory = (navigator as any).deviceMemory || 4
      const isLowEnd = hardwareConcurrency <= 4 || deviceMemory <= 2

      // Check reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      // Check if potato mode is enabled in localStorage
      const isPotatoMode = localStorage.getItem('cryoanime-potato-mode') === '1'

      setInfo({
        isLowEnd,
        isMobile,
        prefersReducedMotion,
        isPotatoMode
      })

      // Listen for reduced motion preference changes
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      const handleChange = (e: MediaQueryListEvent) => {
        setInfo(prev => ({ ...prev, prefersReducedMotion: e.matches }))
      }
      mediaQuery.addEventListener('change', handleChange)

      return () => mediaQuery.removeEventListener('change', handleChange)
    } catch {
      // Fallback for SSR or errors
      setInfo({
        isLowEnd: false,
        isMobile: false,
        prefersReducedMotion: false,
        isPotatoMode: false
      })
    }
  }, [])

  return info
}

/**
 * Lightweight version for components that only need mobile/low-end detection.
 * Returns true if the device should use simplified rendering.
 */
export function useShouldSimplify(): boolean {
  const { isLowEnd, isMobile, prefersReducedMotion, isPotatoMode } = usePerformance()
  return isLowEnd || isMobile || prefersReducedMotion || isPotatoMode
}
