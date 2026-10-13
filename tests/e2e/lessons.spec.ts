import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import { expectAccessible, watchConsole } from './helpers.ts'

// Data-driven: every lesson in content/en/<track>/<id>/index.mdx, every step.
const contentDir = join(import.meta.dirname, '../../content/en')
const lessonIds = readdirSync(contentDir, { withFileTypes: true })
  .filter((track) => track.isDirectory())
  .flatMap((track) =>
    readdirSync(join(contentDir, track.name)).filter((id) =>
      existsSync(join(contentDir, track.name, id, 'index.mdx')),
    ),
  )

for (const id of lessonIds) {
  test(`${id}: every step renders without console errors or serious axe violations`, async ({
    page,
  }) => {
    const consoleMessages = watchConsole(page)
    await page.goto(`/#/learn/${id}?step=1`)
    const bar = page.locator('header progress')
    await expect(bar).toHaveAttribute('aria-label', /^Step 1 of \d+$/)
    const total = Number(/of (\d+)/.exec((await bar.getAttribute('aria-label')) ?? '')?.[1])

    for (let n = 1; n <= total; n++) {
      await page.goto(`/#/learn/${id}?step=${n}`)
      await expect(page.getByRole('progressbar', { name: `Step ${n} of ${total}` })).toBeAttached()
      // Open every "Go deeper" box so its maths is scanned too.
      await page.locator('main details').evaluateAll((els) => {
        for (const el of els) (el as HTMLDetailsElement).open = true
      })
      await expectAccessible(page)
    }
    expect(consoleMessages).toEqual([])
  })
}
