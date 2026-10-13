import { describe, expect, it } from 'vitest'
import { loadQuizAttempt, saveQuizAttempt } from './quizAttempt'

function memoryStorage() {
  const data = new Map<string, string>()
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    data,
  }
}

describe('quiz attempt storage', () => {
  it('round-trips an attempt per lesson', () => {
    const storage = memoryStorage()
    saveQuizAttempt(storage, 'a', { 0: true, 1: false })
    expect(loadQuizAttempt(storage, 'a')).toEqual({ 0: true, 1: false })
    expect(loadQuizAttempt(storage, 'b')).toEqual({})
  })

  it('removes the entry for an empty attempt', () => {
    const storage = memoryStorage()
    saveQuizAttempt(storage, 'a', { 0: true })
    saveQuizAttempt(storage, 'a', {})
    expect(storage.data.size).toBe(0)
  })

  it('ignores corrupt or malformed data', () => {
    const storage = memoryStorage()
    for (const raw of ['{oops', '[true]', '"x"', '{"0":"yes","x":true,"2":false}']) {
      storage.data.set('learning-rate:quiz-attempt:a', raw)
      const attempt = loadQuizAttempt(storage, 'a')
      expect(Object.values(attempt).every((v) => typeof v === 'boolean')).toBe(true)
    }
    expect(loadQuizAttempt(storage, 'a')).toEqual({ 2: false })
    expect(loadQuizAttempt(null, 'a')).toEqual({})
  })
})
