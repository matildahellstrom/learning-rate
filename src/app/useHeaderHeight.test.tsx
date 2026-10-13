// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useHeaderHeight } from './useHeaderHeight'

/** A ResizeObserver stand-in whose callbacks the test fires by hand. */
const observers: { callback: () => void; target?: Element; disconnected: boolean }[] = []
class FakeResizeObserver {
  entry: (typeof observers)[number]
  constructor(callback: () => void) {
    this.entry = { callback, disconnected: false }
    observers.push(this.entry)
  }
  observe(target: Element) {
    this.entry.target = target
  }
  disconnect() {
    this.entry.disconnected = true
  }
}

beforeEach(() => {
  observers.length = 0
  vi.stubGlobal('ResizeObserver', FakeResizeObserver)
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const height = this.isConnected ? Number(this.dataset.height ?? 0) : 0
    return { height } as DOMRect
  })
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  document.documentElement.style.removeProperty('--header-h')
})

const headerHeight = () => document.documentElement.style.getPropertyValue('--header-h')

/** Like the lesson: its header is swapped out for a header-less screen and then back. */
function Page({ initial = 'lesson' }: { initial?: 'lesson' | 'done' }) {
  const [screen, setScreen] = useState(initial)
  const headerRef = useHeaderHeight()
  return (
    <>
      <button type="button" onClick={() => setScreen(screen === 'lesson' ? 'done' : 'lesson')}>
        swap
      </button>
      {screen === 'lesson' ? (
        <header ref={headerRef} data-height="68">
          lesson
        </header>
      ) : (
        <main>done</main>
      )}
    </>
  )
}

describe('useHeaderHeight', () => {
  it('measures each new header node, and ignores the detached old one', () => {
    const { getByRole } = render(<Page />)
    expect(headerHeight()).toBe('68px')

    // Lesson → completion: the old header is gone. Its observer may still fire (reading 0).
    act(() => getByRole('button').click())
    for (const o of observers) o.callback()
    expect(headerHeight()).toBe('68px')
    expect(observers[0].disconnected).toBe(true)

    // Completion → lesson: a brand-new <header> is measured and observed.
    document.documentElement.style.setProperty('--header-h', '0px')
    act(() => getByRole('button').click())
    expect(headerHeight()).toBe('68px')
    const newest = observers.at(-1)!
    expect(newest.target?.tagName).toBe('HEADER')
    expect(newest.target?.isConnected).toBe(true)
  })
})
