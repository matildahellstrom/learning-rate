// Pure maths for the gradient descent widgets. No React in here: everything is testable.

export type Vector = readonly number[]

/** A 1D loss landscape with its analytic derivative. */
export type Landscape1D = {
  id: string
  label: string
  f: (x: number) => number
  df: (x: number) => number
  /** x-range shown in the plot; the ball can't leave it. */
  domain: [number, number]
  /** y-range shown in the plot. */
  range: [number, number]
}

export const landscapes = {
  bowl: {
    id: 'bowl',
    label: 'Bowl',
    f: (x) => x * x,
    df: (x) => 2 * x,
    domain: [-4, 4],
    range: [-1, 12],
  },
  doubleWell: {
    id: 'doubleWell',
    label: 'Two valleys',
    // The +0.3x tilt makes the left valley deeper than the right one.
    f: (x) => 0.25 * x ** 4 - x * x + 0.3 * x,
    df: (x) => x ** 3 - 2 * x + 0.3,
    domain: [-2.5, 2.5],
    range: [-2, 4.5],
  },
  bumpy: {
    id: 'bumpy',
    label: 'Bumpy',
    f: (x) => 0.15 * x * x + 0.5 * Math.sin(3 * x),
    df: (x) => 0.3 * x + 1.5 * Math.cos(3 * x),
    domain: [-5, 5],
    range: [-1, 4.5],
  },
} satisfies Record<string, Landscape1D>

export type LandscapeId = keyof typeof landscapes

/** Central difference: (f(x+h) − f(x−h)) / 2h. Error shrinks like h², not h. */
export function numericalDerivative(f: (x: number) => number, x: number, h = 1e-5): number {
  return (f(x + h) - f(x - h)) / (2 * h)
}

/** Central-difference gradient: one partial derivative per coordinate. */
export function numericalGradient(f: (p: Vector) => number, p: Vector, h = 1e-5): number[] {
  return p.map((_, i) => {
    const plus = [...p]
    const minus = [...p]
    plus[i] += h
    minus[i] -= h
    return (f(plus) - f(minus)) / (2 * h)
  })
}

/** One step downhill: p − η∇f(p). */
export function gradientStep(p: Vector, gradient: Vector, learningRate: number): number[] {
  return p.map((pi, i) => pi - learningRate * gradient[i])
}

export function norm(v: Vector): number {
  return Math.hypot(...v)
}

export type DescentStatus = 'running' | 'converged' | 'diverged'

export type StatusOptions = {
  /** Converged once the gradient is this small. */
  tolerance?: number
  /** Diverged once any coordinate is this large (or not finite). */
  limit?: number
}

export function descentStatus(
  p: Vector,
  gradient: Vector,
  { tolerance = 1e-3, limit = 1e3 }: StatusOptions = {},
): DescentStatus {
  if (p.some((pi) => !Number.isFinite(pi) || Math.abs(pi) > limit)) return 'diverged'
  if (gradient.some((g) => !Number.isFinite(g))) return 'diverged'
  if (norm(gradient) < tolerance) return 'converged'
  return 'running'
}

export type DescentResult = {
  path: number[][]
  status: DescentStatus
  steps: number
}

/** Runs gradient descent until it converges, diverges or hits maxSteps. */
export function runDescent({
  start,
  gradient,
  learningRate,
  maxSteps = 1000,
  ...statusOptions
}: {
  start: Vector
  gradient: (p: Vector) => Vector
  learningRate: number
  maxSteps?: number
} & StatusOptions): DescentResult {
  const path = [[...start]]
  let p: number[] = [...start]
  let status = descentStatus(p, gradient(p), statusOptions)
  while (status === 'running' && path.length <= maxSteps) {
    p = gradientStep(p, gradient(p), learningRate)
    path.push(p)
    status = descentStatus(p, gradient(p), statusOptions)
  }
  return { path, status, steps: path.length - 1 }
}

/**
 * The 2D "ravine" f(x, y) = ½(x² + κy²): a valley that is κ times steeper across than along.
 * Its level sets are ellipses, so we can draw exact contours.
 */
export function ravine(kappa: number) {
  return {
    f: ([x, y]: Vector) => 0.5 * (x * x + kappa * y * y),
    gradient: ([x, y]: Vector): number[] => [x, kappa * y],
    /** Point on the contour f = level at angle t. */
    contour: (level: number, t: number): [number, number] => [
      Math.sqrt(2 * level) * Math.cos(t),
      Math.sqrt((2 * level) / kappa) * Math.sin(t),
    ],
  }
}

/**
 * For a quadratic with curvature λ, a step multiplies the distance to the minimum by (1 − ηλ).
 * That shrinks only while |1 − ηλ| < 1, i.e. for η < 2/λ.
 */
export function maxStableLearningRate(curvature: number): number {
  return 2 / curvature
}
