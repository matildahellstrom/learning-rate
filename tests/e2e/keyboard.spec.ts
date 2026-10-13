import { expect, test } from '@playwright/test'
import { openStep } from './helpers.ts'

test('the quiz can be answered with the keyboard alone', async ({ page }) => {
  await openStep(page, 10)
  const focused = page.locator(':focus')

  // Q1 (choice): arrow keys pick an option, Enter checks, Enter again goes on.
  await page.getByRole('radio').first().focus()
  await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('radio', { name: 'Opposite the gradient, downhill' })).toBeChecked()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'Next question' })).toBeFocused()
  await page.keyboard.press('Enter')

  // Q2 (numeric): focus is on the new question, and Tab reaches its input next.
  await expect(focused).toHaveText('Question 2 of 5')
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Your answer')).toBeFocused()
  await page.keyboard.type('1')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'Next question' })).toBeFocused()
  await page.keyboard.press('Enter')

  // Q3 (choice) after a numeric question: same again, never <body> or the footer.
  await expect(focused).toHaveText('Question 3 of 5')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('radio').first()).toBeFocused()
})
