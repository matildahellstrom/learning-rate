import { useRef } from 'react'
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router'
import { t } from '../i18n'
import styles from './AppLayout.module.css'
import { useFocusOnNavigation } from './navigation'
import { StatsBar } from './StatsBar'

/** Frame for the map and profile: header with stats, content, and navigation. */
export function AppLayout() {
  const mainRef = useRef<HTMLElement>(null)
  useFocusOnNavigation(mainRef, useLocation().pathname)

  return (
    <div className={styles.app}>
      {/* With hash routing, href="#main" would be read as a route, so focus the target directly. */}
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('main')?.focus()
        }}
      >
        {t('skipToContent')}
      </a>
      <header className={styles.header}>
        <Link to="/" className={styles.brand}>
          <span aria-hidden="true">⚡</span>{' '}
          <span className={styles.brandName}>{t('appName')}</span>
        </Link>
        <StatsBar />
      </header>

      <main ref={mainRef} id="main" className={styles.main} tabIndex={-1}>
        <Outlet />
      </main>

      <nav className={styles.nav} aria-label={t('nav.main')}>
        <NavLink to="/" end className={({ isActive }) => (isActive ? styles.active : undefined)}>
          <span aria-hidden="true">🗺️</span>
          {t('nav.map')}
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => (isActive ? styles.active : undefined)}>
          <span aria-hidden="true">🏅</span>
          {t('nav.profile')}
        </NavLink>
      </nav>
      {/* New pages start at the top; Back/Forward restore where you were. */}
      <ScrollRestoration />
    </div>
  )
}
