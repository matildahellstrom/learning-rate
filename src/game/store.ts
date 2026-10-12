import { applyAction, type GameAction, type GameContext, type Reward } from './engine'
import { initialGameState, migrate, type GameState } from './state'

export const STORAGE_KEY = 'learning-rate:game'

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
  let state = load(storage)
  const listeners = new Set<() => void>()
  const rewardListeners = new Set<(rewards: Reward[]) => void>()

  function commit(next: GameState) {
    state = next
    save(storage, state)
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
      commit(initialGameState())
    },
  }
}

function load(storage: KeyValueStorage | null): GameState {
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    return raw ? migrate(JSON.parse(raw)) : initialGameState()
  } catch {
    // Corrupt JSON or storage blocked (private mode): start fresh rather than crash.
    return initialGameState()
  }
}

function save(storage: KeyValueStorage | null, state: GameState) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Quota exceeded or storage blocked: the game still works for this visit.
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
