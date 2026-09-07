# Q1 Factory — Existing Architecture Audit (Phase 0)

2026-09-08. Read-only inventory of what the repository ALREADY does, taken
before implementing the closed-loop "Q1 Autonomous Game Factory". Method:
three parallel read-only inventories (harness/scripts/CI; rules/state/
schemas; agents/art/game code) plus direct reads of every gate script.
This file records facts and gaps; it changes nothing. The mechanisms
added in Phase 1-3 are listed at the end so the delta is explicit.

Prior AS-IS audit: `factory-architecture-audit-2026-09-06.md` (its §0 root
cause — no project `CLAUDE.md` — is fixed; its §15/§16 items are partly
fixed by `task-state.mjs` + `release-gate-check.mjs`, 2026-09-07).

## 1. Component inventory (responsibility → actual tool → gate → independence → gap)

| Component | Responsibility | Actual tool / agent | Input | Output | Gate (mechanical?) | Downstream | Independence | Gap |
|---|---|---|---|---|---|---|---|---|
| Task ledger | task status, repair cap, QA/review/identity/deploy state | `factory/harness/task-state.mjs` → `factory/state/tasks.json` | CLI args, evidence JSON | tasks.json + history | YES: `request-repair` refuses at repair_count≥1; `set-review` rejects non-canonical evidence, blockers never overridable; `can-deploy` 4 conditions | CI gate, deploy | n/a | no notion of design stages, seeds, translations, redesign, staleness, triggers, WIP |
| Canonical review evidence | define what counts as independent review | `factory/harness/review-evidence.mjs` | result JSON | {ok,reason} | YES (shape + PASS⇒blockers/high empty + score≤min(axes)) | task-state, release-gate-check | — | axis scores optional (only `codex-review --require-axes` forces them); `validate-pipeline.mjs` re-implements its own weaker check |
| Independent reviewer | adversarial review via Codex, two-axis gate, forced FAIL downgrade | `factory/harness/codex-review.mjs` (`codex exec --sandbox read-only`, ChatGPT OAuth only, API keys stripped) | prompt file | `{ok,status,verdict{...}}`, routing-log line | YES in-script (PASS with blockers/high ⇒ FAIL; axis<60 ⇒ FAIL); never PASS on UNAVAILABLE/TIMEOUT/MALFORMED | task-state set-review, loop.mjs | Codex ≠ producer; INDEPENDENCE_PREAMBLE prepended | routing-log path is RELATIVE (`factory/state/routing-log.jsonl`) — entries silently lost when cwd≠repo root (fixed in Phase 1) |
| Generic delegation | non-gate Codex tasks (research, scans) | `factory/harness/codex-task.mjs` | prompt file | `{ok,status,output/json}` | none (by design) | research artifacts | — | must never be used as gate evidence (enforced by review-evidence.mjs shape) |
| Loop engine | PRODUCE→REVIEW→REPAIR→re-review until PASS/max | `factory/harness/loop.mjs` → `factory/state/runs/` | run id, prompt | run JSON, `<run>.review-N.json` | YES: reviewer must be codex, producer≠codex, max_iterations is a stop not a PASS | pipeline.json evidence | enforced | run-level only; no failure→stage routing, no redesign concept |
| World pipeline (v2) | 18 implementation-phase statuses per world | `factory/projects/<world>/pipeline.json` + `factory/scripts/validate-pipeline.mjs` | phase evidence | ok/errors | YES (phases done, gameplay QA executed, binding review PASS ≥60/60, presentation QA, gameplay-references) | AI_VERIFIED | — | starts at world_selection; NO fact-sheet/CORE/SCOPE/A-E/seeds/C-compression/translation/first-5-seconds stages; duplicates evidence validation |
| Release gate (CI) | block deploy of src/public changes without a passing task | `factory/scripts/release-gate-check.mjs` in `.github/workflows/deploy.yml` (fetch-depth 0 → gate → lint → build → Pages) | git range, tasks.json | pass/fail | YES fail-closed | GitHub Pages | — | none for its scope |
| Deploy policy | what may auto-deploy | `factory/rules/deploy-release-policy.md` (canonical) | — | — | via can-deploy | — | — | prose in `two-track-model.md`/`visual-production-flow.md`/`continuous-development-queue.md` still says "never auto"; CLAUDE.md §2 order resolves it |
| Product Identity Gate | Human Decision domains | `factory/rules/product-identity-gate.md`, `tasks.json.product_identity_impact` + `approve-identity-impact` | — | gate-log.md entries | PARTIAL: enforced only when impact is declared on a task | can-deploy | — | no declaration point at DESIGN time (seed/translation) |
| Autonomous execution / WIP / anti-idle / REAL_USER interrupt | who picks next work | `factory/rules/autonomous-execution.md` (prose) | backlog, feedback, audits | — | NO (prose only; "カウンタもスケジューラも存在しない") | — | — | no trigger entry point, no WIP counter, no `next` command |
| Real user feedback | observations from real children | `factory/state/feedback/real-user-feedback-schema.json` (+ rival `factory/state/validation/child-observation-schema.json`) | jsonl | triage docs | NO script | /game-lab improve | — | no routing to a failure code / stage; observation vs interpretation not separated; two rival schemas |
| Legacy audit | independent audit of all Q1 | `factory/harness/game-lab.mjs audit-all` → `factory/state/audits/q1-audit.json` (39 games, 2026-09-01) + `audit-summary.md` | code | per-game C_required / judgment / exploit / axes / evidence | YES (batch completeness) | q1-improve-* tasks | Codex | no reverse-audit schema (SCOPE/CORE/A-E extraction), no classification, no rebuild queue; 63 games registered vs 39 audited (24 newer worlds audited per-world instead) |
| Gameplay QA | deterministic exploit tests on pure logic | 16× `factory/harness/gameplay-qa-*.mjs` ↔ 16 `src/q1/*Logic.ts` | logic module | PASS/FAIL, exit code | YES | validate-pipeline | — | 33/63 games covered; 30 older components have no logic module |
| Browser QA | smoke, flows, gestures, presentation shots | `public-safety-smoke-qa.mjs`, `flows/*-flow.mjs`, `gesture-arbitration-qa.mjs`, `art/present-shots.mjs` | dev server :5177 | shots + JSON | YES (smoke/flows/gesture) | RELEASE_CANDIDATE | — | `map-mobile-interaction-qa.mjs` and `career-path-full-sweep-qa.mjs` print FAIL but exit 0; smoke WORLDS table hand-synced |
| Art need → generation → QA | reuse-first art production | `factory/harness/art/{art-need-detector,art-provider,art-loop,art-qa,art-link-qa,present-shots}.mjs`, `reference-set.json`, `style-contract.md` | `factory/projects/<w>/art-requests/*.json` | images, `manifest-v2.json`, presentation-audit | YES fail-closed (10 categories ≥70, series gates ≥80, BADGE_COLLISION, paid providers hard-refused) | implementation | producer = codex_imagegen, reviewer = codex vision critic (different prompts, same vendor); Claude never self-scores | no Art BRIEF stage between game spec and request JSON; three request formats (`art-manifest.json` v0.1, `art-requests/*.json`, `gpt-asset-requests.json`); `jc-art-director` writes the obsolete v0.1 manifest |
| Paid art path | OpenAI Images API | `factory/scripts/art-generate.mjs` + `.claude/commands/generate-art.md` | manifest, `OPENAI_API_KEY` | images, `factory/art/generation-log.jsonl` | cost caps only | — | — | CONTRADICTS CLAUDE.md §8 / art README "従量課金API禁止"; only a prose HUMAN_REQUIRED stop (fixed in Phase 1: hard refusal without an explicit Human-Decision env flag) |
| Agents | research/design/critic/QA roles | `.claude/agents/jc-*.md` (10; 6 creators, 4 critics; tools-only frontmatter) | conversation | `factory/projects/<w>/{research,design,critic-review,qa-report}.md` | none (prose) | — | critic files state 利益相反 rule | never invoked programmatically; `/new-world` v2 delegates to codex-task + scripts instead; descriptions cite stale STEP numbers |
| /new-world v2, /game-lab | orchestration recipes | `.claude/commands/*.md`, `factory/harness/game-lab.mjs` | — | projects/, runs/ | game-lab: batch completeness | — | — | orchestrator is the Claude session (by design, `ai-routing.md`); no machine state for design stages |
| Q1 shell contract | A/B/E belong to shell, C/D to game | `src/q1/gameTypes.ts` (`onComplete`, `onPartialComplete`, `hasCompleted`), `src/screens/Q1Screen.tsx` (unconditional Job Reveal, 🤔 partial chip) | — | — | — | — | — | only 5/63 games use `onPartialComplete` (Gate H) |

## 2. What is already mechanically enforced (reused as-is)

1. Auto Repair cap (`task-state.mjs request-repair`), non-overridable blockers, canonical evidence shape, `can-deploy` (QA + review + identity + not blocked).
2. CI release gate on every `main` push touching `src/`/`public/` (`release-gate-check.mjs`), plus lint/build.
3. Codex-only independent review with forced downgrade, two-axis 60 floor, API-key stripping, no fail-open on Codex errors.
4. `loop.mjs` reviewer/producer independence and explicit max-iteration stop.
5. Fail-closed art QA (category thresholds, series gates, presentation gate, badge collision), paid-provider refusal in `art-provider.mjs`, art-loop lock and output_path==filename check.
6. 16 deterministic gameplay-QA harnesses; browser smoke/flow/gesture gates.
7. `validate-pipeline.mjs` world-level completion check (phases + executed QA + binding review + presentation QA + gameplay-references).

## 3. Gaps that the master request requires and nothing enforced (added in Phase 1-3)

| # | Gap | Added mechanism |
|---|---|---|
| G1 | No design-stage state machine (DRAFT…GAME_DESIGN_READY/ESCALATED) or per-game design ledger | `factory/harness/q1-pipeline.mjs` + `factory/projects/<game>/q1-pipeline.json` + `factory/state/q1-pipeline-index.json` |
| G2 | No artifact schemas / minimum counts (play_seeds≥3, game_translations≥3, C compression fields, First 5 Seconds, no-manual/exploit check, CORE back-check) | `factory/harness/q1-factory-schema.mjs` (`validateArtifact`, `GAME_DESIGN_READY_CHECKS`) |
| G3 | No failure_code → return_to routing, no REPAIR vs REDESIGN distinction, no finite redesign budget | `FAILURE_ROUTES`, `q1-pipeline.mjs fail/redesign`, `REPAIR_MAX_PER_ITERATION=1`, `REDESIGN_MAX=2`, ESCALATED |
| G4 | No artifact versioning / provenance / staleness | `submit` versions every artifact, records `source_artifacts`, marks transitive downstream STALE (`DOWNSTREAM_OF`) |
| G5 | No trigger entry point, WIP counter, anti-idle `next`, reaudit invalidation by dependency | `factory/harness/q1-trigger.mjs` (`fire`, `next`, `wip`, `dependency`, `evidence`) |
| G6 | Real-user evidence not routable (observation/interpretation mixed; no stage/failure code) | `validateRealUserEvidence` + `q1-trigger.mjs evidence` → `factory/state/feedback/real-user-evidence.jsonl` (routing layer; references `feedback_id` of the existing observation schema, not a third observation format) |
| G7 | No reverse audit / classification / prioritized rebuild queue for legacy Q1 | `factory/harness/q1-legacy-audit.mjs` (`seed` from q1-audit.json + blocked-queue evidence, `record`, `queue`, `start --backfill`) → `factory/state/legacy/` |
| G8 | No Game Spec / Art Brief / Art Review / Implementation / Implementation-QA handoff artifacts with independence recorded | `q1-pipeline.mjs submit game_spec|art_brief|art_production|implementation|implementation_qa`, `art-review` (reviewer≠producer), `art-request` (art_brief → `art-requests/*.json` for `art-loop.mjs`), `review --kind implementation`, `release-ready` (delegates to `task-state can-deploy`) |
| G9 | Product Identity domains not declarable at design time | `human_decision_domains` on any artifact / `human-decision` command → open Human Decision blocks `gate` and `release-ready` |
| G10 | `codex-review.mjs` relative routing-log path; `validate-pipeline.mjs` duplicate evidence check; live paid art path | Fixed in Phase 1 (absolute path; import `review-evidence.mjs`; hard refusal in `art-generate.mjs` unless `JC_PAID_ART_HUMAN_DECISION=<gate-log entry id>`) |

## 4. AI role separation as observed today

- Orchestration: the Claude Code session itself (`ai-routing.md`: routing is never delegated).
- Design creators: Claude session / `jc-*` creator agents (not invoked programmatically).
- Independent review: `codex-review.mjs` only (loop.mjs refuses any other reviewer). Producer==reviewer never PASSes a gate.
- Art: producer `codex_imagegen` (via art-provider), reviewer Codex vision critic (art-qa), Claude never rates its own art; Human supplies GPT illustrations via `gpt-asset-requests.json` when the free provider cannot.
- Mechanical: task-state, review-evidence, release-gate-check, gameplay-qa, smoke/flows, art-qa/link-qa, verify.mjs.
- Human: Product Identity Gate, identity-impact approval, `reset-iteration`, GPT asset approval, STABLE tag.

## 5. Not mechanically enforceable in this environment (declared, not hidden)

- Whether a Claude session actually invokes the pipeline scripts (no hooks/cron/scheduler; CI cannot run Codex or a browser). CLAUDE.md §4-6 point at the scripts; `release-gate-check.mjs` is the only unattended enforcement point.
- Reviewer "independence" is a different model/vendor + prepended rules, not a proof.
- Real-user evidence quality (severity judgment) is human/session judgment; the schema only forces its structure.
