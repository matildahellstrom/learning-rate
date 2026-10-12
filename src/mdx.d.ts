declare module '*.mdx' {
  import type { MDXProps } from 'mdx/types'
  import type { ComponentType } from 'react'

  export const frontmatter: unknown
  export const stepCount: number
  const MDXContent: ComponentType<MDXProps>
  export default MDXContent
}
