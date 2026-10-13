// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { gameStore } from '../../app/game'
import type { Lesson } from '../../content/lessons'
import { LessonContext } from '../../lesson/context'
import { useChallenge, type WidgetEvent } from '../../widgets/events'
import { Challenge } from './Challenge'

beforeEach(() => {
  // jsdom has no canvas; the confetti is decorative, so a null context is fine.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

const lesson = { id: 'test-lesson', challenges: ['speedrun'], file: 'test' } as unknown as Lesson

const events: Record<string, WidgetEvent> = {
  converge: { type: 'converged', steps: 6 },
  perfect: { type: 'converged', steps: 2 },
  diverge: { type: 'diverged', steps: 12 },
  reset: { type: 'reset' },
}

/** Stands in for a playground: one button per event it can report. */
function FakeWidget() {
  const challenge = useChallenge()
  return Object.entries(events).map(([name, event]) => (
    <button key={name} type="button" onClick={() => challenge?.report(event)}>
      {name}
    </button>
  ))
}

function renderChallenge() {
  return render(
    <LessonContext.Provider
      value={{ lesson, step: 0, quizAttempt: {}, recordQuizAnswer: () => {} }}
    >
      <Challenge id="speedrun" title="Speedrun" goal="Be quick." stars={[25, 8, 3]}>
        <FakeWidget />
      </Challenge>
    </LessonContext.Provider>,
  )
}

const press = (name: string) => fireEvent.click(screen.getByRole('button', { name }))

describe('Challenge', () => {
  it('clears the last result when a later run diverges', () => {
    renderChallenge()
    press('converge')
    expect(screen.getByText(/Reached the bottom in 6 steps/)).toBeTruthy()

    press('diverge')
    expect(screen.queryByText(/Reached the bottom/)).toBeNull()
  })

  it('clears the last result when the run is reset', () => {
    renderChallenge()
    press('converge')
    press('reset')
    expect(screen.queryByText(/Reached the bottom/)).toBeNull()
  })

  it('celebrates a three-star run with confetti', () => {
    vi.spyOn(gameStore, 'dispatch').mockReturnValue([])
    const { container } = renderChallenge()
    press('perfect')
    expect(screen.getByText(/Three stars, perfect!/)).toBeTruthy()
    expect(container.querySelector('canvas')).not.toBeNull()
  })

  it("doesn't celebrate in a tab that can't save", () => {
    vi.spyOn(gameStore, 'isReadOnly').mockReturnValue(true)
    vi.spyOn(gameStore, 'dispatch').mockReturnValue([])
    const { container } = renderChallenge()
    press('perfect')
    // The run's result is still shown, but no confetti and no "perfect!".
    expect(screen.getByText(/Reached the bottom in 2 steps/)).toBeTruthy()
    expect(screen.getByText(/Not saved: this tab can't save progress/)).toBeTruthy()
    expect(screen.queryByText(/Three stars, perfect!/)).toBeNull()
    expect(container.querySelector('canvas')).toBeNull()
  })
})
