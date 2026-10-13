import type { ReactNode } from 'react'

/**
 * Axis labels only for values within [min, max]. Mafs also labels grid lines just outside the
 * plot, which show up as cut-off slivers at the edges. Like Mafs' default, a hidden "-" after
 * negative numbers keeps them centred on their tick.
 */
export function labelsWithin(min: number, max: number) {
  return (n: number): ReactNode =>
    n < min || n > max ? null : (
      <>
        {n}
        {n < 0 && <tspan visibility="hidden">-</tspan>}
      </>
    )
}
