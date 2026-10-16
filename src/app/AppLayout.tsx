import { useRef } from 'react'
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router'
import { Mascot } from '../components/Mascot'
import { t } from '../i18n'
import styles from './AppLayout.module.css'
import { useFocusOnNavigation } from './navigation'
import { ReadOnlyBanner } from './ReadOnlyBanner'
import { StatsBar } from './StatsBar'
import { useHeaderHeight } from './useHeaderHeight'

/** Frame for the map and profile: header with stats, content, and navigation. */
export function AppLayout() {
  const mainRef = useRef<HTMLElement>(null)
  const headerRef = useHeaderHeight()
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
      <ReadOnlyBanner />
      <header ref={headerRef} className={styles.header}>
        <Link to="/" className={styles.brand}>
          <Mascot className={styles.logo} shape="pentagon" colour="blue" />
          <span className={styles.brandName}>{t('appName')}</span>
        </Link>
        <StatsBar />
      </header>

      <main ref={mainRef} id="main" className={`sheet ${styles.main}`} tabIndex={-1}>
        <Outlet />
      </main>

      <nav className={styles.nav} aria-label={t('nav.main')}>
        <NavLink to="/" end className={({ isActive }) => (isActive ? styles.active : undefined)}>
          <MapIcon />
          {t('nav.map')}
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => (isActive ? styles.active : undefined)}>
          <ProfileIcon />
          {t('nav.profile')}
        </NavLink>
      </nav>
      {/* New pages start at the top; Back/Forward restore where you were. */}
      <ScrollRestoration />
    </div>
  )
}

/** Outline tab-bar icons (24×24, stroked in the link's text colour). */
function TabIcon({ d }: { d: string }) {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  )
}

const MapIcon = () => (
  <TabIcon d="M9 4 3 6.5v13.5L9 17.5l6 2.5 6-2.5V4L15 6.5 9 4Zm0 0v13.5m6-11v13.5" />
)

const ProfileIcon = () => (
  <TabIcon d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7.5 8.5c.8-3.7 3.8-6 7.5-6s6.7 2.3 7.5 6" />
)
