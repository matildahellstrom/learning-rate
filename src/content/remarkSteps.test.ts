import type { Root } from 'mdast'
import { describe, expect, it } from 'vitest'
import { remarkSteps } from './remarkSteps'

const text = (value: string) => ({
  type: 'paragraph' as const,
  children: [{ type: 'text' as const, value }],
})

function transform(children: Root['children']): Root {
  const tree: Root = { type: 'root', children }
  remarkSteps()(tree)
  return tree
}

describe('remarkSteps', () => {
  it('wraps each ---separated chunk in a numbered <Step> and exports the count', () => {
    const tree = transform([
      { type: 'yaml', value: 'id: x' },
      text('one'),
      { type: 'thematicBreak' },
      text('two'),
      text('still two'),
    ])

    expect(tree.children.map((n) => n.type)).toEqual([
      'yaml',
      'mdxJsxFlowElement',
      'mdxJsxFlowElement',
      'mdxjsEsm',
    ])
    const [, first, second, esm] = tree.children
    expect(first).toMatchObject({ name: 'Step', attributes: [{ name: 'index', value: '0' }] })
    expect(second).toMatchObject({ attributes: [{ value: '1' }] })
    expect((second as { children: unknown[] }).children).toHaveLength(2)
    expect(esm).toMatchObject({ value: 'export const stepCount = 2' })
  })

  it('ignores empty steps from doubled or trailing separators', () => {
    const tree = transform([
      text('one'),
      { type: 'thematicBreak' },
      { type: 'thematicBreak' },
      text('two'),
      { type: 'thematicBreak' },
    ])
    const steps = tree.children.filter((n) => n.type === 'mdxJsxFlowElement')
    expect(steps).toHaveLength(2)
  })
})
