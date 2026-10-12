import type { MDXComponents } from 'mdx/types'
import { GradientPlayground } from '../widgets/gradient-descent/GradientPlayground'
import { RavinePlayground } from '../widgets/gradient-descent/RavinePlayground'
import { Challenge } from './challenge/Challenge'
import { Deeper } from './Deeper'
import { Quiz } from './quiz/Quiz'
import { Step } from './Step'

/** Everything lesson authors can use in MDX without importing it. */
export const mdxComponents: MDXComponents = {
  Step,
  Deeper,
  Quiz,
  Challenge,
  GradientPlayground,
  RavinePlayground,
}
