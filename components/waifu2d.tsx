'use client'

// Compatibility entry point for callers that refer to the feature as waifu2d.
// Keep the implementation in the descriptively named Live2D component.
export { default } from './live2d-waifu'
export { isLive2dEligible, waitForLive2dWidget } from './live2d-waifu'
