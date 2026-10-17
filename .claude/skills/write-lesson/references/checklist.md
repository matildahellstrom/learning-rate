# Lesson review checklist

Go through this against the finished file. Each item comes from a fix a reviewer had to make in
an earlier lesson; the example in brackets is the real case.

## Claims and sources

- [ ] Every number, date, name, quote and superlative maps to a listed source, and you opened
      that source and saw it. (Speculative decoding named Medusa, EAGLE and DeepSeek-V3 with no
      source listed.)
- [ ] Each claim keeps the source's scope and conditions. Read the sentence and ask "is this
      true in general, or only in their set-up?" (Speculative decoding said the drafter "must
      use the same tokens"; only the simplest set-up needs a shared tokeniser. "The slow bit is
      moving weights" holds for one request at a time, not big batches.)
- [ ] Experiments are described as they were run: who or what did the judging, what was
      simulated, what was measured. (Gao et al. used a larger "gold" reward model standing in
      for people; the lesson said quality "as judged by people".)
- [ ] Credit goes to the right people and place: all authors where it's two or three, who coined
      a term and where. ("Dark knowledge" came from Hinton's 2014 talk, not the 2015 paper;
      model compression was Buciluǎ, Caruana & Niculescu-Mizil, not "Caruana and colleagues".)
- [ ] Numbers from a paper are the paper's, not folk ranges. (LoRA "often 4 to 16" became
      "the LoRA paper mostly used 4 or 8".)
- [ ] Technical terms are precise. (Outlier features are mostly in activations, not weights;
      MX formats share an 8-bit scale per block of 32; GPTQ goes one column at a time.)
- [ ] Paraphrases say no more than the source's own words. ("No effect on output token
      generation" is not "the response is identical": sampling still varies.)
- [ ] Partial truths are scoped. (Constitutional AI replaced human labels for harmlessness, not
      "most human labels"; R1-Zero's answers grew longer over training, the paper doesn't say
      "on harder problems".)
- [ ] Verdicts that depend on the reader's situation say so. ("Often a fine trade" became
      "whether that trade is worth it depends on your task".)
- [ ] Every source in the frontmatter is used in the text, and every URL returns 200.
- [ ] Fast-moving claims about products or APIs say "as of <month year>".

## Teaching

- [ ] Jargon is explained on first use. (Adam "keeps two running averages per weight"; mixed
      precision "a 16-bit working copy plus a 32-bit master copy".)
- [ ] Every prerequisite is used, and every "the X lesson covers this" lesson is a real or
      upcoming id. (Speculative decoding listed context-windows but never mentioned the KV
      cache.)
- [ ] At least two 🤔 Predict prompts, with the answer only after the prompt.
- [ ] Worked examples check out arithmetically (recompute them).
- [ ] Examples in exercises are unambiguous: each scenario has exactly one defensible answer.
      (A "users liked long answers" story read as either specification gaming or goal
      misgeneralisation until the training distribution was spelled out.)
- [ ] Hypothetical scenarios are labelled as hypothetical.

## Quiz

- [ ] Six questions; correct `answer` indices are spread out, not mostly 1.
- [ ] No answer is given away in the quiz intro or the step just before.
- [ ] Each explanation teaches the reason, not just the answer.
- [ ] Numeric tolerances accept sensible rounding.

## Format

- [ ] British spelling in prose (quantisation, behaviour, optimise); ids, URLs and paper titles
      untouched.
- [ ] **Coming up** only points to a later lesson in the same track; earlier lessons go under
      **Related**.
- [ ] Display maths fits a phone: no line much wider than about 40 characters; break with
      `aligned` or `gathered`.
- [ ] YAML strings with colons, `#` or apostrophes are quoted correctly (an unquoted option
      containing a colon broke a build once).
- [ ] The lesson is removed from `upcoming` in `tracks.json`.
- [ ] `npm run check`, `npm run build` and the lesson's Playwright run pass, with exit codes
      checked directly.

## Before it goes live

- [ ] An independent fact-check (`references/fact-check.md`) found nothing that is still open.
- [ ] `main` holds the lesson and is pushed; the site was rebuilt from `main` and deployed to
      `gh-pages`, and the live URL serves the new build.
