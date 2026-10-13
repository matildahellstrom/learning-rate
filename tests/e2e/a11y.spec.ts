import { expect, test } from '@playwright/test'
import { expectAccessible, openStep } from './helpers.ts'

test('wide equations in "Go deeper" can be scrolled with the keyboard', async ({ page }) => {
  for (const width of [320, 375, 412]) {
    await page.setViewportSize({ width, height: 800 })
    for (const step of [4, 8]) {
      await openStep(page, step)
      for (const summary of await page.locator('details > summary').all()) await summary.click()
      await expect(page.locator('.katex-display').first()).toBeVisible()
      await expect(page.locator('.katex-display').first()).toHaveAttribute('tabindex', '0')
      await expectAccessible(page)
    }
  }
})
