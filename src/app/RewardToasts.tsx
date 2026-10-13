import { useEffect, useState } from 'react'
import { badges } from '../content/lessons'
import type { Reward } from '../game/engine'
import { t } from '../i18n'
import { gameStore } from './game'
import styles from './RewardToasts.module.css'
import { onToastSuppressionChange, rewardToastsSuppressed } from './toastSuppression'

type Item = { icon: string; text: string }
type Toast = { id: number; items: Item[] }

const TOAST_MS = 2500
let nextId = 0

function toItem(reward: Reward): Item | null {
  switch (reward.type) {
    case 'xp':
      return { icon: '⭐', text: t('toast.xp', { amount: reward.amount }) }
    case 'levelUp':
      return { icon: '⬆️', text: t('toast.levelUp', { level: reward.level }) }
    case 'badge': {
      const badge = badges.find((b) => b.id === reward.badgeId)
      return badge ? { icon: badge.icon, text: t('toast.badge', { title: badge.title }) } : null
    }
    case 'streak':
      if (reward.change === 'started') return { icon: '🔥', text: t('toast.streakStarted') }
      if (reward.change === 'freezeUsed')
        return { icon: '🧊', text: t('toast.freezeUsed', { days: reward.days }) }
      if (reward.change === 'extended')
        return { icon: '🔥', text: t('toast.streakExtended', { days: reward.days }) }
      return null
  }
}

/**
 * One compact pop-up for whatever was just earned (XP, level-ups, badges, streaks), announced
 * politely to screen readers. Each new batch replaces the previous one, so they never pile up
 * over the controls.
 */
export function RewardToasts() {
  const [toast, setToast] = useState<Toast | null>(null)

  useEffect(
    () =>
      gameStore.onRewards((rewards) => {
        if (rewardToastsSuppressed()) return
        const items = rewards.map(toItem).filter((x): x is Item => x !== null)
        if (items.length === 0) return
        const id = nextId++
        setToast({ id, items })
        setTimeout(() => setToast((current) => (current?.id === id ? null : current)), TOAST_MS)
      }),
    [],
  )

  // A screen that celebrates rewards itself (the completion screen) hides the toast.
  useEffect(
    () =>
      onToastSuppressionChange(() => {
        if (rewardToastsSuppressed()) setToast(null)
      }),
    [],
  )

  return (
    <div className={styles.region} aria-live="polite">
      {toast && (
        <div key={toast.id} className={styles.toast}>
          {toast.items.map((item, i) => (
            <span key={i}>
              <span aria-hidden="true">{item.icon}</span> {item.text}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
