---
name: write-lesson
description: Write, revise or re-verify a lesson for this learning app (content/en/<track>/<id>/index.mdx). Use whenever the task is to publish an upcoming lesson from tracks.json, write a lesson on a new topic, rework a lesson's text or quiz, re-verify a stale fast-moving lesson, review a lesson draft, or fact-check lessons and update the live site, even if the request only names a topic ("do the tokenisation lesson", "the prompt caching one is out of date").
---

# Writing a lesson

A lesson is a short, game-like page: about 11 steps, one idea per step, a quiz, and XP at the
end. The reader is a curious adult with no ML background who reads on a phone. Two published
lessons show the target quality; read them before writing, because copying their shape is far
more reliable than following a description of it:

- `content/en/llm/fine-tuning-rlhf/index.mdx` (a concept lesson with maths in Deeper boxes)
- `content/en/safety/alignment-basics/index.mdx` (a lesson built from real examples, plus an exercise)

Hard rules live in code: `src/content/schema.ts` (frontmatter) and `src/content/content.test.ts`
(ids, prerequisites, freshness). `assets/template.mdx` is a skeleton to start from.
`references/checklist.md` is the review list; it is built from the mistakes reviewers actually
caught in earlier lessons. `references/fact-check.md` is the brief for the independent fact-check.

The job is not done when the lesson is committed. Every lesson goes through the whole pipeline:
write (sections 1–5), finish and commit (6), an independent fact-check (7), then the live site is
updated (8).

## 1. Orient

- Find the lesson in `content/en/tracks.json`. Its `upcoming` entry gives the id, title and
  order. Note the lessons just before and after it in the track: they decide **Coming up**
  (only a lesson later in the track) and **Related** (earlier lessons or other tracks).
- Choose `prerequisites` from real or upcoming ids, and only ones the lesson actually leans on.
  If the text says "the X lesson covers this", X should usually be a prerequisite, and every
  prerequisite should be used somewhere in the text.
- Decide `volatility`. Anything about specific models, products, APIs, prices, benchmarks or
  recent research is `fast-moving`; timeless maths is `evergreen`.

## 2. Research before writing: build a claim sheet

Almost every fix in past reviews came from a sentence drifting away from its source: a claim
widened ("same tokeniser" when only the simplest set-up needs it), credit given to the wrong
person, or a simulated set-up described as if humans had judged it. So gather the facts first
and write from them, not from memory.

Keep a scratch list (outside the repo) of every fact you intend to use. For each, note the
source and where in it the fact appears (section, table or a short quote). Prefer primary
sources: the paper (arXiv abstract page), official docs, the original blog post. Then:

- Open each source and confirm the fact is really there, with the same scope and conditions.
  Note what the experiment actually measured and under which set-up. Copy the source's own
  words into the sheet. Page-fetching tools often return a summary, and a summary has already
  paraphrased; for anything you will quote or state precisely, check the raw page text
  (for example `curl` plus a text search).
- Check every URL returns HTTP 200. If it redirects, cite the final URL. If a site blocks
  automated fetching, use a different primary source (for example the arXiv version of a
  system card) rather than citing something you could not read.
- Every number, date, name, quote and "first/best/most" claim in the lesson needs an entry.
  Explanations you derive yourself (a worked example, an analogy) don't, but the maths must
  check out.

Sources in the frontmatter are `'Author et al. (year): Title'`, and every one should be used
somewhere in the lesson.

## 3. Outline, then write

Shape (see the template): a hook step, roughly 6–8 concept steps, common misconceptions, quiz,
recap. Each step is separated by `---` on its own line and is short enough to read in about a
minute.

- **Hook:** an `#` heading with one emoji, then a concrete situation or puzzle the reader can
  feel (Midas's gold, the bat-and-ball question, an assistant reading a poisoned page). End by
  saying what the lesson covers.
- **Concept steps:** a `##` heading each. Lead with intuition and a concrete example, then name
  the idea in **bold**. Explain any jargon in plain words the first time it appears (what Adam
  keeps per weight, what an activation is). Use worked numbers the reader can check in their head.
- **Predict prompts:** at least two steps should ask "🤔 Predict: …" before revealing the answer
  in the next paragraph. Predicting first is what makes the idea stick.
- **`<Deeper title="Go deeper: …">`** holds formulas, derivations and fine print, so the main
  path stays readable. Display maths must fit a phone: break anything long with
  `\begin{aligned}` / `\begin{gathered}` and `\\`.
- **Interactives:** use only components registered in `src/components/mdxComponents.ts`. If a
  widget would clearly help but doesn't exist, add an entry to `docs/WIDGET_BACKLOG.md` in the
  existing format (idea, pure functions, acceptance tests) instead of building it here.
- **Common misconceptions:** 4–5 bullets, each a quoted wrong belief followed by the correction.
- **Quiz step:** a one-line intro and `<Quiz />`. **Recap step:** "What you learned" bullets,
  then **Coming up:** and/or **Related:**, then "Hit **Finish** to collect your XP! 🏁".

Voice: friendly, plain, second person, British spelling in prose (ids, URLs and paper titles
stay as published). Hedge exactly as much as the evidence does: "in their set-up", "one 2025
study found", "as of <month year>". Never write an absolute ("always", "never", "the only")
unless the source says so.

## 4. The quiz

Six questions in the frontmatter, usually one or two `numeric` and the rest `choice`. Each one
should test understanding (predict, apply, compute, pick the right reason), not recall of a
sentence. Write explanations that teach: why the right answer is right, and where useful why the
tempting one is wrong.

- Options are never shuffled at runtime, so vary the correct `answer` index across questions.
  Earlier lessons put it at index 1 almost every time, which a learner can game.
- Distractors should be plausible to a beginner but clearly wrong once understood.
- Don't give a quiz answer away in the quiz intro or the step just before it.
- Numeric answers need a `tolerance` that accepts sensible rounding.

YAML: quote every prompt, option and explanation that contains a colon, `#`, or starts with a
quote or bracket. Use double quotes when the text contains an apostrophe.

## 5. Safety and security topics

Teach how attacks and failures work at the level of mechanism and defence. Describe an
injection or jailbreak in words; never include working payload text, prompts that would work
as attacks, or step-by-step recipes for misuse. When reporting safety research, state the
authors' own caveats (artificial set-up, harmless backdoor, model was told about its training)
and label hypothetical scenarios as hypothetical. Aim for calm accuracy: neither "evil AI"
drama nor dismissal.

## 6. Finish and commit

- Remove the lesson's entry from `upcoming` in `content/en/tracks.json` (a published lesson
  can't also be upcoming).
- Frontmatter: `minutes` ≈ steps, `xp: 100`, `lastVerified` = today for fast-moving lessons.
- Do a wording pass: for every sentence that rests on a source, put it next to the source's
  words from your claim sheet and check it says no more than they do. Having the right fact on
  the sheet isn't enough; the drift happens when the sentence is written. (A test run had "no
  effect on output token generation" on its sheet and still wrote that the response is
  "identical", which sampling makes untrue.)
- Go through `references/checklist.md` against the finished text, not from memory.
- Run, checking each exit code directly (a pipe through `grep` or `tail` hides failures):
  - `npm run check`
  - `npm run build`
  - `npx playwright test lessons -g "<id>:"`, which walks every step on phone and desktop with
    axe. Playwright reuses whatever server is on port 4173, so in a worktree first make sure
    no other checkout is serving there (`lsof -i :4173`).
- Commit as `feat(content): add the <Title> lesson`, one commit per lesson; review fixes are
  `fix(content): …`.

## 7. Fact-check, independently

You wrote the lesson from your claim sheet, so you will read your own drift as correct. Have a
reviewer who hasn't seen your sheet check the finished text against the sources.

- Start one fact-checker per lesson as a subagent (general-purpose, so it can fetch pages and
  run scripts), with the brief in `references/fact-check.md` filled in. Give it only the lesson
  path and a scratch directory; don't pass your claim sheet or your conclusions. Lessons in a
  batch can be checked in parallel. If subagents aren't available, do the brief yourself in a
  fresh pass, re-opening every source rather than working from your sheet.
- The checker reports; it doesn't edit. For every finding, either fix the text (narrow the
  claim, add the source's condition, correct the number) or, if you are sure the claim holds,
  find the passage that shows it. A claim nobody can find in a source gets cut or rewritten so
  it rests on one.
- Rerun the three checks from section 6 and commit the fixes as
  `fix(content): tighten claims in the <Title> lesson`.
- Only move on when no finding is open. If something can't be settled (a source that blocks
  fetching, a question of judgement), stop and ask the user instead of deploying.

## 8. Update the live site

The site is served by GitHub Pages from the `gh-pages` branch, built from `main`. Deploy from
`main` so the site always has every published lesson, not just the ones on your branch.

1. Bring `main` up to date. If you worked on a branch, `git switch main` and
   `git merge --ff-only <branch>`; if that refuses, the branches have diverged, so stop and ask.
   Then `git push origin main`.
2. Check for personal information before anything leaves the machine: grep the commits since
   `origin/main` and the built files for the author's name, email domains and `/Users/` paths.
   Commits must use the repo-local no-reply identity.
3. From `main`, run `npm run build` and check its exit code.
4. Clone `gh-pages` into the scratchpad (never into the repo):
   `git clone --branch gh-pages --single-branch <origin url> <scratch>/ghp`. In the clone,
   delete everything except `.git`, copy in the contents of `dist/`, add an empty `.nojekyll`,
   and set the no-reply identity with `git config` in that clone.
5. Commit as `deploy: Learning Rate site build (<short sha of main>)`, then run exactly
   `git push origin gh-pages` from the clone (the allowed permission matches that command).
   If the push is blocked, tell the user what is ready and ask them to approve it.
6. Verify: after a minute or two, fetch the site URL (see the repository's Pages settings or
   `gh api repos/{owner}/{repo}/pages`) and check it returns 200 and its `index.html` references
   the new asset file names from `dist/index.html`. Report the URL and which lessons went live.

## Revising or re-verifying a lesson

Keep the id, order and step structure unless asked to change them; progress is stored by id.
To re-verify, rebuild the claim sheet from the current text, re-open every source, and look for
newer developments that change a claim. Only then bump `lastVerified`. Report what changed and
what you couldn't confirm. Revisions go through the fact-check (7) and the site update (8) too.
