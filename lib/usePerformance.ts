'use client'
import { useState, useEffect } from 'react'

interface PerformanceInfo {
  isReady: boolean
  isLowEnd: boolean
  isMobile: boolean
  prefersReducedMotion: boolean
  isPotatoMode: boolean
}

type NavigatorWithMemory = Navigator & { deviceMemory?: number }

/**
 * Hook for detecting device performance capabilities and user preferences.
 * Used to conditionally disable expensive features on low-end/mobile devices.
 */
export function usePerformance(): PerformanceInfo {
  const [info, setInfo] = useState<PerformanceInfo>({
    isReady: false,
    isLowEnd: false,
    isMobile: false,
    prefersReducedMotion: false,
    isPotatoMode: false,
  })

  useEffect(() => {
    try {
      const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const hardwareConcurrency = navigator.hardwareConcurrency || 4
      const deviceMemory = (navigator as NavigatorWithMemory).deviceMemory || 4
      const isLowEnd = (hardwareConcurrency < 4 && deviceMemory <= 4) || deviceMemory <= 2
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      let isPotatoMode = false
      try {
        isPotatoMode = localStorage.getItem('cryoanime-potato-mode') === '1'
      } catch {
        // Storage can be disabled or unavailable in privacy modes.
      }

      setInfo({ isReady: true, isLowEnd, isMobile, prefersReducedMotion, isPotatoMode })

      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      const handleChange = (event: MediaQueryListEvent) => {
        setInfo(prev => ({ ...prev, prefersReducedMotion: event.matches }))
      }
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } catch {
      setInfo({ isReady: true, isLowEnd: false, isMobile: false, prefersReducedMotion: false, isPotatoMode: false })
    }
  }, [])

  return info
}

/** Lightweight version for components that only need simplification state. */
export function useShouldSimplify(): boolean {
  const { isReady, isLowEnd, isMobile, prefersReducedMotion, isPotatoMode } = usePerformance()
  return !isReady || isLowEnd || isMobile || prefersReducedMotion || isPotatoMode
}
