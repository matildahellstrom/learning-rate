import mdx from '@mdx-js/rollup'
import react from '@vitejs/plugin-react'
import rehypeKatex from 'rehype-katex'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMath from 'remark-math'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import { defineConfig } from 'vitest/config'
import { rehypeFocusableMath } from './src/content/rehypeFocusableMath.ts'
import { remarkSteps } from './src/content/remarkSteps.ts'
import { t } from './src/i18n/index.ts'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset paths: the build works under any GitHub Pages repo name.
  base: './',
  plugins: [
    {
      // MDX must run before the React plugin so its JSX output gets transformed.
      enforce: 'pre',
      ...mdx({
        providerImportSource: '@mdx-js/react',
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkSteps, remarkMath],
        rehypePlugins: [rehypeKatex, [rehypeFocusableMath, { label: t('math.equation') }]],
      }),
    },
    react({ include: /\.(mdx|tsx|ts)$/ }),
  ],
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
