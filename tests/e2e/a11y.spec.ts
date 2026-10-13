import { expect, test } from '@playwright/test'
import { expectAccessible, LESSON, openStep } from './helpers.ts'

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

test('the focus ring on the hero Start button is a double ring that shows on the gradient', async ({
  page,
}) => {
  await page.goto('/')
  const start = page.getByRole('link', { name: /Start/ })
  await start.focus()
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Tab')
  await expect(start).toBeFocused()
  const ring = await start.evaluate(async (el) => {
    // .btn animates its shadow; read it once the transition has finished.
    await Promise.all(el.getAnimations().map((a) => a.finished))
    const style = getComputedStyle(el)
    return { outline: style.outlineColor, shadow: style.boxShadow }
  })
  expect(ring.outline).toBe('rgb(255, 255, 255)')
  expect(ring.shadow).toContain('rgb(28, 21, 48) 0px 0px 0px 2px')
})

test('unearned stars are hollow, earned ones filled', async ({ page }) => {
  await page.goto(`${LESSON}?step=11`)
  await page.getByRole('button', { name: /Finish/ }).click()
  // Finished without a perfect quiz or the challenges: 1 of 3 stars.
  const glyphs = await page
    .getByRole('main')
    .locator('[aria-hidden="true"]')
    .filter({ hasText: /^[★☆]$/ })
    .allTextContents()
  expect(glyphs.slice(0, 3)).toEqual(['★', '☆', '☆'])
})
