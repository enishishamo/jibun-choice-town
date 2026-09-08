You are the INDEPENDENT, ADVERSARIAL Q1 GAME DESIGN REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 3 of the DESIGN-STAGE
review of the NEW Q1 game "weather-forecaster" (気象庁の予報官). This is now DESIGN ITERATION 2
(a REDESIGN, not a third patch of iteration 1) under the Q1 Autonomous Game Factory
(factory/rules/q1-autonomous-factory.md): iteration 1's translation (t1-storm-night) was abandoned
after round-2 review found 2 genuine HIGH findings that a single local repair could not fix; the
adopted translation is now t1b-storm-night-team. Iteration 2 has a fresh repair budget (1 local
repair allowed) but this round-3 review is itself iteration 2's FIRST review — judge it as such,
not leniently because of the history.

**IMPORTANT — file version discipline (a round-2 review was corrupted by exactly this mistake):**
Read ONLY the exact file paths listed below. Every artifact type has exactly ONE current file;
do NOT read any other file in factory/projects/weather-forecaster/design/ that shares a base name
without the version suffix listed here (e.g. do NOT read `c_compression.json` or `play_seeds.json`
or `game_translations.json` or `game_translations_v2.json`/`_v3.json` — those are all SUPERSEDED
drafts kept only for the audit trail; reading them will produce a false finding). The single
source of truth for which file is current is
`factory/projects/weather-forecaster/q1-pipeline.json` (`.artifacts.<type>.file`) — you may check
it to confirm you are reading the right file, but the list below already matches it exactly:

- factory/projects/weather-forecaster/design/fact_sheet_v2.json (28+26=54 sources)
- factory/projects/weather-forecaster/design/fact_check_r1.json (the targeted fact-check backing v2)
- factory/projects/weather-forecaster/design/scope_core_v2.json
- factory/projects/weather-forecaster/design/ae_v2.json
- factory/projects/weather-forecaster/design/core_scope_check_v2.json
- factory/projects/weather-forecaster/design/play_seeds_v2.json
- factory/projects/weather-forecaster/design/reference_research_v2.json
- factory/projects/weather-forecaster/design/c_compression_v2.json
- factory/projects/weather-forecaster/design/game_translations_v4.json (adopted_translation_id: t1b-storm-night-team — READ THIS ONE ONLY for the translation; it also keeps the superseded t1-storm-night entry for the audit trail, marked with a `status`/`superseded_reason` field)
- factory/projects/weather-forecaster/design/state_table.json (the mechanic rules t1b implements; note warning_rule and cancel are both objects now, not the old flat strings)
- factory/projects/weather-forecaster/design/design-sim.mjs and design-sim-result.json (re-run it yourself: `node factory/projects/weather-forecaster/design/design-sim.mjs`)
- factory/projects/weather-forecaster/design/first_5_seconds_v3.json
- factory/projects/weather-forecaster/design/no_manual_exploit_check_v3.json
- factory/projects/weather-forecaster/design/core_back_check_v3.json
- factory/projects/weather-forecaster/q1-pipeline.json (history: see `failures` f-1 and f-2, and the `redesign` entry, for exactly what round 1 and round 2 found and what changed)

**Round-2 verdict** (factory/projects/weather-forecaster/design/design-review-r2.result.json):
FAIL, score 58, 0 blockers, 3 HIGH. Two were genuine and are what iteration 2 exists to fix:
1. CORE_DISTORTED_BY_GAME: the intermediate municipal 避難情報 card was textually framed as an
   independent judgment, but the state machine fired it deterministically every time a warning
   stood — the separation was cosmetic. Fix claimed: the card's text no longer claims the
   municipality "judges" anything; it states a fact (a different organization acts promptly while
   danger continues) and the design does not claim to model a divergent outcome.
2. FACTUAL_PROFESSION_ERROR: 解除 (cancellation) was allowed unconditionally at any time, contradicting
   the confirmed criterion (基準を下回り、再び上回らないと判断したとき). Fix claimed: cancel is now
   gated on "no rain falling on that town this step" (the checkable proxy for the confirmed
   criterion); illegal cancel attempts are rejected, not merely avoided by well-behaved strategies.
The third HIGH (claimed regression in c_compression.json/play_seeds.json) was found, on
investigation, to be a review-prompt authoring bug in round 2 (the prompt's read-list pointed at
stale v1 filenames instead of the already-correct v2 files) — NOT a genuine design defect. Verify
this yourself: check that c_compression_v2.json and play_seeds_v2.json (which you are reading in
this round) do NOT contain any terrain-tied threshold claim or a fictional "missed warnings delay
trust" mechanic, and that q1-pipeline.json's `artifacts.c_compression.file`/`artifacts.play_seeds.file`
already pointed at these v2 files even during round 2.

**Read `factory/rules/q1-first-play-standard.md` FIRST** (gates A-I, §3 RELEASE BLOCKER list) and
`factory/rules/principles.md` (A-E definitions; BLOCKER 禁止事項). Replayability/mastery is PLUS
QUALITY only.

Verify specifically, with evidence:
1. Is finding #1 (CORE_DISTORTED_BY_GAME) genuinely closed? Read game_translations_v4.json's
   t1b-storm-night-team system_reaction/D_externalization/job_reveal_bridge and state_table.json's
   warning_rule. Does the text now accurately describe a deterministic institutional handoff
   WITHOUT claiming an independent judgment that could diverge? Is this an honest simplification
   (stating what always happens, correctly) rather than the round-2 problem (claiming variability
   that doesn't exist)? Or does removing the claim of judgment now make the intermediate step
   pointless/confusing to a child — is there a better way to have raised this, and if so is it
   still a HIGH given the honesty fix, or does it become acceptable per Q1's target age and scope?
2. Is finding #2 (FACTUAL_PROFESSION_ERROR) genuinely closed? Read state_table.json's cancel rule
   and design-sim.mjs's cancel-gating code (the `curRain[id] > 0` check). RE-RUN
   `node factory/projects/weather-forecaster/design/design-sim.mjs` yourself and inspect the
   `cancel_gate` section of its output: does it actually demonstrate that an adversarial strategy
   which tries to cancel every standing warning every step (including while raining) has those
   attempts rejected (illegalCancelsAttempted > 0) and still fails to win all 3 paths? Construct
   your own adversarial cancel-abuse strategy if you doubt this is sufficient, and state the result.
3. Is finding #3 (the file-version claim) confirmed as a round-2 process error, or is there in fact
   still a real inconsistency between what core_back_check_v3.json / no_manual_exploit_check_v3.json
   CLAIM was fixed and what the actual v2/v4 artifacts contain?
4. Re-verify everything a fresh design review should check regardless of history: CORE integrity,
   SCOPE representativeness, Profession Name Hidden Test, A-E integrity, C necessity, D
   authenticity, C→D causality (walk through content-blind strategies again for t1b specifically,
   including the two adversarial cancel strategies), active play, consequence, think-again, honest
   outcome, job reveal, first 5 seconds / no-manual (first_5_seconds_v3.json — note this file's
   content is UNCHANGED from before the redesign; confirm it is still accurate for t1b, i.e. that
   nothing about the first-screen framing became inconsistent with t1b's later mechanics), answer
   leaks (color/label/position/visual hierarchy — including whether the disabled/grayed-out
   "解除する" button itself leaks anything), factual accuracy against fact_sheet_v2.json /
   fact_check_r1.json, fun.
5. For each defect you raise, name the pipeline failure code (factory/harness/q1-factory-schema.mjs
   FAILURE_ROUTES).

Severity calibration: BLOCKER = would fail §3 no matter how implemented; HIGH = must fix before
spec; implementation-only concerns = MEDIUM/LOW.

Output (STRICT — a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"..."}],
 "sim_verification":{"reran":true|false,"cancel_gate_confirmed":true|false,"notes":"..."},
 "round2_finding3_confirmed_as_prompt_bug":true|false,
 "evidence":["file — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
