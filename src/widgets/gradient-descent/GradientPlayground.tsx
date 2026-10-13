import { Coordinates, Mafs, MovablePoint, Plot, Point, Polyline, Theme } from 'mafs'
import { useId, useRef, useState } from 'react'
import { clamp } from '../../lib/math/clamp'
import { t } from '../../i18n'
import { useChallenge } from '../events'
import { PlayButtons, Slider, StatusLine } from './Controls'
import { landscapes, type LandscapeId, type Vector } from './model'
import styles from './Playground.module.css'
import { useBallAccessibility } from './useBallAccessibility'
import { useDescent } from './useDescent'

/** Path dots never catch the pointer, so they can't block dragging the ball underneath. */
const DECORATIVE = { style: { pointerEvents: 'none' } } as const

type Props = {
  landscape?: LandscapeId
  /** Let the player switch between these landscapes. */
  choices?: LandscapeId[]
  start?: number
  learningRate?: number
  maxLearningRate?: number
}

/** A ball rolling down a 1D loss curve, one gradient step at a time. */
export function GradientPlayground({
  landscape = 'bowl',
  choices,
  start = 3,
  learningRate: initialRate = 0.1,
  maxLearningRate = 1.2,
}: Props) {
  const challenge = useChallenge()
  const startFixed = challenge !== null
  const radioName = useId()
  const [landscapeId, setLandscapeId] = useState<LandscapeId>(landscape)
  const [x0, setX0] = useState(start)
  const [learningRate, setLearningRate] = useState(initialRate)

  const l = landscapes[landscapeId]
  const gradient = ([x]: Vector) => [l.df(x)]
  const descent = useDescent({
    start: [x0],
    gradient,
    learningRate,
    limit: 100,
    maxSteps: 200,
    onEvent: challenge?.report,
  })

  const [x] = descent.current
  const [xMin, xMax] = l.domain
  const restartFrom = (newX: number) => {
    setX0(newX)
    descent.reset([newX])
  }

  // The ball works like the Start slider (arrow keys move it along the curve), so it says so.
  const figureRef = useRef<HTMLElement>(null)
  useBallAccessibility(figureRef, {
    role: 'slider',
    'aria-label': t('widget.ball'),
    'aria-valuemin': String(xMin),
    'aria-valuemax': String(xMax),
    'aria-valuenow': String(x0),
    'aria-valuetext': x0.toFixed(1),
  })

  return (
    <figure ref={figureRef} className={styles.playground}>
      <Mafs
        height={260}
        viewBox={{ x: l.domain, y: l.range, padding: 0 }}
        preserveAspectRatio={false}
        pan={false}
        zoom={false}
      >
        <Coordinates.Cartesian subdivisions={false} />
        <Plot.OfX y={l.f} color={Theme.violet} weight={3} />
        <Polyline
          points={descent.path.map(([px]) => [px, l.f(px)])}
          color={Theme.orange}
          weight={2}
          strokeStyle="dashed"
        />
        {descent.path.slice(0, -1).map(([px], i) => (
          <Point
            key={i}
            x={px}
            y={l.f(px)}
            color={Theme.orange}
            opacity={0.5}
            svgCircleProps={DECORATIVE}
          />
        ))}
        {Number.isFinite(x) && (
          <Point x={x} y={l.f(x)} color={Theme.orange} svgCircleProps={DECORATIVE} />
        )}
        {/* The draggable ball comes last so it sits on top: SVG has no z-index, later = higher. */}
        {startFixed ? (
          <Point x={x0} y={l.f(x0)} color={Theme.pink} />
        ) : (
          <MovablePoint
            point={[x0, l.f(x0)]}
            color={Theme.pink}
            constrain={([px]) => {
              const cx = clamp(px, xMin, xMax)
              return [cx, l.f(cx)]
            }}
            onMove={([px]) => restartFrom(px)}
          />
        )}
      </Mafs>

      <figcaption className={styles.caption}>
        {startFixed ? t('widget.startFixed') : t('widget.hint')}
      </figcaption>

      <StatusLine status={descent.status} steps={descent.steps} loss={l.f(x)} />

      <div className={styles.controls}>
        {choices && (
          <fieldset className={styles.choices}>
            <legend>{t('widget.landscape')}</legend>
            {choices.map((id) => (
              <label key={id} className={styles.choice}>
                <input
                  type="radio"
                  name={`${radioName}-landscape`}
                  checked={id === landscapeId}
                  onChange={() => {
                    const next = landscapes[id]
                    const nextX = clamp(x0, next.domain[0], next.domain[1])
                    setLandscapeId(id)
                    restartFrom(nextX)
                  }}
                />
                {landscapes[id].label}
              </label>
            ))}
          </fieldset>
        )}
        <Slider
          label={t('widget.learningRate')}
          value={learningRate}
          min={0.01}
          max={maxLearningRate}
          step={0.01}
          onChange={(v) => {
            setLearningRate(v)
            descent.reset([x0])
          }}
        />
        {!startFixed && (
          <Slider
            label={t('widget.start')}
            value={x0}
            min={xMin}
            max={xMax}
            step={0.1}
            onChange={restartFrom}
            format={(v) => v.toFixed(1)}
          />
        )}
        <PlayButtons
          status={descent.status}
          playing={descent.playing}
          onStep={descent.step}
          onTogglePlay={descent.togglePlay}
          onReset={() => descent.reset([x0])}
        />
      </div>
    </figure>
  )
}
