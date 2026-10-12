import { describe, expect, it } from 'vitest'
import { daysBetween, toDayString } from './dates'
import { activeStreak, emptyStreak, recordActivity, type Streak } from './streak'

describe('dates', () => {
  it('formats the local day with zero padding', () => {
    expect(toDayString(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })

  it('counts days across month, year and DST boundaries', () => {
    expect(daysBetween('2026-01-31', '2026-02-01')).toBe(1)
    expect(daysBetween('2025-12-31', '2026-01-01')).toBe(1)
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2)
    expect(daysBetween('2026-10-12', '2026-10-10')).toBe(-2)
  })
})

describe('recordActivity', () => {
  const day = (n: number) => `2026-10-${String(n).padStart(2, '0')}`

  it('starts a streak on the first activity', () => {
    const { streak, change } = recordActivity(emptyStreak, day(1))
    expect(change).toBe('started')
    expect(streak).toMatchObject({ current: 1, best: 1, lastDay: day(1) })
  })

  it('ignores repeat activity on the same day', () => {
    const s = recordActivity(emptyStreak, day(1)).streak
    expect(recordActivity(s, day(1))).toEqual({ streak: s, change: 'unchanged' })
  })

  it('extends on consecutive days', () => {
    let s: Streak = emptyStreak
    for (let d = 1; d <= 3; d++) s = recordActivity(s, day(d)).streak
    expect(s).toMatchObject({ current: 3, best: 3 })
  })

  it('resets after a missed day when there is no freeze', () => {
    const s = recordActivity(emptyStreak, day(1)).streak
    const { streak, change } = recordActivity(s, day(3))
    expect(change).toBe('reset')
    expect(streak).toMatchObject({ current: 1, best: 1 })
  })

  it('earns a freeze every 7 days and spends it on a missed day', () => {
    let s: Streak = emptyStreak
    for (let d = 1; d <= 7; d++) s = recordActivity(s, day(d)).streak
    expect(s.freezes).toBe(1)

    const { streak, change } = recordActivity(s, day(9))
    expect(change).toBe('freezeUsed')
    expect(streak).toMatchObject({ current: 8, freezes: 0 })
  })

  it('caps freezes at 2', () => {
    let s: Streak = emptyStreak
    for (let d = 1; d <= 28; d++) s = recordActivity(s, day(d)).streak
    expect(s.freezes).toBe(2)
  })
})

describe('activeStreak', () => {
  it('shows 0 once the streak can no longer be saved', () => {
    const s: Streak = { current: 5, best: 5, lastDay: '2026-10-01', freezes: 0 }
    expect(activeStreak(s, '2026-10-02')).toBe(5)
    expect(activeStreak(s, '2026-10-03')).toBe(0)
  })
})
