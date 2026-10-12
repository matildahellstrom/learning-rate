import { describe, expect, it, vi } from 'vitest'
import type { GameContext, Reward } from './engine'
import { initialGameState } from './state'
import { createGameStore, STORAGE_KEY } from './store'

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    data,
  }
}

const context = (): GameContext => ({
  today: '2026-10-12',
  lesson: () => ({ xp: 100, challenges: [] }),
  badges: [],
})

const finish = { type: 'lessonFinished', lessonId: 'gd', quizCorrect: 0, quizTotal: 0 } as const

describe('createGameStore', () => {
  it('saves after every change and reloads it', () => {
    const storage = memoryStorage()
    createGameStore({ storage, context }).dispatch(finish)

    const reloaded = createGameStore({ storage, context })
    expect(reloaded.getState().xp).toBe(100)
  })

  it('starts fresh when saved data is corrupt or from an unknown version', () => {
    for (const saved of ['{not json', JSON.stringify({ version: 99 })]) {
      const store = createGameStore({ storage: memoryStorage({ [STORAGE_KEY]: saved }), context })
      expect(store.getState()).toEqual(initialGameState())
    }
  })

  it('works without storage at all', () => {
    const store = createGameStore({ storage: null, context })
    store.dispatch(finish)
    expect(store.getState().xp).toBe(100)
  })

  it('notifies subscribers and reward listeners', () => {
    const store = createGameStore({ storage: null, context })
    const onChange = vi.fn<() => void>()
    const onRewards = vi.fn<(rewards: Reward[]) => void>()
    store.subscribe(onChange)
    store.onRewards(onRewards)

    store.dispatch(finish)
    expect(onChange).toHaveBeenCalledOnce()
    expect(onRewards).toHaveBeenCalledWith(
      expect.arrayContaining([{ type: 'xp', amount: 100, reason: 'lesson' }]),
    )
  })

  it('reset clears progress', () => {
    const storage = memoryStorage()
    const store = createGameStore({ storage, context })
    store.dispatch(finish)
    store.reset()
    expect(store.getState()).toEqual(initialGameState())
  })
})
