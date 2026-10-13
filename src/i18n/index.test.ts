import { describe, expect, it } from 'vitest'
import { t, tn } from './index'

describe('t', () => {
  it('fills in placeholders', () => {
    expect(t('stats.level', { level: 3 })).toBe('Level 3')
  })
})

describe('tn', () => {
  it('picks the singular or plural form', () => {
    expect(tn('profile.days', 1, { days: 1 })).toBe('1 day')
    expect(tn('profile.days', 2, { days: 2 })).toBe('2 days')
    expect(tn('profile.days', 0, { days: 0 })).toBe('0 days')
  })
})
