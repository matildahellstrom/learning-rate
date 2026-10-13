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
