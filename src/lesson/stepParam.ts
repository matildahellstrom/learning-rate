/**
 * The lesson step lives in the URL (`#/learn/<id>?step=3`) so reload, Back/Forward and shared
 * links land on the same step. The URL is 1-based to match the "Step 3 of 11" the player sees;
 * inside the app steps are 0-based.
 */
export const STEP_PARAM = 'step'
/** `?step=done`: the completion screen, so Back from it returns to the last step. */
export const DONE_PARAM = 'done'

/** 0-based step from the URL value. Missing or invalid → 0; out of range → clamped. */
export function parseStep(value: string | null, stepCount: number): number {
  if (value === null || !/^\d+$/.test(value.trim())) return 0
  const step = Number(value.trim()) - 1
  return Math.min(Math.max(step, 0), Math.max(stepCount - 1, 0))
}

/** URL value for a 0-based step. */
export function stepToParam(step: number): string {
  return String(step + 1)
}
