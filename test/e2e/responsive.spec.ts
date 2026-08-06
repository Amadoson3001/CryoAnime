import { expect, test } from '@playwright/test'

for (const viewport of [
  { name: 'phone', width: 320, height: 800 },
  { name: 'desktop', width: 1440, height: 1000 },
]) {
  test(`home layout fits the ${viewport.name} viewport`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.addInitScript(() => localStorage.setItem('cryoanime-live2d', 'off'))
    await page.goto('/', { waitUntil: 'networkidle' })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

    if (viewport.name === 'phone') {
      await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible()
      await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeHidden()
    } else {
      await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Open menu' })).toBeHidden()
    }
  })
}
