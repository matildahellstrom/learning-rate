import { Link } from 'react-router'
import { usePageTitle } from '../app/usePageTitle'
import { Mascot } from '../components/Mascot'
import { t } from '../i18n'

export function NotFoundPage({ message }: { message?: string }) {
  usePageTitle(t('notFound.title'))
  return (
    <main className="sheet sheet-page">
      <Mascot shape="cloud" colour="blue" size={96} />
      <h1>{t('notFound.title')}</h1>
      {message && <p>{message}</p>}
      <Link to="/" className="btn">
        {t('notFound.back')}
      </Link>
    </main>
  )
}
