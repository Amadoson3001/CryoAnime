/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === 'development'

// CSP is applied by proxy.ts so it stays compatible with Cache Components'
// streamed resume scripts. Static security headers remain here and apply
// consistently to pages and assets.
const securityHeaders = [
  // --- Anti-clickjacking ---
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // --- Content-Type sniffing protection ---
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // --- Referrer policy ---
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // --- XSS Protection (legacy browsers) ---
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  // --- DNS prefetch control ---
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  // --- HSTS (only in production to avoid dev issues) ---
  ...(!isDev
    ? [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
      ]
    : []),
  // --- Permissions Policy (disable unused browser features) ---
  {
    key: 'Permissions-Policy',
    value:
      'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(), usb=()',
  },
]

const nextConfig = {
  // Cache Components is the Next 16 server-rendering model. The custom
  // profiles mirror the AniList freshness policy and keep cache keys isolated
  // by operation and sanitized variables.
  cacheComponents: true,
  cacheLife: {
    anilistSearch: { stale: 900, revalidate: 300, expire: 3600 },
    anilistList: { stale: 3600, revalidate: 900, expire: 7 * 24 * 60 * 60 },
    anilistSchedule: { stale: 3600, revalidate: 3600, expire: 7 * 24 * 60 * 60 },
    anilistDetails: { stale: 24 * 60 * 60, revalidate: 24 * 60 * 60, expire: 30 * 24 * 60 * 60 },
  },
  // Apply security headers to all routes
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },

  images: {
    // Let Next.js resize and cache AniList artwork. Serving every grid card's
    // original large cover made mobile pages download far more data than the
    // rendered dimensions require.
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's4.anilist.co',
        port: '',
        pathname: '/file/anilistcdn/**',
      },
    ],
    // Optimized device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // Image sizes for layout="fill" or specific widths
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Prefer WebP for better compression
    formats: ['image/webp'],
    // Keep the qualities used by the card components explicit. This also
    // prevents arbitrary image-quality variants from bypassing the optimizer
    // cache and is required by newer Next.js releases.
    qualities: [65, 75],
    // Limit image optimization to known safe domains
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Disable powered-by header (leaks Next.js version info)
  poweredByHeader: false,

  // Strict mode for React (catches effects running twice in dev, surfaces bugs)
  reactStrictMode: true,
}

module.exports = nextConfig
