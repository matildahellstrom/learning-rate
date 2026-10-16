# Learning log

One short entry per step: what we built, the concepts behind it, and questions to explore.

---

## Step 0: Planning and repo setup (2026-10-12)

**Built:** An approved plan (`PLAN.md`), a git repository, `CLAUDE.md` for future AI sessions, this log, and a `.gitignore`.

**Concepts:**

- **Explore → plan → implement → verify.** We spent a whole session on the first two steps, with no code written. With an empty folder, "explore" meant interviewing you instead of reading code. Planning first is cheap; rewriting a wrong architecture is not.
- **CLAUDE.md** is loaded into every Claude Code session in this folder. It holds things that are _always_ true (commands, architecture rules, conventions) and should stay short (under ~200 lines). Anything needed only sometimes belongs in a skill instead. (This is also lesson material for the "Coding with AI" track.)
- **git basics.** `git init` creates a hidden `.git/` folder that records history. A _commit_ is a snapshot plus a message explaining why. `main` is the default branch name. `.gitignore` lists files git should never track, such as generated folders (`node_modules/`, `dist/`) and OS clutter (`.DS_Store`).

**Trade-offs:** CLAUDE.md lists commands that don't exist yet. That's fine because it says so, but it's a reminder that CLAUDE.md must be kept in sync with reality, or it misleads future sessions.

**Explore:**

1. Run `git log` and `git show --stat` after the first commit. What does a commit actually contain?
2. Read the "Extend Claude Code" docs (https://code.claude.com/docs/en/features-overview). Which of our CLAUDE.md rules would be better enforced by a _hook_, and why?

## Phase 0: Tooling scaffold (2026-10-12)

**Built:** A Vite + React + TypeScript project with oxlint, Vitest, Prettier, a GitHub Actions CI workflow, and one tested maths helper (`src/lib/math/clamp.ts`).

**Concepts:**

- **`package.json`** is the project's manifest. `dependencies` ship to the browser (React). `devDependencies` are only for building and checking (Vite, TypeScript, linters). `scripts` are named shortcuts: `npm run check` runs four tools in a row. `package-lock.json` records the _exact_ installed versions so everyone (and CI, via `npm ci`) gets an identical install.
- **Semantic versioning.** `^19.2.8` allows any 19.x.y ≥ 19.2.8 (no breaking changes, by convention). `~6.0.2` only allows 6.0.x, which is how we pin TypeScript.
- **Four kinds of checks, four kinds of mistakes.** The _type checker_ (`tsc`) catches wrong shapes of data. The _linter_ (oxlint) catches suspicious patterns, like a hook called conditionally or an image without alt text (the jsx-a11y rules). _Tests_ (Vitest) check that behaviour is correct. The _formatter_ (Prettier) ends style debates by deciding layout automatically.
- **Two tsconfigs.** `tsconfig.app.json` covers browser code in `src/` (DOM types). `tsconfig.node.json` covers `vite.config.ts`, which runs in Node. `tsconfig.json` just references both, and `tsc -b` builds them together.
- **ES modules.** `"type": "module"` means `import`/`export` everywhere. Vite serves them to the browser directly in dev and bundles them for production.
- **CI (continuous integration).** `.github/workflows/ci.yml` makes GitHub run the same checks on a clean machine on every push. "Works on my machine" is no longer enough.
- **Edge cases in tests.** `clamp` is tested inside, outside, _on_ the bounds, and with an invalid interval. Boundaries are where off-by-one bugs live.

**Trade-offs:** oxlint over ESLint (one fast dependency vs. a bigger ecosystem with type-aware rules). TypeScript 6.0 over 7.0 (mature tooling vs. a faster compiler). Vitest's default `node` environment for now: pure maths tests don't need a fake browser, so `jsdom` + Testing Library arrive only with the first component test.

**Explore:**

1. In `src/lib/math/clamp.ts`, change the return type to `string`. Run `npm run typecheck`, then `npm test`. Which tool complains, and why does the test still run?
2. Swap `Math.min` and `Math.max` in `clamp`. Which test fails first, and what does Vitest's diff tell you?
3. Open `.github/workflows/ci.yml`. Why does it use `npm ci` instead of `npm install`?

## Phases 1–8: The MVP, built in one go (2026-10-12)

You asked to be told when the first version was ready, so these phases were built back to back. This entry is longer than usual to make up for the step-by-step explanations you didn't get.

**Built:** The app shell (map, lesson player, profile), the MDX content pipeline, the game engine (XP, levels, stars, streaks with freezes, badges), two gradient descent playgrounds with challenges, the quiz, the full gradient descent lesson, 77 unit and component tests, and 4 Playwright journeys (run on a phone and a desktop) with axe accessibility scans. There is also a manual GitHub Pages deploy workflow.

**Decisions made for you** (all reversible; tell me if you'd choose differently):

| Decision point          | Chosen                                                  | Alternative                                                             |
| ----------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------- |
| Routing on GitHub Pages | Hash URLs (`#/learn/…`), zero server config             | 404.html redirect trick for clean URLs                                  |
| Quiz format             | Questions in the lesson frontmatter, validated with zod | `<Question>` components inline in the MDX                               |
| State management        | Hand-written store + `useSyncExternalStore` (no dep)    | zustand                                                                 |
| Map style               | Winding vertical path per track + an "Up next" card     | Node graph with prerequisite arrows                                     |
| XP curve                | Level L needs 50·L·(L−1) XP: 0, 100, 300, 600…          | Linear or exponential                                                   |
| Lesson stars            | ★ finish · ★ perfect quiz · ★ 3 stars in all challenges | Stars from quiz score only                                              |
| Mafs vs hand-rolled SVG | Mafs works with React 19; kept it                       | SVG fallback (still easy: the maths is separate from the drawing)       |
| Challenge fairness      | Start position fixed inside a challenge                 | Otherwise you could drag the ball to the bottom and "win" in 0 steps 😄 |

**Concepts worth knowing:**

- **Pure core, thin shell.** `applyAction(state, action, ctx)` in `src/game/engine.ts` contains every game rule but never touches the clock, storage or React. That's why it can be tested exhaustively. `store.ts` adds persistence, and `app/game.ts` plugs in the real date and localStorage. The same split exists between `model.ts` (maths) and the playground components (drawing).
- **`useSyncExternalStore`** is React's official way to subscribe to state that lives outside React (our store). React re-renders when the store says it changed.
- **`useEffectEvent`** (React 19.2): the Play loop's timer always calls the newest `step()` without restarting the effect on every render. Before this existed, people used refs for it.
- **Derived state beats synced state.** `isPlaying = playing && status === 'running'` is computed, not stored, so it can never disagree with reality. The linter flagged the earlier version that synced it with an effect.
- **Build time vs run time.** MDX, the `---` step splitter (a remark plugin that edits the Markdown syntax tree) and KaTeX all run during `npm run build`. The browser receives finished HTML for the maths, so no maths engine ships for lesson text.
- **Schemas at the boundary.** zod checks everything that comes from outside the code: lesson frontmatter, JSON data, and saved progress (which a user or an old version could have mangled). Inside, TypeScript types are trusted.
- **Versioned persistence.** Saved progress has `version: 1`. When its shape changes, a migration upgrades old saves instead of wiping them.
- **Dates for streaks** use the player's local calendar day, while day differences are computed in UTC so a daylight-saving change can't make a "day" 23 hours long.
- **Code splitting.** The lesson route is loaded with `lazy`, so Mafs (~90 kB gzipped) downloads only when you open a lesson.
- **Accessibility details** you can see in the code: focus moves to each new step and to quiz feedback; `aria-live` announces outcomes only (not every animation frame); sliders offer an alternative to dragging; colour is never the only signal (✓/✗ too); and every animation respects `prefers-reduced-motion`.
- **Property-based tests** (fast-check) throw hundreds of random inputs at a claim, e.g. "on the bowl, every η in (0, 1) converges from any start". This is closer to a maths proof than a handful of examples.

**Bugs the tools caught** (good examples of why each check exists):

1. axe: an `aria-label` on a plain `<div>` (not allowed), and low contrast in toasts while they faded in.
2. Playwright on a phone: the map was 70px wider than the screen, because a full-width row was shifted sideways instead of the node inside it.
3. TypeScript: `Set.delete` returns a boolean, but React cleanup functions must return nothing.
4. oxlint: `new Date()` during render (impure) and setState inside an effect.

**Your exercises** (the planned ✍️ tasks; the tests are already there to guide you):

1. Delete the bodies of `numericalDerivative` and `gradientStep` in `src/widgets/gradient-descent/model.ts`, then re-implement them until `npx vitest run src/widgets` passes.
2. Design your own XP curve in `src/game/levels.ts` (`xpForLevel` + `levelFromXp`). The property test checks your inverse is correct for every XP value.
3. Write a sixth quiz question in `content/en/ml/gradient-descent/index.mdx`. Then make a typo in the YAML on purpose and read the error `npm test` gives you.

**Explore:**

1. Why does η = 0.8 on the bowl converge _slower_ than η = 0.4, even though it's a bigger step? (Hint: |1 − 2η|.)
2. In the ravine, the best fixed learning rate isn't 2/κ but a bit less. Can you derive the optimum? (Hint: balance the two contraction factors |1 − η| and |1 − ηκ|.)
3. Open DevTools → Application → Local Storage and look at `learning-rate:game`. What happens if you corrupt it and reload?

## Naming, roadmap and going private (2026-10-12)

**Built:** Renamed the app to **Learning Rate**, added two tracks (Computer vision, Safety & interpretability) plus efficiency and eigenvalue/SVD lessons to the map as "coming soon", reordered the roadmap, removed personal details from the repo, and published it as a private GitHub repository with a fresh history.

**Concepts:**

- **Renaming is cheapest before launch.** The localStorage key changed from the old name to `learning-rate:game`. Since nobody has played the deployed app yet, no saved progress is lost. After launch, the same rename would need a migration that reads the old key.
- **Git history is permanent until rewritten.** Deleting a line from a file doesn't remove it from older commits, and every commit also records an author name and email. We started a fresh history and now commit as a GitHub _no-reply_ address, set in the repo's own git config (`git config user.email`), so the global setting is untouched.
- **Ignore files in layers.** `.claude/settings.local.json` was ignored only by a global ignore file on this one machine. The repo's own `.gitignore` now covers it everywhere.
- **Why install/export comes before the daily warm-up:** the warm-up makes saved progress more valuable, so the features that protect progress (installing the app, which shields it from Safari's 7-day cleanup, and export codes) come first.
- **Why Leitner boxes for the warm-up:** a question moves up a box when answered right and back to box 1 when wrong. Each box has a fixed interval. That's easy to reason about and test. SM-2 (Anki's algorithm) adapts intervals per question and is a good upgrade later.

**Explore:**

1. Run `git log --format='%an <%ae>'`. What would someone with access to the repo see?
2. Free GitHub Pages needs a public repo. What would you check before making it public? (Hint: the history, the content licence, and whether any lesson text is copied from somewhere.)

## Bug bash, round 1 (2026-10-13)

**Built:** Fixed 22 bugs a QA tester found by play-testing the app, each with a test that fails without the fix. They fell into a few families: things drawn on top of other things (the ball couldn't be dragged by its centre, toasts covered the controls), focus lost or stuck for keyboard users (quiz, Step/Play, route changes), progress lost (two tabs, one bad saved field, reload mid-lesson), layout at 320px and 200% text, and wording that didn't match what the app does ("try a bigger learning rate" when it was already too big, "1 days").

**Concepts:**

- **Stacking order and pointer events in SVG.** SVG has no `z-index`: whatever is drawn later is on top and gets the click. The orange "current position" dot was drawn after the draggable ball, so it swallowed the pointer. Fix: draw the interactive thing last, and give decorative shapes `pointer-events: none`. `document.elementFromPoint(x, y)` tells you who really receives a click.
- **Cross-tab storage.** Every tab has its own copy of the state in memory, but they share one `localStorage`. If each tab writes its whole snapshot, the last writer wins and erases the other tab's progress. Fix: read → apply → write on every action, and listen for the `storage` event, which the browser fires in the _other_ tabs when one of them writes.
- **Focus management when elements become disabled or disappear.** A focused button that becomes `disabled` (or is removed) drops focus to `<body>`, so a keyboard user has to start over from the top. Options: keep it focusable with `aria-disabled="true"` and ignore presses, or move focus somewhere sensible yourself (the next question, the new page's `<main>`). React may also _reuse_ a DOM node between two different buttons unless you give them different `key`s.
- **Defensive parsing and migrations.** Saved data comes from outside the code: old versions, other tabs, people editing DevTools. Validate it at the boundary (zod), salvage field by field instead of throwing everything away, never write `NaN`, keep a backup before repairing, and never overwrite data from a _newer_ version you don't understand.

**Explore:**

1. Open the lesson in two tabs, earn XP in one and watch the other tab's XP bar. Then comment out the `storage` listener in `src/app/game.ts`: what still works thanks to "read before write", and what doesn't?
2. In DevTools, focus the Step button with the keyboard, run `$0.disabled = true` in the console and check `document.activeElement`. Now try `$0.setAttribute('aria-disabled', 'true')` instead. What does a screen reader user hear in each case?

## UI glow-up (2026-10-13)

**Built:** A more game-like, colourful look: every track is a "world" with its own gradient, the map is a winding dotted road of 3D coins with a pulsing START node, the header is a HUD (level chip, shiny XP bar, streak flame), lessons have a glossy progress bar and bouncy quiz feedback, and finishing a lesson (or a three-star challenge) fires confetti. The mascot, Eta (η), is a little ball that rolls downhill, like gradient descent. The font is Nunito, a self-hosted variable font.

**Concepts:**

- **3D without images.** A box-shadow with no blur (`0 6px 0 darker`) draws a solid "ledge" under a button or coin. On `:active` the element moves down (`translateY(4px)`) while the ledge shrinks, so it looks pressed. A second, inset shadow (`inset 0 3px 0 rgb(255 255 255 / 0.2)`) adds a glossy top edge.
- **CSS custom properties per track.** React sets just `--track` and `--track-2` on each section (`style={{ '--track': 'var(--track-blue)' }}`), and one stylesheet themes every banner, coin and lesson accent from them. `color-mix(in srgb, var(--track) 55%, #000)` derives the darker ledge colour, so no extra tokens are needed.
- **Contrast on gradients.** axe can't measure text on a gradient (it reports "needs review", not a failure), so we check it ourselves: both gradient stops must pass 4.5:1 with the text colour. Every gradient also sets a solid `background-color` as a fallback.
- **Animate transform, not opacity.** Every keyframe that touches text uses only `transform` (scale, translate, rotate), so the text is always at full contrast, even mid-animation. Opacity animations are only used on decoration, such as the ring around the START node and the confetti.
- **Reduced motion in two layers.** Each component turns its own loops off under `prefers-reduced-motion: reduce`. A global rule in `global.css` then shortens any remaining animation to 0.01 ms, so everything snaps to its final, visible state. JavaScript effects check `matchMedia` too: confetti doesn't render, and the XP counter shows the final number straight away.
- **An SVG path that needs no measuring.** Each map row draws its own piece of the road, from its coin down to the next one. The SVG uses `viewBox="0 0 100 100"` with `preserveAspectRatio="none"`, so CSS can stretch it to any size (`height: calc(100% + gap)`). `vector-effect: non-scaling-stroke` keeps the dots round when it stretches. A dash array of `0.1 15` with round line caps turns a line into a row of dots.
- **Canvas for confetti.** About 100 small rectangles and dots get a velocity, gravity and spin, and are redrawn with `requestAnimationFrame` for under 3 seconds. The canvas has `pointer-events: none`, so it never blocks clicks, and accessibility checkers still "see" the text underneath.
- **Responsive without breakpoints.** The map's sideways swing is `clamp(0px, (100vw - 220px) / 2, 76px)`, so it shrinks on narrow phones. The old map was 42px wider than a 320px screen.

**Explore:**

1. In `MapPage.tsx`, remove `vectorEffect="non-scaling-stroke"` from the connector path. What happens to the dots on long, narrow segments, and why?
2. Open DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce" and finish a lesson. Which parts still feel rewarding without motion? What would you add (a sound? a bigger static badge?) for players who turn motion off?

## Bug bash, round 2 (2026-10-13)

**Built:** After the UI glow-up was merged, a re-test found 7 new bugs, all fixed with tests: Back on the "Lesson complete!" screen changed the URL but not the screen, "Review lesson" flashed the last step, the footer buttons, reward toast, map titles and completion screen broke at 200% text on small phones, screen readers heard the XP count-up start at "+0 XP", and a tab that couldn't save still celebrated rewards it then threw away. Two small extras: unearned stars are now hollow (☆), not just paler, and the hero's Start button gets a double focus ring that shows up on the gradient.

**Concepts:**

- **State that should live in the URL.** If a screen can be reached with Back/Forward, it belongs in the URL (`?step=done`), and the UI should be _derived_ from it. Keeping "finished" in component state next to a URL step meant two sources of truth that could disagree, and two updates (one instant, one through the router) that showed an in-between frame.
- **Test at 200% text, not just at narrow widths.** People who enlarge text get longer words than the screen is wide. `position: fixed` elements don't make the page scroll sideways, so overflow checks miss them: check their boxes directly. Fixes are usually `overflow-wrap: anywhere`, `flex-wrap: wrap`, sizes in `rem` and caps like `min(3.6rem, 18vw)`.
- **Accessible count-up animations.** Animated numbers are for eyes only: mark them `aria-hidden` and give screen readers the final value in a visually hidden span, or they hear "+0 XP".
- **Callback refs when the element can be swapped.** An effect that reads `ref.current` once keeps watching the first node it saw, even after React replaced it with a new one (the lesson header, after the completion screen). A callback ref runs for every new node, and in React 19 it can return a cleanup to disconnect the old observer.

**Explore:**

1. Set your browser's default font size to 200% and walk through a lesson. What else would you change?
2. Why does `?step=done` show the last step after a reload instead of the celebration? What would you need to store to show the celebration again?

## Habitz-style restyle (2026-10-16)

**Built:** A visual restyle after an inspiration image: a lavender backdrop with pages on white rounded "sheets", flat solid-purple buttons, grey filled quiz rows and inputs, a purple encouragement card on the map (streak/XP message, the next lesson, a link to your progress), lessons as bright gradient cards with a round tick indicator, a bottom tab bar with outline icons, and flat mascots (`Mascot.tsx`: simple shapes with dot eyes) on the map, profile tiles and locked badges. No game logic or saved state changed.

**Concepts:**

- **Dark ink on bright colours.** White text on bright orange, pink or teal fails WCAG AA (often under 3:1). Instead of darkening the colours until white passes, the cards keep the bright inspiration colours and use dark text (4.7–9:1). Check every gradient stop, not just the middle.
- **A backdrop that text never touches.** The lavender (#c4a6e8) gives 8.3:1 with the body text but only 3.8:1 with muted grey text. So only `--text`-coloured things sit on it directly (header, lesson top bar); everything else lives on a white sheet.
- **Tokens as the theme switch.** Every colour is a CSS custom property in `tokens.css`, so the dark theme is just a second set of values, and a component like `<Mascot colour="coral">` only sets `--body: var(--mascot-coral)`.
- **Visual order vs. reading order.** On the lesson cards the stars and minutes sit above the title visually (`order: -1`), but the title comes first in the DOM, so a link's accessible name starts with the lesson's name.

**Explore:**

1. The grey filled fields are only 1.1:1 against white. Why does that matter for WCAG 1.4.11 (non-text contrast), and how does the underline on the numeric quiz input address it?
2. Try the system font (`system-ui`) instead of Nunito in `--font`. Which feels closer to the inspiration, and what would you lose?

## First three maths lessons (2026-10-16)

**Built:** Lessons for Vectors & matrices, Dot product & cosine similarity, and Derivatives & the chain rule, written with the `write-lesson` skill: a claim sheet built from the primary sources first, then the text, then the checklist. Many published lessons already listed these three as prerequisites, so the maths track now opens with real lessons. Also a backlog entry for a dot-product widget.

**Concepts:**

- **Evergreen still needs sources.** Timeless maths doesn't go stale, but concrete numbers in it (the Transformer's 512-number vectors, GPT-3's 12,288) and attributions (King − Man + Woman ≈ Queen) are claims, and each one was checked against the paper's own text.
- **Write for the lessons that depend on you.** Later lessons already said "as in the vectors and matrices lesson" and "the dot product lesson covers this", so these lessons had to introduce the exact ideas those sentences promise (matrices as grids, cosine similarity as a normalised dot product).
- **Check the arithmetic by a second route.** Each chain-rule example is checked by nudging the input, which caught nothing here but would catch a slip in the rules.

**Explore:**

1. The dot product lesson divides by √d_k in a Deeper box. Simulate it: draw random vectors of size 4, 64 and 1024 and compare the spread of their dot products, with and without the scaling.
2. Which quiz question in these lessons could a learner answer without understanding the idea? How would you rewrite it?

## Maths lessons 4–6 (2026-10-16)

**Built:** Lessons for Gradients, Exponentials, logs & softmax, and Probability & Bayes, written with the `write-lesson` skill. The gradients lesson reuses the ravine widget with `kappa={1}` (a round bowl) to show the path heading straight for the bottom, as a contrast to the stretched valley in the gradient descent lesson.

**Concepts:**

- **Sources you can't read don't get cited.** Gigerenzer & Hoffrage's natural-frequency paper and Bayes' 1763 essay both block automated fetching, and the Khan Academy and PyTorch pages render with JavaScript, so none of them could be checked. The lessons use made-up numbers (labelled as such) for the medical-test example instead.
- **Illustrative numbers stay illustrative.** 3Blue1Brown's 40% and 10% in the Steve example are gut guesses, not data, and the lesson says so; only the 20-to-1 ratio comes from Kahneman and Tversky.
- **Run the arithmetic, don't trust it.** The softmax values, the 10⁻⁴⁰⁰ underflow and the e¹⁰⁰⁰ overflow were all checked in Python before going into the text.

**Explore:**

1. The softmax lesson says only the gaps between scores matter. Prove it for two scores: show that softmax([a, b]) depends only on a − b. Which familiar S-shaped function do you get?
2. In the odds form of Bayes, two positive tests multiply the odds by 9 twice. Why would that overstate the evidence if both tests tended to fail on the same people?

## Maths lessons 7–9 (2026-10-16)

**Built:** Lessons for Entropy & cross-entropy, Eigenvalues & eigenvectors, and SVD & low-rank approximation, written with the `write-lesson` skill. This finishes the maths track: it has no upcoming lessons left. The eigenvalues lesson reuses the ravine widget with `kappa={10}`, because that valley's Hessian has eigenvalues 1 and 10, so the condition number shows up on screen.

**Concepts:**

- **The renderer limits the writing.** The MDX pipeline has no GFM plugin, so Markdown tables don't render. The code-length and loss tables became bullet lists instead of a new dependency.
- **Rebuild an example, then check it against the source's numbers.** Olah's essay gives only the totals (1.75 bits, 2.25 bits), so the lesson writes out frequencies that reproduce both and uses them for the reverse direction (2.375 bits). That shows KL isn't symmetric without claiming a number the essay doesn't give.
- **A dead link gets swapped for a primary source that works.** The PageRank tech report's server returned an error page, so the lesson cites Brin & Page's 1998 paper, which states the eigenvector link in its own words.

**Explore:**

1. Run power iteration by hand on the matrix with rows [2, 1] and [1, 2], starting from [1, 0]. After how many steps is the angle to [1, 1] under 1°? How would that change if the eigenvalues were 3 and 2.9?
2. Take a small greyscale image as a matrix, compute its SVD with NumPy, and plot the singular values. At what rank does the picture stop looking blocky?
