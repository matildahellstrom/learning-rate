import { useLayoutEffect } from 'react'

let suppressors = 0
const listeners = new Set<() => void>()

/** True while some screen (e.g. the lesson completion screen) shows rewards itself. */
export function rewardToastsSuppressed(): boolean {
  return suppressors > 0
}

export function onToastSuppressionChange(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * While the calling component is mounted, reward toasts are hidden and new ones are skipped.
 * A layout effect, so toasts from the click that opened the screen are gone before it paints.
 */
export function useSuppressRewardToasts() {
  useLayoutEffect(() => {
    suppressors++
    listeners.forEach((l) => l())
    return () => {
      suppressors--
      listeners.forEach((l) => l())
    }
  }, [])
}
