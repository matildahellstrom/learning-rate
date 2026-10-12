/**
 * Total XP needed to reach a level: 0, 100, 300, 600, 1000, …
 * Each level costs 100 XP more than the last, so early levels come quickly.
 */
export function xpForLevel(level: number): number {
  return 50 * level * (level - 1)
}

export type LevelInfo = {
  level: number
  /** XP earned since reaching the current level. */
  xpIntoLevel: number
  /** XP between the current level and the next. */
  xpForNextLevel: number
  /** 0–1 progress towards the next level. */
  progress: number
}

export function levelFromXp(xp: number): LevelInfo {
  // Invert xpForLevel: 50L(L−1) ≤ xp  ⇔  L ≤ (1 + √(1 + 0.08·xp)) / 2
  let level = Math.max(1, Math.floor((1 + Math.sqrt(1 + 0.08 * Math.max(0, xp))) / 2))
  // Guard against floating-point error right at a boundary.
  while (xpForLevel(level + 1) <= xp) level++
  while (level > 1 && xpForLevel(level) > xp) level--

  const xpIntoLevel = xp - xpForLevel(level)
  const xpForNextLevel = xpForLevel(level + 1) - xpForLevel(level)
  return { level, xpIntoLevel, xpForNextLevel, progress: xpIntoLevel / xpForNextLevel }
}
