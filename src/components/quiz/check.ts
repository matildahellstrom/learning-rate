import type { Question } from '../../content/schema'

/** Accepts "0.5", " 0,5 " (comma decimals, common in Europe) and "-2". */
export function parseNumber(input: string): number | null {
  const normalised = input.trim().replace(',', '.')
  if (normalised === '' || !/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(normalised)) return null
  return Number(normalised)
}

export type CheckResult = { valid: false } | { valid: true; correct: boolean }

/** `response` is the chosen option index for choice questions, the typed text for numeric ones. */
export function checkAnswer(question: Question, response: number | string): CheckResult {
  if (question.type === 'choice') {
    return { valid: true, correct: response === question.answer }
  }
  const value = typeof response === 'number' ? response : parseNumber(response)
  if (value === null) return { valid: false }
  // A tiny epsilon so 0.1 + 0.2-style float noise never marks a right answer wrong.
  return { valid: true, correct: Math.abs(value - question.answer) <= question.tolerance + 1e-9 }
}

export function formatAnswer(question: Question): string {
  return question.type === 'choice' ? question.options[question.answer] : String(question.answer)
}
