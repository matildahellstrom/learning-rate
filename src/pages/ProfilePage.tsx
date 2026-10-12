import { gameStore, useGameState } from '../app/game'
import { usePageTitle } from '../app/usePageTitle'
import { useToday } from '../app/useToday'
import { badges } from '../content/lessons'
import { levelFromXp } from '../game/levels'
import { activeStreak, MAX_FREEZES } from '../game/streak'
import { t } from '../i18n'
import styles from './ProfilePage.module.css'

export function ProfilePage() {
  usePageTitle(t('profile.title'))
  const state = useGameState()
  const level = levelFromXp(state.xp)
  const today = useToday()

  const stats = [
    { label: t('profile.level'), value: level.level, icon: '⬆️' },
    { label: t('profile.totalXp'), value: state.xp, icon: '⭐' },
    {
      label: t('profile.streak'),
      value: t('profile.days', { days: activeStreak(state.streak, today) }),
      icon: '🔥',
    },
    {
      label: t('profile.bestStreak'),
      value: t('profile.days', { days: state.streak.best }),
      icon: '🏆',
    },
    { label: t('profile.freezes'), value: `${state.streak.freezes} / ${MAX_FREEZES}`, icon: '🧊' },
  ]

  return (
    <>
      <h1 className={styles.title}>{t('profile.title')}</h1>

      <div className={`card ${styles.levelCard}`}>
        <span className={styles.levelNumber}>{level.level}</span>
        <div className={styles.levelInfo}>
          <strong>{t('stats.level', { level: level.level })}</strong>
          <progress
            max={level.xpForNextLevel}
            value={level.xpIntoLevel}
            aria-label={t('stats.levelProgress', {
              current: level.xpIntoLevel,
              total: level.xpForNextLevel,
              next: level.level + 1,
            })}
          />
          <span className={styles.muted}>
            {t('stats.levelProgress', {
              current: level.xpIntoLevel,
              total: level.xpForNextLevel,
              next: level.level + 1,
            })}
          </span>
        </div>
      </div>

      <dl className={styles.stats}>
        {stats.map((s) => (
          <div key={s.label} className={`card ${styles.stat}`}>
            <dt>
              <span aria-hidden="true">{s.icon} </span>
              {s.label}
            </dt>
            <dd>{s.value}</dd>
          </div>
        ))}
      </dl>
      <p className={styles.muted}>{t('profile.freezesHelp')}</p>

      <h2>{t('profile.badges')}</h2>
      <ul className={styles.badges}>
        {badges.map((b) => {
          const earned = b.id in state.badges
          return (
            <li key={b.id} className={`${styles.badge} ${earned ? styles.earned : styles.locked}`}>
              <span className={styles.badgeIcon} aria-hidden="true">
                {earned ? b.icon : '🔒'}
              </span>
              <strong>{b.title}</strong>
              <span className={styles.muted}>
                {earned ? b.description : `${t('profile.locked')}: ${b.description}`}
              </span>
            </li>
          )
        })}
      </ul>

      <section className={`card ${styles.storage}`}>
        <h2>{t('profile.storageTitle')}</h2>
        <p>{t('profile.storageText')}</p>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            if (window.confirm(t('profile.resetConfirm'))) gameStore.reset()
          }}
        >
          {t('profile.reset')}
        </button>
      </section>
    </>
  )
}
