'use client'

import dynamic from 'next/dynamic'
import { useShouldSimplify } from '@/lib/usePerformance'

const Live2dWaifu = dynamic(() => import('@/components/live2d-waifu'), {
    ssr: false,
    loading: () => null
})

export default function Live2dWaifuWrapper() {
    const shouldSimplify = useShouldSimplify()

    // Skip Live2D widget on mobile/low-end devices to save resources
    if (shouldSimplify) {
        return null
    }

    return <Live2dWaifu />
}