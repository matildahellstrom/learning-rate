import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { useGameState } from '../app/game'
import { usePageTitle } from '../app/usePageTitle'
import { useToday } from '../app/useToday'
import { Mascot } from '../components/Mascot'
import { Stars } from '../components/Stars'
import { lessons, lessonsInTrack, tracks, type Lesson } from '../content/lessons'
import type { GameState } from '../game/state'
import { activeStreak } from '../game/streak'
import { locale, t } from '../i18n'
import styles from './MapPage.module.css'

type Node =
  | { kind: 'lesson'; lesson: Lesson; order: number }
  | { kind: 'upcoming'; id: string; title: string; order: number }

/** Each track's colours as CSS custom properties, so one stylesheet themes every "world". */
const trackColours = (colour: string) =>
  ({
    '--track': `var(--track-${colour})`,
    '--track-2': `var(--track-${colour}-2)`,
  }) as CSSProperties

/** "16 October" and "Thursday" for a YYYY-MM-DD day string, in the UI language. */
function formatDay(day: string) {
  const [y, m, d] = day.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return {
    date: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(date),
    weekday: new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date),
  }
}

export function MapPage() {
  usePageTitle(t('map.title'))
  const state = useGameState()
  const today = useToday()
  const isDone = (id: string) => (state.lessons[id]?.completedAt ?? null) !== null
  const upNext = lessons.find((l) => !isDone(l.id))
  const streak = activeStreak(state.streak, today)
  const day = formatDay(today)
  const cheer =
    streak > 0
      ? t('map.cheerStreak', { days: streak })
      : state.xp > 0
        ? t('map.cheerXp', { xp: state.xp })
        : t('map.cheerNew')

  return (
    <>
      <p className={styles.date}>
        <span className={styles.dateMain}>{day.date}</span>
        <span className={styles.weekday}>{day.weekday}</span>
      </p>
      <h1 className={styles.title}>{t('map.title')}</h1>

      {/* The encouragement card: how you're doing, plus the next lesson to play. */}
      <section className={styles.hero} aria-label={t('map.upNext')}>
        {/* First in the DOM so it can float beside the text on narrow phones. */}
        <Mascot className={styles.mascot} shape="flame" colour="coral" mood="star" bob />
        <div className={styles.heroText}>
          <p className={styles.cheer}>{cheer}</p>
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
          <p className={styles.heroLinkWrap}>
            <Link className={styles.heroLink} to="/profile">
              {t('map.seeProgress')} <span aria-hidden="true">›</span>
            </Link>
          </p>
        </div>
      </section>

      {tracks.map((track, trackIndex) => {
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
            style={trackColours(track.colour)}
            aria-labelledby={`track-${track.id}`}
          >
            <header className={styles.trackHeader}>
              <span className={styles.trackIcon} aria-hidden="true">
                {track.icon}
              </span>
              <div className={styles.trackText}>
                <p className={styles.world}>{t('map.world', { n: trackIndex + 1 })}</p>
                <h2 id={`track-${track.id}`} className={styles.trackTitle}>
                  {track.title}
                </h2>
                <p className={styles.trackDescription}>{track.description}</p>
              </div>
              {available.length > 0 && (
                <p className={styles.count}>
                  <span aria-hidden="true">
                    <span className={styles.dot} />
                    {done}/{available.length}
                  </span>
                  <span className="visually-hidden">
                    {t('map.progress', { done, total: available.length })}
                  </span>
                </p>
              )}
            </header>

            <ol className={styles.list}>
              {nodes.map((node) =>
                node.kind === 'lesson' ? (
                  <li key={node.lesson.id}>
                    <LessonCard
                      lesson={node.lesson}
                      state={state}
                      isNext={node.lesson === upNext}
                    />
                  </li>
                ) : (
                  <li key={node.id} className={styles.soonRow}>
                    <span className={styles.soonNumber} aria-hidden="true">
                      {node.order}
                    </span>
                    <span className={styles.soonTitle}>{node.title}</span>
                    <span className={styles.soon}>{t('map.soon')}</span>
                  </li>
                ),
              )}
            </ol>
          </section>
        )
      })}
    </>
  )
}

/**
 * A lesson as a bright gradient card: stars and minutes above the title, and a round
 * indicator on the right (a tick once done, a play arrow on the next lesson).
 */
function LessonCard({
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
    <Link to={`/learn/${lesson.id}`} className={`${styles.card} ${isNext ? styles.nextCard : ''}`}>
      {/* The title comes first in the DOM, so the link's name starts with it. */}
      <span className={styles.cardText}>
        <span className={styles.cardTitle}>{lesson.title}</span>
        <span className={styles.cardMeta}>
          <Stars count={stars} />
          <span>{t('map.minutes', { minutes: lesson.minutes })}</span>
        </span>
      </span>
      {done && <span className="visually-hidden">{t('map.completed')}</span>}
      <span
        className={`${styles.check} ${done ? styles.checkDone : ''} ${isNext ? styles.checkNext : ''}`}
        aria-hidden="true"
      >
        {done ? '✓' : isNext ? '▶' : ''}
      </span>
    </Link>
  )
}
