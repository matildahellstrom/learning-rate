import { useEffect, useState } from 'react'
import { badges } from '../content/lessons'
import type { Reward } from '../game/engine'
import { t } from '../i18n'
import { gameStore } from './game'
import styles from './RewardToasts.module.css'

type Toast = { id: number; icon: string; text: string }

const TOAST_MS = 3500
let nextId = 0

function toToast(reward: Reward): Toast | null {
  const id = nextId++
  switch (reward.type) {
    case 'xp':
      return { id, icon: '⭐', text: t('toast.xp', { amount: reward.amount }) }
    case 'levelUp':
      return { id, icon: '⬆️', text: t('toast.levelUp', { level: reward.level }) }
    case 'badge': {
      const badge = badges.find((b) => b.id === reward.badgeId)
      return badge ? { id, icon: badge.icon, text: t('toast.badge', { title: badge.title }) } : null
    }
    case 'streak':
      if (reward.change === 'started') return { id, icon: '🔥', text: t('toast.streakStarted') }
      if (reward.change === 'freezeUsed')
        return { id, icon: '🧊', text: t('toast.freezeUsed', { days: reward.days }) }
      if (reward.change === 'extended')
        return { id, icon: '🔥', text: t('toast.streakExtended', { days: reward.days }) }
      return null
  }
}

/** Little pop-ups for XP, level-ups, badges and streaks, announced politely to screen readers. */
export function RewardToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(
    () =>
      gameStore.onRewards((rewards) => {
        const added = rewards.map(toToast).filter((x): x is Toast => x !== null)
        setToasts((current) => [...current, ...added].slice(-3))
        for (const toast of added) {
          setTimeout(
            () => setToasts((current) => current.filter((x) => x.id !== toast.id)),
            TOAST_MS,
          )
        }
      }),
    [],
  )

  return (
    <div className={styles.region} aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={styles.toast}>
          <span aria-hidden="true">{toast.icon}</span> {toast.text}
        </div>
      ))}
    </div>
  )
}
