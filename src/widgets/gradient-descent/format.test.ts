import { describe, expect, it } from 'vitest'
import { formatLoss } from './format'

describe('formatLoss', () => {
  it.each([
    [9, '9.000'],
    [0.5876, '0.588'],
    [-1.4306, '-1.431'],
    [0, '0.000'],
    [0.0001234, '1.2e-4'],
    [2.5e-9, '2.5e-9'],
    [123456, '1.2e+5'],
    [Number.POSITIVE_INFINITY, '∞'],
    [Number.NaN, '∞'],
  ])('%d → %s', (loss, text) => {
    expect(formatLoss(loss)).toBe(text)
  })
})
