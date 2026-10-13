# Widget backlog

Interactive widgets that would clearly help a lesson but don't exist yet. Each entry names the
pure maths function a learner could implement first (in `src/widgets/<name>/model.ts`, with
colocated tests), plus acceptance tests in words. Nothing here is built yet.

## llm/speculative-decoding: draft-and-verify simulator

**Idea:** two rows of token chips. The drafter proposes k tokens; the target's picks appear
underneath; accepted chips turn green, the first rejection turns red and is replaced, the rest
fade out. Sliders for the acceptance rate α and draft length k show the expected tokens per
target pass, plus a "simulate 100 rounds" button with a histogram.

**Pure functions:**

- `verifyGreedy(draft: string[], target: string[]): { accepted: number; output: string[] }`:
  keeps the longest agreeing prefix of `draft`, then appends the target's token at the first
  disagreement (or the bonus token `target[k]` if all k agree; `target` has length k + 1).
- `acceptProbability(p: number, q: number): number`: `min(1, p / q)`.
- `residual(p: number[], q: number[]): number[]`: `max(0, p − q)` elementwise, normalised to sum
  to 1.
- `expectedTokensPerPass(alpha: number, k: number): number`: `(1 − α^(k+1)) / (1 − α)`, and
  `k + 1` when α = 1.

**Acceptance tests:**

1. `verifyGreedy(['Paris', '.', 'It', 'is'], ['Paris', '.', 'The', 'capital', 'x'])` returns
   `accepted: 2` and output `['Paris', '.', 'The']`.
2. When every draft matches, the output has k + 1 tokens (the bonus token is appended).
3. `acceptProbability(0.3, 0.6)` is 0.5 and `acceptProbability(0.6, 0.3)` is 1.
4. For random p and q, `min(p, q) + (1 − Σ min(p, q)) · residual(p, q)` equals p (within 1e-12):
   the output distribution is exactly the target's.
5. `expectedTokensPerPass(0.8, 4)` ≈ 3.3616, and `expectedTokensPerPass(0, k)` is 1 for any k.

## llm/distillation: temperature and soft-label explorer

**Idea:** a bar chart of a teacher's next-word probabilities with a temperature slider, next to a
student whose bars the learner drags. Live readouts show the hard-label loss and the soft-label
(distillation) loss, so the learner sees that an overconfident student wins on hard labels but
loses on soft ones.

**Pure functions:**

- `softmaxT(logits: number[], T: number): number[]`: `exp(z_i / T) / Σ_j exp(z_j / T)`,
  computed stably (subtract the max logit first).
- `crossEntropy(p: number[], q: number[]): number`: `−Σ p_i ln q_i` (natural log).
- `klDivergence(p: number[], q: number[]): number`: `Σ p_i ln(p_i / q_i)`, treating `0 · ln 0`
  as 0.

**Acceptance tests:**

1. `softmaxT([5, 3, 2, -1], 1)` ≈ `[0.842, 0.114, 0.042, 0.002]` and at T = 4 ≈
   `[0.434, 0.263, 0.205, 0.097]`.
2. For any logits and T > 0 the output sums to 1 and keeps the ranking of the logits.
3. `softmaxT([1000, 0], 1)` returns `[1, 0]` without overflowing to NaN.
4. `crossEntropy([0.6, 0.3, 0.1], [0.6, 0.3, 0.1])` ≈ 0.898 and
   `crossEntropy([0.6, 0.3, 0.1], [0.9, 0.05, 0.05])` ≈ 1.262.
5. `klDivergence(p, p)` is 0, and `klDivergence(p, q)` equals
   `crossEntropy(p, q) − crossEntropy(p, p)`.
