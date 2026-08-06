import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Live2dWaifu, { isLive2dEligible } from '@/components/live2d-waifu'
import Waifu2d from '@/components/waifu2d'

const setDesktopEnvironment = () => {
  Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: 8 })
  Object.defineProperty(navigator, 'userAgent', { configurable: true, value: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36' })
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
  vi.stubGlobal('requestIdleCallback', (callback: () => void) => {
    callback()
    return 1
  })
  vi.stubGlobal('cancelIdleCallback', vi.fn())
}

const widgetScript = () => document.querySelector<HTMLScriptElement>('script[data-cryo-live2d]')

const finishScriptLoad = () => {
  const script = widgetScript()
  expect(script).not.toBeNull()
  script?.dispatchEvent(new Event('load'))
}

beforeEach(() => {
  vi.useFakeTimers()
  setDesktopEnvironment()
  document.head.innerHTML = ''
  document.body.innerHTML = ''
  localStorage.clear()
  delete window.initWidget
})

afterEach(() => {
  cleanup()
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('Live2D waifu bootstrap', () => {
  it('loads the pinned script once and accepts the widget DOM created by autoload', async () => {
    render(
      <>
        <Live2dWaifu />
        <Live2dWaifu />
      </>,
    )

    expect(document.querySelectorAll('script[data-cryo-live2d]')).toHaveLength(1)
    finishScriptLoad()
    document.body.insertAdjacentHTML('beforeend', '<div id="waifu-toggle"></div><div id="waifu"><canvas id="live2d"></canvas></div>')

    await vi.advanceTimersByTimeAsync(0)
    expect(document.querySelector('#waifu')).not.toBeNull()
    expect(document.querySelector('#live2d')).not.toBeNull()
    expect(document.querySelectorAll('script[data-cryo-live2d]')).toHaveLength(1)
  })

  it('explicitly initializes the widget with the local tips file when autoload does not create it', async () => {
    const initWidget = vi.fn((config: Record<string, unknown>) => {
      expect(config).toMatchObject({
        waifuPath: '/waifu-tips.json',
        cdnPath: 'https://fastly.jsdelivr.net/gh/fghrsh/live2d_api/',
      })
      document.body.insertAdjacentHTML('beforeend', '<div id="waifu-toggle"></div><div id="waifu"><canvas id="live2d"></canvas></div>')
    })
    window.initWidget = initWidget

    render(<Waifu2d />)
    finishScriptLoad()
    await vi.advanceTimersByTimeAsync(5_000)
    await Promise.resolve()

    expect(initWidget).toHaveBeenCalledTimes(1)
    expect(document.querySelector('#waifu-toggle')).not.toBeNull()
    expect(document.querySelector('#live2d')).not.toBeNull()
  })

  it('fails quietly when the CDN script cannot load', async () => {
    const errors: string[] = []
    const onError = (event: ErrorEvent) => errors.push(event.message)
    window.addEventListener('error', onError)

    render(<Live2dWaifu />)
    const script = widgetScript()
    expect(script).not.toBeNull()
    script?.dispatchEvent(new Event('error'))
    await vi.advanceTimersByTimeAsync(0)

    expect(document.querySelector('#waifu')).toBeNull()
    expect(errors).toEqual([])
    window.removeEventListener('error', onError)
  })

  it('uses the repository-owned talking copy after automatic widget bootstrap', async () => {
    const fetchTips = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        message: {
          default: ['Custom idle line'],
          welcome: 'Custom welcome line',
        },
        click: [{ selector: '#live2d', text: 'Custom click line' }],
      }),
    })
    vi.stubGlobal('fetch', fetchTips)

    render(<Live2dWaifu />)
    finishScriptLoad()
    document.body.insertAdjacentHTML(
      'beforeend',
      '<div id="waifu-toggle"></div><div id="waifu"><div id="waifu-tips"></div><canvas id="live2d"></canvas></div>',
    )

    await vi.advanceTimersByTimeAsync(0)
    await Promise.resolve()

    expect(fetchTips).toHaveBeenCalledWith('/waifu-tips.json', { cache: 'no-store' })
    expect(document.querySelector('#waifu-tips')?.textContent).toBe('Custom welcome line')

    document.querySelector('#live2d')?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await vi.advanceTimersByTimeAsync(0)
    expect(document.querySelector('#waifu-tips')?.textContent).toBe('Custom click line')
  })
})

describe('waifu2d compatibility entry point', () => {
  it('re-exports the canonical Live2D component', () => {
    expect(Waifu2d).toBe(Live2dWaifu)
  })
})

describe('Live2D eligibility gates', () => {
  it('keeps the enhancement off for opt-out, mobile, low-end, and reduced-motion contexts', () => {
    localStorage.setItem('cryoanime-live2d', 'off')
    expect(isLive2dEligible()).toBe(false)

    localStorage.clear()
    Object.defineProperty(navigator, 'userAgent', { configurable: true, value: 'Mozilla/5.0 (Linux; Android 14) Mobile' })
    expect(isLive2dEligible()).toBe(false)

    Object.defineProperty(navigator, 'userAgent', { configurable: true, value: 'Mozilla/5.0 (X11; Linux x86_64)' })
    Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: 2 })
    expect(isLive2dEligible()).toBe(false)

    Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: 8 })
    Object.defineProperty(navigator, 'hardwareConcurrency', { configurable: true, value: 8 })
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    expect(isLive2dEligible()).toBe(true)

    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    expect(isLive2dEligible()).toBe(false)
  })
})
