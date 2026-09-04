# JIBUN CHOICE Release Lifecycle (established 2026-09-04)

This document defines the stages a body of work passes through before it may
be called "Stable" and handed to real children/parents for external
verification. It exists because DEVELOPMENT work (new worlds, map changes,
language-UX changes, Factory changes) happens continuously on working
branches, and none of that should silently become "what the outside world is
looking at" without an explicit, gated promotion.

## Stages

```
DEVELOPMENT  →  AI_VERIFIED  →  RELEASE_CANDIDATE  →  STABLE
```

### DEVELOPMENT
Anything in progress on a branch. No claim of quality. This is the default
state of all work — most commits on `feature/*` branches never need to leave
this stage individually; they accumulate until a coherent unit is ready to
advance.

### AI_VERIFIED
A specific commit where every machine-checkable gate this project defines has
been run and passed, with evidence on disk:
- Per-world: `factory/scripts/validate-pipeline.mjs <world>` passes for every
  world touched (binding Codex adversarial review PASS, blockers/high=0, both
  axes ≥60; gameplay-QA sim suite passes; presentation-QA evidence exists).
- Language QA axes (LANGUAGE_AGE_FIT / BUTTON_CLARITY / TEXT_DENSITY) ≥80 on
  every world touched.
- If Home/Map was touched: Home Quality Gate + (as of 2026-09-04) the
  MAP_SPATIAL_COHERENCE / NAVIGATION_LAYER_CLARITY / WORLD_CONTINUITY gates,
  plus the two adversarial questions ("one world or a collection of
  buttons?", "map or menu styled as map?") — both must resolve to the
  positive answer, with an independent Codex session that has not seen the
  implementer's own reasoning.
- `tsc -b` and `vite build` succeed with no new console/page errors from the
  relevant flow bots.
"AI_VERIFIED" is a claim about a COMMIT, not a branch — record the exact SHA.

### RELEASE_CANDIDATE
An AI_VERIFIED commit that has additionally passed a **Public-Safety Smoke
QA** pass (see `factory/state/release/smoke-qa-*.json` for the template and
latest run): Home renders at mobile 375px and desktop, map pan/district
tap/world entry work for EVERY registered world (not just newly-touched
ones), a representative sample of full Q1 playthroughs completes including
Job Reveal and wrapUp, no broken image loads, no 404s, no console/page
errors anywhere in the crawl. Smoke QA is a BLOCKER hunt, not an improvement
pass — findings below HIGH severity are logged to backlog, not fixed here.
Only a commit with zero BLOCKER/HIGH smoke findings may be tagged as a
Release Candidate.

### STABLE
A Release Candidate that a human has explicitly designated for external
distribution (a git tag, e.g. `stable-prototype-v0.1`). Promotion to Stable
is a deliberate, human-triggered act — never automatic, never inferred from
"the branch looks good." A Stable tag is a promise: this exact commit is
what a child or parent following the distributed URL/build will see. Once
tagged, that commit's content never changes retroactively; a fix ships as a
NEW commit promoted through the same lifecycle to a NEW tag
(`stable-prototype-v0.2`, etc.) — tags are never force-moved.

## What does NOT auto-promote
- Merging to a branch does not imply AI_VERIFIED.
- Passing gates for ONE new world does not imply the WHOLE app is
  AI_VERIFIED — the claim is scoped to the commit and what was actually
  re-checked (see the smoke QA's full-world crawl for why Stable needs a
  broader check than any single world's own gate).
- AI_VERIFIED does not imply RELEASE_CANDIDATE (smoke QA is a separate,
  mandatory gate).
- RELEASE_CANDIDATE does not imply STABLE (a human must decide to publish
  externally; see §7 of the 2026-09-04 directive — remote push / public
  hosting changes are NEVER performed without that explicit instruction).

## Rollback
Every Stable tag points at an immutable commit on `feature/harness-bootstrap`
(or whatever branch is current at release time). Rolling back means
re-deploying the PREVIOUS stable tag's commit — `git checkout
<previous-tag>` — nothing needs to be reverted in history; tags are additive.

## Real-user feedback re-enters at DEVELOPMENT
See `factory/state/feedback/real-user-feedback-schema.json` and
`factory/state/feedback/README.md`. A REAL_USER_FEEDBACK record with
severity HIGH or above becomes a DEVELOPMENT-stage repair task (routed via
`/game-lab improve <gameType>` or a targeted repair workflow depending on
what the observation implicates), which must climb back through
AI_VERIFIED → RELEASE_CANDIDATE → STABLE before it reaches the next external
release. AI verification passing is never grounds to dismiss or downgrade a
real observed child/parent finding — see
`factory/state/feedback/README.md` §"AI_VERIFIED vs REAL_USER_OBSERVED".
