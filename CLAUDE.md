# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Static, game-like learning app (AI coding + ML/AI theory). Vite + React + TypeScript + MDX, deployed to GitHub Pages. No backend, no API keys, progress in localStorage. See PLAN.md for the roadmap and the current phase.

## Commands

Node 24 (see `.nvmrc`), npm.

- `npm run dev`: dev server
- `npm run build`: type-check + production build to dist/
- `npm run preview`: serve the built site locally
- `npm test`: Vitest, run once · `npm run test:watch` · single file: `npx vitest run src/widgets/gradient-descent/model.test.ts` · by name: `npx vitest run -t "levelFromXp"`
- `npm run lint`: oxlint (react, jsx-a11y, vitest plugins; warnings fail) · `npm run typecheck`: `tsc -b`
- `npm run format` / `npm run format:check`: Prettier (no semicolons, single quotes, width 100)
- `npm run check`: lint + typecheck + test + format check; run before every commit
- `npm run e2e`: Playwright (phone + desktop) with axe accessibility scans; run `npm run build` first. One spec: `npx playwright test journey --project=phone`
- Screenshots for visual review: `SCREENSHOTS=1 npx playwright test screenshots` → `test-results/screens/`

TypeScript is deliberately pinned to `~6.0` (the Vite template default); upgrading to 7.x is a planned, separate step. KaTeX is forced to one version via `overrides` in package.json.

## Architecture

- `content/en/<track>/<lesson-id>/index.mdx`: all lesson text (frontmatter holds metadata, sources, quiz and challenge ids). `content/en/tracks.json` (tracks + upcoming lessons) and `badges.json` are data too. Never put lesson copy in src/.
- `src/content/`: `lessons.ts` globs the MDX eagerly and validates it with the zod schemas in `schema.ts`, so bad content fails `npm test` (`content.test.ts` adds cross-file checks). `remarkSteps.ts` is a build-time remark plugin that splits lessons at `---` into `<Step index>` and exports `stepCount`.
- MDX components available without imports are registered in `src/components/mdxComponents.ts`. Lesson state (current step, quiz attempt) flows through `LessonContext` in `src/lesson/context.ts`.
- `src/widgets/<name>/`: `model.ts` is pure, React-free maths with colocated tests; the `.tsx` view only renders and handles input. Widgets report `WidgetEvent`s via `ChallengeContext` (`src/widgets/events.ts`); `<Challenge>` turns them into stars. Inside a challenge the start position is fixed.
- `src/game/`: `applyAction` in `engine.ts` is the whole game as a pure reducer (XP, stars, streaks, badges). `store.ts` wraps it with persistence and subscriptions; `src/app/game.ts` wires the single store to real content, clock and localStorage. The persisted state is versioned (`state.ts`): changing its shape requires bumping `GAME_STATE_VERSION`, adding a migration and a test.
- Routing uses `createHashRouter` (`src/app/router.tsx`) so GitHub Pages needs no server config; the lesson route is lazy-loaded to keep Mafs out of the main chunk. In-page `#anchor` links don't work with hash routing; focus elements directly instead.
- UI strings go through `t()` in `src/i18n/`.

## Conventions

- Fast-moving lessons (`volatility: fast-moving`) must be verified with web search when written and include sources + `lastVerified`; `content.test.ts` fails once they are 180 days old.
- Every interactive is keyboard-operable, labelled, colour-contrast-safe (use tokens from `src/styles/tokens.css`) and respects `prefers-reduced-motion`. Don't animate opacity on text (axe measures mid-animation contrast).
- Ask before adding a dependency, and explain why.
- Small commits; run `npm run check` before committing.
- Commit messages follow Conventional Commits: `type(scope): summary` with types feat, fix, test, docs, refactor, style, chore, ci (e.g. `feat(widgets): add gradient playground`).
- Deploying is manual: the "Deploy to GitHub Pages" workflow runs only via workflow_dispatch.

## Teaching workflow (this is also a learning project)

- Before each step: a few sentences on what and why. After: key concepts and trade-offs.
- At real design decisions, offer 2-3 options and let the user choose.
- Leave small, scoped tasks marked `// TODO(you):` with a failing test; review the solution when done.
- Append one short entry per step to LEARNING.md: built / concepts / questions to explore.
