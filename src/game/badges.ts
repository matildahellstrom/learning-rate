import type { BadgeDef, BadgeRule } from '../content/schema'
import { levelFromXp } from './levels'
import type { GameState } from './state'

export function isRuleMet(rule: BadgeRule, state: GameState): boolean {
  const lessons = Object.values(state.lessons)
  switch (rule.type) {
    case 'lessonsCompleted':
      return lessons.filter((l) => l.completedAt !== null).length >= rule.count
    case 'perfectQuiz':
      return lessons.some((l) => l.quizPerfect)
    case 'challengeStars':
      return lessons.some((l) => Object.values(l.challengeStars).some((s) => s >= rule.stars))
    case 'streak':
      return state.streak.best >= rule.days
    case 'level':
      return levelFromXp(state.xp).level >= rule.level
  }
}

/** Ids of badges whose rule is now met but which haven't been awarded yet. */
export function newlyEarnedBadges(state: GameState, badges: BadgeDef[]): string[] {
  return badges.filter((b) => !(b.id in state.badges) && isRuleMet(b.rule, state)).map((b) => b.id)
}
