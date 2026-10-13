import { useSyncExternalStore } from 'react'
import { badges, getLesson } from '../content/lessons'
import { toDayString } from '../game/dates'
import { browserStorage, createGameStore, STORAGE_KEY } from '../game/store'

/** The app's single game store, wired to the real content, clock and localStorage. */
export const gameStore = createGameStore({
  storage: browserStorage(),
  context: () => ({
    today: toDayString(new Date()),
    lesson: (id) => {
      const lesson = getLesson(id)
      return lesson && { xp: lesson.xp, challenges: lesson.challenges }
    },
    badges,
  }),
})

// Another tab saved progress: pick it up right away so both tabs show the same XP and stars.
// (The store also re-reads storage before every action, so a stale tab never overwrites it.)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    // key is null when the whole storage was cleared.
    if (event.key === STORAGE_KEY || event.key === null) gameStore.sync()
  })
}

// Ask the browser not to evict our storage under pressure (helps on Safari).
gameStore.onRewards(() => {
  void navigator.storage?.persist?.()
})

/** True while this tab can't save (another tab runs a newer version of the app). */
export function useReadOnly() {
  return useSyncExternalStore(gameStore.subscribe, gameStore.isReadOnly)
}

/** Re-renders the component whenever the game state changes. */
export function useGameState() {
  return useSyncExternalStore(gameStore.subscribe, gameStore.getState)
}
