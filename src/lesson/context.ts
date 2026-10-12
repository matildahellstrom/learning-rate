import { createContext, useContext } from 'react'
import type { Lesson } from '../content/lessons'

export type LessonContextValue = {
  lesson: Lesson
  step: number
  /** Question index → answered correctly on the first try, for this attempt. */
  quizAttempt: Record<number, boolean>
  recordQuizAnswer: (index: number, correct: boolean) => void
}

export const LessonContext = createContext<LessonContextValue | null>(null)

export function useLesson(): LessonContextValue {
  const value = useContext(LessonContext)
  if (!value) throw new Error('useLesson must be used inside a lesson')
  return value
}
