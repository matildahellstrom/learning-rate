import { useCallback } from 'react'

/**
 * Publishes the sticky header's real height as the CSS variable --header-h on <html>, so things
 * pinned below it (the reward toast) never overlap it, whatever the text size or wrapping.
 *
 * Returns a callback ref rather than taking a ref object: the lesson swaps its whole layout
 * (header included) for the completion screen and back, and a callback ref runs for every new
 * <header> node, while an effect keyed on a ref object would keep watching the first, detached
 * one. A detached node measures 0 high, so those readings are ignored.
 */
export function useHeaderHeight(): (header: HTMLElement | null) => (() => void) | undefined {
  return useCallback((header: HTMLElement | null) => {
    if (!header) return
    const update = () => {
      if (!header.isConnected) return
      const height = header.getBoundingClientRect().height
      document.documentElement.style.setProperty('--header-h', `${height}px`)
    }
    update()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(update)
    observer.observe(header)
    return () => observer.disconnect()
  }, [])
}
