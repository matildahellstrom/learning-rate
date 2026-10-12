import { useEffect } from 'react'
import { t } from '../i18n'

/** Screen readers announce the document title on navigation, so every page sets one. */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · ${t('appName')}`
  }, [title])
}
