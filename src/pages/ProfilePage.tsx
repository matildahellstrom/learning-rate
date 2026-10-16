import type { CSSProperties } from 'react'
import { gameStore, useGameState } from '../app/game'
import { usePageTitle } from '../app/usePageTitle'
import { useToday } from '../app/useToday'
import { Mascot, type MascotColour, type MascotShape } from '../components/Mascot'
import { badges } from '../content/lessons'
import { levelFromXp } from '../game/levels'
import { activeStreak, MAX_FREEZES } from '../game/streak'
import { t, tn } from '../i18n'
import styles from './ProfilePage.module.css'

export function ProfilePage() {
  usePageTitle(t('profile.title'))
  const state = useGameState()
  const level = levelFromXp(state.xp)
  const today = useToday()
  const currentStreak = activeStreak(state.streak, today)

  // Each stat is a pastel tile with its own mascot peeking in, like a grid of mood tiles.
  const stats: {
    label: string
    value: string | number
    shape: MascotShape
    colour: MascotColour
  }[] = [
    { label: t('profile.level'), value: level.level, shape: 'pentagon', colour: 'purple' },
    { label: t('profile.totalXp'), value: state.xp, shape: 'circle', colour: 'amber' },
    {
      label: t('profile.streak'),
      value: tn('profile.days', currentStreak, { days: currentStreak }),
      shape: 'flame',
      colour: 'coral',
    },
    {
      label: t('profile.bestStreak'),
      value: tn('profile.days', state.streak.best, { days: state.streak.best }),
      shape: 'blob',
      colour: 'pink',
    },
    {
      label: t('profile.freezes'),
      value: `${state.streak.freezes} / ${MAX_FREEZES}`,
      shape: 'cloud',
      colour: 'blue',
    },
  ]
  const fill = level.xpForNextLevel > 0 ? level.xpIntoLevel / level.xpForNextLevel : 0

  return (
    <>
      <h1 className={styles.title}>{t('profile.title')}</h1>

      <div className={`card ${styles.levelCard}`}>
        {/* The ring fills up (conic-gradient) as you earn XP towards the next level. */}
        <span className={styles.levelRing} style={{ '--fill': fill } as CSSProperties}>
          <span className={styles.levelNumber}>{level.level}</span>
        </span>
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
          <div
            key={s.label}
            className={styles.stat}
            style={{ '--tint': `var(--mascot-${s.colour})` } as CSSProperties}
          >
            <dt>{s.label}</dt>
            <dd>{s.value}</dd>
            <Mascot
              className={styles.statMascot}
              shape={s.shape}
              colour={s.colour}
              mood={s.shape === 'flame' && currentStreak > 0 ? 'star' : 'happy'}
            />
          </div>
        ))}
      </dl>
      <p className={styles.muted}>{t('profile.freezesHelp')}</p>

      <h2>{t('profile.badges')}</h2>
      <ul className={styles.badges}>
        {badges.map((b, i) => {
          const earned = b.id in state.badges
          return (
            <li key={b.id} className={`${styles.badge} ${earned ? styles.earned : styles.locked}`}>
              {earned ? (
                <span className={styles.medal} aria-hidden="true">
                  <span className={styles.badgeIcon}>{b.icon}</span>
                </span>
              ) : (
                // Locked: a sleepy grey mascot waits for you to earn it.
                <Mascot
                  className={styles.sleeper}
                  shape={sleeperShapes[i % sleeperShapes.length]}
                  colour="grey"
                  mood="sleepy"
                />
              )}
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

const sleeperShapes: MascotShape[] = ['circle', 'pentagon', 'cloud', 'square', 'triangle', 'blob']
