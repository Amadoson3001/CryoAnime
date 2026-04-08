import '@testing-library/jest-dom'
import { vi } from 'vitest'

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
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock Radix UI scroll area (it can be problematic in JSDOM)
vi.mock('@radix-ui/react-scroll-area', () => ({
  Root: ({ children }: any) => <div>{children}</div>,
  Viewport: ({ children }: any) => <div>{children}</div>,
  Scrollbar: () => null,
  Thumb: () => null,
  Corner: () => null,
}))
