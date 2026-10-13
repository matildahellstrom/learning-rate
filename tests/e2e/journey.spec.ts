import { expect, test } from '@playwright/test'
import { continueTo, expectAccessible, QUIZ_ANSWERS } from './helpers.ts'

test('a new player finishes the gradient descent lesson and keeps their progress', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Your learning map' })).toBeVisible()
  await expectAccessible(page)

  // Start from the "Up next" card.
  await page.getByRole('link', { name: /Start/ }).click()
  await expect(page.getByRole('heading', { name: /Lost in the fog/ })).toBeVisible()
  await expect(page.getByText(/Recommended first/)).toBeVisible()
  await expectAccessible(page)

  // The first playground: stepping moves the ball and updates the readout.
  await continueTo(page, 3, 11)
  await expect(page.getByText('Step 0 · loss 9.000')).toBeVisible()
  await page.getByRole('button', { name: 'Step', exact: true }).click()
  await expect(page.getByText('Step 1 · loss 5.760')).toBeVisible()
  await expectAccessible(page)

  // Challenge: η = 0.5 reaches the bottom of the bowl in one step → three stars.
  await continueTo(page, 6, 11)
  await page.getByLabel('Learning rate η').fill('0.5')
  await page.getByRole('button', { name: 'Step', exact: true }).click()
  await expect(page.getByText('Reached the bottom in a single step!')).toBeVisible()
  await expect(page.getByText('Three stars, perfect!')).toBeVisible()

  // Quiz: all five right on the first try.
  await continueTo(page, 10, 11)
  for (const answer of QUIZ_ANSWERS) {
    if (typeof answer === 'number') {
      await page.getByLabel('Your answer').fill(String(answer))
    } else {
      await page.getByRole('radio', { name: answer }).check()
    }
    await page.getByRole('button', { name: 'Check' }).click()
    await expect(page.getByText('Correct!')).toBeVisible()
    await page.getByRole('button', { name: 'Next question' }).click()
  }
  await expect(page.getByText('Quiz done: 5 of 5 right.')).toBeVisible()

  await continueTo(page, 11, 11)
  await expect(page.getByRole('heading', { name: 'Sources' })).toBeVisible()
  await page.getByRole('button', { name: 'Finish' }).click()

  // Celebration: 2 of 3 stars (the ravine challenge is still open), level 2, new badges.
  await expect(page.getByRole('heading', { name: 'Lesson complete!' })).toBeFocused()
  await expect(page.getByText('2 of 3 stars').first()).toBeAttached()
  await expect(page.getByText('+180 XP')).toBeVisible()
  await expect(page.getByText('Level up! You are now level 2.')).toBeVisible()
  for (const badge of ['First steps', 'Perfectionist', 'Speedrunner', 'Levelling up']) {
    await expect(page.getByRole('main').getByText(badge, { exact: true })).toBeVisible()
  }
  await expectAccessible(page)

  // Progress survives a reload.
  await page.getByRole('link', { name: 'Back to map' }).click()
  await page.reload()
  await expect(page.getByText('Level 2').first()).toBeVisible()
  await expect(page.getByText('180 XP')).toBeVisible()
  await expect(page.getByText('You have finished every lesson so far')).toBeVisible()

  await page.getByRole('link', { name: 'Profile' }).click()
  await expect(page.getByRole('heading', { name: 'Your profile' })).toBeVisible()
  await expectAccessible(page)
})

test('the lesson can be played with the keyboard alone', async ({ page }) => {
  await page.goto('/#/learn/gradient-descent')
  await expect(page.getByRole('heading', { name: /Lost in the fog/ })).toBeVisible()

  // Tab to Continue and press Enter; focus then moves to the new step's content.
  const cont = page.getByRole('button', { name: 'Continue' })
  await cont.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: /Why would a computer/ })).toBeVisible()

  await cont.focus()
  await page.keyboard.press('Enter')
  const stepButton = page.getByRole('button', { name: 'Step', exact: true })
  await stepButton.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByText('Step 1 · loss 5.760')).toBeVisible()

  // The learning-rate slider responds to arrow keys.
  const slider = page.getByLabel('Learning rate η')
  await slider.focus()
  await page.keyboard.press('ArrowRight')
  await expect(slider).toHaveValue('0.11')
})

test('unknown lessons show a friendly not-found page', async ({ page }) => {
  await page.goto('/#/learn/does-not-exist')
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
})

test('no page scrolls sideways', async ({ page }) => {
  for (const path of ['/', '/#/profile', '/#/learn/gradient-descent']) {
    await page.goto(path)
    await page.getByRole('heading', { level: 1 }).first().waitFor()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow, `${path} is wider than the screen`).toBeLessThanOrEqual(0)
  }
})
