# Q1 Factory — End-to-End Connection Audit (Phase 2)

2026-09-08. Traces GAME_DESIGN_READY → GAME SPEC → ART BRIEF → ART PRODUCTION →
ART REVIEW → IMPLEMENTATION → QA → INDEPENDENT REVIEW → RELEASE → DEPLOY on the
real repository, stage by stage. "Mechanical connection" means a script
refuses to proceed without the previous stage's artifact/evidence; "prose"
means a rule file asks for it but nothing checks. Evidence for every
"mechanical" row is scenario K–R/U/V of
`factory/state/selftests/q1-factory-selftest-2026-09-08.json` (executed
against the real scripts with fixture pipelines) unless stated otherwise.

| Stage | Owner | Actual tool | Input | Output | Gate | Handoff → next | Mechanical connection | Independence | Gap / dry-run |
|---|---|---|---|---|---|---|---|---|---|
| GAME_DESIGN_READY | Claude session (creator) | `q1-pipeline.mjs gate` over `GAME_DESIGN_READY_CHECKS` | all 11 design artifacts + independent review | state GAME_DESIGN_READY | 21 mechanical checks (counts, fields, review PASS & independent & non-stale, no open Human Decision) | `submit game_spec --source game_translations@N` | YES: `submit game_spec` requires a CURRENT non-stale source; K | review by `codex-review.mjs` only | — |
| GAME SPEC | Claude session | `submit game_spec` (`ARTIFACT_SCHEMAS.game_spec`: goal, initial_visual_state, interactive_objects, primary_action, C, D, system_reactions, state_transitions, failure_behavior, retry_behavior, E, job_reveal, first_5_seconds, no_manual_requirements, mobile_constraints, asset_requirements) | adopted translation | `game_spec vN` with provenance | required fields; STALE if translation changes (U) | `submit art_brief --source game_spec@N` | YES (K, U) | — | spec content quality is reviewed at IMPL review, not separately (prose) |
| ART BRIEF | Claude session (Art Brief Creator) | `submit art_brief` (15 required fields incl. interactive_object_visual_hierarchy, what_must_not_be_baked_into_image, touch_affordance_requirements, prohibited_mascot_invention) or `no_art_required:true` | game_spec | `art_brief vN` | required fields | `art-request` → `factory/projects/<game>/art-requests/<asset>.json` | YES: `art-request` refuses without a CURRENT brief; the request JSON is the exact input format of the EXISTING producer `factory/harness/art/art-loop.mjs run --request` (L, M) | brief creator ≠ producer | — |
| ART PRODUCTION | Art Producer = `codex_imagegen` via `art-provider.mjs` (existing) | `node factory/harness/art/art-loop.mjs run --request <file>` (prompt = STYLE_BLOCK + request fields → generate → `art-qa.mjs` → amend → ≤3) | art request JSON | image at `output_path`, `factory/state/art/manifest-v2.json` | existing fail-closed art QA (≥70 categories, ≥80 series gates), paid providers refused, `output_path==filename` | `submit art_production --source art_brief@N` | YES: `release-ready` requires CURRENT art_production when the brief needs art (L) | producer is Codex image tool; Claude never draws illustration (art ownership) | **dry-run in the self-test** (no real image generated there); exercised for real only when the new Q1 needs an asset; if `codex_imagegen` is unavailable art-loop writes a human_boundary package (not a failure) |
| ART REVIEW | Art Reviewer = `art-qa.mjs` Codex vision critic (existing) + `q1-pipeline.mjs art-review` | `art-review --evidence <art-qa result> --reviewer codex-vision-critic --producer codex_imagegen --pass|--fail --code` | produced asset + brief | `art_review` record (independent flag) | reviewer≠producer or no approval; FAIL → `FAILURE_ROUTES` (ART_ANSWER_LEAK/VISUAL_AFFORDANCE_FAILURE → ART_BRIEF) | state ART_APPROVED | YES (N) | mechanical: `independent = reviewer !== producer` | art-qa's 12 categories do not literally include "interactive object visibility / answer leak" as named axes — those are carried in the request's composition/forbidden_objects and judged under READABILITY/OBJECT_COMPLETENESS/JOB_ACCURACY; declared as a taxonomy gap, not enforced |
| IMPLEMENTATION | Claude session (implementer) | `submit implementation` (component_files, logic_module, qa_harness, spec_version, art_version_or_none, d_preserved_statement) | game_spec + approved art | `implementation vN` | `spec_version` must equal current game_spec version at release (P/Q) | `submit implementation_qa --source implementation@N` | YES: `release-ready` refuses `implementation.spec_version != game_spec.version` | — | "D preserved" is a statement checked by the independent impl review, not by code |
| MECHANICAL QA | scripts (existing) | `npm run build`, `npm run lint`, `factory/harness/gameplay-qa-<x>.mjs`, `public-safety-smoke-qa.mjs`, `gesture-arbitration-qa.mjs` | code | exit codes | YES (each) | recorded in `implementation_qa.evidence` + `task-state set-qa` | YES: `can-deploy` requires `qa_status=PASS` | — | which QA scripts ran is evidence text; `validate-pipeline.mjs` (world level) actually re-executes the gameplay QA — the game-level `release-ready` trusts `set-qa` (same trust model as CI) |
| BROWSER / VISUAL / MOBILE QA | Claude session + `art/present-shots.mjs` + `art-qa.mjs presentation` | `submit implementation_qa` (14 booleans incl. first_5_seconds, touch_targets, mobile_375, direct_manipulation, c_to_d, consequence, retry, answer_leak, brute_force, visual_affordance, no_manual, job_reveal, pass) | running app | `implementation_qa vN` | `pass:true` required; QA_FAILURE trigger routes by cause (O) | `review --kind implementation` | YES (O, P) | — | the booleans are self-attested; the independent impl review is the check on them |
| INDEPENDENT IMPL REVIEW | Codex via `codex-review.mjs --require-axes` | `review --kind implementation --evidence <result.json> --input <prompt>` | code + spec + QA | `impl_review` (verdict, independent, stale) | canonical evidence only; FAIL → `fail --code …` routing; stale on spec/impl/translation change | `release-ready` | YES (P) | Codex ≠ creator | — |
| RELEASE | `q1-pipeline.mjs release-ready` → `task-state.mjs can-deploy` | design chain + spec + art(or none) + impl(spec_version) + impl QA + impl review + no open Human Decision + not ESCALATED/REAUDIT_REQUIRED + linked task can-deploy | all of the above | RELEASE_CANDIDATE | YES (Q, R) | `set-release-commit` + push | YES: identical `can-deploy` logic is what CI runs | — | — |
| DEPLOY | GitHub Actions `.github/workflows/deploy.yml` | `release-gate-check.mjs --base --head` → lint → build → Pages | pushed commit | live site | fail-closed on any src/public change without a passing task | `set-version` → RELEASED | YES (existing, verified in earlier real runs) | — | CI cannot run Codex/browser (declared) |
| REAL USER EVIDENCE | observer → Claude session | `q1-trigger.mjs evidence --file` (observation ≠ interpretation, severity, affected_stage, suggested_failure_code) | released version | `real-user-evidence.jsonl` + routed failure | HIGH/BLOCKER → `fail` at affected stage (USER LEARNING LOOP), LOW/MEDIUM logged | pipeline REPAIRING at the returned stage (V) | YES (V) | — | severity judgment is human |
| REAUDIT | `q1-trigger.mjs fire STANDARD_UPDATED/SHARED_*` | dependency map (`depends_on`) | trigger | REAUDIT_REQUIRED on affected released pipelines, reviews stale | `release-ready` refuses REAUDIT_REQUIRED | re-run affected stage(s) | YES (`mark-reaudit`; scoped by `--dependency`, `--all` only for STANDARD_UPDATED) | — | `depends_on` must be declared per game (`q1-trigger.mjs dependency <game> --add <dep>`); nothing infers it from imports yet |

## Cross-department failure routing (master request §37) — as encoded

| Failure | return_to (default first) |
|---|---|
| VISUAL_AFFORDANCE_FAILURE | ART_BRIEF, FIRST_PLAY_UX |
| ART_ANSWER_LEAK | ART_BRIEF, GAME_TRANSLATION |
| IMPLEMENTATION_CHANGED_D | IMPLEMENTATION |
| GAME_SPEC_MISSING_STATE | GAME_SPEC |
| FIRST_PLAY_FAIL_DESPITE_CORRECT_IMPLEMENTATION | FIRST_PLAY_UX, GAME_TRANSLATION |
| CORE_DISTORTION_FOUND_AFTER_ART | GAME_TRANSLATION, SCOPE_CORE |
| FACTUAL_VISUAL_ERROR | PROFESSION_RESEARCH, ART_BRIEF |

`fail --return-to` outside the table is refused (G). Downstream failures get
one local repair, then the same REDESIGN/ESCALATE ladder (H).

## Relationship to the pre-existing world pipeline

`factory/projects/<world>/pipeline.json` (18 implementation phases) and
`factory/scripts/validate-pipeline.mjs` remain the world-level completion
check for `/new-world`. The game-level `q1-pipeline.json` sits UPSTREAM of
it: a world's `game_design` phase evidence should point at the game's
GAME_DESIGN_READY gate record, and `validate-pipeline.mjs` now shares the
evidence validator (`review-evidence.mjs`) with `task-state.mjs`, so the two
ledgers cannot disagree about what a valid review is.

## What is dry-run vs executed in this audit

- Executed for real: every gate/handoff above via the self-test (fixtures),
  `validate-pipeline.mjs river-health` (real world, PASS through the shared
  validator), `art-generate.mjs --confirm` refusal, `task-state can-deploy`.
- Dry-run here, executed on the NEW Q1 run: real Codex design review and
  implementation review, real art-loop generation + art-qa (only if the
  adopted translation needs a new asset), real browser QA, real push/CI.
