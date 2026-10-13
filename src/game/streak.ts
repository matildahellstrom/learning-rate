import { daysBetween } from './dates'

export type Streak = {
  current: number
  best: number
  /** Last day with any activity, "YYYY-MM-DD". */
  lastDay: string | null
  /** Each freeze covers one missed day. */
  freezes: number
}

export type StreakChange = 'started' | 'extended' | 'freezeUsed' | 'reset' | 'unchanged'

export const MAX_FREEZES = 2
/** A freeze is earned every this many streak days. */
export const FREEZE_EVERY = 7

export const emptyStreak: Streak = { current: 0, best: 0, lastDay: null, freezes: 0 }

export function recordActivity(
  streak: Streak,
  today: string,
): { streak: Streak; change: StreakChange } {
  if (streak.lastDay === null) {
    return { streak: withBest({ ...streak, current: 1, lastDay: today }), change: 'started' }
  }

  const gap = daysBetween(streak.lastDay, today)
  // A day we can't read (gap is NaN): start over rather than let NaN leak into the save.
  if (!Number.isFinite(gap) || !Number.isFinite(streak.freezes)) {
    return {
      streak: withBest({ ...streak, current: 1, freezes: 0, lastDay: today }),
      change: 'reset',
    }
  }
  // Same day, or the clock went backwards: nothing to do.
  if (gap <= 0) return { streak, change: 'unchanged' }

  const missed = gap - 1
  if (missed > streak.freezes) {
    return { streak: withBest({ ...streak, current: 1, lastDay: today }), change: 'reset' }
  }

  const current = streak.current + 1
  const earnedFreeze = current % FREEZE_EVERY === 0 ? 1 : 0
  const freezes = Math.min(MAX_FREEZES, streak.freezes - missed + earnedFreeze)
  return {
    streak: withBest({ ...streak, current, freezes, lastDay: today }),
    change: missed > 0 ? 'freezeUsed' : 'extended',
  }
}

/** The streak to display today: 0 if it can no longer be saved. */
export function activeStreak(streak: Streak, today: string): number {
  if (streak.lastDay === null) return 0
  const missed = daysBetween(streak.lastDay, today) - 1
  if (!Number.isFinite(missed)) return 0
  return missed > streak.freezes ? 0 : streak.current
}

function withBest(streak: Streak): Streak {
  return { ...streak, best: Math.max(streak.best, streak.current) }
}
