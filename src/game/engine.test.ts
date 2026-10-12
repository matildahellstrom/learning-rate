import { describe, expect, it } from 'vitest'
import type { BadgeDef } from '../content/schema'
import { applyAction, lessonStars, type GameAction, type GameContext } from './engine'
import { emptyLessonProgress, initialGameState, type GameState } from './state'

const badges: BadgeDef[] = [
  {
    id: 'first',
    title: 'First',
    description: 'd',
    icon: '🌱',
    rule: { type: 'lessonsCompleted', count: 1 },
  },
  { id: 'perfect', title: 'Perfect', description: 'd', icon: '🎯', rule: { type: 'perfectQuiz' } },
  {
    id: 'fast',
    title: 'Fast',
    description: 'd',
    icon: '⚡',
    rule: { type: 'challengeStars', stars: 3 },
  },
  { id: 'lvl2', title: 'Level 2', description: 'd', icon: '⬆️', rule: { type: 'level', level: 2 } },
]

const ctx: GameContext = {
  today: '2026-10-12',
  lesson: (id) => (id === 'gd' ? { xp: 100, challenges: ['speedrun'] } : undefined),
  badges,
}

function play(actions: GameAction[], state: GameState = initialGameState()) {
  const allRewards = []
  for (const action of actions) {
    const result = applyAction(state, action, ctx)
    state = result.state
    allRewards.push(...result.rewards)
  }
  return { state, rewards: allRewards }
}

describe('applyAction', () => {
  it('pays quiz XP once per question', () => {
    const answer = {
      type: 'quizAnswered',
      lessonId: 'gd',
      questionIndex: 0,
      correct: true,
    } as const
    const { state } = play([answer, answer])
    expect(state.xp).toBe(10)
  })

  it('pays nothing for a wrong answer, but still counts as activity', () => {
    const { state, rewards } = play([
      { type: 'quizAnswered', lessonId: 'gd', questionIndex: 0, correct: false },
    ])
    expect(state.xp).toBe(0)
    expect(rewards).toEqual([{ type: 'streak', days: 1, change: 'started' }])
  })

  it('pays only for improvement in a challenge', () => {
    const { state } = play([
      { type: 'challengeScored', lessonId: 'gd', challengeId: 'speedrun', stars: 2 },
      { type: 'challengeScored', lessonId: 'gd', challengeId: 'speedrun', stars: 1 },
      { type: 'challengeScored', lessonId: 'gd', challengeId: 'speedrun', stars: 3 },
    ])
    expect(state.xp).toBe(30)
    expect(state.lessons.gd.challengeStars.speedrun).toBe(3)
  })

  it('finishing a lesson pays its XP once, levels up and awards badges', () => {
    const finish = { type: 'lessonFinished', lessonId: 'gd', quizCorrect: 3, quizTotal: 3 } as const
    const { state, rewards } = play([finish, finish])

    expect(state.xp).toBe(100)
    expect(state.lessons.gd).toMatchObject({
      completedAt: '2026-10-12',
      quizPerfect: true,
      stars: 2,
    })
    expect(rewards).toContainEqual({ type: 'levelUp', level: 2 })
    expect(Object.keys(state.badges).sort()).toEqual(['first', 'lvl2', 'perfect'])
    expect(rewards.filter((r) => r.type === 'badge')).toHaveLength(3)
  })

  it('ignores actions for unknown lessons', () => {
    const state = initialGameState()
    const result = applyAction(
      state,
      { type: 'lessonFinished', lessonId: 'nope', quizCorrect: 0, quizTotal: 0 },
      ctx,
    )
    expect(result.state).toBe(state)
  })
})

describe('lessonStars', () => {
  it('gives one star per goal', () => {
    const done = { ...emptyLessonProgress(), completedAt: '2026-10-12' }
    expect(lessonStars(emptyLessonProgress(), [])).toBe(0)
    expect(lessonStars(done, ['a'])).toBe(1)
    expect(lessonStars({ ...done, quizPerfect: true }, ['a'])).toBe(2)
    expect(lessonStars({ ...done, quizPerfect: true, challengeStars: { a: 3 } }, ['a'])).toBe(3)
  })

  it('awards the challenge star automatically when a lesson has no challenges', () => {
    expect(lessonStars({ ...emptyLessonProgress(), completedAt: '2026-10-12' }, [])).toBe(2)
  })
})
