import styles from './Eta.module.css'

/**
 * Eta (η), the app's mascot: a little ball that rolls downhill, like gradient descent.
 * Drawn flat, in the same style as the other mascots. Purely decorative, so it's hidden
 * from screen readers.
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
  return (
    <svg
      className={`${styles.eta} ${className}`}
      viewBox="0 0 120 100"
      aria-hidden="true"
      focusable="false"
    >
      {hill && <path className={styles.hill} d="M0 56 C 30 58, 60 92, 120 94 L120 100 L0 100 Z" />}
      <g className={styles.ball}>
        <circle className={styles.body} cx="52" cy="58" r="28" />
        {mood === 'cheer' ? (
          <>
            <path className={styles.ink} d="M37 56 q5 -7 10 0 M58 56 q5 -7 10 0" />
            <path className={styles.mouth} d="M44 64 q8 12 16 0 z" />
          </>
        ) : (
          <>
            <ellipse className={styles.eye} cx="42" cy="56" rx="4.5" ry="5.5" />
            <ellipse className={styles.eye} cx="62" cy="56" rx="4.5" ry="5.5" />
            <circle className={styles.shine} cx="43.5" cy="54" r="1.6" />
            <circle className={styles.shine} cx="63.5" cy="54" r="1.6" />
            <path className={styles.ink} d="M47 65 q5 5 10 0" />
          </>
        )}
      </g>
    </svg>
  )
}
