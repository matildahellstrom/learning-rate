import { useEffect, useRef, type RefObject } from 'react'

/**
 * Mafs renders the draggable point as a focusable <g> with no role or name, so a screen reader
 * just says "group" (or nothing). We can't pass ARIA props through <MovablePoint>, so we add them
 * to its DOM node directly. React doesn't own these attributes, so it never removes them again.
 *
 * Mafs draws its contents only once it has measured its size, possibly after our effects ran, so
 * a MutationObserver also catches the ball when it (re)appears.
 */
export function useBallAccessibility(
  container: RefObject<HTMLElement | null>,
  attributes: Record<string, string>,
) {
  const latest = useRef(attributes)

  useEffect(() => {
    latest.current = attributes
    if (container.current) label(container.current, attributes)
  })

  useEffect(() => {
    const root = container.current
    if (!root) return
    const observer = new MutationObserver(() => label(root, latest.current))
    observer.observe(root, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [container])
}

function label(root: HTMLElement, attributes: Record<string, string>) {
  const ball = root.querySelector('.mafs-movable-point')
  if (!ball) return
  for (const [name, value] of Object.entries(attributes)) {
    if (ball.getAttribute(name) !== value) ball.setAttribute(name, value)
  }
}
