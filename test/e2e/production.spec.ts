import { expect, test } from '@playwright/test'

const ROUTES = ['/', '/about', '/faq', '/privacy', '/library', '/movies', '/schedule', '/search', '/seasonal', '/top-rated', '/trending', '/Explore', '/anime/1']

test.beforeEach(async ({ page }) => {
  // Keep the browser smoke suite focused on shell hydration and route behavior;
  // Live2D has its own idle-eligibility path and is covered by unit checks.
  await page.addInitScript(() => localStorage.setItem('cryoanime-live2d', 'off'))
})

test('production shell hydrates with a PPR-compatible CSP', async ({ page }) => {
  const errors: string[] = []
  const requests: string[] = []
  page.on('pageerror', error => errors.push(error.stack || error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('request', request => requests.push(request.url()))

  const response = await page.goto('/', { waitUntil: 'domcontentloaded' })
  expect(response).not.toBeNull()
  const csp = response?.headers()['content-security-policy'] || ''
  expect(csp).toContain("script-src 'self'")
  expect(csp).toMatch(/script-src[^;]*unsafe-inline/)
  await expect(page.getByRole('banner')).toBeVisible()
  expect(requests.some(url => url.includes('graphql.anilist.co'))).toBe(false)
  expect(errors).toEqual([])
})

test('header suggestions stay on the constrained same-origin search route', async ({ page }) => {
  const requests: string[] = []
  page.on('request', request => requests.push(request.url()))
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const search = page.getByRole('search').first().getByRole('textbox')
  await expect(search).toBeVisible()
  await search.fill('cow')
  await expect(search).toHaveValue('cow')
  await page.waitForTimeout(1_250)
  expect(requests.some(url => url.includes('/api/search?q=cow&limit=6'))).toBe(true)
  expect(requests.some(url => url.includes('graphql.anilist.co'))).toBe(false)
})

test('empty search route hydrates without recovery', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.stack || error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  const response = await page.goto('/search', { waitUntil: 'networkidle' })
  expect(response?.status()).toBeLessThan(500)
  await expect(page.getByRole('heading', { name: 'Search Anime' })).toBeVisible()
  expect(errors).toEqual([])
})

test('all first-party routes render without uncaught browser errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(`${new URL(page.url()).pathname}: ${error.message}`))
  for (const route of ROUTES) {
    const response = await page.goto(route, { waitUntil: 'networkidle' })
    expect(response?.status(), route).toBeLessThan(500)
    await expect(page.locator('body')).toBeVisible()
  }
  expect(errors).toEqual([])
})
