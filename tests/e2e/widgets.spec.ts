import { expect, test, type Page } from '@playwright/test'
import { expectAccessible, openStep } from './helpers.ts'

/** Centre of the draggable ball in page pixels. */
async function ballCentre(page: Page) {
  // Clicking Step scrolls the page; bring the plot back to the middle (clear of the sticky bars).
  await page
    .locator('.mafs-movable-point')
    .evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
  const box = await page.locator('.mafs-movable-point-point').boundingBox()
  if (!box) throw new Error('no draggable ball on this step')
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

for (const { step, slider } of [
  { step: 3, slider: 'Start position' },
  { step: 8, slider: 'Start x' },
]) {
  test(`the ball can be dragged by its centre (step ${step})`, async ({ page }) => {
    await openStep(page, step)
    const start = page.getByLabel(slider, { exact: true })

    // Before any step (the orange "current position" dot sits exactly on the ball) and after a
    // few steps (the faded path dots start there).
    for (const stepsFirst of [0, 2]) {
      for (let i = 0; i < stepsFirst; i++) {
        await page.getByRole('button', { name: 'Step', exact: true }).click()
      }
      const centre = await ballCentre(page)
      const hitsBall = await page.evaluate(
        ({ x, y }) => document.elementFromPoint(x, y)?.closest('.mafs-movable-point') !== null,
        centre,
      )
      expect(hitsBall, 'the element under the ball centre belongs to the draggable point').toBe(
        true,
      )

      const before = await start.inputValue()
      await page.mouse.move(centre.x, centre.y)
      await page.mouse.down()
      await page.mouse.move(centre.x - 30, centre.y, { steps: 4 })
      await page.mouse.move(centre.x - 60, centre.y, { steps: 4 })
      await page.mouse.up()
      await expect(start).not.toHaveValue(before)
    }
  })
}

test('the draggable ball has an accessible name', async ({ page }) => {
  for (const step of [3, 5, 7, 8]) {
    await openStep(page, step)
    const ball = page.locator('.mafs-movable-point')
    await ball.focus()
    await expect(page.locator(':focus')).toHaveAccessibleName(/^Ball start position/)
  }

  // On the 1D bowl it is a slider whose value follows the arrow keys.
  await openStep(page, 3)
  const ball = page.getByRole('slider', { name: 'Ball start position' })
  await expect(ball).toHaveAttribute('aria-valuetext', '3.0')
  await ball.focus()
  await page.keyboard.press('ArrowLeft')
  await expect(ball).not.toHaveAttribute('aria-valuetext', '3.0')
  await expectAccessible(page)

  await openStep(page, 8)
  await expectAccessible(page)
})
