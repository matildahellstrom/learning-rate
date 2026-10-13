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
  let { state, readOnly, raw: lastRaw } = load(storage)
  const listeners = new Set<() => void>()
  const rewardListeners = new Set<(rewards: Reward[]) => void>()

  function commit(next: GameState, { force = false } = {}) {
    state = next
    // Data from a newer version of the app is never overwritten (except by an explicit reset).
    if (!readOnly || force) {
      const written = save(storage, state)
      if (written !== null) lastRaw = written
      readOnly = false
    }
    listeners.forEach((l) => l())
  }

  /**
   * Another tab may have saved since we last looked. If storage holds something other than what
   * we last read or wrote, adopt it, so we never write a stale snapshot over newer progress.
   */
  function sync(): boolean {
    let raw: string | null
    try {
      raw = storage?.getItem(STORAGE_KEY) ?? null
    } catch {
      return false
    }
    if (raw === lastRaw) return false
    ;({ state, readOnly, raw: lastRaw } = load(storage))
    listeners.forEach((l) => l())
    return true
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

    /** Re-read storage (e.g. on a `storage` event from another tab). True if it changed. */
    sync,

    dispatch(action: GameAction): Reward[] {
      // Read → apply → write, so two open tabs add up their progress instead of overwriting it.
      sync()
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

type Loaded = {
  state: GameState
  readOnly: boolean
  /** The exact string read from storage, to notice later when another tab changed it. */
  raw: string | null
}

function load(storage: KeyValueStorage | null): Loaded {
  let raw: string | null
  try {
    raw = storage?.getItem(STORAGE_KEY) ?? null
  } catch {
    // Storage blocked (private mode): play without saving.
    return { state: initialGameState(), readOnly: false, raw: null }
  }
  if (!raw) return { state: initialGameState(), readOnly: false, raw }

  let saved: unknown
  try {
    saved = JSON.parse(raw)
  } catch {
    saved = undefined
  }
  const { state, repaired, fromNewerVersion } = migrateSaved(saved)
  // About to replace data we couldn't fully read: keep a copy of the original first.
  if (repaired) backup(storage, raw)
  return { state, readOnly: fromNewerVersion, raw }
}

/** Returns what was written, or null if storage refused it. */
function save(storage: KeyValueStorage | null, state: GameState): string | null {
  const raw = JSON.stringify(state)
  try {
    if (!storage) return null
    storage.setItem(STORAGE_KEY, raw)
    return raw
  } catch {
    // Quota exceeded or storage blocked: the game still works for this visit.
    return null
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
