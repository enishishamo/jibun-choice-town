# Factory Retrospective — 栄養教諭 Job Vertical Slice (2026-09-21)

Two questions: why did the 給食 lane get slow and fragmented before today, and what
should the next job do differently. Kept short on purpose; only the items that will
recur are promoted to canonical rules.

## 1. Why the 給食 lane fragmented

**Root cause: `DESIGN_NEEDED` was a full stop, not a queue.** The marker existed only
as prose in `DESIGN_OWNERSHIP.md` and as a string in `copy.ts`. It had no id, no
status, no place in the ledger. So every time the build met a gap it had exactly one
move: stop and ask. The record shows the shape — four independent-review rounds
(r1..r4), each ending in a Human round-trip, each resuming from a cold context, and a
task parked `BLOCKED` on a single missing design.

That is now mechanical: `task-state.mjs design-needed <id> --add/--resolve/--list`
records the gap as an addressable item and **deliberately does not change the task's
status**, so unrelated work continues; `block --design-needed` is the only route to
the new `DESIGN_BLOCKED` status; `can-deploy` refuses while any item is unresolved.
Today's slice carries three open items (rack art, map tiles, job-scene art) and still
went from audit to finished flow without stopping once.

**Second cause: the Design Owner was asked one question at a time.** Nine separate
round-trips for what was, in the end, one coherent brief. The correction is in the
rule now: gaps are accumulated and returned as one batch per job.

**Third cause: the reviewer's findings were re-litigated instead of being turned into
tests.** The same class of finding ("a placeholder is visible", "the status display is
not legible") came back in r1, r2, r3 and r4. Nothing turned it into an assertion, so
nothing prevented it from returning.

## 2. The most expensive lesson: the QA harness was passing wrong implementations

The independent reviewer mutated the board to render the raw model total, to render
「できた！」/「まだだよ」, and to render an explicit aptitude verdict about the child —
**all three still passed the harness**, which at the time reported "51/51 checks
passed" and was the recorded QA evidence. A fourth mutation moved the auto-clear into
`place()` and also passed, because the check counted occurrences of a string instead
of driving the state machine.

The checks were greps over source text. They asserted that the code did not *look*
wrong. They could not see behaviour.

This is the finding most likely to recur, so it is promoted to a canonical rule
(`factory/rules/qa-rules.md`): **a gate check must observe behaviour, not source
text.** Concretely, for a game:

- drive the state machine over the whole space and assert the invariant, rather than
  grepping for the call that would break it;
- collect what is actually rendered in a real browser and assert against an
  allow-list built from the copy module, rather than a blocklist of bad words;
- a source grep may be recorded as a *documentation* check, and must be labelled as
  one so nobody mistakes it for a gate.

The rebuilt harness now drives 126 trays through place/remove/swap/fireEvent and
asserts the cleared phase is unreachable, and the screenshot harness asserts the same
kind of thing in the browser. That last one also closed a second hole: a missing
picture used to fall back to a CSS shape silently, with no 4xx and no text, so the run
reported `ok: true` with seven assets missing.

**And then the rebuilt harness was itself found wanting, twice.** A fresh independent
review mutated the board again and showed that the new checks still passed a game that
sends itself on a timer, a score that flashes only during the 380ms dish flight, and a
verdict shown only during the 900ms settle window — because the browser harness
performed the gesture itself, and because it only looked at 23 quiescent moments. A
second round then found that the touch-geometry assertion ran *after* the flow had left
the board, so it inspected an empty page and passed vacuously, that the no-number rule
never looked at accessible names, and that a job name flashed during play would not be
caught.

Three further rules come out of that, and they are the ones worth keeping:

- **A check that samples cannot see what happens between the samples.** Accumulate
  continuously (a `MutationObserver` over the whole run) and assert over everything that
  was ever rendered, not over screenshots.
- **A driven test cannot prove that nothing happens on its own.** If the harness
  performs the gesture, add an explicit idle window and assert that nothing advances.
- **A check must fail when it had nothing to check.** The vacuous geometry assertion
  looked identical to a passing one. Every such check now counts its subjects and fails
  itself if the count is implausible.

All of these were verified by mutation: seven deliberately-wrong implementations were
written, and each is now caught by a named assertion.

## 3. Why Ver.1 knowledge nearly disappeared

The Ver.2 rebuild replaced the game and, with it, would have replaced the job
knowledge — Ver.1's 「1日の流れ」, 「どうやってなる？」 and the sourced correction that a
栄養士 qualification alone is not enough all lived in files the new code did not touch
and did not read. Nothing in the process required anyone to look.

`legacy-inventory.md` now exists for this job, with a KEEP / UPGRADE / REPLACE / DROP
decision and a reason per asset. Promoted to a rule: **a Ver.2 job slice starts with a
legacy inventory of that job, and a DROP needs a written reason.**

## 4. What worked and should be kept

- **Parallel audit lanes before any building.** Five read-only lanes (factory
  architecture, Ver.1 assets, primary-source facts, current implementation, quality
  benchmark) ran at once and produced the whole plan. The fact lane alone found that
  the 栄養教諭's職務 had been redefined by a 2025 通知 that none of the existing
  research knew about, and that four claims in the existing fact set were wrong.
- **Independent review in a separate context is worth its cost.** Four reviewers found
  four different classes of defect; the implementation reviewer's mutation test is the
  single most valuable thing produced today, and it is exactly the thing a self-review
  cannot do.
- **Tuning the game by exhaustive search.** All 126 menus are enumerated on every QA
  run, so "several genuinely different solutions", "no dead ends" and "the trouble
  always leaves a way back" are measured, not hoped for.

## 5. What was not needed

- Re-deriving the design from scratch each round. The design contract should be
  written once per job and referenced, not restated.
- Regenerating art that already passed. The dish/tray/truck/school assets were reused
  untouched; only genuinely new objects were queued for generation.

## 6. How many Human interruptions should the next job need?

Today's slice needed **zero** mid-flight, against nine in the previous rounds. The
remaining Human items are all genuine decisions, batched for one sitting: the three
art gaps, the Product Identity approval for a core-loop change, and the OPEN items
(D-08 / D-12 / D-14 / T-03) that this slice implements a working answer to without
claiming one. The target for the next job is the same: **zero mid-flight, one batch at
the end.**

## 7. Promoted to canonical rules

| Rule | Where |
|---|---|
| A gate check observes behaviour, not source text; a source grep is a documentation check and must say so | `factory/rules/qa-rules.md` |
| A screenshot run asserts every state (markers, forbidden content, rendered-string allow-list, image load), not just the last one | `factory/rules/qa-rules.md` |
| `DESIGN_NEEDED` is a queued item that does not stop unrelated work; only an explicit block sets `DESIGN_BLOCKED` | `factory/harness/task-state.mjs` (mechanical) + `CLAUDE.md` §5 |
| A Ver.2 job slice starts with a legacy inventory; a DROP needs a written reason | `docs/jibun-choice-v2/MIGRATION_PLAN.md` |

Not promoted (one-offs): the specific gauge geometry, the specific dish coefficients,
the Codex quota collision between image generation and review.
