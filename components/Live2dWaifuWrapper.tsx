'use client'

import dynamic from 'next/dynamic'

const Live2dWaifu = dynamic(() => import('@/components/live2d-waifu'), {
    ssr: false,
    loading: () => null
})

export default function Live2dWaifuWrapper() {
    return <Live2dWaifu />
}