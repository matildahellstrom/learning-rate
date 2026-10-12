# Learning Rate

A playful, game-like web app for learning to code with AI and the maths and ideas behind machine learning and modern AI. Interactive visuals, challenges, quizzes, XP, streaks and badges. Every lesson has an intuitive layer and an optional "go deeper" layer with the real maths.

**Status:** MVP. One complete lesson (gradient descent) plus the map of everything that's coming. See [PLAN.md](PLAN.md) for the roadmap and [LEARNING.md](LEARNING.md) for the build log.

## Run it

Requires Node 24.

```sh
npm install
npm run dev        # http://localhost:5173
npm run check      # lint, typecheck, unit tests, formatting
npm run build && npm run e2e   # end-to-end + accessibility tests
```

## Add a lesson

Create `content/en/<track>/<lesson-id>/index.mdx`. Copy the frontmatter from `content/en/ml/gradient-descent/index.mdx`, and separate steps with `---`. If the lesson was listed as upcoming in `content/en/tracks.json`, remove it from there. `npm test` validates the frontmatter, quiz and links between lessons, and tells you exactly what is wrong.

## Deploy

The repository is private, and free GitHub Pages only serves public repositories (GitHub Pro lifts that limit). Once that's settled: GitHub Pages, via the manual **Deploy to GitHub Pages** workflow (Actions tab → Run workflow). In the repo settings, set Pages → Source to "GitHub Actions" first. Progress is stored only in each visitor's browser; there is no backend.
