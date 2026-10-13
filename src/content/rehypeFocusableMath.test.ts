import { describe, expect, it } from 'vitest'
import { rehypeFocusableMath, type HastNode } from './rehypeFocusableMath'

const span = (className: string[], children: HastNode[] = []): HastNode => ({
  type: 'element',
  tagName: 'span',
  properties: { className },
  children,
})

describe('rehypeFocusableMath', () => {
  it('makes display maths focusable and names it, leaving inline maths alone', () => {
    const display = span(['katex-display'], [span(['katex'])])
    const inline = span(['katex'])
    const tree: HastNode = {
      type: 'root',
      children: [{ type: 'element', tagName: 'p', children: [inline] }, display],
    }

    rehypeFocusableMath({ label: 'Equation' })(tree)

    expect(display.properties).toEqual({
      className: ['katex-display'],
      tabIndex: 0,
      role: 'group',
      ariaLabel: 'Equation',
    })
    expect(inline.properties).toEqual({ className: ['katex'] })
    expect(display.children?.[0].properties).toEqual({ className: ['katex'] })
  })
})
