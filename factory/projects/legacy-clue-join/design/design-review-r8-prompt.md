You are the INDEPENDENT, ADVERSARIAL Q1 GAME DESIGN REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 8 of the DESIGN-STAGE
review of the LEGACY REBUILD "legacy-clue-join" (医師, gameType `clue_join`), DESIGN ITERATION 3
(translation t1d-flexible-commit-and-defend). This pipeline's design-stage repair budget (1/1) and
redesign budget (2/2) are BOTH exhausted. Round 7 found 2 HIGH: (1) a genuine factual overclaim in
fact_sheet (a bilateral/butterfly-pattern discriminator for heart failure that its cited source
never stated, surviving in expertise/decisions despite 6 rounds only ever fixing the downstream
candidate card text) and (2) an audit finding against the Factory's own consistency-repair
mechanism (unrelated to this game's content, already fixed independently). A Human Decision
(2026-09-09) formally created a THIRD path, FACTUAL_EVIDENCE_CORRECTION, distinct from both design
repair/redesign and consistency-repair, specifically for removing/narrowing a claim that turns out
unsupported by its cited source — implemented as rules-as-code (factory/harness/q1-factory-schema.mjs
`checkFactCorrectionEligible`, enforced by `q1-pipeline.mjs fact-correct`, every submission checked
to have SHRUNK, never grown, every touched field) and does NOT touch repair_count/redesign_count.
**If this round finds ANY genuine HIGH/BLOCKER touching CORE/SCOPE/A-E/the adopted translation's
mechanic/a success-or-failure condition/Product Identity, this pipeline has no budget left and must
ESCALATE immediately** — judge with exactly the same rigor as round 1. Be especially alert to
whether the "narrowing" claimed this round actually stayed a narrowing, or quietly introduced a
replacement idea (that would be a disguised redesign, not a factual correction).

**What changed since round 7** (via `fact-correct`, verify each is ACTUALLY a shrink with nothing
new added, and via `consistency-repair` for everything that merely needed re-syncing): fact_sheet's
expertise[1]/decisions[1] no longer assert the bilateral-pattern claim (verified shorter than
before); ae.C no longer mentions unilateral-vs-bilateral (verified shorter); the ADOPTED
translation's C_interaction no longer mentions unilateral-vs-bilateral (verified shorter);
design-sim.mjs's own historical notes corrected to stop claiming the heart-failure card was
grounded for a bilateral pattern. scope_core/core_scope_check/play_seeds/reference_research/
c_compression/first_5_seconds/no_manual_exploit_check/core_back_check were resubmitted with NO
content change, purely to clear the staleness this correction cascaded downstream.

**File version discipline:** read `factory/projects/legacy-clue-join/q1-pipeline.json`
`.artifacts.<type>.file` FIRST for the exact current filename of every artifact type (several
changed this round) — then read only those files, plus:
- factory/projects/legacy-clue-join/design/design-sim.mjs and design-sim-result.json (RE-RUN:
  `node factory/projects/legacy-clue-join/design/design-sim.mjs`) — scoring logic is unchanged
  since r4/r5, confirm nothing regressed and that the required/optional/forbidden evidence sets
  never depended on the removed unilateral/bilateral axis (they never did — verify this yourself
  from the actual code, not just the claim)
- factory/projects/legacy-clue-join/q1-pipeline.json (`failures`, `redesign[0]`, `redesign[1]`,
  `fact_corrections`, `history` — note repair_count/redesign_count are unchanged across all of them)
- factory/harness/q1-factory-schema.mjs (`checkFactCorrectionEligible` — confirm the mechanism
  itself is sound: does "narrowing_only" genuinely prevent introducing a replacement idea, or could
  a shorter-but-different claim slip through?)
- factory/state/legacy/reverse-audits/clue_join.json; Context only: src/q1/DiagnoseGame.tsx,
  src/q1/ClueBoardGame.tsx, src/q1/clueBoardLogic.ts, src/data/content/medical.ts

**Read `factory/rules/q1-first-play-standard.md` FIRST** (gates A-I, §3 RELEASE BLOCKER list) and
`factory/rules/principles.md`. Replayability/mastery is PLUS QUALITY only (§4).

Verify specifically:
1. Is the bilateral-pattern claim now genuinely gone everywhere (fact_sheet, ae, the adopted
   translation, design-sim's own notes), and does the actual scoring logic (design-sim.mjs
   required={lab,xray}, optional={talk,exam}, forbidden={spo2,bp}) genuinely never depend on it (so
   removing it from prose changes nothing about what the game actually does)?
2. Did the "narrowing" introduce any REPLACEMENT content (a new claim, a new axis, new wording that
   changes meaning even if shorter)? Compare old vs new text for ae.C and the adopted translation's
   C_interaction carefully.
3. Re-run design-sim.mjs — confirm all verdict flags remain true.
4. A genuinely fresh, exhaustive pass, same bar as round 1: CORE/SCOPE representativeness
   (faithful to GAME_TRANSLATION_REBUILD after everything that has happened), Profession Name
   Hidden Test, C necessity, D authenticity, C→D causality, answer leaks, brute force (shuffle
   mechanism, 4-combination evidence window), honest outcome, retry/think-again gate (§2 gate G),
   no instruction line, factual accuracy against fact_sheet and its 4 cited sources (check ALL 4
   candidate cards' claims against their sources this time, not just heart failure), consistency
   with ch1-3, fun (§5), and whether this is NOW genuinely ready for GAME_SPEC (the 2 MEDIUM
   implementation-stage items — shuffle lifecycle, 375px layout — carry forward as required
   acceptance criteria, not design-stage blockers).
5. For each defect, name the pipeline failure code and severity, and say explicitly whether it
   touches CORE/SCOPE/A-E/the adopted mechanic/a success-or-failure condition/Product Identity
   (→ ESCALATE, no budget left) or is itself still just a reference/wording/factual-grounding issue
   that the existing consistency-repair or fact-correct paths could still handle (→ note it, do not
   fail the round over something those paths could fix, but be honest if it looks like more than a
   narrowing/reference fix).

Output (STRICT — a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","touches_protected_meaning":true|false,"still_fixable_via_consistency_or_fact_correct":true|false}],
 "bilateral_claim_fully_removed":true|false,
 "narrowing_introduced_no_replacement_content":true|false,
 "all_four_candidate_cards_source_supported":true|false,
 "sim_verification":{"reran":true|false,"all_flags_true":true|false,"notes":"..."},
 "ready_for_game_spec":true|false,
 "gate_bypass_found":true|false,
 "e_closes_inside_own_authority":true|false,
 "evidence":["file — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
