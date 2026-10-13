import { describe, expect, it } from 'vitest'
import { parseStep, stepToParam } from './stepParam'

describe('parseStep', () => {
  it('reads the 1-based URL step as a 0-based index', () => {
    expect(parseStep('1', 11)).toBe(0)
    expect(parseStep('6', 11)).toBe(5)
    expect(parseStep(stepToParam(10), 11)).toBe(10)
  })

  it('starts at the first step when the value is missing or invalid', () => {
    for (const value of [null, '', 'abc', '2.5', '-3', '1e2', '0x4']) {
      expect(parseStep(value, 11)).toBe(0)
    }
  })

  it('clamps out-of-range steps', () => {
    expect(parseStep('0', 11)).toBe(0)
    expect(parseStep('99', 11)).toBe(10)
  })
})
