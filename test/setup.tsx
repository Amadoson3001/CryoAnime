import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Node 25 exposes an incomplete global `localStorage` object when Vitest is
// launched without `--localstorage-file`. Prefer a small deterministic shim
// so browser components can exercise their normal preference/cache paths.
if (typeof globalThis.localStorage?.getItem !== 'function') {
  const values = new Map<string, string>()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      get length() {
        return values.size
      },
      clear: () => values.clear(),
      getItem: (key: string) => values.get(key) ?? null,
      key: (index: number) => [...values.keys()][index] ?? null,
      removeItem: (key: string) => values.delete(key),
      setItem: (key: string, value: string) => values.set(key, value),
    },
  })
}

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  useParams: () => ({
    id: '1',
  }),
  usePathname: () => '/',
}))

// Mock next/image
vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt = '', ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} {...props} />
  },
}))
