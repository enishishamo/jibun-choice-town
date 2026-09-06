# Enforcement Foundation — Self-Test Evidence (2026-09-07)

Per the Human directive "JIBUN CHOICE FACTORY V1 — ENFORCEMENT
FOUNDATION" §8. All scenarios run against real code with real data — no
mocks. Raw commands and output are reproducible; task records referenced
below are preserved in `factory/state/tasks.json` (status `SUPERSEDED`,
since they are self-test fixtures, not real work).

## A. Entry point reachability

Verified every path CLAUDE.md links to actually exists on disk (11/11
resolved). `factory/state/tasks.json` did not exist before the first
`task-state.mjs create` call, by design (created lazily) — now exists.
A live second Claude Code session was not spun up inside this
conversation to prove auto-loading directly; that mechanism (project-root
`CLAUDE.md`) is Claude Code's own documented, standard behavior, not
something this repo implements — the structural check above is what's
actually verifiable from inside a running session.

## B. Auto Repair max-1 (mechanical)

```
$ node factory/harness/task-state.mjs create selftest-B --type bugfix
$ node factory/harness/task-state.mjs request-repair selftest-B
{"allowed": true, "repair_count": 1, ...}          exit 0
$ node factory/harness/task-state.mjs request-repair selftest-B
{"allowed": false, "reason": "repair_count is already 1 — AUTO REPAIR
 RULE caps automatic repair at 1 attempt per task. Use 'reset-iteration
 --reason' ...", ...}                               exit 1
```
**PASS** — second automatic repair mechanically refused.

## C. Release without canonical independent review evidence

```
$ node factory/harness/task-state.mjs create selftest-C --type game-content --review-required
$ node factory/harness/task-state.mjs set-qa selftest-C PASS
$ node factory/harness/task-state.mjs can-deploy selftest-C
{"allowed": false, "reasons": ["review_required=true but review_status
 is null, must be PASS with valid canonical evidence"]}   exit 1

# attempt to substitute yesterday's REAL codex-task.mjs output (the exact
# loophole the audit found) as review evidence:
$ node factory/harness/task-state.mjs set-review selftest-C PASS \
    --evidence factory/projects/q1-improve-lab-check/final-review.result.json
{"accepted": false, "reason": "evidence.verdict must be an object — a
 codex-task.mjs-shaped result (no `verdict` wrapper) is not accepted"}  exit 1

# now with a genuine, freshly-run codex-review.mjs result:
$ node factory/harness/codex-review.mjs --prompt-file ... --out /tmp/selftest-C-review.json
{"ok": true, "status": "OK", "verdict": {"verdict": "PASS", "score": 88, ...}}
$ node factory/harness/task-state.mjs set-review selftest-C PASS --evidence /tmp/selftest-C-review.json
... accepted ...
$ node factory/harness/task-state.mjs can-deploy selftest-C
{"allowed": true, "reasons": []}                          exit 0
```
**PASS** — wrong-script evidence rejected with the exact reason; genuine
`codex-review.mjs` evidence accepted; gate then opens.

## D. product_identity_impact=YES

```
$ node factory/harness/task-state.mjs create selftest-D --type feature --identity-impact YES
$ node factory/harness/task-state.mjs set-qa selftest-D PASS
$ node factory/harness/task-state.mjs can-deploy selftest-D
{"allowed": false, "reasons": ["product_identity_impact=YES requires an
 explicit approve-identity-impact record, which is missing — QA passing
 alone can never clear this"]}                            exit 1

$ node factory/harness/task-state.mjs approve-identity-impact selftest-D \
    --note "Human approved this specific mascot proposal on 2026-09-07 per chat decision"
$ node factory/harness/task-state.mjs can-deploy selftest-D
{"allowed": true, "reasons": []}                          exit 0
```
**PASS** — YES blocks auto-deploy on QA alone, exactly as required; a
separate, explicitly-worded human approval record (never producible by a
QA script) is the only thing that opens it.

## E. QA failure

```
$ node factory/harness/task-state.mjs create selftest-E --type bugfix
$ node factory/harness/task-state.mjs set-qa selftest-E FAIL --evidence "public-safety-smoke-qa found 2 blockers"
$ node factory/harness/task-state.mjs can-deploy selftest-E
{"allowed": false, "reasons": ["qa_status is \"FAIL\", must be PASS"]}  exit 1
```
**PASS**.

## F. All gates PASS, normal bug fix

```
$ node factory/harness/task-state.mjs create selftest-F --type bugfix
$ node factory/harness/task-state.mjs set-qa selftest-F PASS --evidence "..."
$ node factory/harness/task-state.mjs can-deploy selftest-F
{"allowed": true, "reasons": []}                          exit 0
```
**PASS**.

## G (added during testing). CI-side script + a real bug found and fixed

Beyond the required A-F, the CI-callable `release-gate-check.mjs` was
tested directly against real commit ranges from this repo's own history
(no synthetic data):

1. A genuinely doc-only commit (`287d874~1`..`287d874`, the architecture
   audit) → `PASS: ... release gate does not apply` (exit 0), confirming
   non-app changes are never blocked.
2. A commit touching `src/` (`59f43a1~1`..`59f43a1`, the AreaScreen hooks
   fix) with no task referencing it → `FAIL: no task ... has
   release_commit == <sha>` (exit 1), confirming an ungated app change is
   refused.
3. The same commit, after `set-release-commit selftest-G-areascreen-fix
   59f43a1` and a passing QA record → **the string comparison failed**
   because `set-release-commit` stored the literal short sha `"59f43a1"`
   while `git rev-parse HEAD` (what `release-gate-check.mjs` actually
   compares against) always returns the full 40-character sha. This is a
   real bug the self-test caught, not a hypothetical: two correct-looking
   pieces of code silently never matching because of an implicit format
   assumption — arguably the same *class* of gap (a rule "looks satisfied"
   without actually being checked the same way twice) the whole audit was
   about. Fixed by resolving every `set-release-commit` argument through
   `git rev-parse` before storing. Re-ran step 3 after the fix: `PASS: 1
   task(s) referencing <full sha> all pass can-deploy` (exit 0).

## What this does and does not prove

- **Proves**: the exact logic GitHub Actions will run (`release-gate-
  check.mjs` calling `task-state.mjs can-deploy`) behaves correctly
  against real git history and real evidence files, including a genuine
  bug it exposed and had fixed in the same session.
- **Does not (yet) prove**: that the GitHub Actions YAML wiring itself
  (checkout `fetch-depth: 2`, step ordering, `github.event.before`
  resolution, exit-code-blocks-deploy) behaves identically on GitHub's
  actual runners. That requires one real push to `main` — done
  separately as part of this same release (see the commit this file
  ships with, and the linked Actions run in the closing report).
