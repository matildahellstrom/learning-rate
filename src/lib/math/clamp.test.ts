import { describe, expect, it } from 'vitest'
import { clamp } from './clamp'

describe('clamp', () => {
  it('returns values inside the interval unchanged', () => {
    expect(clamp(0.5, 0, 1)).toBe(0.5)
  })

  it('pulls values outside the interval to the nearest bound', () => {
    expect(clamp(-3, 0, 1)).toBe(0)
    expect(clamp(42, 0, 1)).toBe(1)
  })

  it('keeps the bounds themselves', () => {
    expect(clamp(0, 0, 1)).toBe(0)
    expect(clamp(1, 0, 1)).toBe(1)
  })

  it('rejects an empty interval', () => {
    expect(() => clamp(0, 1, 0)).toThrow(RangeError)
  })
})
