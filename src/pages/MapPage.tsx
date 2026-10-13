import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { useGameState } from '../app/game'
import { usePageTitle } from '../app/usePageTitle'
import { Eta } from '../components/Eta'
import { Stars } from '../components/Stars'
import { lessons, lessonsInTrack, tracks, type Lesson } from '../content/lessons'
import type { GameState } from '../game/state'
import { t } from '../i18n'
import styles from './MapPage.module.css'

type Node =
  | { kind: 'lesson'; lesson: Lesson; order: number }
  | { kind: 'upcoming'; id: string; title: string; order: number }

/** Sideways position of the i-th node, from -1 (left) to 1 (right): a gentle winding path. */
const wave = (i: number) => Math.round(Math.sin(i * 1.1) * 100) / 100

/** Each track's colours as CSS custom properties, so one stylesheet themes every "world". */
const trackColours = (colour: string) =>
  ({
    '--track': `var(--track-${colour})`,
    '--track-2': `var(--track-${colour}-2)`,
  }) as CSSProperties

export function MapPage() {
  usePageTitle(t('map.title'))
  const state = useGameState()
  const isDone = (id: string) => (state.lessons[id]?.completedAt ?? null) !== null
  const upNext = lessons.find((l) => !isDone(l.id))

  return (
    <>
      <h1 className={styles.title}>{t('map.title')}</h1>

      <section className={styles.upNext} aria-label={t('map.upNext')}>
        {/* First in the DOM so it can float beside the text on narrow phones. */}
        <Eta className={styles.mascot} mood={upNext ? 'happy' : 'cheer'} />
        <div className={styles.upNextText}>
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
        const isNextNode = (n: Node | undefined) => n?.kind === 'lesson' && n.lesson === upNext

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
                {available.length > 0 && (
                  <div className={styles.trackProgress}>
                    <span className={styles.trackBar} aria-hidden="true">
                      <span style={{ width: `${(done / available.length) * 100}%` }} />
                    </span>
                    <p>{t('map.progress', { done, total: available.length })}</p>
                  </div>
                )}
              </div>
            </header>

            <ol className={styles.path}>
              {nodes.map((node, i) => {
                const next = nodes[i + 1]
                const lit =
                  node.kind === 'lesson' ? (isDone(node.lesson.id) ? 'done' : 'open') : 'locked'
                return (
                  <li
                    key={node.kind === 'lesson' ? node.lesson.id : node.id}
                    className={`${styles.stop} ${isNextNode(node) ? styles.hasBubble : ''}`}
                    style={
                      {
                        '--a': wave(i),
                        '--next-pad': isNextNode(next) ? 'var(--bubble-room)' : '0px',
                      } as CSSProperties
                    }
                  >
                    {next && (
                      <Connector
                        from={wave(i)}
                        to={wave(i + 1)}
                        tone={lit === 'done' ? 'done' : next.kind === 'lesson' ? 'open' : 'locked'}
                      />
                    )}
                    {node.kind === 'lesson' ? (
                      <LessonNode lesson={node.lesson} state={state} isNext={isNextNode(node)} />
                    ) : (
                      <div className={styles.node}>
                        <span className={`${styles.coin} ${styles.locked}`} aria-hidden="true">
                          {node.order}
                        </span>
                        <span className={styles.label}>
                          {node.title}
                          <span className={styles.soon}>{t('map.soon')}</span>
                        </span>
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })}
    </>
  )
}

/**
 * The dotted road from one node down to the next. Drawn per row so it needs no measuring:
 * it starts at this coin's centre and is exactly one row (plus the gap) tall. The SVG is
 * stretched to fit (preserveAspectRatio="none"); non-scaling-stroke keeps the dots round.
 */
const roadTone = {
  done: styles.roadDone,
  open: styles.roadOpen,
  locked: styles.roadLocked,
}

function Connector({ from, to, tone }: { from: number; to: number; tone: keyof typeof roadTone }) {
  const straight = Math.abs(from - to) < 0.02
  const x0 = straight ? 50 : from < to ? 0 : 100
  const x1 = straight ? 50 : 100 - x0
  return (
    <svg
      className={`${styles.connector} ${roadTone[tone]}`}
      style={{ '--lo': Math.min(from, to), '--span': Math.abs(from - to) } as CSSProperties}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d={`M${x0} 0 C${x0} 55, ${x1} 45, ${x1} 100`} vectorEffect="non-scaling-stroke" />
    </svg>
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
      <span className={styles.coinWrap}>
        {isNext && (
          <span className={styles.bubble} aria-hidden="true">
            {t('map.startHere')}
          </span>
        )}
        <span
          className={`${styles.coin} ${done ? styles.doneCoin : ''} ${isNext ? styles.next : ''}`}
          aria-hidden="true"
        >
          {done ? '★' : lesson.order}
        </span>
      </span>
      <span className={styles.label}>
        {lesson.title}
        <Stars count={stars} />
      </span>
    </Link>
  )
}
