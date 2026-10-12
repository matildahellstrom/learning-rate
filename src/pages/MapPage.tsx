import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { useGameState } from '../app/game'
import { usePageTitle } from '../app/usePageTitle'
import { Stars } from '../components/Stars'
import { lessons, lessonsInTrack, tracks, type Lesson } from '../content/lessons'
import type { GameState } from '../game/state'
import { t } from '../i18n'
import styles from './MapPage.module.css'

type Node =
  | { kind: 'lesson'; lesson: Lesson; order: number }
  | { kind: 'upcoming'; id: string; title: string; order: number }

export function MapPage() {
  usePageTitle(t('map.title'))
  const state = useGameState()
  const isDone = (id: string) => (state.lessons[id]?.completedAt ?? null) !== null
  const upNext = lessons.find((l) => !isDone(l.id))

  return (
    <>
      <h1 className={styles.title}>{t('map.title')}</h1>

      <section className={styles.upNext} aria-label={t('map.upNext')}>
        {upNext ? (
          <>
            <p className={styles.upNextLabel}>{t('map.upNext')}</p>
            <h2 className={styles.upNextTitle}>{upNext.title}</h2>
            <p className={styles.upNextSummary}>
              {upNext.summary} · {t('map.minutes', { minutes: upNext.minutes })}
            </p>
            <Link className="btn" to={`/learn/${upNext.id}`}>
              {t('map.start')} <span aria-hidden="true">→</span>
            </Link>
          </>
        ) : (
          <p className={styles.upNextSummary}>{t('map.allDone')}</p>
        )}
      </section>

      {tracks.map((track) => {
        const nodes: Node[] = [
          ...lessonsInTrack(track.id).map((lesson) => ({
            kind: 'lesson' as const,
            lesson,
            order: lesson.order,
          })),
          ...track.upcoming.map((u) => ({ kind: 'upcoming' as const, ...u })),
        ].sort((a, b) => a.order - b.order)
        const available = lessonsInTrack(track.id)
        const done = available.filter((l) => isDone(l.id)).length

        return (
          <section
            key={track.id}
            className={styles.track}
            style={{ '--track': `var(--track-${track.colour})` } as CSSProperties}
            aria-labelledby={`track-${track.id}`}
          >
            <header className={styles.trackHeader}>
              <span className={styles.trackIcon} aria-hidden="true">
                {track.icon}
              </span>
              <div>
                <h2 id={`track-${track.id}`} className={styles.trackTitle}>
                  {track.title}
                </h2>
                <p className={styles.trackDescription}>{track.description}</p>
                {available.length > 0 && (
                  <p className={styles.trackProgress}>
                    {t('map.progress', { done, total: available.length })}
                  </p>
                )}
              </div>
            </header>

            <ol className={styles.path}>
              {nodes.map((node, i) => (
                <li
                  key={node.kind === 'lesson' ? node.lesson.id : node.id}
                  className={styles.stop}
                  style={{ '--shift': `${Math.round(Math.sin(i * 1.1) * 70)}px` } as CSSProperties}
                >
                  {node.kind === 'lesson' ? (
                    <LessonNode
                      lesson={node.lesson}
                      state={state}
                      isNext={node.lesson === upNext}
                    />
                  ) : (
                    <div className={styles.node}>
                      <span className={`${styles.circle} ${styles.locked}`} aria-hidden="true">
                        {node.order}
                      </span>
                      <span className={styles.label}>
                        {node.title}
                        <span className={styles.soon}>{t('map.soon')}</span>
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )
      })}
    </>
  )
}

function LessonNode({
  lesson,
  state,
  isNext,
}: {
  lesson: Lesson
  state: GameState
  isNext: boolean
}) {
  const progress = state.lessons[lesson.id]
  const stars = progress?.stars ?? 0
  const done = (progress?.completedAt ?? null) !== null
  return (
    <Link to={`/learn/${lesson.id}`} className={styles.node}>
      <span
        className={`${styles.circle} ${done ? styles.done : ''} ${isNext ? styles.next : ''}`}
        aria-hidden="true"
      >
        {done ? '✓' : lesson.order}
      </span>
      <span className={styles.label}>
        {lesson.title}
        <Stars count={stars} />
      </span>
    </Link>
  )
}
