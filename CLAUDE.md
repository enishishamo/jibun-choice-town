# JIBUN CHOICE — Factory Bootstrap

This is **JIBUN CHOICE Factory**: a children's career-exploration web game
built via Claude Code sessions, operating a semi-autonomous production
process ("the Factory") documented under `factory/`. If you are starting
work here, you are joining that Factory — read this file fully before
making any change.

This file is a **bootstrap pointer**, not a copy of the rules. The rules
themselves live under `factory/rules/` and change independently of this
file — always read the linked file itself, never assume this summary is
current.

## 0. First, orient yourself

- Current AS-IS audit of what is/isn't actually enforced (read before
  trusting any claim of automation elsewhere): [`factory/state/factory-architecture-audit-2026-09-06.md`](factory/state/factory-architecture-audit-2026-09-06.md)
- Open/blocked work: [`factory/state/blocked-queue.md`](factory/state/blocked-queue.md), [`factory/state/tasks.json`](factory/state/tasks.json) (machine-readable task ledger — see §5), `factory/state/backlog/*.md`
- What's already shipped: [`factory/state/release/current-release.json`](factory/state/release/current-release.json)

## 1. Product Identity Gate (highest priority — read this first)

Mascot/brand character, core gameplay loop, points/currency/reward/streak
systems, collection/growth systems, classifying a child's interests or
personality, major Home/nav architecture changes, Mission/target-age/
core-philosophy changes, and monetization all require an explicit **Human
Product Decision** before you select, implement, generate production
assets for, or merge any of it. You may research/ideate/propose. You may
never decide. Full rule: [`factory/rules/product-identity-gate.md`](factory/rules/product-identity-gate.md).

This gate outranks every other rule in this file, including Autonomous
Execution Mode and the Deploy Policy below.

## 2. Canonical rules (`factory/rules/`)

The rule files are the source of truth for policy; this file only indexes
them. Read the specific file before acting on its topic — do not rely on
one-line summaries below staying accurate:

| Topic | File |
|---|---|
| Product Identity Gate (see §1) | `product-identity-gate.md` |
| Game design invariants (A→B→C⇄D→E, BLOCKER list) | `principles.md` |
| Model/task routing (Sonnet/Codex/Haiku/Fable) | `ai-routing.md` |
| Autonomous task selection, Two Parallel Loops, WIP limit, escalation | `autonomous-execution.md` |
| Visual/UI production flow, Auto Review Team, Human Gate | `visual-production-flow.md` |
| Deploy/release policy — **canonical for what may auto-deploy** | `deploy-release-policy.md` |
| Game quality rubric (binding two-axis gate) | `game-critic-v2.md` |
| Language/text style, Language QA gate | `language-style.md` |
| QA checklist (superseded for game-scoring by `game-critic-v2.md`) | `qa-rules.md` |
| Art style, art ownership (Claude=UI/CSS/SVG, GPT=illustration) | `art-style.md`, `visual-design-system.md` |
| Research sourcing rules | `research-rules.md` |

### Conflict resolution order

If two rule files disagree, resolve in this order:
1. `product-identity-gate.md` — always wins.
2. `principles.md` — game-design invariants, "変更不可".
3. **`deploy-release-policy.md`** — canonical for Development→Stable
   promotion and remote-push conditions. It supersedes the
   human-gate-only promotion language in `factory/state/release/
   two-track-model.md` and `release-lifecycle.md` for changes within its
   scope (see the amendment notices added to those two files
   2026-09-07 — they are not deleted, just marked superseded-in-part).
4. Any other `factory/rules/*.md` file, most-recently-dated wins if two
   genuinely conflict — but treat a live conflict as a bug: log it and
   ask, don't silently pick one.
5. `factory/state/*` — records/evidence, never policy. If a state file
   seems to imply a different policy than `factory/rules/`, the rules
   file wins; fix the state file's wording instead.

## 3. Routing entry point

Task classification → executor mapping is `factory/rules/ai-routing.md`.
In short: mechanical/repetitive → direct tools; implementation →
Sonnet (default); independent review → Codex (see §4); architecture/hard
ambiguity → escalate per the ladder in that file. No paid API, ever, for
any of this.

## 4. QA / independent review entry point

**Canonical independent-review script: `factory/harness/codex-review.mjs`.**
It is the ONLY script whose output counts as "independent review evidence"
for a release/Game-Quality gate — it hard-codes the two-axis PASS/FAIL
gate and forces FAIL when blockers/high are non-empty; `codex-task.mjs`
(generic delegation, no gate logic) must never be substituted for it when
recording gate evidence, even though it also calls Codex. See
`factory/harness/review-evidence.mjs` for the shared validator that
enforces this shape mechanically wherever gate evidence is recorded
(`factory/harness/task-state.mjs`, `factory/scripts/release-gate-check.mjs`).

Technical QA entry points: `npm run build`, `npm run lint`,
`factory/harness/gesture-arbitration-qa.mjs`,
`factory/harness/public-safety-smoke-qa.mjs`,
`factory/harness/gameplay-qa-*.mjs` (per-game pure-logic exploit tests).
Full checklist: `factory/rules/qa-rules.md` (functional) /
`factory/rules/game-critic-v2.md` (binding game-quality gate).

## 5. Task state (mechanical, not memory)

Task progress — status, repair count, review/QA/deploy status, blocked
reason, Product Identity impact — is tracked in
[`factory/state/tasks.json`](factory/state/tasks.json) via
`factory/harness/task-state.mjs`, not just in conversation memory. Before
resuming or repairing a task, check its recorded state:
```
node factory/harness/task-state.mjs status <task_id>
```
Auto Repair is capped at 1 attempt per task and this is enforced by the
script (`request-repair` refuses once `repair_count >= 1`), not by
whoever happens to remember. A human can explicitly reset a task for a
new iteration (`reset-iteration --reason "..."`) when a new spec changes
things; the reset is logged, never silent.

## 6. Deploy Policy (canonical: `factory/rules/deploy-release-policy.md`)

Within Human-approved product direction, routine changes (bug fixes, UI
polish, content repair) may reach `main` → GitHub Pages without a
per-change approval stop, **provided the release gate passes**:
`node factory/harness/task-state.mjs can-deploy <task_id>` — checks QA
status, required review evidence, and Product Identity impact
(`NONE` only auto-deploys; `POSSIBLE`/`YES` always require an explicit
recorded human approval, never just a QA pass). CI
(`.github/workflows/deploy.yml`) also runs
`factory/scripts/release-gate-check.mjs` before deploying any commit that
touches `src/` or `public/`, and fails the workflow (no deploy) if no
passing gated task references that commit. Product Identity Gate items
(§1) are categorically excluded from auto-deploy regardless of QA status.

## 7. Two-track model

`feature/harness-bootstrap` (or the active development branch) is
Development Track; `main` is Stable/Public, deployed automatically on
push. Development → Release Candidate can be automated per the gates
above; promotion is a normal `git push origin main` once the release gate
passes — see `factory/state/release/two-track-model.md` and
`release-lifecycle.md` for the fuller stage model (now amended, not
replaced, by `deploy-release-policy.md` — see §2).

## 8. Session hygiene

- Never use paid APIs, API keys, or incur additional billing.
- Never force-push, never rewrite published git history.
- Read `factory/state/blocked-queue.md` before starting new Continuous
  Product Loop work — don't re-attempt a task parked there without a
  recorded Human Decision.
