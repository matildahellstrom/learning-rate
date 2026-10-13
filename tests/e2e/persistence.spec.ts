import { expect, test, type Page } from '@playwright/test'
import { LESSON, STORAGE_KEY } from './helpers.ts'

const saved = (page: Page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), STORAGE_KEY)

test('two open tabs add up their progress instead of overwriting it', async ({ context }) => {
  const tabA = await context.newPage()
  const tabB = await context.newPage()
  await tabA.goto(`${LESSON}?step=6`)
  await tabB.goto(`${LESSON}?step=10`)
  await tabA.getByRole('progressbar', { name: 'Step 6 of 11' }).waitFor({ state: 'attached' })
  await tabB.getByRole('progressbar', { name: 'Step 10 of 11' }).waitFor({ state: 'attached' })

  // Tab A: bowl challenge in one step → 3 stars, +30 XP.
  await tabA.getByLabel('Learning rate η').fill('0.5')
  await tabA.getByRole('button', { name: 'Step', exact: true }).click()
  await expect(tabA.getByText('Three stars, perfect!')).toBeVisible()

  // Tab B: first quiz question right → +10 XP, on top of tab A's 30.
  await tabB.getByRole('radio', { name: 'Opposite the gradient, downhill' }).check()
  await tabB.getByRole('button', { name: 'Check' }).click()
  await expect(tabB.getByText('Correct!')).toBeVisible()

  const state = await saved(tabB)
  expect(state.xp).toBe(40)
  expect(state.lessons['gradient-descent'].challengeStars).toEqual({ 'bowl-speedrun': 3 })
  expect(state.lessons['gradient-descent'].quizCorrect).toEqual([0])

  // Tab A hears about tab B's change without a reload.
  await tabA.goto('/#/profile')
  await expect(tabA.getByText('40 XP').first()).toBeVisible()
})

test('a malformed saved date does not wipe progress', async ({ page }) => {
  await page.goto('/')
  await page.evaluate((key) => {
    localStorage.setItem(
      key,
      JSON.stringify({
        version: 1,
        xp: 150,
        lessons: {},
        streak: { current: 2, best: 2, lastDay: '13/10/2026', freezes: 0 },
        badges: {},
      }),
    )
  }, STORAGE_KEY)
  await page.reload()
  await expect(page.getByText('150 XP')).toBeVisible()

  // Earn something, reload: still there, and nothing became NaN/null.
  await page.goto(`${LESSON}?step=10`)
  await page.getByRole('radio', { name: 'Opposite the gradient, downhill' }).check()
  await page.getByRole('button', { name: 'Check' }).click()
  await page.reload()
  const state = await saved(page)
  expect(state.xp).toBe(160)
  expect(state.streak.freezes).toBe(0)
  expect(state.streak.current).toBe(1)
})

test('finishing a lesson again says no new XP instead of "+0 XP"', async ({ page }) => {
  for (const expected of ['+100 XP', 'No new XP: you already earned it.']) {
    await page.goto('about:blank')
    await page.goto(`${LESSON}?step=11`)
    await page.getByRole('button', { name: 'Finish' }).click()
    await expect(page.getByText(expected)).toBeVisible()
  }
  await expect(page.getByText('+0 XP')).toHaveCount(0)
})
