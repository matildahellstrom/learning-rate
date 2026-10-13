import { useEffect, type RefObject } from 'react'

let navigated = false

/**
 * Remembers whether the player has navigated inside the app since the page loaded.
 * On the very first page load the browser starts at the top of the document (where the skip
 * link is), so focus stays put. After an in-app navigation the old focused element is gone or
 * stale, so we move focus to the new page's content instead.
 */
export function trackNavigation(router: {
  state: { location: { key: string } }
  subscribe: (fn: (state: { location: { key: string } }) => void) => unknown
}) {
  const initialKey = router.state.location.key
  router.subscribe((state) => {
    if (state.location.key !== initialKey) navigated = true
  })
}

export function hasNavigated(): boolean {
  return navigated
}

/**
 * Moves focus to `target` whenever `key` changes (e.g. the pathname) after an in-app navigation,
 * so keyboard and screen-reader users continue from the new page's content, not from <body>.
 */
export function useFocusOnNavigation(target: RefObject<HTMLElement | null>, key: string) {
  useEffect(() => {
    if (hasNavigated()) target.current?.focus({ preventScroll: true })
  }, [target, key])
}
