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

## llm/lora: low-rank update explorer

**Idea:** a small heatmap of a "true" fine-tuning update ΔW next to its rank-r approximation B·A,
with a rank slider. Readouts show trainable numbers (r·(d + k) versus d·k) and the approximation
error, so the learner sees how a few ranks capture most of a structured update. A second mode
lets the learner edit a column B and a row A by hand and watch the rank-1 product.

**Pure functions:**

- `outer(b: number[], a: number[]): number[][]`: the rank-1 matrix with entries `b_i · a_j`.
- `loraParamCount(d: number, k: number, r: number): { full: number; lora: number; ratio: number }`:
  `full = d·k`, `lora = r·(d + k)`, `ratio = full / lora`.
- `lowRankApprox(M: number[][], r: number): number[][]`: the best rank-r approximation via the
  top r singular values/vectors (power iteration with deflation is enough for small matrices).

**Acceptance tests:**

1. `outer([1, 2, 0], [1, 0, -1])` equals `[[1, 0, -1], [2, 0, -2], [0, 0, 0]]`.
2. `loraParamCount(4096, 4096, 8)` gives full 16,777,216, lora 65,536 and ratio 256.
3. For a matrix built as the sum of two outer products, `lowRankApprox(M, 2)` reproduces M within
   1e-9 and `lowRankApprox(M, 1)` does not.
4. The Frobenius error of `lowRankApprox(M, r)` never increases as r grows, and is 0 at full rank.

## llm/quantization: rounding-grid explorer

**Idea:** a row of draggable weights on a number line with the quantization grid drawn
underneath. Sliders for bit-width (2–8) and group size; each weight shows an arrow to where it
lands after rounding, with the error. Dragging one weight far out (an outlier) visibly stretches
the grid and snaps its neighbours to zero, and shrinking the group size rescues them. Readouts
show bits per weight including the scale overhead and the memory for a chosen model size.

**Pure functions:**

- `quantizeSymmetric(weights: number[], bits: number): { scale: number; q: number[]; dequant: number[]; maxError: number }`:
  `scale = max|w| / (2^(bits−1) − 1)`, `q_i = round(w_i / scale)`, `dequant_i = scale · q_i`.
- `quantizeGrouped(weights: number[], bits: number, groupSize: number)`: applies
  `quantizeSymmetric` to consecutive groups and concatenates the results.
- `bitsPerWeight(bits: number, groupSize: number, scaleBits: number): number`:
  `bits + scaleBits / groupSize`.
- `weightMemoryGB(params: number, bitsPerWeight: number): number`: `params · bitsPerWeight / 8 / 1e9`.

**Acceptance tests:**

1. `quantizeSymmetric([0.5, -1.27, 0.03, 0.9], 8)` gives scale 0.01, q `[50, -127, 3, 90]` and
   dequantized values equal to the input within 1e-12.
2. `quantizeSymmetric([0.5, -1.27, 0.03, 0.9], 4)` gives q `[3, -7, 0, 5]`, and every
   `|w − dequant|` is at most `scale / 2`.
3. `quantizeSymmetric([0.1, -0.2, 0.15, 10], 4).q` is `[0, 0, 0, 7]`, while
   `quantizeGrouped` with group size 2 keeps 0.1 and −0.2 non-zero (the 0.15, which shares a
   group with the 10, still rounds to 0).
4. An all-zero group returns zeros without dividing by zero.
5. `bitsPerWeight(4, 32, 8)` is 4.25 and `weightMemoryGB(13e9, 4)` is 6.5.

## llm/reasoning-models: vote-and-group simulator

**Idea:** two small panels. "Vote": sliders for per-sample accuracy p and number of samples n,
with a chart of majority-vote accuracy against n and a "sample once" button that draws n coloured
answer chips and shows the plurality. "Group": toggle four to eight attempts between correct and
wrong and watch each attempt's GRPO advantage bar grow or shrink.

**Pure functions:**

- `majorityAccuracy(p: number, n: number): number`: probability that more than half of n
  independent samples are correct (n odd): `Σ_(k > n/2) C(n, k) p^k (1 − p)^(n − k)`.
- `grpoAdvantages(rewards: number[], eps = 1e-8): number[]`: `(r_i − mean) / (std + eps)`, using
  the population standard deviation; all zeros when every reward is equal.
- `plurality(answers: string[]): string | null`: the most common answer, `null` on a tie for first.

**Acceptance tests:**

1. `majorityAccuracy(0.8, 3)` ≈ 0.896 and `majorityAccuracy(0.6, 3)` ≈ 0.648.
2. `majorityAccuracy(p, 1)` equals p, and for p = 0.5 the result is 0.5 for every odd n.
3. `grpoAdvantages([1, 0, 0, 1])` ≈ `[1, -1, -1, 1]`; `grpoAdvantages([1, 1, 1])` is `[0, 0, 0]`.
4. `plurality(['42', '42', '17', '42', '40'])` is `'42'`; `plurality(['a', 'b'])` is `null`.

## llm/fine-tuning-rlhf: be the reward model

**Idea:** the learner sees pairs of short answers, picks the better one, and watches a tiny reward
model (one score per answer) update after each choice. Two draggable score sliders show
P(A preferred) as a sigmoid curve with the current gap marked, and the loss for the learner's
choice. A second panel plots "proxy reward" against "true quality" as optimisation pressure grows,
to show Goodhart's law.

**Pure functions:**

- `sigmoid(x: number): number`: `1 / (1 + e^(−x))`, stable for large |x|.
- `preferenceProbability(rA: number, rB: number): number`: `sigmoid(rA − rB)`.
- `preferenceLoss(rChosen: number, rRejected: number): number`: `−ln sigmoid(rChosen − rRejected)`,
  computed stably (softplus of the negative gap).
- `updateScores(scores: number[], chosen: number, rejected: number, lr: number): number[]`: one
  gradient step on `preferenceLoss`, raising the chosen score and lowering the rejected one by
  `lr · (1 − sigmoid(gap))`.

**Acceptance tests:**

1. `preferenceProbability(2, 0)` ≈ 0.881 and `preferenceProbability(1, 1)` is 0.5.
2. `preferenceLoss(2, 0)` ≈ 0.127 and `preferenceLoss(0, 2)` ≈ 2.127.
3. `preferenceLoss(1000, 0)` is about 0 and `preferenceLoss(0, 1000)` is about 1000, with no
   `Infinity` or `NaN`.
4. After `updateScores`, the chosen score rose by exactly as much as the rejected one fell, and
   other scores are unchanged.

## ml/regression: drag-the-line fitter

**Idea:** a scatter plot of the café data (temperature against iced coffees sold) with a line the
learner drags by two handles. Residuals are drawn as vertical bars, and their squares as little
squares, so the MSE readout is literally the total area. A "best fit" button snaps to the
least-squares line; a draggable extra point shows how one outlier pulls the slope.

**Pure functions:**

- `predict(w: number, b: number, x: number): number`: `w · x + b`.
- `residuals(points: [number, number][], w: number, b: number): number[]`: `y − predict(w, b, x)`
  for each point.
- `mse(points: [number, number][], w: number, b: number): number`: the mean of the squared
  residuals.
- `fitLeastSquares(points: [number, number][]): { w: number; b: number }`:
  `w = Σ(x − x̄)(y − ȳ) / Σ(x − x̄)²`, `b = ȳ − w · x̄`; throws if every x is the same.

**Acceptance tests:**

1. For `[[15, 20], [20, 35], [25, 40], [30, 55]]`, `fitLeastSquares` gives w = 2.2 and b = −12
   (within 1e-9), and `mse` at that line is 5.
2. `mse` for the same points with w = 2, b = −10 is 12.5, and with w = 0, b = 37.5 it is 156.25.
3. The residuals of the least-squares line sum to 0 (within 1e-9) for random points.
4. The fitted line passes through (x̄, ȳ).
5. Changing the last point to `[30, 95]` gives w = 4.6.

## ml/loss-functions: loss explorer

**Idea:** five draggable data points on a number line and one draggable guess. Side-by-side
curves show squared, absolute, Huber and pinball loss of the guess, each with its minimum marked,
so the learner sees the mean, median and quantile appear as the best guesses. Dragging one point
far away moves the mean marker but not the median.

**Pure functions:**

- `squaredLoss(y: number[], c: number): number`, `absoluteLoss(y: number[], c: number): number`:
  the mean squared and mean absolute miss of the constant guess `c`.
- `huber(z: number, eps: number): number`: `z²` if `|z| < eps`, otherwise `2·eps·|z| − eps²`.
- `pinball(y: number[], c: number, alpha: number): number`: the mean of
  `alpha · max(y − c, 0) + (1 − alpha) · max(c − y, 0)`.
- `bestConstant(y: number[], loss: (y: number[], c: number) => number): number`: a numeric search
  for the minimising `c` (golden-section search between min(y) and max(y) is enough).

**Acceptance tests:**

1. For `[200, 210, 220, 230, 1000]`, `bestConstant` with `squaredLoss` is 372 and with
   `absoluteLoss` is 220 (within 1e-6).
2. `huber` is continuous at `|z| = eps` and equals `z²` below it; `huber(10, 1)` is 19.
3. `pinball(y, c, 0.5)` is half of `absoluteLoss(y, c)` for any `y` and `c`.
4. For `y = [1, 2, …, 100]` the minimiser of `pinball` with alpha 0.75 is between 75 and 76.

## vision/images-as-tensors: pixel and channel explorer

**Idea:** a small photo next to a zoomed 8 × 8 patch showing each pixel's numbers. Toggles show
the red, green and blue channels on their own, and a layout switch shows the same values as
(H, W, C) and (C, H, W). Three sliders mix one RGB pixel and show its colour live.

**Pure functions:**

- `shapeOf(height: number, width: number, channels: number, layout: 'HWC' | 'CHW'): number[]`
- `toCHW(hwc: number[], height: number, width: number, channels: number): number[]`: reorders a
  flat channels-last array into channels-first.
- `normalise(value: number, mean: number, std: number): number`: `(value / 255 − mean) / std`.

**Acceptance tests:**

1. `shapeOf(224, 224, 3, 'CHW')` is `[3, 224, 224]` and `'HWC'` gives `[224, 224, 3]`.
2. For a 1 × 2 image stored channels-last as `[255, 0, 0, 0, 0, 255]` (a red pixel, then a blue
   one), `toCHW` returns `[255, 0, 0, 0, 0, 255]` read as R `[255, 0]`, G `[0, 0]`, B `[0, 255]`.
   For a 1 × 2 image `[10, 20, 30, 40, 50, 60]` it returns `[10, 40, 20, 50, 30, 60]`.
3. `toCHW` followed by its inverse returns the original array for random inputs.
4. `normalise(200, 0.485, 0.229)` ≈ 1.307.
