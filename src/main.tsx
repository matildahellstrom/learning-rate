import '@fontsource-variable/nunito/wght.css'
import 'katex/dist/katex.min.css'
import 'mafs/core.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { RewardToasts } from './app/RewardToasts'
import { router } from './app/router'
import './styles/tokens.css'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
    <RewardToasts />
  </StrictMode>,
)
