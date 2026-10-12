import type { ReactNode } from 'react'
import { useLesson } from '../lesson/context'

/**
 * remarkSteps wraps each `---`-separated chunk of a lesson in <Step index="n">.
 * Only the current step renders.
 */
export function Step({ index, children }: { index: string; children?: ReactNode }) {
  const { step } = useLesson()
  return Number(index) === step ? <>{children}</> : null
}
