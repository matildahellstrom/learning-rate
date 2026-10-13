/**
 * Rehype plugin: make KaTeX display maths reachable by keyboard.
 *
 * Wide equations scroll sideways inside `.katex-display` (see global.css). A scrollable region
 * that can't be focused can't be scrolled with the keyboard (axe: scrollable-region-focusable),
 * so each one gets tabindex="0" plus a role and a name, so screen readers say what it is.
 *
 *   <span class="katex-display">…</span>
 *   → <span class="katex-display" tabindex="0" role="group" aria-label="Equation">…</span>
 *
 * Runs after rehype-katex at build time; minimal hast types so we need no extra dependency.
 */
export type HastNode = {
  type: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
}

export function rehypeFocusableMath({ label }: { label: string }) {
  return (tree: HastNode) => {
    visit(tree, (node) => {
      const className = node.properties?.className
      if (
        node.type === 'element' &&
        Array.isArray(className) &&
        className.includes('katex-display')
      ) {
        node.properties = { ...node.properties, tabIndex: 0, role: 'group', ariaLabel: label }
      }
    })
  }
}

function visit(node: HastNode, fn: (node: HastNode) => void) {
  fn(node)
  node.children?.forEach((child) => visit(child, fn))
}
