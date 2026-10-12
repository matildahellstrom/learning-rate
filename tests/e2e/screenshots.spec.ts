import { test } from '@playwright/test'

// Visual review helper, skipped unless SCREENSHOTS=1. Images land in test-results/screens/.
test.skip(!process.env.SCREENSHOTS, 'set SCREENSHOTS=1 to capture screenshots')

for (const scheme of ['light', 'dark'] as const) {
  test(`capture key screens (${scheme})`, async ({ page }, info) => {
    await page.emulateMedia({ colorScheme: scheme })
    const shot = (name: string) =>
      page.screenshot({
        path: `test-results/screens/${info.project.name}-${scheme}-${name}.png`,
        fullPage: true,
      })

    await page.goto('/')
    await shot('1-map')

    await page.goto('/#/learn/gradient-descent')
    await shot('2-lesson-intro')
    for (let i = 0; i < 2; i++) await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Step', exact: true }).click()
    await page.getByRole('button', { name: 'Step', exact: true }).click()
    await shot('3-playground')
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByText('Go deeper: the maths').click()
    await shot('4-deeper')
    for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByLabel('Learning rate η').fill('0.15')
    for (let i = 0; i < 12; i++)
      await page.getByRole('button', { name: 'Step', exact: true }).click()
    await shot('5-ravine')
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('radio').first().check()
    await page.getByRole('button', { name: 'Check' }).click()
    await shot('6-quiz')
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByRole('button', { name: 'Finish' }).click()
    await page.waitForTimeout(1500)
    await shot('7-complete')

    await page.goto('/#/profile')
    await shot('8-profile')
  })
}
