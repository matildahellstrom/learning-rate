import type { Question } from '../../content/schema'

/**
 * Accepts "0.5", " 0,5 " (comma decimals, common in Europe), "-2" and "−2" (the Unicode minus
 * sign, as in the lesson text). Returns null for anything that isn't clearly one number, so the
 * quiz asks again instead of silently marking it wrong.
 */
export function parseNumber(input: string): number | null {
  const trimmed = input.trim().replace(/\u2212/g, '-')
  // "1,000" or "12,345.6" use a thousands separator: reading "1,000" as 1.0 would be wrong.
  if (/^[-+]?[1-9]\d{0,2}(,\d{3})+(\.\d*)?$/.test(trimmed)) return null
  // More than one separator ("1.000,5", "1,2,3") is ambiguous.
  if ((trimmed.match(/[.,]/g) ?? []).length > 1) return null
  const normalised = trimmed.replace(',', '.')
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
