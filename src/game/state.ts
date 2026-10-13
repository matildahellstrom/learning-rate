import { z } from 'zod'
import { emptyStreak, MAX_FREEZES } from './streak'

export const GAME_STATE_VERSION = 1

/** A calendar day, "YYYY-MM-DD". Anything else would turn day maths into NaN. */
const daySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((day) => !Number.isNaN(Date.parse(`${day}T00:00:00Z`)), 'not a real day')

const starsSchema = z.number().int().min(0).max(3)

const lessonProgressSchema = z.object({
  /** Day the lesson was first finished, or null. */
  completedAt: daySchema.nullable(),
  stars: starsSchema,
  /** Indices of quiz questions ever answered correctly (each pays XP once). */
  quizCorrect: z.array(z.number().int().nonnegative()),
  /** True once a full attempt got every question right on the first try. */
  quizPerfect: z.boolean(),
  /** Best stars per challenge id. */
  challengeStars: z.record(z.string(), starsSchema),
})

const streakSchema = z.object({
  current: z.number().int().nonnegative(),
  best: z.number().int().nonnegative(),
  lastDay: daySchema.nullable(),
  freezes: z.number().int().min(0).max(MAX_FREEZES),
})

export const gameStateSchema = z.object({
  version: z.literal(GAME_STATE_VERSION),
  xp: z.number().int().nonnegative(),
  lessons: z.record(z.string(), lessonProgressSchema),
  streak: streakSchema,
  /** Badge id → day earned. */
  badges: z.record(z.string(), daySchema),
})

export type GameState = z.infer<typeof gameStateSchema>
export type LessonProgress = z.infer<typeof lessonProgressSchema>

export function initialGameState(): GameState {
  return { version: GAME_STATE_VERSION, xp: 0, lessons: {}, streak: emptyStreak, badges: {} }
}

export function emptyLessonProgress(): LessonProgress {
  return { completedAt: null, stars: 0, quizCorrect: [], quizPerfect: false, challengeStars: {} }
}

export type MigrationResult = {
  state: GameState
  /** The saved data wasn't a valid state: what could be read was kept, the rest was dropped. */
  repaired: boolean
  /** Saved by a newer version of the app. Show what we can, but never overwrite it. */
  fromNewerVersion: boolean
}

/**
 * Turn whatever was saved into a valid current-version state, keeping as much as possible.
 * One bad field (a mangled date, stars: 4) must never wipe everyone's progress, so anything
 * that doesn't parse is salvaged field by field.
 *
 * When the shape changes: bump GAME_STATE_VERSION, add a step here that upgrades the
 * previous version, and add a test with an old saved state.
 */
export function migrateSaved(saved: unknown): MigrationResult {
  const parsed = gameStateSchema.safeParse(saved)
  if (parsed.success) return { state: parsed.data, repaired: false, fromNewerVersion: false }

  const fromNewerVersion =
    isRecord(saved) && typeof saved.version === 'number' && saved.version > GAME_STATE_VERSION
  return { state: salvage(saved), repaired: !fromNewerVersion, fromNewerVersion }
}

export function migrate(saved: unknown): GameState {
  return migrateSaved(saved).state
}

function salvage(saved: unknown): GameState {
  if (!isRecord(saved)) return initialGameState()
  return {
    version: GAME_STATE_VERSION,
    xp: count(saved.xp),
    lessons: salvageRecord(saved.lessons, salvageLesson),
    streak: salvageStreak(saved.streak),
    badges: salvageRecord(saved.badges, (day) => daySchema.safeParse(day).data),
  }
}

function salvageLesson(value: unknown): LessonProgress | undefined {
  if (!isRecord(value)) return undefined
  const quizCorrect = Array.isArray(value.quizCorrect)
    ? value.quizCorrect.filter((i): i is number => Number.isInteger(i) && i >= 0)
    : []
  return {
    completedAt: daySchema.safeParse(value.completedAt).data ?? null,
    stars: Math.min(count(value.stars), 3),
    quizCorrect: [...new Set(quizCorrect)],
    quizPerfect: value.quizPerfect === true,
    challengeStars: salvageRecord(value.challengeStars, (stars) =>
      typeof stars === 'number' && Number.isFinite(stars) ? Math.min(count(stars), 3) : undefined,
    ),
  }
}

function salvageStreak(value: unknown): GameState['streak'] {
  if (!isRecord(value)) return emptyStreak
  return {
    current: count(value.current),
    best: count(value.best),
    lastDay: daySchema.safeParse(value.lastDay).data ?? null,
    freezes: Math.min(count(value.freezes), MAX_FREEZES),
  }
}

/** A non-negative whole number, or 0 for anything else (NaN, -5, "12", null). */
function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
}

/** Keeps each entry that `salvageValue` can make sense of, drops the rest. */
function salvageRecord<T>(
  value: unknown,
  salvageValue: (v: unknown) => T | undefined,
): Record<string, T> {
  if (!isRecord(value)) return {}
  const result: Record<string, T> = {}
  for (const [key, v] of Object.entries(value)) {
    const salvaged = salvageValue(v)
    if (salvaged !== undefined) result[key] = salvaged
  }
  return result
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
