import { createContext, useContext } from 'react'

/** What interactive widgets report. A <Challenge> turns these into stars; widgets never touch the game. */
export type WidgetEvent =
  | { type: 'converged'; steps: number }
  | { type: 'diverged'; steps: number }
  /** The run was restarted (Reset, a new learning rate or start): earlier results are stale. */
  | { type: 'reset' }

export type ChallengeContextValue = {
  report: (event: WidgetEvent) => void
}

export const ChallengeContext = createContext<ChallengeContextValue | null>(null)

/** The surrounding challenge, or null when the widget is just for play. */
export function useChallenge(): ChallengeContextValue | null {
  return useContext(ChallengeContext)
}
