import { expect, test, type Page } from '@playwright/test'
import { continueTo, LESSON, STEP_COUNT } from './helpers.ts'

const stepBar = (n: number) => ({ name: `Step ${n} of ${STEP_COUNT}` })

test('the lesson step is in the URL: reload, Back and Forward keep your place', async ({
  page,
}) => {
  await page.goto(LESSON)
  await continueTo(page, 6)
  expect(page.url()).toContain('step=6')

  await page.reload()
  await expect(page.getByRole('progressbar', stepBar(6))).toBeAttached()

  await page.goBack()
  await expect(page.getByRole('progressbar', stepBar(5))).toBeAttached()
  await page.goForward()
  await expect(page.getByRole('progressbar', stepBar(6))).toBeAttached()

  // Nonsense in the URL falls back to a valid step instead of breaking the page.
  await page.goto(`${LESSON}?step=abc`)
  await expect(page.getByRole('progressbar', stepBar(1))).toBeAttached()
  await page.goto(`${LESSON}?step=99`)
  await expect(page.getByRole('progressbar', stepBar(STEP_COUNT))).toBeAttached()
})

test('a reload mid-quiz keeps the quiz attempt', async ({ page }) => {
  await page.goto(`${LESSON}?step=10`)
  await page.getByRole('radio', { name: 'Opposite the gradient, downhill' }).check()
  await page.getByRole('button', { name: 'Check' }).click()
  await page.getByRole('button', { name: 'Next question' }).click()
  await expect(page.getByText('Question 2 of 5')).toBeVisible()

  await page.reload()
  await expect(page.getByText('Question 2 of 5')).toBeVisible()
})

const focusIsInMain = (page: Page) =>
  page.evaluate(() => document.activeElement?.closest('main') !== null)

test('changing page starts at the top and moves focus to the new content', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('heading', { name: 'Your learning map' }).waitFor()
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100)

  await page.getByRole('link', { name: 'Profile' }).click()
  await expect(page.getByRole('heading', { name: 'Your profile' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  expect(await focusIsInMain(page)).toBe(true)

  // Back restores where you were on the map.
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Your learning map' })).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100)

  // Map → lesson: focus lands in the lesson, not on the stale Start link.
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.getByRole('link', { name: /Start/ }).click()
  await expect(page.getByRole('heading', { name: /Lost in the fog/ })).toBeVisible()
  await expect.poll(() => focusIsInMain(page)).toBe(true)

  // Lesson → map via the close button.
  await page.getByRole('link', { name: 'Close lesson' }).click()
  await expect(page.getByRole('heading', { name: 'Your learning map' })).toBeVisible()
  await expect.poll(() => focusIsInMain(page)).toBe(true)
})

test('a fresh page load leaves focus at the start of the document', async ({ page }) => {
  await page.goto(LESSON)
  await expect(page.getByRole('heading', { name: /Lost in the fog/ })).toBeVisible()
  expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true)
})

test('a lesson that fails to load shows a friendly message', async ({ page }) => {
  await page.route('**/assets/LessonPage-*.js', (route) => route.abort())
  await page.goto(LESSON)
  await expect(page.getByRole('heading', { name: "Couldn't load the lesson" })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Reload' })).toBeVisible()
})

test('Back from the completion screen returns to the last step', async ({ page }) => {
  await page.goto(`${LESSON}?step=${STEP_COUNT}`)
  await page.getByRole('button', { name: /Finish/ }).click()
  await expect(page.getByRole('heading', { name: 'Lesson complete!' })).toBeVisible()
  expect(page.url()).toContain('step=done')

  await page.goBack()
  await expect(page.getByRole('progressbar', stepBar(STEP_COUNT))).toBeAttached()
  await expect(page.getByRole('heading', { name: 'Lesson complete!' })).toHaveCount(0)

  // Forward again shows the celebration from this visit.
  await page.goForward()
  await expect(page.getByRole('heading', { name: 'Lesson complete!' })).toBeVisible()

  // A reload of the done URL has nothing to celebrate: it shows the last step.
  await page.reload()
  await expect(page.getByRole('progressbar', stepBar(STEP_COUNT))).toBeAttached()
  await expect(page.getByRole('heading', { name: 'Lesson complete!' })).toHaveCount(0)
})

test('"Review lesson" goes straight to step 1 without flashing the last step', async ({ page }) => {
  await page.goto(`${LESSON}?step=${STEP_COUNT}`)
  await page.getByRole('button', { name: /Finish/ }).click()
  await expect(page.getByRole('heading', { name: 'Lesson complete!' })).toBeVisible()

  // Record every progress label that appears from now on.
  await page.evaluate(() => {
    const seen: string[] = []
    ;(window as unknown as { seenSteps: string[] }).seenSteps = seen
    new MutationObserver(() => {
      const label = document.querySelector('header progress')?.getAttribute('aria-label')
      if (label) seen.push(label)
    }).observe(document.body, { subtree: true, childList: true, attributes: true })
  })
  await page.getByRole('button', { name: 'Review lesson' }).click()
  await expect(page.getByRole('progressbar', stepBar(1))).toBeAttached()
  const seen = await page.evaluate(() => (window as unknown as { seenSteps: string[] }).seenSteps)
  expect(seen).not.toContain(`Step ${STEP_COUNT} of ${STEP_COUNT}`)
})
