import type { Root, RootContent } from 'mdast'
import type { MdxJsxFlowElement } from 'mdast-util-mdx-jsx'
import type { MdxjsEsm } from 'mdast-util-mdxjs-esm'

/**
 * Remark plugin: split a lesson into steps at every `---` (thematic break).
 *
 * Markdown:            becomes:
 *   intro text           <Step index="0">intro text</Step>
 *   ---                  <Step index="1">more text</Step>
 *   more text            export const stepCount = 2
 *
 * Frontmatter and import/export statements stay at the top level.
 */
export function remarkSteps() {
  return (tree: Root) => {
    const topLevel: RootContent[] = []
    const groups: RootContent[][] = [[]]

    for (const node of tree.children) {
      if (node.type === 'yaml' || node.type === 'mdxjsEsm') {
        topLevel.push(node)
      } else if (node.type === 'thematicBreak') {
        groups.push([])
      } else {
        groups[groups.length - 1].push(node)
      }
    }

    const steps = groups
      .filter((children) => children.length > 0)
      .map((children, index) => stepElement(children, index))

    tree.children = [...topLevel, ...steps, stepCountExport(steps.length)]
  }
}

function stepElement(children: RootContent[], index: number): MdxJsxFlowElement {
  return {
    type: 'mdxJsxFlowElement',
    name: 'Step',
    attributes: [{ type: 'mdxJsxAttribute', name: 'index', value: String(index) }],
    children: children as MdxJsxFlowElement['children'],
  }
}

/** Builds `export const stepCount = n` as an ESTree program, the form MDX compiles. */
function stepCountExport(count: number): MdxjsEsm {
  return {
    type: 'mdxjsEsm',
    value: `export const stepCount = ${count}`,
    data: {
      estree: {
        type: 'Program',
        sourceType: 'module',
        body: [
          {
            type: 'ExportNamedDeclaration',
            specifiers: [],
            attributes: [],
            source: null,
            declaration: {
              type: 'VariableDeclaration',
              kind: 'const',
              declarations: [
                {
                  type: 'VariableDeclarator',
                  id: { type: 'Identifier', name: 'stepCount' },
                  init: { type: 'Literal', value: count, raw: String(count) },
                },
              ],
            },
          },
        ],
      },
    },
  }
}
