import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import {
  descentStatus,
  gradientStep,
  landscapes,
  maxStableLearningRate,
  numericalDerivative,
  numericalGradient,
  ravine,
  runDescent,
} from './model'

describe('numericalDerivative', () => {
  it('matches a known derivative', () => {
    expect(numericalDerivative((x) => x ** 3, 2)).toBeCloseTo(12, 6)
  })

  it.each(Object.values(landscapes))('agrees with the analytic derivative of $label', (l) => {
    fc.assert(
      fc.property(fc.double({ min: l.domain[0], max: l.domain[1], noNaN: true }), (x) => {
        expect(numericalDerivative(l.f, x)).toBeCloseTo(l.df(x), 4)
      }),
    )
  })
})

describe('numericalGradient', () => {
  it('matches the analytic gradient of the ravine', () => {
    const r = ravine(10)
    const p = [1.5, -0.7]
    const [gx, gy] = numericalGradient(r.f, p)
    const [ax, ay] = r.gradient(p)
    expect(gx).toBeCloseTo(ax, 6)
    expect(gy).toBeCloseTo(ay, 6)
  })
})

describe('gradientStep', () => {
  it('moves against the gradient, scaled by the learning rate', () => {
    expect(gradientStep([1, 2], [4, -2], 0.5)).toEqual([-1, 3])
  })

  it('does not mutate its input', () => {
    const p = [1, 1]
    gradientStep(p, [1, 1], 0.1)
    expect(p).toEqual([1, 1])
  })
})

describe('descentStatus', () => {
  it('detects convergence, divergence and progress', () => {
    expect(descentStatus([0.1], [1e-4])).toBe('converged')
    expect(descentStatus([2e3], [1])).toBe('diverged')
    expect(descentStatus([Number.NaN], [1])).toBe('diverged')
    expect(descentStatus([1], [2])).toBe('running')
  })
})

describe('runDescent on the bowl f(x) = x²', () => {
  const gradient = ([x]: readonly number[]) => [landscapes.bowl.df(x)]

  it('converges for any start when 0 < η < 1', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -4, max: 4, noNaN: true }),
        fc.double({ min: 0.01, max: 0.99, noNaN: true }),
        (start, learningRate) => {
          const result = runDescent({ start: [start], gradient, learningRate })
          expect(result.status).toBe('converged')
        },
      ),
    )
  })

  it('diverges for η > 1 (each step overshoots further)', () => {
    const result = runDescent({ start: [1], gradient, learningRate: 1.1 })
    expect(result.status).toBe('diverged')
  })

  it('lands on the minimum in one step when η = 1/curvature = 0.5', () => {
    const result = runDescent({ start: [3], gradient, learningRate: 0.5 })
    expect(result.steps).toBe(1)
    expect(result.path[1][0]).toBe(0)
  })
})

describe('ravine stability', () => {
  const kappa = 10
  const { gradient } = ravine(kappa)
  const limit = maxStableLearningRate(kappa)

  it('has its stability limit at 2/κ', () => {
    expect(limit).toBeCloseTo(0.2)
  })

  it('converges just below the limit and diverges just above it', () => {
    const below = runDescent({ start: [3, 1], gradient, learningRate: limit * 0.95 })
    const above = runDescent({ start: [3, 1], gradient, learningRate: limit * 1.05 })
    expect(below.status).toBe('converged')
    expect(above.status).toBe('diverged')
  })
})
