# Q1 Factory self-test — 2026-09-09

Scenarios A-W from the 2026-09-08 master request (§29, §40) plus X-Z, AA (2026-09-09 leak-detective E2E gap regressions: parked legacy items never auto-started, design-review staleness scope, art-review state protection, Limited Human Exception cap), run against the real scripts with fixture pipelines (game ids `selftest-*`, removed afterwards). Fixture review evidence is codex-review.mjs SHAPED ONLY (never a real review) and is deleted after the run.

Result: **27/27 PASS**

| id | scenario | result | mode |
|---|---|---|---|
| A | play_seeds = 2 → artifact refused AND gate FAIL | PASS | mechanical |
| B | preserved_D missing → c_compression refused | PASS | mechanical |
| C | game_translations = 1 → refused (minimum 3) | PASS | mechanical |
| D | First 5 Seconds missing → GAME_DESIGN_READY refused | PASS | mechanical |
| E | review FAIL → gate refused; codex-task-shaped evidence refused; creator==reviewer never satisfies the gate | PASS | mechanical |
| F | FIRST_ACTION_NOT_INFERABLE → return_to FIRST_PLAY_UX, state REPAIRING, repair_count 1 | PASS | mechanical |
| G | PERIPHERAL_JOB_TASK → return_to SCOPE_CORE; an off-table return_to is refused | PASS | mechanical |
| H | repair 1 allowed; 2nd FAIL → REDESIGN_REQUIRED (no 2nd repair); same translation refused; different translation → iteration 2 / repair_count 0; redesign beyond budget → ESCALATED | PASS | mechanical |
| I | reverse audit recorded → classified → in prioritized queue with entry_stage; malformed audit refused | PASS | mechanical |
| J | open Human Decision (mascot) blocks gate and submissions; resolving it re-enables the gate | PASS | mechanical |
| K | GAME_DESIGN_READY → game_spec accepted with provenance to game_translations@1 → SPEC_READY | PASS | mechanical |
| L | no_art_required:true satisfies the art condition; a real brief then requires art_production + independent art review | PASS | mechanical |
| M | art_brief → art-requests/*.json in art-loop.mjs format carrying touch affordance, hierarchy, forbidden bake-ins, provenance | PASS | mechanical |
| N | self-review (reviewer==producer) cannot approve art; art review FAIL routes back to ART_BRIEF | PASS | mechanical |
| O | QA_FAILURE routes by cause: FIRST_PLAY→FIRST_PLAY_UX, VISUAL_AFFORDANCE→ART_BRIEF, IMPLEMENTATION_CHANGED_D→IMPLEMENTATION | PASS | mechanical |
| P | implementation review FAIL → release-ready refused | PASS | mechanical |
| Q | all design+spec+art(none)+impl+QA+reviews PASS and linked task passes can-deploy → RELEASE_CANDIDATE; without a linked task it is refused | PASS | mechanical |
| R | product_identity_impact=YES without approval blocks release-ready (via task-state can-deploy); an explicit approval record clears it | PASS | mechanical |
| S | legacy start refused while WIP is full; forced start opens the pipeline at the classification's entry stage with upstream artifacts backfilled from the reverse audit (creator=reverse-audit), downstream left empty | PASS | mechanical |
| T | design rationale (scope why / core / A-E / seeds considered / adopted+rejected translations / C compression / creators / failures / redesigns) reconstructable from q1-pipeline.json alone | PASS | mechanical |
| U | scope_core v1→v2 marks ae/play_seeds/…/game_translations STALE + review stale; gate refused; building on a STALE source is refused | PASS | mechanical |
| V | evidence with observation==interpretation refused; LOW is logged only; HIGH on a RELEASED game returns it to FIRST_PLAY_UX (state REPAIRING) | PASS | mechanical |
| W | `next` never reports idle while a queued legacy item or a returned pipeline exists; WIP limit is reported and enforced at start | PASS | mechanical |
| X | game_spec v1→v2 (downstream) keeps the design review non-stale; core_back_check v1→v2 (design stage) stales it | PASS | mechanical |
| Y | art-review PASS moves ART_PRODUCED→ART_APPROVED, but during REPAIRING it keeps the state (state_kept) so repair-done still works | PASS | mechanical |
| Z | limited_exception: needs --scope; blocks submit while open; resolve resets repair_count only (redesign_count unchanged); 1 scoped REPAIR then ESCALATED again (no redesign under the exception); recorded with precedent:false | PASS | mechanical |
| AA | legacy item with a BLOCKED (Human Decision) task is parked_human_decision in the queue, not proposed by next, and start refuses it even with --force | PASS | mechanical |

Mechanically executed: every scenario above invoked `q1-pipeline.mjs` / `q1-trigger.mjs` / `q1-legacy-audit.mjs` / `task-state.mjs` for real and asserted on their exit codes and JSON output. Not exercised here (dry-run by design): a real Codex review, real image generation, a real browser QA run, and a real `git push` — those are exercised by the NEW Q1 demonstration and the release path respectively.
