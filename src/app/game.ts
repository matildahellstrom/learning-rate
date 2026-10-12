import { useSyncExternalStore } from 'react'
import { badges, getLesson } from '../content/lessons'
import { toDayString } from '../game/dates'
import { browserStorage, createGameStore } from '../game/store'

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

// Ask the browser not to evict our storage under pressure (helps on Safari).
gameStore.onRewards(() => {
  void navigator.storage?.persist?.()
})

/** Re-renders the component whenever the game state changes. */
export function useGameState() {
  return useSyncExternalStore(gameStore.subscribe, gameStore.getState)
}
