/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === 'development'

// Content Security Policy
// - Allows self-hosted resources + CDN/fonts used by the app
// - 'unsafe-inline' for styles is needed for Radix UI & Tailwind runtime styles
// - YouTube embeds are allowed for anime trailers
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ''} https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: https://cdn.myanimelist.net https://myanimelist.net https://img.youtube.com https://cdn.jsdelivr.net;
  media-src 'self';
  connect-src 'self' https://api.jikan.moe https://api.myanimelist.net https://cdn.jsdelivr.net;
  frame-src https://www.youtube.com https://youtube.com;
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self';
  object-src 'none';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim()

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
  // --- Content Security Policy ---
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy,
  },
]

const nextConfig = {
  // Static Export configuration for GitHub Pages
  output: 'export',
  
  // GitHub Pages usually deploys to a subpath (e.g., /repo-name/)
  // Only apply basePath in production
  basePath: process.env.NODE_ENV === 'production' ? '/CryoAnime' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/CryoAnime/' : '',

  // Apply security headers to all routes
  // Note: headers() is ignored when output: 'export'
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },

  images: {
    // Standard Next.js Image Optimization doesn't work with static export
    // unless using a custom loader or setting unoptimized: true
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.myanimelist.net',
        port: '',
        pathname: '/images/**',
      },
      {
        protocol: 'https',
        hostname: 'myanimelist.net',
        port: '',
        pathname: '/images/**',
      },
    ],
    // Optimized device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // Image sizes for layout="fill" or specific widths
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Prefer WebP for better compression
    formats: ['image/webp'],
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
