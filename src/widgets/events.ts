import { createContext, useContext } from 'react'

/** What interactive widgets report. A <Challenge> turns these into stars; widgets never touch the game. */
export type WidgetEvent = { type: 'converged'; steps: number } | { type: 'diverged'; steps: number }

export type ChallengeContextValue = {
  report: (event: WidgetEvent) => void
}

export const ChallengeContext = createContext<ChallengeContextValue | null>(null)

/** The surrounding challenge, or null when the widget is just for play. */
export function useChallenge(): ChallengeContextValue | null {
  return useContext(ChallengeContext)
}
