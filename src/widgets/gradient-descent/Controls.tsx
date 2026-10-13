import { useId } from 'react'
import { t } from '../../i18n'
import styles from './Playground.module.css'
import type { PlaygroundStatus } from './useDescent'

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format = (v) => v.toFixed(2),
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  format?: (value: number) => string
}) {
  const id = useId()
  return (
    <div className={styles.slider}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <output htmlFor={id} className={styles.value}>
        {format(value)}
      </output>
    </div>
  )
}

export function PlayButtons({
  status,
  playing,
  onStep,
  onTogglePlay,
  onReset,
}: {
  status: PlaygroundStatus
  playing: boolean
  onStep: () => void
  onTogglePlay: () => void
  onReset: () => void
}) {
  const done = status !== 'running'
  const stepDisabled = done || playing
  // aria-disabled instead of disabled: a disabled button drops keyboard focus to <body> the
  // moment the run ends. These stay focusable (and say they're unavailable) and just ignore
  // presses, so keyboard users can carry on from where they were.
  return (
    <div className={styles.buttons}>
      <button
        type="button"
        className="btn btn-small"
        onClick={() => !stepDisabled && onStep()}
        aria-disabled={stepDisabled}
      >
        {t('widget.step')}
      </button>
      <button
        type="button"
        className="btn btn-small"
        onClick={() => !done && onTogglePlay()}
        aria-disabled={done}
        aria-pressed={playing}
      >
        {playing ? t('widget.pause') : t('widget.play')}
      </button>
      <button type="button" className="btn btn-small btn-secondary" onClick={onReset}>
        {t('widget.reset')}
      </button>
    </div>
  )
}

export function StatusLine({
  status,
  steps,
  loss,
}: {
  status: PlaygroundStatus
  steps: number
  loss: number
}) {
  const message =
    status === 'converged'
      ? steps === 1
        ? t('widget.convergedOne')
        : t('widget.converged', { steps })
      : status === 'diverged'
        ? t('widget.diverged')
        : status === 'tooSlow'
          ? t('widget.tooSlow', { steps })
          : status === 'oscillating'
            ? t('widget.oscillating', { steps })
            : null
  return (
    <div className={styles.status}>
      <p className={styles.readout}>
        {t('widget.readout', { step: steps, loss: formatLoss(loss) })}
      </p>
      {/* Only the outcome is announced, so screen readers aren't flooded during Play. */}
      <p aria-live="polite" className={`${styles.message} ${styles[status]}`}>
        {message}
      </p>
    </div>
  )
}

function formatLoss(loss: number): string {
  if (!Number.isFinite(loss)) return '∞'
  return Math.abs(loss) >= 1000 ? loss.toExponential(1) : loss.toFixed(3)
}
