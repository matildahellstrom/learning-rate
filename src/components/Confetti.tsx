import { useEffect, useRef, useState } from 'react'
import styles from './Confetti.module.css'

const COLOURS = ['#fbbf24', '#f472b6', '#a78bfa', '#60a5fa', '#34d399', '#fb923c', '#f87171']
const DURATION_MS = 2800
const GRAVITY = 0.32

type Piece = {
  x: number
  y: number
  vx: number
  vy: number
  angle: number
  spin: number
  size: number
  colour: string
  round: boolean
}

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * A one-shot confetti burst on a full-screen <canvas>. Decorative only: hidden from screen
 * readers, ignores the pointer (so it never blocks clicks), and skipped entirely under
 * prefers-reduced-motion. Remount it (change its `key`) to fire again.
 */
export function Confetti({ count = 140, originY = 0.3 }: { count?: number; originY?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [done, setDone] = useState(prefersReducedMotion)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const width = window.innerWidth
    const height = window.innerHeight
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    const pieces: Piece[] = Array.from({ length: count }, (_, i) => {
      // Two cannons, left and right, firing up and inwards; plus a few from the middle.
      const side = i % 3 === 0 ? 0.5 : i % 3 === 1 ? 0.15 : 0.85
      const direction = side === 0.5 ? Math.random() * 2 - 1 : side < 0.5 ? 1 : -1
      return {
        x: width * side,
        y: height * originY + 40,
        vx: direction * (2 + Math.random() * 6),
        vy: -(8 + Math.random() * 9),
        angle: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.4,
        size: 7 + Math.random() * 7,
        colour: COLOURS[i % COLOURS.length],
        round: Math.random() < 0.3,
      }
    })

    const start = performance.now()
    let frame = 0
    const draw = (now: number) => {
      const elapsed = now - start
      ctx.clearRect(0, 0, width, height)
      // Fade the confetti (not text) out over the last 600 ms.
      ctx.globalAlpha = Math.max(0, Math.min(1, (DURATION_MS - elapsed) / 600))
      for (const p of pieces) {
        p.vy += GRAVITY
        p.vx *= 0.985
        p.vy *= 0.985
        p.x += p.vx
        p.y += p.vy
        p.angle += p.spin
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.angle)
        ctx.fillStyle = p.colour
        if (p.round) {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2.4, 0, Math.PI * 2)
          ctx.fill()
        } else {
          // Squash the width with the angle so the pieces seem to flutter.
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size * Math.cos(p.angle * 2), p.size / 2)
        }
        ctx.restore()
      }
      if (elapsed < DURATION_MS) frame = requestAnimationFrame(draw)
      else setDone(true)
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [count, originY])

  if (done) return null
  return <canvas ref={canvasRef} className={styles.confetti} aria-hidden="true" />
}
