import { useCallback, useId, useMemo, useState, type ReactNode } from 'react'
import { gameStore, useGameState } from '../../app/game'
import { t } from '../../i18n'
import { useLesson } from '../../lesson/context'
import { ChallengeContext, type WidgetEvent } from '../../widgets/events'
import { Confetti } from '../Confetti'
import { Stars } from '../Stars'
import styles from './Challenge.module.css'
import { starsForSteps, stepsForNextStar, type StepThresholds } from './scoring'

type Props = {
  id: string
  title: string
  goal: string
  /** Max steps for one, two and three stars. */
  stars: StepThresholds
  children?: ReactNode
}

export function Challenge({ id, title, goal, stars: thresholds, children }: Props) {
  const { lesson } = useLesson()
  const best = useGameState().lessons[lesson.id]?.challengeStars[id] ?? 0
  const [last, setLast] = useState<{ steps: number; stars: number } | null>(null)
  // Counts three-star results; each one remounts <Confetti> for a fresh burst.
  const [bursts, setBursts] = useState(0)
  const headingId = useId()

  if (import.meta.env.DEV && !lesson.challenges.includes(id)) {
    console.warn(`Challenge "${id}" is missing from the "challenges" list in ${lesson.file}`)
  }

  const report = useCallback(
    (event: WidgetEvent) => {
      // A new run, or one that blew up: the last result no longer describes what's on screen.
      if (event.type !== 'converged') {
        setLast(null)
        return
      }
      const stars = starsForSteps(event.steps, thresholds)
      setLast({ steps: event.steps, stars })
      if (stars === 3) setBursts((n) => n + 1)
      if (stars > 0) {
        gameStore.dispatch({ type: 'challengeScored', lessonId: lesson.id, challengeId: id, stars })
      }
    },
    [thresholds, lesson.id, id],
  )
  const context = useMemo(() => ({ report }), [report])
  const nextStar = last && stepsForNextStar(last.stars, thresholds)

  return (
    <section className={styles.challenge} aria-labelledby={headingId}>
      <div className={styles.header}>
        <span className={styles.badge}>
          <span aria-hidden="true">🏁</span> {t('challenge.label')}
        </span>
        <span className={styles.best}>
          <span className="visually-hidden">{t('challenge.best', { stars: best })}</span>
          <Stars count={best} />
        </span>
      </div>
      <h3 id={headingId} className={styles.title}>
        {title}
      </h3>
      <p className={styles.goal}>{goal}</p>
      <ChallengeContext.Provider value={context}>{children}</ChallengeContext.Provider>
      {bursts > 0 && <Confetti key={bursts} count={90} originY={0.45} />}
      <div aria-live="polite" className={styles.result}>
        {last && (
          <p className={last.stars === 3 ? styles.perfect : undefined}>
            {last.steps === 1
              ? t('challenge.resultOne')
              : t('challenge.result', { steps: last.steps })}{' '}
            <Stars count={last.stars} />{' '}
            {nextStar === null
              ? t('challenge.maxStars')
              : t('challenge.nextStar', { steps: nextStar })}
          </p>
        )}
      </div>
    </section>
  )
}
