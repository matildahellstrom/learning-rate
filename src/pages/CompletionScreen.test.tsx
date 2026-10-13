// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getLesson } from '../content/lessons'
import { CompletionScreen } from './CompletionScreen'

beforeEach(() => {
  vi.useFakeTimers()
  // jsdom has no canvas; the confetti is decorative, so a null context is fine.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const isHidden = (el: Element) => el.closest('[aria-hidden="true"]') !== null

describe('CompletionScreen', () => {
  it('gives screen readers the final XP straight away, not the count-up', () => {
    render(
      <MemoryRouter>
        <CompletionScreen
          lesson={getLesson('gradient-descent')!}
          rewards={[{ type: 'xp', amount: 100, reason: 'lesson' }]}
          quizCorrect={5}
          onReview={() => {}}
        />
      </MemoryRouter>,
    )
    // At t = 0 the animated number still says +0, but only for the eyes.
    const visible = screen.getAllByText(/^\+\d+ XP$/).filter((el) => !isHidden(el))
    expect(visible.map((el) => el.textContent)).toEqual(['+100 XP'])
    for (const el of screen.queryAllByText('+0 XP')) expect(isHidden(el)).toBe(true)
  })
})
