// Validates every content file. Loading lessons.ts already runs the zod schemas, so a
// broken frontmatter fails here with the file name; these tests add cross-file checks.
import { describe, expect, it } from 'vitest'
import { daysBetween, toDayString } from '../game/dates'
import { badges, lessons, tracks } from './lessons'

const STALE_AFTER_DAYS = 180

const lessonIds = lessons.map((l) => l.id)
const upcomingIds = tracks.flatMap((t) => t.upcoming.map((u) => u.id))
const allIds = [...lessonIds, ...upcomingIds]

describe('content', () => {
  it('has at least one lesson', () => {
    expect(lessons.length).toBeGreaterThan(0)
  })

  it('uses each lesson id only once (including upcoming lessons)', () => {
    expect(new Set(allIds).size).toBe(allIds.length)
  })

  it('does not list a published lesson as upcoming', () => {
    expect(upcomingIds.filter((id) => lessonIds.includes(id))).toEqual([])
  })

  it.each(lessons)('$id: belongs to a known track', (lesson) => {
    expect(tracks.map((t) => t.id)).toContain(lesson.track)
  })

  it.each(lessons)('$id: prerequisites point at real or upcoming lessons', (lesson) => {
    for (const id of lesson.prerequisites) expect(allIds).toContain(id)
  })

  it.each(lessons)('$id: has at least one step', (lesson) => {
    expect(lesson.stepCount).toBeGreaterThan(0)
  })

  it.each(lessons.filter((l) => l.volatility === 'fast-moving'))(
    '$id: fast-moving content was verified recently',
    (lesson) => {
      const age = daysBetween(lesson.lastVerified!, toDayString(new Date()))
      expect(age, `Re-verify ${lesson.file} with fresh sources`).toBeLessThan(STALE_AFTER_DAYS)
    },
  )

  it('uses each badge id only once', () => {
    expect(new Set(badges.map((b) => b.id)).size).toBe(badges.length)
  })
})
