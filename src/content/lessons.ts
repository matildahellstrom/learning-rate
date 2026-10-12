import type { ComponentType } from 'react'
import type { MDXProps } from 'mdx/types'
import { z } from 'zod'
import badgesJson from '../../content/en/badges.json'
import tracksJson from '../../content/en/tracks.json'
import {
  badgesSchema,
  lessonFrontmatterSchema,
  tracksSchema,
  type BadgeDef,
  type LessonFrontmatter,
  type Track,
} from './schema'

export type Lesson = LessonFrontmatter & {
  /** The compiled MDX body. */
  Content: ComponentType<MDXProps>
  stepCount: number
  file: string
}

type LessonModule = {
  default: ComponentType<MDXProps>
  frontmatter: unknown
  stepCount: number
}

// Lessons live at content/<locale>/<track>/<lesson-id>/index.mdx.
// Eager: every lesson is bundled up front. Fine for a handful of lessons;
// switch to lazy imports once the bundle grows.
const modules = import.meta.glob<LessonModule>('/content/en/*/*/index.mdx', {
  eager: true,
})

function parseOrThrow<T>(schema: z.ZodType<T>, data: unknown, where: string): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new Error(`Invalid content in ${where}:\n${z.prettifyError(result.error)}`)
  }
  return result.data
}

function loadLessons(): Lesson[] {
  return Object.entries(modules)
    .map(([file, mod]) => {
      const meta = parseOrThrow(lessonFrontmatterSchema, mod.frontmatter, file)
      const [, , , track, folder] = file.split('/')
      if (meta.track !== track || meta.id !== folder) {
        throw new Error(
          `Invalid content in ${file}: id/track (${meta.id}/${meta.track}) must match the folder (${folder}/${track})`,
        )
      }
      return { ...meta, Content: mod.default, stepCount: mod.stepCount, file }
    })
    .sort((a, b) => a.order - b.order)
}

export const tracks: Track[] = parseOrThrow(tracksSchema, tracksJson, 'content/en/tracks.json')
export const badges: BadgeDef[] = parseOrThrow(badgesSchema, badgesJson, 'content/en/badges.json')
export const lessons: Lesson[] = loadLessons()

const lessonsById = new Map(lessons.map((l) => [l.id, l]))

export function getLesson(id: string): Lesson | undefined {
  return lessonsById.get(id)
}

/** Title for any lesson id, including upcoming ones that don't have content yet. */
export function lessonTitle(id: string): string | undefined {
  return (
    lessonsById.get(id)?.title ?? tracks.flatMap((t) => t.upcoming).find((u) => u.id === id)?.title
  )
}

export function lessonsInTrack(trackId: string): Lesson[] {
  return lessons.filter((l) => l.track === trackId)
}
