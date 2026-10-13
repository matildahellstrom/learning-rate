import { useEffect, useState } from 'react'

const reducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Counts from 0 up to `target` over `ms` milliseconds (ease-out), for scoreboard-style numbers.
 * Under prefers-reduced-motion it shows the final number straight away.
 */
export function useCountUp(target: number, ms = 900, delay = 300): number {
  const [value, setValue] = useState(() => (reducedMotion() ? target : 0))

  useEffect(() => {
    if (reducedMotion()) return
    let frame = 0
    const start = performance.now() + delay
    const tick = (now: number) => {
      const progress = Math.min(1, Math.max(0, (now - start) / ms))
      const eased = 1 - (1 - progress) ** 3
      setValue(Math.round(target * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, ms, delay])

  return value
}
