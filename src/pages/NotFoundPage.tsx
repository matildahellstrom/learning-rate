import { Link } from 'react-router'
import { usePageTitle } from '../app/usePageTitle'
import { t } from '../i18n'

export function NotFoundPage({ message }: { message?: string }) {
  usePageTitle(t('notFound.title'))
  return (
    <main
      style={{
        maxWidth: 'var(--content-width)',
        margin: '0 auto',
        padding: 'var(--space-6) var(--space-4)',
      }}
    >
      <h1>
        <span aria-hidden="true">🧭 </span>
        {t('notFound.title')}
      </h1>
      {message && <p>{message}</p>}
      <Link to="/" className="btn">
        {t('notFound.back')}
      </Link>
    </main>
  )
}
