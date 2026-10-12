# PLAN: "Learning Rate", a playful learning app for AI coding + ML theory

_(Originally "Level Up AI"; renamed to Learning Rate in round 2.)_

**Status (2026-10-12):** Phases 0–8 are done (MVP built and tested). The code lives in a private GitHub repo. Deploying (Phase 9) needs the repo to be public, or GitHub Pro, so that decision comes later. Decisions taken along the way are logged in LEARNING.md.

## Context

The project folder started empty. We're building a free, static, shareable web app that teaches two things:

1. **Coding effectively with AI**: prompting, context, Claude Code workflows, CLAUDE.md, skills, subagents, hooks, MCP.
2. **The maths and theory behind ML and modern AI**, from linear algebra up to LLMs and agentic systems.

It's for its author, a maths-strong developer who is new to frontend, and their friends (mixed backgrounds, some complete beginners). The project is also a learning vehicle: every step gets explained, logged in LEARNING.md, and the author implements small, well-scoped pieces.

**Decisions from the interview**

| Topic             | Decision                                                                                                                          |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Look & feel       | **Game-like**: bold colours, level map, XP bar, challenge cards                                                                   |
| Gamification      | **Full**: XP, levels, streaks, badges, stars per lesson                                                                           |
| Structure         | **Level map with soft prerequisites** (recommended path, nothing locked)                                                          |
| Track after MVP   | **LLMs**                                                                                                                          |
| Social            | **Shareable result card** (image/link for group chats), no backend                                                                |
| Language          | **English, i18n-ready** (a second language can be added without restructuring)                                                    |
| Usage             | **Short sessions on phones**: small steps, touch-first visuals                                                                    |
| Your coding share | **Mostly me**: you get occasional small, focused tasks (mainly the pure maths functions + their tests) and focus on understanding |
| Your experience   | New to frontend → explanations start from fundamentals                                                                            |
| Hosting           | **GitHub Pages** via GitHub Actions                                                                                               |
| Stack             | **Vite + React + TypeScript + MDX**                                                                                               |
| Visuals           | **Maths library (Mafs)** for plots; plain React/HTML/SVG for non-plot visuals (token chips, heatmaps)                             |
| Styling           | **Plain CSS Modules + CSS variables** (design tokens)                                                                             |

Environment checked: Node 24.3, npm 11.4, git 2.55 and gh 2.99 are installed. We use npm.

---

## Tech stack, explained

- **Vite**: the dev server and bundler. `npm run dev` gives instant reloads, and `npm run build` turns everything into static files in `dist/` that GitHub Pages serves. (Latest major appears to be Vite 8, Mar 2026; confirm with `npm view vite version` at setup.)
- **React + TypeScript**: React builds the UI from components (functions that return markup). TypeScript adds types, so mistakes like passing a string where a number is expected fail before you run anything.
- **MDX**: Markdown that can embed React components. A lesson is mostly prose, with `<GradientPlayground />` dropped in where the interaction goes. Components are provided globally, so lesson authors never import anything.
- **Single-page app (SPA)**: the browser loads one HTML page, and React swaps views as you navigate. Simple for game state, which lives in one place. The cost is that GitHub Pages needs a routing workaround (see Phase 1 decision).

### Dependencies (each explained when added; nothing is added without asking)

| Package                                                                                                                                                      | Why                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| `react`, `react-dom`                                                                                                                                         | UI library                                                                  |
| `react-router`                                                                                                                                               | Maps URLs to screens (map, lesson, profile)                                 |
| `@mdx-js/rollup`, `@mdx-js/react`                                                                                                                            | Compiles `.mdx` lessons at build time                                       |
| `remark-frontmatter`, `remark-mdx-frontmatter`                                                                                                               | Reads the metadata block at the top of each lesson                          |
| `remark-math`, `rehype-katex`, `katex`                                                                                                                       | Renders LaTeX maths (`$\nabla f$`) in "Go deeper" sections                  |
| `zod`                                                                                                                                                        | Schemas that validate lesson frontmatter, quizzes and saved progress        |
| `mafs`                                                                                                                                                       | Interactive maths plots with draggable points (maintenance risk, see Risks) |
| `zustand` (decision point, Phase 6)                                                                                                                          | Tiny global store with localStorage persistence for game state              |
| `gpt-tokenizer` (LLM phase, lazy-loaded)                                                                                                                     | Real BPE tokeniser running fully in the browser, no API key                 |
| Dev: `typescript` (~6.0), `vitest`, `oxlint` (react, jsx-a11y, vitest plugins), `prettier`; `@testing-library/react` + `jsdom` with the first component test | Type checking, tests, linting (including accessibility lint), formatting    |
| Dev, later: `@playwright/test`, `@axe-core/playwright`, `fast-check`                                                                                         | End-to-end + automated accessibility checks; property-based tests for maths |

---

## Architecture

```
/
├─ content/                    # ALL lesson content; add lessons without touching src/
│  └─ en/                      # one folder per language → i18n-ready
│     ├─ tracks.json           # track list, colours, order, map layout
│     ├─ badges.json           # badge definitions (rule type + params), data not code
│     └─ ml/gradient-descent/
│        └─ index.mdx          # frontmatter + steps + widgets + quiz
├─ src/
│  ├─ app/                     # App root, routes, layout: the "shell" that frames every screen
│  ├─ content/                 # loader (import.meta.glob), zod schemas, remark plugins: turns files into typed lesson data
│  ├─ components/              # reusable lesson UI (Step, Deeper, Quiz, Challenge, Hint): what MDX authors use
│  ├─ widgets/<name>/          # one folder per interactive: model.ts (pure maths) + View.tsx + model.test.ts
│  ├─ lib/math/                # shared pure maths (vectors, numeric derivatives, softmax) so widgets don't duplicate it
│  ├─ game/                    # XP, levels, streaks, badges, persisted store: game rules as pure, tested functions
│  ├─ i18n/                    # UI strings (en.ts) + t(): no hard-coded UI text, so translation is a drop-in
│  └─ styles/                  # tokens.css (colours/spacing/radii, light+dark), global.css: one source of visual truth
├─ tests/e2e/                  # Playwright journeys + axe accessibility scans
├─ .github/workflows/          # ci.yml (lint/types/tests on every push), deploy.yml (Pages)
├─ CLAUDE.md  LEARNING.md  PLAN.md  README.md
```

**Key patterns**

- **Model / view split.** Every widget's maths lives in a React-free `model.ts`, so it's trivially testable and it's where your tasks live. The `.tsx` view only draws and handles input.
- **Lessons are data.** The loader globs `content/<locale>/**/index.mdx`, validates frontmatter with zod, and builds the level map from `tracks.json` + `prerequisites`. A content test fails the build on a missing source, a broken prerequisite id or an invalid quiz.
- **Phone-first steps.** A lesson is a sequence of small cards. Authors separate steps with `---` in Markdown, and a small custom remark plugin splits them (you'll learn how Markdown → AST → React works).
- **Two depths.** Each step has an intuitive layer. `<Deeper>` (built on accessible `<details>`) holds the real maths in KaTeX.
- **Widgets report events** (`onEvent({type: "reachedMinimum", steps: 7})`). `<Challenge>` listens and awards stars, so game logic never lives inside widgets.
- **Game state** is one versioned object `{version, xp, completed, stars, streak, badges, lastActive}` validated by zod on load, with a migration function per version bump.

**Lesson frontmatter (validated)**

```yaml
id: gradient-descent
title: Gradient descent
track: ml
order: 3
prerequisites: [derivatives]
minutes: 8
xp: 100
volatility: evergreen # or fast-moving → requires lastVerified
lastVerified: 2026-10-12
sources:
  - title: '...'
    url: 'https://...'
```

---

## Curriculum (refined)

Each topic is tagged **[E] evergreen** or **[F] fast-moving**. [F] lessons must be web-verified when written and carry `lastVerified` + source links. Additions to your list are marked ➕.

**Maths foundations**: vectors & matrices · ➕ dot product & cosine similarity (needed for embeddings/attention) · ➕ matrix multiplication as transformation · derivatives & chain rule · gradients · probability & Bayes · ➕ exponentials, logs & softmax · ➕ entropy & cross-entropy (the LLM loss) · optimisation [all E]

**Machine learning**: regression · ➕ classification & logistic regression · loss functions · gradient descent (★ MVP) · ➕ SGD, momentum & Adam · neural networks · backpropagation · overfitting, ➕ regularisation & train/val/test splits · evaluation [all E]

**LLMs**: ➕ next-token prediction & pretraining [E] · tokenisation [E] · embeddings [E] · attention & transformers, ➕ positional encoding [E] · sampling & temperature [E] · context windows, ➕ KV cache [E/F] · fine-tuning & RLHF, ➕ RLAIF/DPO [F] · ➕ reasoning models & test-time compute [F] · ➕ mixture of experts, multimodality [F] · ➕ scaling laws [F]

**Coding with AI**: prompting · context management & ➕ context engineering · explore → plan → implement → verify · ➕ tests as the agent's feedback loop · CLAUDE.md & ➕ `.claude/rules/` · skills · subagents · hooks (➕ "guardrails belong in hooks, not prompts") · MCP · ➕ plugins · ➕ output styles · ➕ permission modes & safety · ➕ parallel agents/worktrees [mostly F]. Verified against the current Claude Code "Extend Claude Code" docs ([code.claude.com/docs/en/features-overview](https://code.claude.com/docs/en/features-overview)): CLAUDE.md for always-on rules (<200 lines), skills on demand, subagents isolate context, hooks are deterministic, MCP connects external services, plugins package it all.

**Agentic AI & engineering**: tool use · ➕ structured outputs · agent loops · RAG · evals & ➕ LLM-as-judge · MCP · skills · subagents & ➕ multi-agent orchestration · prompt caching · guardrails & ➕ prompt injection · ➕ computer use [mostly F]

---

## Phases

Each phase fits one session and follows the same rhythm: a short "what & why" before → build → concept explanation + trade-offs after → your task (if any) → review → LEARNING.md entry → small commits. **Decision points** are where I'll stop and give you 2-3 options.

### MVP: app shell + one polished lesson (Gradient descent)

| #   | Build                                                                                                                                                            | You'll learn                                                                                       | Your task                                                                         | Decision point                                                     |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 0   | `git init`, save PLAN/CLAUDE/LEARNING.md, Vite scaffold, TS strict, oxlint, Prettier, Vitest, CI workflow                                                        | npm & package.json, ES modules, tsconfig, what lint/types/tests each catch, CI                     | Run the scripts, break a type on purpose, read the errors                         | Commit message style (Conventional Commits vs free-form)           |
| 1   | App shell: layout, routes (map / lesson / profile), design tokens, light+dark, bottom nav for phones                                                             | Components, props, JSX, CSS variables, mobile-first CSS, semantic HTML & focus                     | Pick the colour palette (contrast-checked)                                        | **Routing on GitHub Pages**: HashRouter vs 404.html redirect trick |
| 2   | Content pipeline: MDX, frontmatter + zod, glob loader, KaTeX, `---` step splitter, `<Deeper>`, content-validation test                                           | Build time vs run time, ASTs & remark plugins, schemas                                             | Write a tiny placeholder lesson in MDX                                            | Quiz format: inline MDX components vs a separate `quiz.json`       |
| 3   | Gradient descent **model**: test functions (bowl, ravine, double-well), analytic + numeric gradients, step, divergence detection                                 | Finite differences, floating-point error, TDD, property-based tests                                | ✍️ Implement `numericalGradient` (central difference) + `gradientStep` with tests | —                                                                  |
| 4   | Gradient **playground** with Mafs: drag the start point, learning-rate slider, play/step/reset, path trail, loss readout                                         | React state & effects, `requestAnimationFrame`, pointer + keyboard input, `prefers-reduced-motion` | Tune the "ravine" so lr matters visibly                                           | Mafs vs hand-rolled SVG fallback if Mafs fails on React 19         |
| 5   | `<Quiz>` (MCQ, numeric-answer, "predict what happens") and `<Challenge>` wired to widget events                                                                  | Controlled inputs, accessible forms, `aria-live` feedback                                          | Write the 4-5 quiz questions                                                      | —                                                                  |
| 6   | Game engine: XP, level curve, stars, streak (with a "freeze" so it isn't stressful), badge rules, persisted versioned store                                      | localStorage, schema migrations, date/timezone pitfalls, pure-function design                      | ✍️ Implement `levelFromXp` (your choice of curve) + tests                         | **State**: zustand vs React context + `useSyncExternalStore`       |
| 7   | Level map (tracks, nodes, soft-prereq hints), XP bar, reward animations (respecting reduced motion), profile/badges screen                                       | SVG layout, CSS animations, accessibility of motion                                                | —                                                                                 | Map style: vertical path vs node graph                             |
| 8   | Write the real gradient-descent lesson (intuition → interactive → maths → challenge → quiz), polish, Playwright smoke test + axe scan, keyboard-only walkthrough | Writing for two depths, e2e testing, WCAG contrast/keyboard                                        | Review the maths layer for correctness                                            | —                                                                  |
| 9   | Deploy to GitHub Pages via Actions, README with link                                                                                                             | Static hosting, base paths, Actions workflows, caching                                             | Share with 2 friends, collect feedback                                            | Repo public or private                                             |

**MVP done** = a friend opens the link on their phone, completes Gradient descent, earns XP, stars and a badge, and their progress survives a reload.

### Later phases (updated in round 2)

| #   | Build                                                                                                                                                                                                                                                                                                                           | You'll learn                                                         | Your task                                                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 9   | Deploy: the private `learning-rate` repo exists; free GitHub Pages needs it public (or GitHub Pro), then run the manual Pages workflow                                                                                                                                                                                          | Static hosting, Actions, Pages settings                              | Run the first deploy yourself                                      |
| 10  | **Installable app + offline**: web manifest, icons, service worker (decision: `vite-plugin-pwa` vs hand-written), install prompt on the profile page, storage-persistence status                                                                                                                                                | Service workers, caching strategies, PWA install flow, Safari quirks | Write the manifest                                                 |
| 11  | **Progress export/import**: "Copy progress code" (base64url JSON) and "Paste code" on the profile page, validated with `gameStateSchema` + `migrate`, confirm before overwriting                                                                                                                                                | Encoding, Clipboard API, validating untrusted input                  | ✍️ `encodeProgress`/`decodeProgress` + round-trip property test    |
| 12  | **Daily warm-up**: Leitner boxes (1, 2, 4, 8, 16 days) over quiz questions from finished lessons; up to 3 due a day; +5 XP each; counts for the streak. First real state migration (`GAME_STATE_VERSION` 2)                                                                                                                     | Spaced repetition, migrations, scheduling with dates                 | ✍️ `nextBox(box, correct)` and `dueItems(state, today)` with tests |
| 13  | Shareable result card: `<canvas>` → PNG, Web Share API with download fallback                                                                                                                                                                                                                                                   | Canvas 2D, Blob/File APIs, progressive enhancement                   | Design the card layout                                             |
| 14  | Prereqs: dot product & cosine similarity, softmax & temperature (sampling playground)                                                                                                                                                                                                                                           | Numerical stability, probability as a UI                             | ✍️ Stable softmax via log-sum-exp + tests                          |
| 15  | Tokenisation: live tokeniser (lazy-loaded `gpt-tokenizer`) + toy BPE trainer                                                                                                                                                                                                                                                    | Code-splitting, the BPE algorithm                                    | ✍️ One BPE merge step                                              |
| 16  | Embeddings: small precomputed 2D embedding map, nearest neighbours                                                                                                                                                                                                                                                              | PCA, build-time data scripts                                         | ✍️ Cosine nearest-neighbour search                                 |
| 17  | Attention: editable Q/K/V, live heatmap, causal mask toggle                                                                                                                                                                                                                                                                     | Scaled dot-product attention                                         | ✍️ `attention(Q,K,V)` + tests                                      |
| 18  | Transformers, positional encoding, context windows & KV cache                                                                                                                                                                                                                                                                   | Architecture-level reasoning                                         | Quiz writing                                                       |
| 19  | Fine-tuning, RLHF/DPO, reasoning models [F]: web-verified                                                                                                                                                                                                                                                                       | Reading primary sources                                              | Source review                                                      |
| 20+ | Efficiency lessons in the LLM track (quantization, LoRA, distillation, speculative decoding) [F]; Maths additions (eigenvalues, SVD); **Computer vision** track (convolutions, CNNs, ViTs, CLIP, diffusion); **Safety & interpretability** track [F]; Coding-with-AI track (scenario challenges); Agents track; second language | Per lesson                                                           | Per lesson                                                         |

---

## Project CLAUDE.md (written in Phase 0)

```markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static, game-like learning app (AI coding + ML/AI theory). Vite + React + TypeScript + MDX, deployed to GitHub Pages. No backend, no API keys, progress in localStorage. See PLAN.md for roadmap.

## Commands

- `npm run dev`: dev server
- `npm run build`: type-check + production build to dist/
- `npm run preview`: serve the built site locally
- `npm test`: Vitest (unit + content validation) · single file: `npx vitest run src/widgets/gradient-descent/model.test.ts` · by name: `npx vitest run -t "numericalGradient"`
- `npm run lint` · `npm run typecheck` · `npm run format`
- `npm run e2e`: Playwright + axe (needs `npm run build` first)

## Architecture

- content/<locale>/: all lesson text. Never put lesson copy in src/. Lessons are auto-discovered; frontmatter is validated by src/content/schema.ts.
- src/widgets/<name>/: model.ts is pure, React-free maths with colocated tests; the .tsx view only renders and handles input. Widgets emit events; <Challenge> and src/game/ turn them into rewards.
- src/game/: game rules are pure functions; the persisted state is versioned. Changing its shape requires bumping the version and adding a migration + test.
- UI strings go through t() in src/i18n/.

## Conventions

- Fast-moving lessons (volatility: fast-moving) must be verified with web search when written and include sources + lastVerified.
- Every interactive is keyboard-operable, labelled, colour-contrast-safe (use tokens from src/styles/tokens.css) and respects prefers-reduced-motion.
- Ask before adding a dependency, and explain why.
- Small commits; run lint, typecheck and test before committing.

## Teaching workflow (this is also a learning project)

- Before each step: a few sentences on what and why. After: key concepts and trade-offs.
- At real design decisions, offer 2-3 options and let the user choose.
- Leave small, scoped tasks marked `// TODO(you):` with a failing test; review the solution when done.
- Append one short entry per step to LEARNING.md: built / concepts / questions to explore.
```

**LEARNING.md entry format**

```markdown
## Phase 3: Gradient descent model (2026-10-xx)

**Built:** ... **Concepts:** ... **Trade-offs:** ... **Explore:** 1. ... 2. ...
```

---

## Risks

1. **Mafs maintenance.** Its last activity found was Mar 2025, and React 19 support is unconfirmed. _Mitigation:_ check peer deps in Phase 4. Widgets use the model/view split, so swapping to hand-rolled SVG only touches views.
2. **Safari deletes localStorage** after ~7 days without a visit (ITP), which breaks streaks and progress for iPhone friends. _Mitigation:_ call `navigator.storage.persist()`, suggest "Add to Home Screen" (exempt), and add progress export/import later.
3. **Fast-moving content goes stale.** _Mitigation:_ the `volatility` + `lastVerified` frontmatter, plus a CI warning when [F] lessons are older than ~90 days.
4. **Gamification can feel like pressure** (streak anxiety). _Mitigation:_ streak freezes, no penalties, and XP for partial progress.
5. **Bundle size.** Tokeniser vocab is ~MBs, KaTeX fonts are heavy. _Mitigation:_ lazy-load per lesson.
6. **Scope creep** across 5 tracks. _Mitigation:_ finish the MVP before anything else; one lesson per later session.
7. **MDX authoring friction for non-coders** (a stray `<` breaks the build). _Mitigation:_ clear build errors plus a lesson template.

## Open questions

- App name (and repo name, which becomes part of the GitHub Pages URL)
- Public or private repo? Content licence (e.g. CC BY 4.0 for lessons, MIT for code)?
- Should friends be able to contribute lessons via pull requests later?
- XP curve and badge list: we design these together in Phase 6.

## Verification

- Every phase: `npm run lint && npm run typecheck && npm test` passes. CI runs the same on push.
- Maths: unit tests compare analytic and numeric gradients, check convergence on convex functions for small lr, and check divergence detection for large lr.
- MVP: Playwright journey (open map → finish lesson → quiz → XP/badge shown → reload → progress persists) with axe reporting zero serious violations. Manual keyboard-only run and phone test (Chrome devtools device mode + a real iPhone/Android).
- Deploy: visit the live Pages URL from a phone.

## On approval

1. `git init` and save this plan as `PLAN.md` in the repo.
2. Create `CLAUDE.md` (above) and `LEARNING.md`, then make the first commit.
3. Start Phase 0, explaining before and after each step.
