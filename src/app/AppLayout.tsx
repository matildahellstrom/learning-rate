import { Link, NavLink, Outlet } from 'react-router'
import { t } from '../i18n'
import styles from './AppLayout.module.css'
import { StatsBar } from './StatsBar'

/** Frame for the map and profile: header with stats, content, and navigation. */
export function AppLayout() {
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
          <span aria-hidden="true">⚡</span> {t('appName')}
        </Link>
        <StatsBar />
      </header>

      <main id="main" className={styles.main} tabIndex={-1}>
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
    </div>
  )
}
