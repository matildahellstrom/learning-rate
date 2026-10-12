import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { levelFromXp, xpForLevel } from './levels'

describe('xpForLevel', () => {
  it('follows 0, 100, 300, 600, 1000', () => {
    expect([1, 2, 3, 4, 5].map(xpForLevel)).toEqual([0, 100, 300, 600, 1000])
  })
})

describe('levelFromXp', () => {
  it('starts at level 1 with no progress', () => {
    expect(levelFromXp(0)).toEqual({ level: 1, xpIntoLevel: 0, xpForNextLevel: 100, progress: 0 })
  })

  it('levels up exactly on the boundary', () => {
    expect(levelFromXp(99).level).toBe(1)
    expect(levelFromXp(100).level).toBe(2)
    expect(levelFromXp(300).level).toBe(3)
  })

  it('reports progress within a level', () => {
    expect(levelFromXp(150)).toMatchObject({ level: 2, xpIntoLevel: 50, progress: 0.25 })
  })

  it('always lands between the thresholds of its level', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10_000_000 }), (xp) => {
        const { level } = levelFromXp(xp)
        expect(xpForLevel(level)).toBeLessThanOrEqual(xp)
        expect(xpForLevel(level + 1)).toBeGreaterThan(xp)
      }),
    )
  })
})
