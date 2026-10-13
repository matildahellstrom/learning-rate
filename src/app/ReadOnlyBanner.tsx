import { t } from '../i18n'
import { useReadOnly } from './game'
import styles from './ReadOnlyBanner.module.css'

/**
 * Shown while this tab can't save because another tab already saved progress with a newer
 * version of the app. Without it, the tab would silently throw away everything you do.
 */
export function ReadOnlyBanner() {
  if (!useReadOnly()) return null
  return (
    <output className={styles.banner}>
      <span aria-hidden="true">⚠️ </span>
      {t('readOnly.banner')}{' '}
      <button type="button" className={styles.reload} onClick={() => window.location.reload()}>
        {t('readOnly.reload')}
      </button>
    </output>
  )
}
