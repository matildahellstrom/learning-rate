import { useState } from 'react'
import { toDayString } from '../game/dates'

/** Today's local date, read once when the component mounts (rendering stays pure). */
export function useToday(): string {
  const [today] = useState(() => toDayString(new Date()))
  return today
}
