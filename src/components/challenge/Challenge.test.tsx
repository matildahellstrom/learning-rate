// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { Lesson } from '../../content/lessons'
import { LessonContext } from '../../lesson/context'
import { useChallenge, type WidgetEvent } from '../../widgets/events'
import { Challenge } from './Challenge'

afterEach(cleanup)

const lesson = { id: 'test-lesson', challenges: ['speedrun'], file: 'test' } as unknown as Lesson

const events: Record<string, WidgetEvent> = {
  converge: { type: 'converged', steps: 6 },
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
  render(
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
})
