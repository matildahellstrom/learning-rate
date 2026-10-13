import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { useGameState } from '../app/game'
import { useSuppressRewardToasts } from '../app/toastSuppression'
import { Stars } from '../components/Stars'
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
}

export function CompletionScreen({ lesson, rewards, quizCorrect, onReview }: Props) {
  // This screen lists everything that was earned, so pop-up toasts would only cover it.
  useSuppressRewardToasts()
  const state = useGameState()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const stars = state.lessons[lesson.id]?.stars ?? 0
  const level = levelFromXp(state.xp)

  const xp = rewards.reduce((sum, r) => (r.type === 'xp' ? sum + r.amount : sum), 0)
  const levelUp = rewards.findLast((r) => r.type === 'levelUp')
  const newBadges = rewards
    .filter((r) => r.type === 'badge')
    .map((r) => badges.find((b) => b.id === r.badgeId))
    .filter((b) => b !== undefined)

  useEffect(() => headingRef.current?.focus(), [])

  return (
    <main className={styles.screen}>
      <div className={styles.burst} aria-hidden="true">
        🎉
      </div>
      <h1 ref={headingRef} tabIndex={-1} className={styles.title}>
        {t('complete.title')}
      </h1>
      <p className={styles.lessonName}>{lesson.title}</p>

      <Stars count={stars} size="large" />
      <p className={styles.goals}>{t('complete.starGoals')}</p>

      <p className={styles.xp}>{t('complete.xp', { xp })}</p>
      {lesson.quiz.length > 0 && (
        <p>{t('complete.quiz', { correct: quizCorrect, total: lesson.quiz.length })}</p>
      )}

      <div className={styles.level}>
        <span>{t('stats.level', { level: level.level })}</span>
        <progress
          max={level.xpForNextLevel}
          value={level.xpIntoLevel}
          aria-label={t('stats.levelProgress', {
            current: level.xpIntoLevel,
            total: level.xpForNextLevel,
            next: level.level + 1,
          })}
        />
      </div>
      {levelUp && (
        <p className={styles.levelUp}>{t('complete.levelUp', { level: levelUp.level })}</p>
      )}

      {newBadges.length > 0 && (
        <section className={styles.badges}>
          <h2>{t('complete.newBadges')}</h2>
          <ul>
            {newBadges.map((b) => (
              <li key={b.id}>
                <span className={styles.badgeIcon} aria-hidden="true">
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
        <Link to="/" className="btn">
          {t('complete.backToMap')}
        </Link>
        <button type="button" className="btn btn-secondary" onClick={onReview}>
          {t('complete.review')}
        </button>
      </div>
    </main>
  )
}
