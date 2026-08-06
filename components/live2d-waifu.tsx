'use client'

import { useEffect } from 'react'

const WIDGET_BASE = 'https://fastly.jsdelivr.net/npm/live2d-widgets@1.0.1/dist/'
const WIDGET_SCRIPT = `${WIDGET_BASE}autoload.js`
const SCRIPT_INTEGRITY = 'sha384-pBbB6dM+Vbtn6ljvsU4bexD0GpPCX9JrSZjNJ65mZpmo1bpwDFudnRKSRsjSyXM2'
const WIDGET_SELECTORS = ['#waifu', '#waifu-toggle', '#live2d'] as const
const WIDGET_WAIT_MS = 5_000
const FALLBACK_WAIT_MS = 8_000

const WIDGET_CONFIG = {
  // Keep the copy in this repository while the model files stay on the
  // upstream model CDN. The widget requires a model_list.json when models
  // are not embedded in the tips file.
  waifuPath: '/waifu-tips.json',
  cdnPath: 'https://fastly.jsdelivr.net/gh/fghrsh/live2d_api/',
  modelId: 0,
  tools: ['hitokoto', 'switch-model', 'switch-texture', 'photo', 'info', 'quit'],
  drag: false,
  showToggleAfterQuit: true,
  logLevel: 'error',
} as const

type WidgetConfig = Record<string, unknown>

type TalkingTips = {
  message?: {
    default?: string[]
    welcome?: string
    hoverBody?: string | string[]
    tapBody?: string | string[]
    visibilitychange?: string
  }
  mouseover?: Array<{ selector: string; text: string | string[] }>
  click?: Array<{ selector: string; text: string | string[] }>
}

declare global {
  interface Window {
    initWidget?: (config: WidgetConfig) => void
  }
}

let scriptPromise: Promise<void> | undefined
let fallbackInitializationStarted = false
let customTalkingPromise: Promise<void> | undefined
let customTalkingStarted = false

const FALLBACK_TALKING_TIPS: TalkingTips = {
  message: {
    default: ['Welcome to CryoAnime, Senpai!', 'Find your next favorite anime on CryoAnime!'],
    welcome: 'Welcome to CryoAnime, Senpai!',
    hoverBody: 'That tickles, Senpai!',
    tapBody: 'Kyaaa! Please be gentle!',
    visibilitychange: 'Welcome back, Senpai!',
  },
}

const pickTalkingText = (value: string | string[] | undefined, fallback: string): string => {
  const choices = Array.isArray(value) ? value : value ? [value] : []
  return choices[Math.floor(Math.random() * choices.length)] ?? fallback
}

const loadTalkingTips = async (): Promise<TalkingTips> => {
  try {
    const response = await fetch('/waifu-tips.json', { cache: 'no-store' })
    if (!response.ok) throw new Error('Custom Live2D tips are unavailable')
    return await response.json() as TalkingTips
  } catch {
    return FALLBACK_TALKING_TIPS
  }
}

/**
 * The CDN autoloader starts with its own default tips file. Overlay the
 * repository-owned messages after the model exists so custom CryoAnime copy
 * is used for welcome, idle, hover, click, and visibility messages as well.
 */
const installCustomTalking = async (signal?: AbortSignal): Promise<void> => {
  if (customTalkingStarted || signal?.aborted || !hasWidgetElements()) return
  const tips = await loadTalkingTips()
  if (customTalkingStarted || signal?.aborted) return

  const tipsNode = document.querySelector<HTMLElement>('#waifu-tips')
  if (!tipsNode) return

  const defaultText = tips.message?.default?.[0] ?? FALLBACK_TALKING_TIPS.message!.default![0]
  const show = (value: string | string[] | undefined, fallback = defaultText, duration = 6_000) => {
    const message = pickTalkingText(value, fallback)
    const node = document.querySelector<HTMLElement>('#waifu-tips')
    if (!node) return
    node.textContent = message
    node.classList.add('waifu-tips-active')
    window.setTimeout(() => node.classList.remove('waifu-tips-active'), duration)
  }

  const mouseover = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null
    if (!target) return
    for (const entry of tips.mouseover ?? []) {
      if (!target.closest(entry.selector)) continue
      // The CDN also listens on window; defer so the repository-owned copy
      // wins after the external handler has finished.
      window.setTimeout(() => show(entry.text), 0)
      return
    }
  }

  const click = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null
    if (!target) return
    for (const entry of tips.click ?? []) {
      if (!target.closest(entry.selector)) continue
      // The CDN also listens on window; defer so the repository-owned copy
      // wins after the external handler has finished.
      window.setTimeout(() => show(entry.text), 0)
      return
    }
  }

  const onVisibilityChange = () => {
    if (!document.hidden) window.setTimeout(() => show(tips.message?.visibilitychange), 0)
  }
  const onHoverBody = () => show(tips.message?.hoverBody)
  const onTapBody = () => show(tips.message?.tapBody)
  const idle = window.setInterval(() => show(tips.message?.default), 20_000)

  document.addEventListener('mouseover', mouseover)
  document.addEventListener('click', click)
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('live2d:hoverbody', onHoverBody)
  window.addEventListener('live2d:tapbody', onTapBody)
  show(tips.message?.welcome ?? tips.message?.default)
  customTalkingStarted = true

  // The widget is intentionally persistent across route changes. Keep the
  // singleton interval/listeners alive with it and silence the unused handle
  // for linters without exposing a second cleanup path that could duplicate
  // the external widget's own handlers.
  void idle
}

const ensureCustomTalking = (signal?: AbortSignal): Promise<void> => {
  if (customTalkingStarted) return Promise.resolve()
  if (customTalkingPromise) return customTalkingPromise
  customTalkingPromise = installCustomTalking(signal).finally(() => {
    if (!customTalkingStarted) customTalkingPromise = undefined
  })
  return customTalkingPromise
}

const hasWidgetElements = (): boolean => WIDGET_SELECTORS.every(selector => document.querySelector(selector) !== null)

/**
 * Wait for the external widget to add its toggle, root, and canvas. The
 * upstream loader performs more work after its script load event, so checking
 * the DOM is more reliable than treating that event as initialization.
 */
export const waitForLive2dWidget = (timeoutMs = WIDGET_WAIT_MS, signal?: AbortSignal): Promise<boolean> => {
  if (hasWidgetElements()) return Promise.resolve(true)

  return new Promise(resolve => {
    let finished = false
    let timeoutId: number | undefined
    const observer = new MutationObserver(() => {
      if (hasWidgetElements()) finish(true)
    })

    const finish = (ready: boolean) => {
      if (finished) return
      finished = true
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
      observer.disconnect()
      signal?.removeEventListener('abort', onAbort)
      resolve(ready)
    }

    const onAbort = () => finish(false)
    if (signal?.aborted) {
      finish(false)
      return
    }
    signal?.addEventListener('abort', onAbort, { once: true })
    timeoutId = window.setTimeout(() => finish(hasWidgetElements()), timeoutMs)

    observer.observe(document.body, { childList: true, subtree: true })
  })
}

const loadWidgetScript = (): Promise<void> => {
  const existingScript = document.querySelector<HTMLScriptElement>('script[data-cryo-live2d]')
    ?? Array.from(document.scripts).find(script => script.src === WIDGET_SCRIPT)
  if (scriptPromise && existingScript) return scriptPromise
  // A test, hot reload, or host application may remove the old tag while
  // this module instance survives. Do not treat the stale promise as loaded.
  if (scriptPromise && !existingScript) scriptPromise = undefined

  scriptPromise = new Promise((resolve, reject) => {
    const existing = existingScript
    if (existing?.dataset.loaded === 'true') {
      resolve()
      return
    }

    const script = existing ?? document.createElement('script')
    if (!existing) {
      script.src = WIDGET_SCRIPT
      script.async = true
      script.integrity = SCRIPT_INTEGRITY
      script.crossOrigin = 'anonymous'
      script.referrerPolicy = 'no-referrer'
      script.dataset.cryoLive2d = 'true'
    } else if (!script.dataset.cryoLive2d) {
      // Adopt a matching script that was injected by the host shell so a
      // second copy is never added during navigation or hot reload.
      script.dataset.cryoLive2d = 'true'
    }

    const onLoad = () => {
      script.dataset.loaded = 'true'
      resolve()
    }
    const onError = () => {
      script.removeEventListener('load', onLoad)
      script.removeEventListener('error', onError)
      // Allow a later mount to make one clean retry rather than reusing a
      // permanently rejected promise. The failed tag is not useful anymore.
      if (script.parentElement) script.remove()
      scriptPromise = undefined
      reject(new Error('Live2D widget script failed to load'))
    }

    script.addEventListener('load', onLoad, { once: true })
    script.addEventListener('error', onError, { once: true })
    if (!existing) document.head.appendChild(script)
  })

  return scriptPromise
}

const initializeFallbackWidget = async (signal?: AbortSignal): Promise<boolean> => {
  if (hasWidgetElements()) return true
  if (signal?.aborted || fallbackInitializationStarted || typeof window.initWidget !== 'function') return false

  fallbackInitializationStarted = true
  try {
    window.initWidget(WIDGET_CONFIG)
  } catch {
    // An unavailable model CDN should never take down the host application.
    return false
  }

  return waitForLive2dWidget(FALLBACK_WAIT_MS, signal)
}

export const isLive2dEligible = (): boolean => {
  if (document.hidden) return false
  if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  const navigatorWithHints = navigator as Navigator & {
    deviceMemory?: number
    connection?: { saveData?: boolean }
  }
  if (/Android|iPhone|iPad|iPod|Mobile|Opera Mini|IEMobile/i.test(navigatorWithHints.userAgent)) return false
  const hardwareConcurrency = navigatorWithHints.hardwareConcurrency || 4
  const deviceMemory = navigatorWithHints.deviceMemory ?? 4
  const isLowEnd = (hardwareConcurrency < 4 && deviceMemory <= 4) || deviceMemory <= 2
  if (isLowEnd) return false
  if (navigatorWithHints.connection?.saveData) return false
  try {
    if (window.localStorage.getItem('cryoanime-live2d') === 'off') return false
  } catch {
    // A storage restriction is not an opt-out; keep the enhancement usable.
  }
  return true
}

export default function Live2dWaifu() {
  useEffect(() => {
    let cancelled = false
    let idleId: number | undefined
    let fallbackId: number | undefined
    let visibilityHandler: (() => void) | undefined
    const abortController = new AbortController()

    const start = async () => {
      if (cancelled || !isLive2dEligible()) return

      try {
        if (hasWidgetElements()) {
          await ensureCustomTalking(abortController.signal)
          return
        }

        await loadWidgetScript()
        if (cancelled) return

        // autoload.js normally initializes itself after loading its modules.
        // If that asynchronous step did not produce any widget DOM, use the
        // public initializer explicitly with the app-owned tips file.
        const automaticallyReady = await waitForLive2dWidget(WIDGET_WAIT_MS, abortController.signal)
        if (cancelled) return
        if (automaticallyReady) {
          await ensureCustomTalking(abortController.signal)
          return
        }

        const fallbackReady = await initializeFallbackWidget(abortController.signal)
        if (!cancelled && fallbackReady) await ensureCustomTalking(abortController.signal)
      } catch {
        // Live2D is an enhancement; a blocked CDN must not affect the page.
      }
    }

    const schedule = () => {
      if (!isLive2dEligible()) return
      const idleWindow = window as Window & {
        requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
        cancelIdleCallback?: (id: number) => void
      }
      if (idleWindow.requestIdleCallback) {
        idleId = idleWindow.requestIdleCallback(() => { void start() }, { timeout: 4_000 })
      } else {
        fallbackId = window.setTimeout(() => { void start() }, 2_000)
      }
    }

    if (document.hidden) {
      visibilityHandler = () => {
        if (!document.hidden) {
          document.removeEventListener('visibilitychange', visibilityHandler!)
          schedule()
        }
      }
      document.addEventListener('visibilitychange', visibilityHandler)
    } else {
      schedule()
    }

    return () => {
      cancelled = true
      abortController.abort()
      const idleWindow = window as Window & { cancelIdleCallback?: (id: number) => void }
      if (idleId !== undefined) idleWindow.cancelIdleCallback?.(idleId)
      if (fallbackId !== undefined) window.clearTimeout(fallbackId)
      if (visibilityHandler) document.removeEventListener('visibilitychange', visibilityHandler)
    }
  }, [])

  return null
}
