import { z } from 'zod'

/** YAML may parse an unquoted 2026-10-12 as a Date; normalise to "YYYY-MM-DD". */
const isoDay = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
  z.iso.date(),
)

const slug = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'use lowercase-kebab-case')

export const sourceSchema = z.object({
  title: z.string().min(1),
  url: z.url(),
})

const choiceQuestion = z.object({
  type: z.literal('choice'),
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  answer: z.number().int().nonnegative(),
  explanation: z.string().min(1),
})

const numericQuestion = z.object({
  type: z.literal('numeric'),
  prompt: z.string().min(1),
  answer: z.number(),
  tolerance: z.number().nonnegative().default(0),
  explanation: z.string().min(1),
})

export const questionSchema = z
  .discriminatedUnion('type', [choiceQuestion, numericQuestion])
  .refine((q) => q.type !== 'choice' || q.answer < q.options.length, {
    message: 'answer must be an index into options',
  })

export const lessonFrontmatterSchema = z
  .object({
    id: slug,
    title: z.string().min(1),
    summary: z.string().min(1),
    track: slug,
    order: z.number().int().nonnegative(),
    prerequisites: z.array(slug).default([]),
    minutes: z.number().positive(),
    xp: z.number().int().positive(),
    volatility: z.enum(['evergreen', 'fast-moving']),
    lastVerified: isoDay.optional(),
    sources: z.array(sourceSchema).min(1, 'every lesson needs at least one source'),
    quiz: z.array(questionSchema).default([]),
    /** Ids of the <Challenge>s in this lesson; three stars in all of them earns a lesson star. */
    challenges: z.array(slug).default([]),
  })
  .refine((l) => l.volatility !== 'fast-moving' || l.lastVerified, {
    message: 'fast-moving lessons need lastVerified',
    path: ['lastVerified'],
  })

export const tracksSchema = z.array(
  z.object({
    id: slug,
    title: z.string().min(1),
    description: z.string().min(1),
    icon: z.string().min(1),
    colour: z.enum(['violet', 'blue', 'green', 'orange', 'pink', 'teal', 'red']),
    /** Lessons on the roadmap that don't exist yet; shown greyed out on the map. */
    upcoming: z
      .array(z.object({ id: slug, title: z.string().min(1), order: z.number().int() }))
      .default([]),
  }),
)

export const badgeRuleSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('lessonsCompleted'), count: z.number().int().positive() }),
  z.object({ type: z.literal('perfectQuiz') }),
  z.object({ type: z.literal('challengeStars'), stars: z.number().int().min(1).max(3) }),
  z.object({ type: z.literal('streak'), days: z.number().int().positive() }),
  z.object({ type: z.literal('level'), level: z.number().int().positive() }),
])

export const badgesSchema = z.array(
  z.object({
    id: slug,
    title: z.string().min(1),
    description: z.string().min(1),
    icon: z.string().min(1),
    rule: badgeRuleSchema,
  }),
)

export type Source = z.infer<typeof sourceSchema>
export type Question = z.infer<typeof questionSchema>
export type LessonFrontmatter = z.infer<typeof lessonFrontmatterSchema>
export type Track = z.infer<typeof tracksSchema>[number]
export type BadgeRule = z.infer<typeof badgeRuleSchema>
export type BadgeDef = z.infer<typeof badgesSchema>[number]
