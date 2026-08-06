import { NextRequest, NextResponse } from 'next/server'

/**
 * Cache Components use a partially prerendered shell. Next's own resume
 * scripts are emitted from that static shell and therefore cannot receive a
 * request nonce. Keep CSP compatible with PPR while SRI protects built assets.
 */
export function proxy(request: NextRequest) {
  const devScriptPolicy = process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${devScriptPolicy} https://cdn.jsdelivr.net https://fastly.jsdelivr.net https://cubism.live2d.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fastly.jsdelivr.net",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://s4.anilist.co https://img.youtube.com https://cdn.jsdelivr.net https://fastly.jsdelivr.net",
    "media-src 'self'",
    "connect-src 'self' https://cdn.jsdelivr.net https://fastly.jsdelivr.net",
    "frame-src https://www.youtube.com https://youtube.com",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ')

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('Content-Security-Policy', csp)
  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', csp)
  return response
}

export const config = {
  matcher: [{
    source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
    missing: [
      { type: 'header', key: 'next-router-prefetch' },
      { type: 'header', key: 'purpose', value: 'prefetch' },
    ],
  }],
}
