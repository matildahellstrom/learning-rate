import { expect, test, type Page } from '@playwright/test'
import { LESSON } from './helpers.ts'

const PAGES = ['/', '/#/profile', LESSON, `${LESSON}?step=6`, `${LESSON}?step=8`]

async function checkFits(page: Page, label: string) {
  for (const path of PAGES) {
    // A full page load each time: a hash-only navigation would briefly keep the old page.
    await page.goto('about:blank')
    await page.goto(path)
    await page
      .getByRole('heading', { level: 1 })
      .or(page.getByRole('heading', { level: 2 }))
      .first()
      .waitFor()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow, `${path} is wider than the screen (${label})`).toBeLessThanOrEqual(0)

    // The streak (last thing in the header) must be on screen, not pushed off the edge.
    const streak = page.getByTitle(/-day streak/)
    if (await streak.count()) {
      const box = await streak.boundingBox()
      if (!box) throw new Error(`streak not visible on ${path} (${label})`)
      const width = await page.evaluate(() => document.documentElement.clientWidth)
      expect(box.x, `streak on ${path} (${label})`).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width, `streak on ${path} (${label})`).toBeLessThanOrEqual(width)
    }
  }
}

test('no page scrolls sideways, from small phones to desktop', async ({ page }) => {
  for (const width of [320, 375, 412, 768, 1280]) {
    await page.setViewportSize({ width, height: 800 })
    await checkFits(page, `${width}px`)
  }
})

test('no page scrolls sideways with text at 200%', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 })
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      document.documentElement.style.fontSize = '200%'
    })
  })
  await checkFits(page, '200% text')
})

const overlaps = (
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height

test('reward toasts never cover the controls or the challenge result', async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 })
  await page.goto(`${LESSON}?step=6`)
  await page.getByLabel('Learning rate η').fill('0.5')
  await page.getByRole('button', { name: 'Step', exact: true }).click()

  const toast = page.locator('[aria-live] > div').filter({ hasText: 'XP' })
  await expect(toast).toBeVisible()
  const result = page.getByText('Three stars, perfect!')
  await expect(result).toBeVisible()
  const toastBox = (await toast.boundingBox())!
  for (const target of [
    result,
    page.getByRole('button', { name: 'Reset' }),
    page.getByRole('button', { name: 'Step', exact: true }),
  ]) {
    expect(overlaps(toastBox, (await target.boundingBox())!)).toBe(false)
  }
})

test('the completion screen shows rewards without toasts on top', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await page.goto(`${LESSON}?step=11`)
  await page.getByRole('button', { name: 'Finish' }).click()
  await expect(page.getByRole('heading', { name: 'Lesson complete!' })).toBeVisible()
  await expect(page.getByText('+100 XP')).toBeVisible()
  // Checked right away (no auto-retry): toasts would also disappear on their own after a while.
  expect(await page.locator('[aria-live] > div').count()).toBe(0)
})
