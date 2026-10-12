import { useEffect, useEffectEvent, useState } from 'react'
import type { WidgetEvent } from '../events'
import { descentStatus, gradientStep, type Vector } from './model'

export type PlaygroundStatus = 'running' | 'converged' | 'diverged' | 'tooSlow'

type Options = {
  start: Vector
  gradient: (p: Vector) => Vector
  learningRate: number
  /** Coordinates beyond this count as diverged. */
  limit: number
  maxSteps: number
  onEvent?: (event: WidgetEvent) => void
}

/** Step-by-step gradient descent with play/pause, shared by the 1D and 2D playgrounds. */
export function useDescent({ start, gradient, learningRate, limit, maxSteps, onEvent }: Options) {
  const [path, setPath] = useState<number[][]>(() => [[...start]])
  const [playing, setPlaying] = useState(false)

  const current = path[path.length - 1]
  const steps = path.length - 1
  const mathStatus = descentStatus(current, gradient(current), { limit })
  const status: PlaygroundStatus =
    mathStatus === 'running' && steps >= maxSteps ? 'tooSlow' : mathStatus

  function step() {
    if (status !== 'running') return
    const next = gradientStep(current, gradient(current), learningRate)
    setPath([...path, next])

    const nextStatus = descentStatus(next, gradient(next), { limit })
    if (nextStatus !== 'running') {
      setPlaying(false)
      onEvent?.({ type: nextStatus, steps: steps + 1 })
    }
  }

  // "Playing" only while there is still somewhere to go: derived, not stored separately.
  const isPlaying = playing && status === 'running'

  // useEffectEvent: the timer always calls the latest step() without restarting the effect
  // every time step's closure changes.
  const tick = useEffectEvent(step)

  // While playing, take one step after each delay. Early steps are slow so you can follow
  // them; later ones speed up so long runs don't drag.
  useEffect(() => {
    if (!isPlaying) return
    const delay = Math.max(60, 450 - steps * 40)
    const timer = setTimeout(tick, delay)
    return () => clearTimeout(timer)
  }, [isPlaying, steps])

  return {
    path,
    current,
    steps,
    status,
    playing: isPlaying,
    step,
    togglePlay: () => setPlaying((p) => !p && status === 'running'),
    /** Start over, optionally from a new point. */
    reset: (from: Vector = start) => {
      setPlaying(false)
      setPath([[...from]])
    },
  }
}
