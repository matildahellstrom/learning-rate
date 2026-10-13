import { Coordinates, Mafs, MovablePoint, Plot, Point, Polyline, Theme } from 'mafs'
import { useRef, useState } from 'react'
import { t } from '../../i18n'
import { clamp } from '../../lib/math/clamp'
import { useChallenge } from '../events'
import { PlayButtons, Slider, StatusLine } from './Controls'
import { ravine } from './model'
import styles from './Playground.module.css'
import { useBallAccessibility } from './useBallAccessibility'
import { useDescent } from './useDescent'

type Props = {
  /** How many times steeper the valley is across than along. */
  kappa?: number
  start?: [number, number]
  learningRate?: number
  maxLearningRate?: number
}

const X_MAX = 4
const Y_MAX = 2
/** Decorative points never catch the pointer, so they can't block dragging the ball. */
const DECORATIVE = { style: { pointerEvents: 'none' } } as const
const CONTOUR_LEVELS = [0.125, 0.5, 1.125, 2, 3.125, 4.5, 6.125]

/** Gradient descent on a long, narrow valley seen from above: contour lines plus the path. */
export function RavinePlayground({
  kappa = 10,
  start = [3, 1.5],
  learningRate: initialRate = 0.05,
  maxLearningRate = 0.25,
}: Props) {
  const challenge = useChallenge()
  const startFixed = challenge !== null
  const [p0, setP0] = useState<[number, number]>(start)
  const [learningRate, setLearningRate] = useState(initialRate)

  const r = ravine(kappa)
  const descent = useDescent({
    start: p0,
    gradient: r.gradient,
    learningRate,
    limit: 50,
    maxSteps: 300,
    onEvent: challenge?.report,
  })

  const restartFrom = (p: [number, number]) => {
    setP0(p)
    descent.reset(p)
  }
  // Two coordinates, so not a slider: a labelled group that describes where it is.
  const figureRef = useRef<HTMLElement>(null)
  useBallAccessibility(figureRef, {
    role: 'group',
    'aria-roledescription': t('widget.ballRole'),
    'aria-label': t('widget.ball2d', { x: p0[0].toFixed(1), y: p0[1].toFixed(1) }),
  })

  const [cx, cy] = descent.current
  const visible = Math.abs(cx) <= X_MAX * 2 && Math.abs(cy) <= Y_MAX * 2

  return (
    <figure ref={figureRef} className={styles.playground}>
      <Mafs
        height={240}
        viewBox={{ x: [-X_MAX, X_MAX], y: [-Y_MAX, Y_MAX], padding: 0 }}
        preserveAspectRatio="contain"
        pan={false}
        zoom={false}
      >
        <Coordinates.Cartesian subdivisions={false} />
        {CONTOUR_LEVELS.map((level) => (
          <Plot.Parametric
            key={level}
            xy={(t) => r.contour(level, t)}
            domain={[0, 2 * Math.PI]}
            color={Theme.violet}
            opacity={0.55}
            weight={2}
          />
        ))}
        <Point x={0} y={0} color={Theme.green} />
        <Polyline points={descent.path.map(([x, y]) => [x, y])} color={Theme.orange} weight={2} />
        {visible && <Point x={cx} y={cy} color={Theme.orange} svgCircleProps={DECORATIVE} />}
        {/* The draggable ball comes last so it sits on top: SVG has no z-index, later = higher. */}
        {startFixed ? (
          <Point x={p0[0]} y={p0[1]} color={Theme.pink} />
        ) : (
          <MovablePoint
            point={p0}
            color={Theme.pink}
            constrain={([x, y]) => [clamp(x, -X_MAX, X_MAX), clamp(y, -Y_MAX, Y_MAX)]}
            onMove={([x, y]) => restartFrom([x, y])}
          />
        )}
      </Mafs>

      <figcaption className={styles.caption}>
        {startFixed ? t('widget.startFixed') : t('widget.hint')}
      </figcaption>

      <StatusLine status={descent.status} steps={descent.steps} loss={r.f(descent.current)} />

      <div className={styles.controls}>
        <Slider
          label={t('widget.learningRate')}
          value={learningRate}
          min={0.01}
          max={maxLearningRate}
          step={0.01}
          onChange={(v) => {
            setLearningRate(v)
            descent.reset(p0)
          }}
        />
        {!startFixed && (
          <>
            <Slider
              label={t('widget.startX')}
              value={p0[0]}
              min={-X_MAX}
              max={X_MAX}
              step={0.1}
              onChange={(x) => restartFrom([x, p0[1]])}
              format={(v) => v.toFixed(1)}
            />
            <Slider
              label={t('widget.startY')}
              value={p0[1]}
              min={-Y_MAX}
              max={Y_MAX}
              step={0.1}
              onChange={(y) => restartFrom([p0[0], y])}
              format={(v) => v.toFixed(1)}
            />
          </>
        )}
        <PlayButtons
          status={descent.status}
          playing={descent.playing}
          onStep={descent.step}
          onTogglePlay={descent.togglePlay}
          onReset={() => descent.reset(p0)}
        />
      </div>
    </figure>
  )
}
