import { describe, expect, it, vi } from 'vitest'
import type { GameContext, Reward } from './engine'
import { GAME_STATE_VERSION, initialGameState } from './state'
import { BACKUP_KEY, createGameStore, STORAGE_KEY } from './store'

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

  it('backs up unreadable data before it gets overwritten', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: '{not json' })
    createGameStore({ storage, context }).dispatch(finish)
    expect(storage.data.get(BACKUP_KEY)).toBe('{not json')
    expect(JSON.parse(storage.data.get(STORAGE_KEY)!).xp).toBe(100)
  })

  it('keeps progress when one saved field is malformed, and saves a repaired version', () => {
    const saved = {
      ...initialGameState(),
      xp: 40,
      streak: { current: 2, best: 2, lastDay: '13/10/2026', freezes: 0 },
    }
    const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify(saved) })
    const store = createGameStore({ storage, context })
    expect(store.getState().xp).toBe(40)

    store.dispatch(finish)
    const written = JSON.parse(storage.data.get(STORAGE_KEY)!)
    expect(written.xp).toBe(140)
    expect(written.streak.freezes).toBe(0)
    expect(written.streak.lastDay).toBe('2026-10-12')
    // The repaired save loads cleanly next time.
    expect(createGameStore({ storage, context }).getState().xp).toBe(140)
  })

  it('never overwrites data saved by a newer version of the app', () => {
    const newer = JSON.stringify({ ...initialGameState(), version: GAME_STATE_VERSION + 1, xp: 70 })
    const storage = memoryStorage({ [STORAGE_KEY]: newer })
    const store = createGameStore({ storage, context })
    expect(store.getState().xp).toBe(70)

    store.dispatch(finish)
    expect(store.getState().xp).toBe(170)
    expect(storage.data.get(STORAGE_KEY)).toBe(newer)
    expect(storage.data.has(BACKUP_KEY)).toBe(false)
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
