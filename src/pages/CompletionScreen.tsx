import { useEffect, useRef, type CSSProperties } from 'react'
import { Link } from 'react-router'
import { useGameState, useReadOnly } from '../app/game'
import { useSuppressRewardToasts } from '../app/toastSuppression'
import { Confetti } from '../components/Confetti'
import { Eta } from '../components/Eta'
import { Stars } from '../components/Stars'
import { useCountUp } from '../components/useCountUp'
import { badges, type Lesson } from '../content/lessons'
import type { Reward } from '../game/engine'
import { levelFromXp } from '../game/levels'
import { t } from '../i18n'
import styles from './CompletionScreen.module.css'

type Props = {
  lesson: Lesson
  rewards: Reward[]
  quizCorrect: number
  onReview: () => void
  style?: CSSProperties
}

export function CompletionScreen({ lesson, rewards, quizCorrect, onReview, style }: Props) {
  // This screen lists everything that was earned, so pop-up toasts would only cover it.
  useSuppressRewardToasts()
  const state = useGameState()
  const readOnly = useReadOnly()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const stars = state.lessons[lesson.id]?.stars ?? 0
  const level = levelFromXp(state.xp)

  const xp = rewards.reduce((sum, r) => (r.type === 'xp' ? sum + r.amount : sum), 0)
  const shownXp = useCountUp(xp)
  const levelUp = rewards.findLast((r) => r.type === 'levelUp')
  const newBadges = rewards
    .filter((r) => r.type === 'badge')
    .map((r) => badges.find((b) => b.id === r.badgeId))
    .filter((b) => b !== undefined)

  useEffect(() => headingRef.current?.focus(), [])

  return (
    <main className={`sheet ${styles.screen}`} style={style}>
      {/* Nothing to celebrate in a tab that can't save (see ReadOnlyBanner). */}
      {!readOnly && <Confetti />}
      <div className={styles.hero} aria-hidden="true">
        <span className={styles.rays} />
        <Eta className={styles.mascot} mood={readOnly ? 'happy' : 'cheer'} hill={false} />
      </div>
      <h1 ref={headingRef} tabIndex={-1} className={styles.title}>
        {t('complete.title')}
      </h1>
      <p className={styles.lessonName}>{lesson.title}</p>

      <Stars count={stars} size="large" />
      <p className={styles.goals}>{t('complete.starGoals')}</p>

      <div className={styles.tiles}>
        {readOnly ? (
          // This tab can't save, so there is nothing to celebrate (see ReadOnlyBanner).
          <p className={styles.quiz}>{t('readOnly.notSaved')}</p>
        ) : xp > 0 ? (
          <p className={styles.xp}>
            <span className={styles.tileIcon} aria-hidden="true">
              ⭐
            </span>
            {/* The count-up is for eyes only; screen readers get the final number at once. */}
            <span aria-hidden="true">{t('complete.xp', { xp: shownXp })}</span>
            <span className="visually-hidden">{t('complete.xp', { xp })}</span>
          </p>
        ) : (
          <p className={styles.quiz}>{t('complete.noNewXp')}</p>
        )}
        {lesson.quiz.length > 0 && (
          <p className={styles.quiz}>
            <span className={styles.tileIcon} aria-hidden="true">
              🎯
            </span>
            {t('complete.quiz', { correct: quizCorrect, total: lesson.quiz.length })}
          </p>
        )}
      </div>

      <div className={styles.level}>
        <span className={styles.levelBadge}>{t('stats.level', { level: level.level })}</span>
        <span
          className={styles.levelBar}
          style={{ '--fill': level.xpIntoLevel / level.xpForNextLevel } as CSSProperties}
        >
          <progress
            max={level.xpForNextLevel}
            value={level.xpIntoLevel}
            aria-label={t('stats.levelProgress', {
              current: level.xpIntoLevel,
              total: level.xpForNextLevel,
              next: level.level + 1,
            })}
          />
        </span>
      </div>
      {levelUp && (
        <p className={styles.levelUp}>
          <span aria-hidden="true">⬆️ </span>
          {t('complete.levelUp', { level: levelUp.level })}
        </p>
      )}

      {newBadges.length > 0 && (
        <section className={styles.badges}>
          <h2>{t('complete.newBadges')}</h2>
          <ul>
            {newBadges.map((b, i) => (
              <li key={b.id} style={{ '--i': i } as CSSProperties}>
                <span className={styles.medal} aria-hidden="true">
                  {b.icon}
                </span>
                <strong>{b.title}</strong>
                <span>{b.description}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className={styles.actions}>
        <Link to="/" className="btn btn-go">
          {t('complete.backToMap')}
        </Link>
        <button type="button" className="btn btn-secondary" onClick={onReview}>
          {t('complete.review')}
        </button>
      </div>
    </main>
  )
}
