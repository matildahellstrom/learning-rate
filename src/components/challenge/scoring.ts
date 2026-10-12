/** Max steps allowed for one, two and three stars, e.g. [25, 10, 3]. */
export type StepThresholds = readonly [number, number, number]

export function starsForSteps(steps: number, thresholds: StepThresholds): number {
  const [one, two, three] = thresholds
  if (steps <= three) return 3
  if (steps <= two) return 2
  if (steps <= one) return 1
  return 0
}

/** Steps needed for the next star, or null at three stars. */
export function stepsForNextStar(stars: number, thresholds: StepThresholds): number | null {
  return stars >= 3 ? null : thresholds[stars]
}
