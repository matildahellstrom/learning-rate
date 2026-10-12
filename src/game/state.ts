import { z } from 'zod'
import { emptyStreak } from './streak'

export const GAME_STATE_VERSION = 1

const lessonProgressSchema = z.object({
  /** Day the lesson was first finished, or null. */
  completedAt: z.string().nullable(),
  stars: z.number().int().min(0).max(3),
  /** Indices of quiz questions ever answered correctly (each pays XP once). */
  quizCorrect: z.array(z.number().int().nonnegative()),
  /** True once a full attempt got every question right on the first try. */
  quizPerfect: z.boolean(),
  /** Best stars per challenge id. */
  challengeStars: z.record(z.string(), z.number().int().min(0).max(3)),
})

export const gameStateSchema = z.object({
  version: z.literal(GAME_STATE_VERSION),
  xp: z.number().int().nonnegative(),
  lessons: z.record(z.string(), lessonProgressSchema),
  streak: z.object({
    current: z.number().int().nonnegative(),
    best: z.number().int().nonnegative(),
    lastDay: z.string().nullable(),
    freezes: z.number().int().nonnegative(),
  }),
  /** Badge id → day earned. */
  badges: z.record(z.string(), z.string()),
})

export type GameState = z.infer<typeof gameStateSchema>
export type LessonProgress = z.infer<typeof lessonProgressSchema>

export function initialGameState(): GameState {
  return { version: GAME_STATE_VERSION, xp: 0, lessons: {}, streak: emptyStreak, badges: {} }
}

export function emptyLessonProgress(): LessonProgress {
  return { completedAt: null, stars: 0, quizCorrect: [], quizPerfect: false, challengeStars: {} }
}

/**
 * Turn whatever was saved into a valid current-version state.
 * When the shape changes: bump GAME_STATE_VERSION, add a step here that upgrades the
 * previous version, and add a test with an old saved state.
 */
export function migrate(saved: unknown): GameState {
  const parsed = gameStateSchema.safeParse(saved)
  return parsed.success ? parsed.data : initialGameState()
}
