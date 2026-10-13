/** Question index → answered correctly on the first try, for the current attempt. */
export type QuizAttempt = Record<number, boolean>

type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const key = (lessonId: string) => `learning-rate:quiz-attempt:${lessonId}`

/**
 * The quiz attempt is kept in sessionStorage: it survives a reload of this tab (so a reload
 * mid-quiz doesn't throw the attempt away) but not closing it, and never leaks between tabs.
 */
export function loadQuizAttempt(storage: KeyValueStorage | null, lessonId: string): QuizAttempt {
  try {
    const parsed: unknown = JSON.parse(storage?.getItem(key(lessonId)) ?? '{}')
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {}
    const attempt: QuizAttempt = {}
    for (const [index, correct] of Object.entries(parsed)) {
      if (/^\d+$/.test(index) && typeof correct === 'boolean') attempt[Number(index)] = correct
    }
    return attempt
  } catch {
    return {}
  }
}

export function saveQuizAttempt(
  storage: KeyValueStorage | null,
  lessonId: string,
  attempt: QuizAttempt,
) {
  try {
    if (Object.keys(attempt).length === 0) storage?.removeItem(key(lessonId))
    else storage?.setItem(key(lessonId), JSON.stringify(attempt))
  } catch {
    // Storage blocked or full: the attempt just won't survive a reload.
  }
}

/** sessionStorage if the browser lets us use it, otherwise null. */
export function browserSessionStorage(): KeyValueStorage | null {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null
  } catch {
    return null
  }
}
