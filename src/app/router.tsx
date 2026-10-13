import { createHashRouter } from 'react-router'
import { MapPage } from '../pages/MapPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { ProfilePage } from '../pages/ProfilePage'
import { AppLayout } from './AppLayout'
import { trackNavigation } from './navigation'

// Hash URLs (#/learn/gradient-descent) work on any static host with no server config:
// the part after # never reaches the server, so GitHub Pages always serves index.html.
export const router = createHashRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <MapPage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },
  {
    path: 'learn/:lessonId',
    // Loaded on demand: the lesson player pulls in Mafs and the widgets, which the map doesn't need.
    lazy: async () => ({ Component: (await import('../pages/LessonPage')).LessonPage }),
  },
  { path: '*', element: <NotFoundPage /> },
])

trackNavigation(router)
