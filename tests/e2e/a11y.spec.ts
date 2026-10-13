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

for (const colorScheme of ['light', 'dark'] as const) {
  test(`run outcomes have enough contrast (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme })
    await openStep(page, 6)
    await page.getByLabel('Learning rate η').fill('0.5')
    await page.getByRole('button', { name: 'Step', exact: true }).click()
    await expect(page.getByText('Reached the bottom in a single step!')).toBeVisible()
    await expectAccessible(page)

    await page.getByLabel('Learning rate η').fill('1.2')
    await page.getByRole('button', { name: 'Play' }).click()
    await expect(page.getByText(/^Diverged!/)).toBeVisible()
    await expectAccessible(page)
  })
}
