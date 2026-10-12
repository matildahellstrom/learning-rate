import type { BadgeDef } from '../content/schema'
import { newlyEarnedBadges } from './badges'
import { levelFromXp } from './levels'
import { emptyLessonProgress, type GameState, type LessonProgress } from './state'
import { recordActivity, type StreakChange } from './streak'

export type GameAction =
  | { type: 'quizAnswered'; lessonId: string; questionIndex: number; correct: boolean }
  | { type: 'challengeScored'; lessonId: string; challengeId: string; stars: number }
  | { type: 'lessonFinished'; lessonId: string; quizCorrect: number; quizTotal: number }

export type Reward =
  | { type: 'xp'; amount: number; reason: 'lesson' | 'quiz' | 'challenge' }
  | { type: 'levelUp'; level: number }
  | { type: 'badge'; badgeId: string }
  | { type: 'streak'; days: number; change: StreakChange }

export type GameContext = {
  today: string
  lesson: (id: string) => { xp: number; challenges: string[] } | undefined
  badges: BadgeDef[]
}

export const XP_PER_QUIZ_ANSWER = 10
export const XP_PER_CHALLENGE_STAR = 10

/**
 * The whole game in one pure function: (state, action) → (new state, rewards).
 * No storage, no dates from the clock, no React: easy to test and reason about.
 */
export function applyAction(
  state: GameState,
  action: GameAction,
  ctx: GameContext,
): { state: GameState; rewards: Reward[] } {
  const rewards: Reward[] = []
  const info = ctx.lesson(action.lessonId)
  if (!info) return { state, rewards }

  // Any activity counts towards today's streak.
  const streakResult = recordActivity(state.streak, ctx.today)
  if (streakResult.change !== 'unchanged') {
    rewards.push({ type: 'streak', days: streakResult.streak.current, change: streakResult.change })
  }

  const before = state.lessons[action.lessonId] ?? emptyLessonProgress()
  const lesson: LessonProgress = { ...before, challengeStars: { ...before.challengeStars } }
  let xpGained = 0

  switch (action.type) {
    case 'quizAnswered':
      if (action.correct && !lesson.quizCorrect.includes(action.questionIndex)) {
        lesson.quizCorrect = [...lesson.quizCorrect, action.questionIndex]
        xpGained = XP_PER_QUIZ_ANSWER
        rewards.push({ type: 'xp', amount: xpGained, reason: 'quiz' })
      }
      break

    case 'challengeScored': {
      const best = lesson.challengeStars[action.challengeId] ?? 0
      if (action.stars > best) {
        lesson.challengeStars[action.challengeId] = action.stars
        xpGained = (action.stars - best) * XP_PER_CHALLENGE_STAR
        rewards.push({ type: 'xp', amount: xpGained, reason: 'challenge' })
      }
      break
    }

    case 'lessonFinished':
      if (lesson.completedAt === null) {
        lesson.completedAt = ctx.today
        xpGained = info.xp
        rewards.push({ type: 'xp', amount: xpGained, reason: 'lesson' })
      }
      if (action.quizTotal > 0 && action.quizCorrect === action.quizTotal) {
        lesson.quizPerfect = true
      }
      break
  }

  lesson.stars = lessonStars(lesson, info.challenges)

  const next: GameState = {
    ...state,
    xp: state.xp + xpGained,
    streak: streakResult.streak,
    lessons: { ...state.lessons, [action.lessonId]: lesson },
  }

  const levelBefore = levelFromXp(state.xp).level
  const levelAfter = levelFromXp(next.xp).level
  if (levelAfter > levelBefore) rewards.push({ type: 'levelUp', level: levelAfter })

  const earned = newlyEarnedBadges(next, ctx.badges)
  if (earned.length > 0) {
    next.badges = { ...next.badges, ...Object.fromEntries(earned.map((id) => [id, ctx.today])) }
    rewards.push(...earned.map((badgeId) => ({ type: 'badge' as const, badgeId })))
  }

  return { state: next, rewards }
}

/** ★ finish the lesson · ★ perfect quiz · ★ three stars in every challenge. */
export function lessonStars(progress: LessonProgress, challenges: string[]): number {
  if (progress.completedAt === null) return 0
  const quizStar = progress.quizPerfect ? 1 : 0
  const challengeStar = challenges.every((id) => (progress.challengeStars[id] ?? 0) >= 3) ? 1 : 0
  return 1 + quizStar + challengeStar
}
