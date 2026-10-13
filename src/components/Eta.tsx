import { useId } from 'react'
import styles from './Eta.module.css'

/**
 * Eta (η), the app's mascot: a little ball that rolls downhill, like gradient descent.
 * Purely decorative, so it's hidden from screen readers.
 */
export function Eta({
  mood = 'happy',
  hill = true,
  className = '',
}: {
  mood?: 'happy' | 'cheer'
  /** Draw the slope Eta is rolling down. */
  hill?: boolean
  className?: string
}) {
  const id = useId()
  const body = `${id}-body`
  const shade = `${id}-shade`
  return (
    <svg
      className={`${styles.eta} ${className}`}
      viewBox="0 0 120 100"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={body} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="0.55" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#f97316" />
        </radialGradient>
        <linearGradient id={shade} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
      {hill && (
        <path
          className={styles.hill}
          d="M0 56 C 30 58, 60 92, 120 94 L120 100 L0 100 Z"
          fill={`url(#${shade})`}
        />
      )}
      <g className={styles.ball}>
        <ellipse cx="52" cy="90" rx="20" ry="4" fill="rgb(0 0 0 / 0.15)" />
        <circle cx="52" cy="58" r="28" fill={`url(#${body})`} stroke="#c2410c" strokeWidth="2.5" />
        <ellipse cx="42" cy="42" rx="9" ry="5" fill="#fff" opacity="0.6" />
        {mood === 'cheer' ? (
          <>
            <path
              d="M37 56 q5 -7 10 0 M58 56 q5 -7 10 0"
              fill="none"
              stroke="#3b1d00"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path d="M42 64 q10 14 20 0 z" fill="#7c2d12" />
            <path d="M47 69 q5 4 10 0" fill="#fb7185" />
          </>
        ) : (
          <>
            <ellipse cx="42" cy="56" rx="4" ry="5.5" fill="#3b1d00" />
            <ellipse cx="62" cy="56" rx="4" ry="5.5" fill="#3b1d00" />
            <circle cx="43.5" cy="54" r="1.6" fill="#fff" />
            <circle cx="63.5" cy="54" r="1.6" fill="#fff" />
            <path
              d="M45 66 q7 7 14 0"
              fill="none"
              stroke="#3b1d00"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </>
        )}
        <ellipse cx="34" cy="65" rx="4.5" ry="3" fill="#fb7185" opacity="0.7" />
        <ellipse cx="70" cy="65" rx="4.5" ry="3" fill="#fb7185" opacity="0.7" />
      </g>
    </svg>
  )
}
