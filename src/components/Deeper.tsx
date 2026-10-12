import type { ReactNode } from 'react'
import { t } from '../i18n'
import styles from './Deeper.module.css'

/** The optional "real maths" layer. <details> is keyboard- and screen-reader-friendly for free. */
export function Deeper({ title, children }: { title?: string; children?: ReactNode }) {
  return (
    <details className={styles.deeper}>
      <summary className={styles.summary}>
        <span aria-hidden="true">🔬 </span>
        {title ?? t('deeper.label')}
      </summary>
      <div className={styles.body}>{children}</div>
    </details>
  )
}
