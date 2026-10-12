import { MDXProvider } from '@mdx-js/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { gameStore, useGameState } from '../app/game'
import { usePageTitle } from '../app/usePageTitle'
import { mdxComponents } from '../components/mdxComponents'
import { getLesson, lessonTitle, type Lesson } from '../content/lessons'
import type { Reward } from '../game/engine'
import { t } from '../i18n'
import { LessonContext, type LessonContextValue } from '../lesson/context'
import { CompletionScreen } from './CompletionScreen'
import styles from './LessonPage.module.css'
import { NotFoundPage } from './NotFoundPage'

export function LessonPage() {
  const { lessonId = '' } = useParams()
  const lesson = getLesson(lessonId)
  if (!lesson) return <NotFoundPage message={t('lesson.notFound')} />
  // key: a different lesson gets completely fresh state.
  return <LessonPlayer key={lesson.id} lesson={lesson} />
}

function LessonPlayer({ lesson }: { lesson: Lesson }) {
  usePageTitle(lesson.title)
  const [step, setStep] = useState(0)
  const [quizAttempt, setQuizAttempt] = useState<Record<number, boolean>>({})
  const [sessionRewards, setSessionRewards] = useState<Reward[]>([])
  const [finished, setFinished] = useState(false)
  const stepRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)

  // Collect everything earned during this lesson for the celebration screen.
  useEffect(
    () => gameStore.onRewards((rewards) => setSessionRewards((all) => [...all, ...rewards])),
    [],
  )

  // Moving to a new step: scroll up and move focus to the new content, so screen-reader and
  // keyboard users start reading from the top of the step.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    window.scrollTo({ top: 0 })
    stepRef.current?.focus()
  }, [step])

  const context = useMemo<LessonContextValue>(
    () => ({
      lesson,
      step,
      quizAttempt,
      recordQuizAnswer: (index, correct) =>
        setQuizAttempt((a) => (index in a ? a : { ...a, [index]: correct })),
    }),
    [lesson, step, quizAttempt],
  )

  const quizCorrect = Object.values(quizAttempt).filter(Boolean).length
  const isLast = step === lesson.stepCount - 1

  function finish() {
    gameStore.dispatch({
      type: 'lessonFinished',
      lessonId: lesson.id,
      quizCorrect,
      quizTotal: lesson.quiz.length,
    })
    setFinished(true)
  }

  if (finished) {
    return (
      <CompletionScreen
        lesson={lesson}
        rewards={sessionRewards}
        quizCorrect={quizCorrect}
        onReview={() => {
          setFinished(false)
          setStep(0)
          setQuizAttempt({})
          setSessionRewards([])
        }}
      />
    )
  }

  const { Content } = lesson
  return (
    <div className={styles.lesson}>
      <header className={styles.top}>
        <Link to="/" className={styles.close} aria-label={t('lesson.close')}>
          ✕
        </Link>
        <progress
          className={styles.progress}
          max={lesson.stepCount}
          value={step + 1}
          aria-label={t('lesson.progress', { step: step + 1, total: lesson.stepCount })}
        />
        <span className={styles.counter} aria-hidden="true">
          {step + 1}/{lesson.stepCount}
        </span>
      </header>

      <main className={styles.content}>
        <div ref={stepRef} tabIndex={-1} className={styles.step}>
          {step === 0 && <PrerequisiteHint lesson={lesson} />}
          <LessonContext.Provider value={context}>
            <MDXProvider components={mdxComponents}>
              <Content />
            </MDXProvider>
          </LessonContext.Provider>
          {isLast && <Sources lesson={lesson} />}
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
          >
            {t('lesson.back')}
          </button>
          {isLast ? (
            <button type="button" className="btn" onClick={finish}>
              {t('lesson.finish')} <span aria-hidden="true">🏁</span>
            </button>
          ) : (
            <button type="button" className="btn" onClick={() => setStep(step + 1)}>
              {t('lesson.continue')}
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}

/** Soft prerequisites: a friendly hint, never a lock. */
function PrerequisiteHint({ lesson }: { lesson: Lesson }) {
  const state = useGameState()
  const missing = lesson.prerequisites.filter((id) => !state.lessons[id]?.completedAt)
  if (missing.length === 0) return null

  const names = missing
    .map((id) => {
      const title = lessonTitle(id) ?? id
      return getLesson(id) ? title : `${title} ${t('lesson.comingSoon')}`
    })
    .join(', ')
  return (
    <p className={styles.hint}>
      <span aria-hidden="true">🧭 </span>
      {t('lesson.recommendedFirst', { lessons: names })}
    </p>
  )
}

function Sources({ lesson }: { lesson: Lesson }) {
  return (
    <section className={styles.sources}>
      <h2>{t('lesson.sources')}</h2>
      <ul>
        {lesson.sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.title}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
