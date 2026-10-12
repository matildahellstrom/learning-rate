// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import type { Lesson } from '../../content/lessons'
import { LessonContext } from '../../lesson/context'
import { Quiz } from './Quiz'

afterEach(cleanup)

const lesson = {
  id: 'test-lesson',
  quiz: [
    {
      type: 'choice',
      prompt: 'Which way do we step?',
      options: ['Uphill', 'Downhill'],
      answer: 1,
      explanation: 'Against the gradient.',
    },
    {
      type: 'numeric',
      prompt: 'Where after one step?',
      answer: 1,
      tolerance: 0.001,
      explanation: '2 − 0.25 × 4 = 1',
    },
  ],
} as unknown as Lesson

function Harness() {
  const [quizAttempt, setQuizAttempt] = useState<Record<number, boolean>>({})
  return (
    <LessonContext.Provider
      value={{
        lesson,
        step: 0,
        quizAttempt,
        recordQuizAnswer: (i, correct) => setQuizAttempt((a) => ({ ...a, [i]: correct })),
      }}
    >
      <Quiz />
    </LessonContext.Provider>
  )
}

describe('Quiz', () => {
  it('walks through questions with feedback and a final score', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    // Check is disabled until an option is chosen.
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Check' }).disabled).toBe(true)
    await user.click(screen.getByRole('radio', { name: 'Uphill' }))
    await user.click(screen.getByRole('button', { name: 'Check' }))
    expect(screen.getByText('Not quite.')).toBeTruthy()
    expect(screen.getByText('The answer: Downhill')).toBeTruthy()

    // Focus jumps to "Next question" so keyboard users can continue.
    const next = screen.getByRole('button', { name: 'Next question' })
    expect(document.activeElement).toBe(next)
    await user.click(next)

    // Numeric question accepts a comma decimal.
    await user.type(screen.getByLabelText('Your answer'), '1,0')
    await user.click(screen.getByRole('button', { name: 'Check' }))
    expect(screen.getByText('Correct!')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Next question' }))

    const done = screen.getByText(/1 of 2 right/)
    expect(document.activeElement).toBe(done)
  })

  it('asks again instead of marking unparseable numbers wrong', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('radio', { name: 'Downhill' }))
    await user.click(screen.getByRole('button', { name: 'Check' }))
    await user.click(screen.getByRole('button', { name: 'Next question' }))

    await user.type(screen.getByLabelText('Your answer'), 'one')
    await user.click(screen.getByRole('button', { name: 'Check' }))
    expect(screen.getByText('Please enter a number.')).toBeTruthy()
    expect(screen.getByLabelText('Your answer').getAttribute('aria-invalid')).toBe('true')
  })
})
