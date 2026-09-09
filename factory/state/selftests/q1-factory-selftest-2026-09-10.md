# Q1 Factory self-test — 2026-09-10

Scenarios A-W from the 2026-09-08 master request (§29, §40) plus X-Z, AA (2026-09-09 leak-detective E2E gap regressions: parked legacy items never auto-started, design-review staleness scope, art-review state protection, Limited Human Exception cap) BB-FF (2026-09-09 legacy-clue-join r6 Human Decision: MECHANICAL_CONSISTENCY_REPAIR — stale reference alone is repair-eligible, downstream stale-claim survival routes to it and clears ESCALATED without resetting budgets, meaning-changing submissions are refused, budgets are never recovered or consumed by it, Product Identity blocks it outright), GG-LL (2026-09-09 legacy-clue-join r7 Human Decision: FACTUAL_EVIDENCE_CORRECTION — citation-does-not-support-claim corrections are budget-free at impact=none, narrowing_only allows a shrink into CORE/A-E/the adopted translation but refuses anything that grows, requires_new_design_choice is refused outright, citation-only downstream artifacts must use consistency-repair instead, budgets are never recovered or consumed even after a real repair, Product Identity blocks it outright), MM (2026-09-09 legacy-clue-join r8 Human Decision: the fact-correct guard is a containment/subsequence check, not a length check -- a same-or-shorter-length REPLACEMENT claim is refused, only a genuine removal is accepted), and NN (2026-09-09 legacy-clue-join r9 Human Decision: fact_sheet's containment check is fail-closed by default -- every field except an explicit metadata allowlist is checked, not just schema-required ones, so a replacement-attack moved to an extra field like candidate_reference_cards is still caught, and an undeclared brand-new field is refused outright), and OO (2026-09-09 legacy-clue-join r10 Human Decision: array narrowing matches items as an order-preserving subsequence, not index-paired, so dropping a middle item is accepted while reordering is not), run against the real scripts with fixture pipelines (game ids `selftest-*`, removed afterwards). Fixture review evidence is codex-review.mjs SHAPED ONLY (never a real review) and is deleted after the run.

Result: **41/41 PASS**

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
| BB | a stale-reference-only scope_core resubmission is accepted via consistency-repair without touching repair_count/redesign_count | PASS | mechanical |
| CC | a downstream stale-claim fix is accepted via consistency-repair and moves ESCALATED -> RETURNED without resetting either budget | PASS | mechanical |
| DD | changing ae.D, the ADOPTED translation's system_reaction, or anything in fact_sheet is refused by consistency-repair (must use normal repair/redesign) | PASS | mechanical |
| EE | repeated consistency-repair calls never change repair_count or redesign_count in either direction, even after a real repair already happened | PASS | mechanical |
| FF | an open Human Decision with Product Identity domains blocks consistency-repair entirely, regardless of what artifact type is targeted | PASS | mechanical |
| GG | a citation-does-not-support-claim correction (impact=none) is accepted via fact-correct without touching repair_count/redesign_count | PASS | mechanical |
| HH | narrowing_only accepts a shrink to ae/fact_sheet without touching budgets, but refuses a field that gets LONGER | PASS | mechanical |
| II | an evidence file declaring requires_new_design_choice is refused outright, even for fact_sheet itself | PASS | mechanical |
| JJ | no_manual_exploit_check (a citation-only downstream artifact) is not eligible for fact-correct — must use consistency-repair instead | PASS | mechanical |
| KK | fact-correct clears ESCALATED -> RETURNED like consistency-repair, and never changes repair_count/redesign_count even after a real repair already consumed budget | PASS | mechanical |
| LL | an open Human Decision with Product Identity domains blocks fact-correct entirely | PASS | mechanical |
| MM | a same-length REPLACEMENT claim is refused (containment check, not just a length check), while a genuine narrowing (dropping the item) is still accepted | PASS | mechanical |
| NN | a replacement attack moved to an extra (non-required) field is refused, a genuine narrowing of that same extra field is accepted, and an undeclared brand-new field is refused | PASS | mechanical |
| OO | dropping a MIDDLE array item is accepted as a narrowing (subsequence match, not index-paired), while reordering the same items is refused | PASS | mechanical |

Mechanically executed: every scenario above invoked `q1-pipeline.mjs` / `q1-trigger.mjs` / `q1-legacy-audit.mjs` / `task-state.mjs` for real and asserted on their exit codes and JSON output. Not exercised here (dry-run by design): a real Codex review, real image generation, a real browser QA run, and a real `git push` — those are exercised by the NEW Q1 demonstration and the release path respectively.
