import { useLayoutEffect, type RefObject } from 'react'

/**
 * Publishes the sticky header's real height as the CSS variable --header-h on <html>, so things
 * pinned below it (the reward toast) never overlap it, whatever the text size or wrapping.
 */
export function useHeaderHeight(header: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = header.current
    if (!el) return
    const root = document.documentElement
    const update = () =>
      root.style.setProperty('--header-h', `${el.getBoundingClientRect().height}px`)
    update()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [header])
}
