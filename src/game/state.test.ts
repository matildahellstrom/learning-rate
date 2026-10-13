import { describe, expect, it } from 'vitest'
import { emptyLessonProgress, GAME_STATE_VERSION, initialGameState, migrateSaved } from './state'

const valid = {
  version: GAME_STATE_VERSION,
  xp: 210,
  lessons: {
    'gradient-descent': {
      completedAt: '2026-10-12',
      stars: 2,
      quizCorrect: [0, 1, 2, 3, 4],
      quizPerfect: true,
      challengeStars: { 'bowl-speedrun': 3, 'ravine-tamer': 1 },
    },
    derivatives: { ...emptyLessonProgress(), completedAt: '2026-10-11', stars: 1 },
  },
  streak: { current: 3, best: 5, lastDay: '2026-10-12', freezes: 1 },
  badges: { 'first-steps': '2026-10-12' },
}

const withChanges = (change: (copy: typeof valid) => void) => {
  const copy = structuredClone(valid)
  change(copy)
  return copy
}

describe('migrateSaved', () => {
  it('keeps a valid save as it is', () => {
    expect(migrateSaved(valid)).toEqual({ state: valid, repaired: false, fromNewerVersion: false })
  })

  it('repairs a malformed streak day instead of wiping all progress', () => {
    const saved = withChanges((s) => (s.streak.lastDay = '13/10/2026'))
    const { state, repaired } = migrateSaved(saved)
    expect(repaired).toBe(true)
    expect(state.xp).toBe(210)
    expect(state.lessons).toEqual(valid.lessons)
    expect(state.streak).toEqual({ current: 3, best: 5, lastDay: null, freezes: 1 })
  })

  it('keeps xp and the other lessons when one lesson entry is broken', () => {
    const saved = withChanges((s) => {
      ;(s.lessons as Record<string, unknown>).broken = 'not an object'
      ;(s.lessons.derivatives as { stars: number }).stars = 4
    })
    const { state } = migrateSaved(saved)
    expect(state.xp).toBe(210)
    expect(state.lessons['gradient-descent']).toEqual(valid.lessons['gradient-descent'])
    expect(state.lessons.derivatives.stars).toBe(3)
    expect(state.lessons).not.toHaveProperty('broken')
  })

  it('clamps impossible numbers instead of rejecting everything', () => {
    const saved = withChanges((s) => {
      s.xp = -5
      s.streak.freezes = Number.NaN
    })
    const { state } = migrateSaved(saved)
    expect(state.xp).toBe(0)
    expect(state.streak.freezes).toBe(0)
    expect(state.lessons).toEqual(valid.lessons)
  })

  it('drops badges with unreadable dates (they are re-awarded by their rule)', () => {
    const saved = withChanges((s) => ((s.badges as Record<string, string>).bad = 'yesterday'))
    expect(migrateSaved(saved).state.badges).toEqual(valid.badges)
  })

  it('flags data from a newer version of the app without calling it repaired', () => {
    const result = migrateSaved({ ...valid, version: GAME_STATE_VERSION + 1 })
    expect(result.fromNewerVersion).toBe(true)
    expect(result.repaired).toBe(false)
    expect(result.state.xp).toBe(210)
  })

  it('starts fresh from things that are not a save at all', () => {
    for (const saved of [undefined, null, 42, 'text', []]) {
      expect(migrateSaved(saved).state).toEqual(initialGameState())
    }
  })
})
