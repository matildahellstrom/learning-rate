import type { CSSProperties } from 'react'
import styles from './Mascot.module.css'

export type MascotShape = 'circle' | 'pentagon' | 'triangle' | 'square' | 'cloud' | 'blob' | 'flame'
export type MascotColour = 'coral' | 'blue' | 'pink' | 'teal' | 'amber' | 'purple' | 'grey'
export type MascotMood = 'happy' | 'star' | 'sleepy'

/** Body outlines on a 100×100 canvas, plus where the face sits on each. */
const bodies: Record<MascotShape, { d: string; face: [number, number] }> = {
  circle: { d: 'M50 10a40 40 0 1 1 0 80a40 40 0 1 1 0-80z', face: [50, 52] },
  // Polygons get rounded corners from a thick stroke in the same colour (see the CSS).
  pentagon: { d: 'M50 14L86 40L72 84H28L14 40Z', face: [50, 54] },
  triangle: { d: 'M50 18L86 82H14Z', face: [50, 64] },
  square: {
    d: 'M34 12H66A22 22 0 0 1 88 34V66A22 22 0 0 1 66 88H34A22 22 0 0 1 12 66V34A22 22 0 0 1 34 12Z',
    face: [50, 52],
  },
  cloud: {
    d: 'M24 84A14 14 0 0 1 22 56A20 20 0 0 1 48 34A22 22 0 0 1 86 52A16 16 0 0 1 80 84Z',
    face: [52, 64],
  },
  blob: {
    d: 'M50 10C76 8 94 30 90 54C86 80 66 92 46 90C22 88 8 70 10 48C12 26 28 11 50 10Z',
    face: [50, 52],
  },
  flame: {
    d: 'M50 4C58 24 86 34 86 62C86 82 70 95 50 95C30 95 14 82 14 62C14 46 24 38 32 26C35 38 41 44 46 44C43 30 44 16 50 4Z',
    face: [50, 68],
  },
}

/** A five-point star centred on (x, y), for the "star eyes" mood. */
function star(x: number, y: number, r: number) {
  const points = Array.from({ length: 10 }, (_, i) => {
    const radius = i % 2 === 0 ? r : r * 0.45
    const angle = (Math.PI / 5) * i - Math.PI / 2
    return `${(x + radius * Math.cos(angle)).toFixed(1)},${(y + radius * Math.sin(angle)).toFixed(1)}`
  })
  return points.join(' ')
}

function Face({ x, y, mood }: { x: number; y: number; mood: MascotMood }) {
  const left = x - 12
  const right = x + 12
  if (mood === 'sleepy') {
    return (
      <g className={styles.ink}>
        <path d={`M${left - 5} ${y} q5 4 10 0 M${right - 5} ${y} q5 4 10 0`} />
        <path d={`M${x - 4} ${y + 9} h8`} />
      </g>
    )
  }
  return (
    <>
      {mood === 'star' ? (
        <>
          <circle cx={left} cy={y} r="8" className={styles.eye} />
          <circle cx={right} cy={y} r="8" className={styles.eye} />
          <polygon points={star(left, y, 5.5)} className={styles.shine} />
          <polygon points={star(right, y, 5.5)} className={styles.shine} />
        </>
      ) : (
        <>
          <ellipse cx={left} cy={y} rx="5.5" ry="6.5" className={styles.eye} />
          <ellipse cx={right} cy={y} rx="5.5" ry="6.5" className={styles.eye} />
          <circle cx={left + 1.8} cy={y - 2.2} r="1.8" className={styles.shine} />
          <circle cx={right + 1.8} cy={y - 2.2} r="1.8" className={styles.shine} />
        </>
      )}
      <path className={styles.ink} d={`M${x - 5} ${y + 8} q5 5 10 0`} />
    </>
  )
}

/**
 * A little flat mascot: a simple shape in a bright colour with a minimal face.
 * Purely decorative, so it's hidden from screen readers.
 */
export function Mascot({
  shape,
  colour,
  mood = 'happy',
  bob = false,
  size,
  className = '',
}: {
  shape: MascotShape
  colour: MascotColour
  mood?: MascotMood
  /** A gentle idle bob (off under reduced motion). */
  bob?: boolean
  /** Width and height in px; otherwise CSS sizes it. */
  size?: number
  className?: string
}) {
  const body = bodies[shape]
  const [x, y] = body.face
  return (
    <svg
      className={`${styles.mascot} ${bob ? styles.bob : ''} ${className}`}
      style={{ '--body': `var(--mascot-${colour})` } as CSSProperties}
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <g className={styles.figure}>
        <path className={styles.body} d={body.d} />
        {shape === 'flame' && (
          <path
            className={styles.core}
            d="M50 50C56 60 70 66 70 78C70 88 61 94 50 94C39 94 30 88 30 78C30 68 40 62 50 50Z"
          />
        )}
        <Face x={x} y={y} mood={mood} />
      </g>
    </svg>
  )
}
