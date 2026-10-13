import { AxeBuilder } from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

export const LESSON = '/#/learn/gradient-descent'
export const STEP_COUNT = 11
export const STORAGE_KEY = 'learning-rate:game'

/** Fails on serious or critical WCAG A/AA violations. */
export async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  )
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([])
}

/** Opens the gradient descent lesson at "Step n of 11" (1-based, as the player sees it). */
export async function openStep(page: Page, n: number) {
  await page.goto(`${LESSON}?step=${n}`)
  await expect(page.getByRole('progressbar', { name: `Step ${n} of ${STEP_COUNT}` })).toBeAttached()
}

/** Presses Continue until the lesson shows "Step n of 11", waiting for each step to render. */
export async function continueTo(page: Page, step: number, total = STEP_COUNT) {
  const bar = page.locator('header progress')
  for (;;) {
    const label = (await bar.getAttribute('aria-label')) ?? ''
    const current = Number(/Step (\d+)/.exec(label)?.[1])
    if (current >= step) return
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(
      page.getByRole('progressbar', { name: `Step ${current + 1} of ${total}` }),
    ).toBeAttached()
  }
}

export const QUIZ_ANSWERS: (string | number)[] = [
  'Opposite the gradient, downhill',
  1,
  'It zig-zags across the valley but still reaches the bottom',
  'It only feels the local slope, so it cannot see the deeper valley',
  'The steep direction across the walls',
]

/** Collects console warnings/errors and uncaught page errors. */
export function watchConsole(page: Page): string[] {
  const messages: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') messages.push(`[${m.type()}] ${m.text()}`)
  })
  page.on('pageerror', (e) => messages.push(`[pageerror] ${e.message}`))
  return messages
}
