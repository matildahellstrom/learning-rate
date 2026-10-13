import type { CSSProperties } from 'react'
import { activeStreak } from '../game/streak'
import { levelFromXp } from '../game/levels'
import { t } from '../i18n'
import { useGameState } from './game'
import { useToday } from './useToday'
import styles from './StatsBar.module.css'

/** The game HUD: level badge, XP bar and streak flame. */
export function StatsBar() {
  const state = useGameState()
  const today = useToday()
  const level = levelFromXp(state.xp)
  const streak = activeStreak(state.streak, today)
  const fill = level.xpForNextLevel > 0 ? level.xpIntoLevel / level.xpForNextLevel : 0

  return (
    <div className={styles.stats}>
      <span className={styles.level}>{t('stats.level', { level: level.level })}</span>
      <span className={styles.xp}>
        <span className={styles.barWrap} style={{ '--fill': fill } as CSSProperties}>
          <progress
            className={styles.bar}
            max={level.xpForNextLevel}
            value={level.xpIntoLevel}
            aria-label={t('stats.levelProgress', {
              current: level.xpIntoLevel,
              total: level.xpForNextLevel,
              next: level.level + 1,
            })}
          />
          <span className={styles.shine} aria-hidden="true" />
        </span>
        <span className={styles.xpText}>{t('stats.xp', { xp: state.xp })}</span>
      </span>
      <span
        className={`${styles.streak} ${streak > 0 ? styles.lit : ''}`}
        title={t('stats.streak', { days: streak })}
      >
        <span className={styles.flame} aria-hidden="true">
          🔥
        </span>
        <span aria-hidden="true">{streak}</span>
        <span className="visually-hidden">{t('stats.streak', { days: streak })}</span>
      </span>
    </div>
  )
}
