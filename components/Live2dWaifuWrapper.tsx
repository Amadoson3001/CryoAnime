'use client'

import dynamic from 'next/dynamic'
import { useShouldSimplify } from '@/lib/usePerformance'

const Live2dWaifu = dynamic(() => import('@/components/waifu2d'), {
    ssr: false,
    loading: () => null
})

export default function Live2dWaifuWrapper() {
    const shouldSimplify = useShouldSimplify()

    if (shouldSimplify) {
        return null
    }

    return <Live2dWaifu />
}
