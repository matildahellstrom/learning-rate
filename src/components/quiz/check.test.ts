import { describe, expect, it } from 'vitest'
import type { Question } from '../../content/schema'
import { checkAnswer, formatAnswer, parseNumber } from './check'

const choice: Question = {
  type: 'choice',
  prompt: 'Which way?',
  options: ['Up', 'Down'],
  answer: 1,
  explanation: 'Downhill.',
}

const numeric: Question = {
  type: 'numeric',
  prompt: 'Where after one step?',
  answer: 1,
  tolerance: 0.01,
  explanation: '2 − 0.25 · 4 = 1',
}

describe('parseNumber', () => {
  it.each([
    ['1', 1],
    [' 0.5 ', 0.5],
    ['0,5', 0.5],
    ['-2', -2],
    ['.25', 0.25],
    ['1e-3', 0.001],
    ['−2', -2],
    ['−0,5', -0.5],
    ['0,125', 0.125],
    ['1,0', 1],
    ['1.0', 1],
    [' 1 ', 1],
    ['+1', 1],
    ['1e0', 1],
    ['1.', 1],
    ['.99999', 0.99999],
  ])('parses %j', (input, expected) => {
    expect(parseNumber(input)).toBe(expected)
  })

  it.each(['', 'abc', '1.2.3', '--1', '1,2,3', '1,000', '12,345', '1,000.5', '1.000,5'])(
    'rejects %j',
    (input) => {
      expect(parseNumber(input)).toBeNull()
    },
  )
})

describe('checkAnswer', () => {
  it('checks choice questions by option index', () => {
    expect(checkAnswer(choice, 1)).toEqual({ valid: true, correct: true })
    expect(checkAnswer(choice, 0)).toEqual({ valid: true, correct: false })
  })

  it('accepts numeric answers within the tolerance', () => {
    expect(checkAnswer(numeric, '1.005')).toEqual({ valid: true, correct: true })
    expect(checkAnswer(numeric, '1,01')).toEqual({ valid: true, correct: true })
    expect(checkAnswer(numeric, '1.1')).toEqual({ valid: true, correct: false })
  })

  it('flags unparseable numeric input instead of marking it wrong', () => {
    expect(checkAnswer(numeric, 'one')).toEqual({ valid: false })
  })

  it('formats the correct answer for feedback', () => {
    expect(formatAnswer(choice)).toBe('Down')
    expect(formatAnswer(numeric)).toBe('1')
  })
})
