import type { CSSProperties } from 'react'
import { t } from '../i18n'
import styles from './Stars.module.css'

export function Stars({ count, size = 'small' }: { count: number; size?: 'small' | 'large' }) {
  return (
    <span className={`${styles.stars} ${styles[size]}`}>
      <span className="visually-hidden">{t('map.stars', { stars: count })}</span>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden="true"
          className={i < count ? styles.on : styles.off}
          style={{ '--i': i } as CSSProperties}
        >
          ★
        </span>
      ))}
    </span>
  )
}
