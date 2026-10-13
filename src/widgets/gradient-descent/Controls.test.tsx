// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { StatusLine } from './Controls'

afterEach(cleanup)

describe('StatusLine', () => {
  it('suggests a smaller learning rate when the run is bouncing', () => {
    render(<StatusLine status="oscillating" steps={200} loss={9} />)
    expect(
      screen.getByText(/Still bouncing after 200 steps. Try a smaller learning rate./),
    ).toBeTruthy()
  })

  it('suggests a bigger learning rate when the run is crawling', () => {
    render(<StatusLine status="tooSlow" steps={200} loss={0.01} />)
    expect(screen.getByText(/Try a bigger learning rate/)).toBeTruthy()
  })

  it('says "reached the bottom" only on a convex landscape', () => {
    const { rerender } = render(<StatusLine status="converged" steps={39} loss={-0.588} />)
    expect(screen.getByText('Reached the bottom in 39 steps!')).toBeTruthy()

    rerender(<StatusLine status="converged" steps={39} loss={-0.588} convex={false} />)
    expect(screen.getByText('Settled after 39 steps: the slope here is zero.')).toBeTruthy()
    expect(screen.queryByText(/bottom/)).toBeNull()
  })
})
