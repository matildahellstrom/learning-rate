import { Link } from 'react-router'
import { usePageTitle } from '../app/usePageTitle'
import { t } from '../i18n'

const pageStyle = {
  maxWidth: 'var(--content-width)',
  margin: '0 auto',
  padding: 'var(--space-6) var(--space-4)',
}

/** Shown while the lesson chunk downloads on a deep link or reload. No fade: text stays readable. */
export function LessonLoading() {
  return (
    <main style={pageStyle}>
      <output>{t('lesson.loading')}</output>
    </main>
  )
}

/** Shown if the lesson chunk fails to load (offline, or a new deploy replaced the old files). */
export function LessonLoadError() {
  usePageTitle(t('lesson.loadErrorTitle'))
  return (
    <main style={pageStyle}>
      <h1>
        <span aria-hidden="true">🛰️ </span>
        {t('lesson.loadErrorTitle')}
      </h1>
      <p>{t('lesson.loadErrorText')}</p>
      <p style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <button type="button" className="btn" onClick={() => window.location.reload()}>
          {t('lesson.reload')}
        </button>
        <Link to="/" className="btn btn-secondary">
          {t('notFound.back')}
        </Link>
      </p>
    </main>
  )
}
