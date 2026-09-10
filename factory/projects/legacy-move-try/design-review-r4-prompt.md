You are the INDEPENDENT, ADVERSARIAL DESIGN REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 4 of the design review
of the Legacy Q1 REBUILD "legacy-move-try" (理学療法士・退院後の動作能力評価、gameType move_try).

This is the LAST REPAIR available for design_iteration 2 (repair_count is now 1/1) — a further FAIL
here forces a REDESIGN (redesign_count would become 2/2, the maximum). Review rigorously regardless
of that — do not pass anything that doesn't hold up, but also do not manufacture findings.

**Round-3 verdict** (factory/projects/legacy-move-try/design-review-r3.result.json): FAIL 38,
1 BLOCKER (CORE_CAUSAL_MODEL_DISTORTED), 1 HIGH (implausible play_seeds s4 error). Do not
re-litigate anything round 1 or round 2 already confirmed closed (situp framing, Gate H specified,
mapping jointly-necessary, threshold precedent, visual feedback third-state).

Round-3's core finding: the v3 fix (a 4th "rest" candidate placed on the diagonal-Latin-square
repeat cells for standup and walk) was still causally distorted — research.md's D section ties
休憩・ペーシング (pacing/rest) specifically to 持久力/心肺機能 (endurance/cardiopulmonary capacity),
but v3 reused "rest" for standup's support-deficiency cell and walk's balance-impairment cell,
where resting does not causally address a missing support point or impaired dynamic balance.

Claimed fix this round (verify each yourself against the actual CURRENT files, not just the claim):

1. `design-sim.mjs` v4 (see the file's header comment for the full history) now uses 4 FULLY
   DISTINCT candidates for both standup and walk — no candidate appears in more than one
   (cause, condition) cell. Specifically:
   - `CANDIDATES.standup = ["height", "rail", "train", "compensate"]`:
     (legs, adjustable)->height, (legs, not_adjustable)->train, (support, adjustable)->rail,
     (support, not_adjustable)->compensate.
   - `CANDIDATES.walk = ["cane", "rest", "train", "compensate"]`:
     (balance, caregiver_yes)->cane, (balance, caregiver_no)->compensate,
     (endurance, caregiver_yes)->rest, (endurance, caregiver_no)->train.
   "compensate" (代償動作) is claimed to be a genuine, distinct PT intervention — a compensatory
   movement TECHNIQUE (e.g. leaning further forward before standing to avoid needing a grab point;
   walking with light contact along walls/furniture already in the home) — grounded in research.md
   citing 兵庫県理学療法士会's manual ("動作の代償方法（手すりの使い方、良い方の足を使う動作パターン
   等）"), distinct from 用具/環境調整 (height/rail/cane), 休憩・ペーシング (rest — now used ONLY
   for the endurance+caregiver_yes cell), and 訓練 (train). Verify:
   (a) RUN `node factory/projects/legacy-move-try/design/design-sim.mjs` yourself — confirm 8/8
   checks pass and all four single-axis-only measurements are genuinely close to 50%;
   (b) confirm by reading the CANDIDATES/newStandup/newWalk source directly that no candidate
   string appears in more than one cell for either movement (grep is a fine sanity check, but read
   the actual branching logic — a candidate could still be reachable from two cells through
   different code paths);
   (c) the crux: for EACH of the 8 cells (4 standup + 4 walk), is the assigned fix independently and
   specifically defensible for THAT cell's cause+condition combination, using only what research.md
   actually documents? In particular scrutinize "compensate" in its two cells (standup
   support+not_adjustable; walk balance+caregiver_no) — does a movement-compensation technique
   genuinely address a missing support point / impaired dynamic balance, or is this just the same
   "rest" problem wearing a new name (a plausible-sounding label without a specific causal
   mechanism)? Also check "rest" in its one remaining cell (walk endurance+caregiver_yes) — is
   caregiver presence specifically what makes supervised pacing appropriate, per research.md, or is
   that pairing still somewhat arbitrary?
2. HIGH (play_seeds s4 implausibility) — claimed fix: s4 no longer has the child read "height
   cannot be adjusted" and then pick height adjustment anyway. It now has the child correctly read
   BOTH the cause data (下肢筋力不足) and the environment data (height not adjustable), but then
   pick "手すり" (rail) instead of "train" — reasoning "if height can't be adjusted, a rail would
   help instead," conflating a fix for a SUPPORT-point deficiency with a fix for a LEG-STRENGTH
   deficiency. Verify this is now a credible, relatable child-level judgment error (a genuine
   synthesis/mapping mistake, not a direct contradiction of a just-read fact) and that it remains
   consistent with the disclosure gate (both cards opened before commit).

Also independently re-check the full chain for any remaining stale reference to the rejected v2/v3
mapping (any cell still described as "height helps regardless of cause," "杖は省エネ," or "rest"
appearing anywhere other than walk's endurance+caregiver_yes cell) — grep is a useful first pass but
confirm by reading, since this is the second time a superficially-fixed round left residue.

Read, in this order: `factory/rules/q1-first-play-standard.md`, `factory/rules/principles.md`; then
`factory/projects/legacy-move-try/research.md` (re-verify the "compensate"/代償動作 grounding is
real, specifically re-read the 兵庫県理学療法士会マニュアル citation in the D section and the
"(3)" section on 鍛える vs 用具/休息, and confirm research.md does NOT claim any single fix works
"regardless of cause"); then the full CURRENT design chain (all `_v4.json` files per
`q1-pipeline.json`'s `artifacts.<type>.file`, in `factory/projects/legacy-move-try/design/`, plus
`design-sim.mjs` — READ THE FULL SOURCE and RUN it).

Severity calibration: BLOCKER = a prior round's finding is not actually closed, or a NEW genuine
exploit/answer-leak/causal-realism error/CORE-distortion exists. HIGH = a real defect that must fix
before implementation. MEDIUM/LOW = polish, must NOT gate PASS. If you find nothing rising to
BLOCKER or HIGH, say so plainly — a genuine, clean PASS is the expected outcome if the fixes hold
up; do not manufacture findings to justify another round. But also do not pass a defect just because
this is the last repair before a REDESIGN would be required — if the causal grounding is still
weak, say so clearly; a REDESIGN (or ESCALATE if a sound design genuinely isn't reachable within
research.md's documented facts) is a legitimate outcome, not a failure to avoid.

Output (STRICT — a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","file":"..."}],
 "round3_findings_confirmed_closed":{"all_cells_independently_grounded":true|false,
 "compensate_candidate_genuinely_distinct_from_rest":true|false,
 "play_seeds_s4_plausible":true|false},
 "checks":{"design_sim_ran":true|false,"design_sim_result":"...","no_axis_constant_branch":true|false,
 "no_candidate_reused_across_cells":true|false,"no_stale_prior_mapping_references":true|false,
 "ready_for_implementation":true|false},
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
