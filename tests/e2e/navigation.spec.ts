import { expect, test } from '@playwright/test'
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
