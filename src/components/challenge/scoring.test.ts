import { describe, expect, it } from 'vitest'
import { starsForSteps, stepsForNextStar, type StepThresholds } from './scoring'

const thresholds: StepThresholds = [25, 10, 3]

describe('starsForSteps', () => {
  it.each([
    [1, 3],
    [3, 3],
    [4, 2],
    [10, 2],
    [11, 1],
    [25, 1],
    [26, 0],
  ])('%i steps → %i stars', (steps, stars) => {
    expect(starsForSteps(steps, thresholds)).toBe(stars)
  })
})

describe('stepsForNextStar', () => {
  it('points at the next threshold', () => {
    expect(stepsForNextStar(0, thresholds)).toBe(25)
    expect(stepsForNextStar(1, thresholds)).toBe(10)
    expect(stepsForNextStar(2, thresholds)).toBe(3)
    expect(stepsForNextStar(3, thresholds)).toBeNull()
  })
})
