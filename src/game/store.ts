import { applyAction, type GameAction, type GameContext, type Reward } from './engine'
import { initialGameState, migrateSaved, type GameState } from './state'

export const STORAGE_KEY = 'learning-rate:game'
/** Where unreadable saved data is copied before it is repaired, so nothing is lost for good. */
export const BACKUP_KEY = 'learning-rate:game:backup'

type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export type GameStore = ReturnType<typeof createGameStore>

/**
 * A tiny observable store: holds the state, applies actions, saves to storage and tells
 * subscribers (React, via useSyncExternalStore) when something changed.
 */
export function createGameStore({
  storage,
  context,
}: {
  storage: KeyValueStorage | null
  context: () => GameContext
}) {
  let { state, readOnly } = load(storage)
  const listeners = new Set<() => void>()
  const rewardListeners = new Set<(rewards: Reward[]) => void>()

  function commit(next: GameState, { force = false } = {}) {
    state = next
    // Data from a newer version of the app is never overwritten (except by an explicit reset).
    if (!readOnly || force) {
      save(storage, state)
      readOnly = false
    }
    listeners.forEach((l) => l())
  }

  return {
    getState: () => state,

    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    /** Get told about rewards as they happen (for toasts and celebrations). */
    onRewards(listener: (rewards: Reward[]) => void) {
      rewardListeners.add(listener)
      return () => {
        rewardListeners.delete(listener)
      }
    },

    dispatch(action: GameAction): Reward[] {
      const result = applyAction(state, action, context())
      if (result.state !== state) commit(result.state)
      if (result.rewards.length > 0) rewardListeners.forEach((l) => l(result.rewards))
      return result.rewards
    },

    reset() {
      commit(initialGameState(), { force: true })
    },
  }
}

function load(storage: KeyValueStorage | null): { state: GameState; readOnly: boolean } {
  let raw: string | null | undefined
  try {
    raw = storage?.getItem(STORAGE_KEY)
  } catch {
    // Storage blocked (private mode): play without saving.
    return { state: initialGameState(), readOnly: false }
  }
  if (!raw) return { state: initialGameState(), readOnly: false }

  let saved: unknown
  try {
    saved = JSON.parse(raw)
  } catch {
    saved = undefined
  }
  const { state, repaired, fromNewerVersion } = migrateSaved(saved)
  // About to replace data we couldn't fully read: keep a copy of the original first.
  if (repaired) backup(storage, raw)
  return { state, readOnly: fromNewerVersion }
}

function save(storage: KeyValueStorage | null, state: GameState) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Quota exceeded or storage blocked: the game still works for this visit.
  }
}

function backup(storage: KeyValueStorage | null, raw: string) {
  try {
    storage?.setItem(BACKUP_KEY, raw)
  } catch {
    // Nothing more we can do; the repaired state still loads.
  }
}

/** localStorage if the browser lets us use it, otherwise null. */
export function browserStorage(): KeyValueStorage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}
