You are an INDEPENDENT, ADVERSARIAL reviewer for JIBUN CHOICE, continuing a review chain (round 2)
for line_debug (factory-line worker, event "ice-price", chapter "④ 工場").

Read `factory/projects/q1-improve-line-debug/review.result.json` (round 1) FIRST. It found 2
BLOCKERs and 4 HIGH in round 1's fix:
- BLOCKER: "select all" tweaks still won -- the UI allowed choosing multiple tweaks ("いくつでも"),
  and `isFullFix(tweaks)` returned true whenever "guide" was ANYWHERE in the selected set, so
  selecting all 3 always included guide and always won without any judgment.
- BLOCKER: diagnosis was a free, content-independent brute force -- opening any 3 of 6 stations
  (regardless of which) revealed the choice UI, and wrong guesses had no limit or cost, so clicking
  every station in turn always eventually hit the answer for free.
- HIGH: the flowing-ice "stuck" CSS animation always settled at a fixed screen position (left:64%)
  that lines up with the bottleneck's own board position, leaking the answer visually before any
  data was opened.
- HIGH: in the original data, ONLY the bottleneck station had any non-zero `loss` value, so
  checking that ONE field alone (no real multi-field comparison) was already sufficient.
- HIGH: the "guide" tweak's own description ("ひっかかりを減らす" -- "reduces catching/jamming")
  directly restated the diagnosis, handing over the answer's reasoning for free.
- HIGH: full and partial rerun showed the identical "smooth" flow animation, differing only in the
  ending screen's text/numbers -- weak world feedback.
Also read `factory/state/audits/audit-summary.md` (search "line_debug") for the original,
pre-existing defect this whole task exists to fix.

**Read `factory/rules/q1-first-play-standard.md`** as the canonical standard. Key points: Q1's
purpose is the FIRST-PLAY EXPERIENCE, not repeat-play mastery -- do not flag memorization on a
SECOND playthrough as HIGH/BLOCKER on its own. DO flag anything exploitable on the very FIRST
playthrough without reading/judging content (answer-leaking UI, brute force, C not needed, D not
affecting the outcome).

**This round's fix** (verify all of it by reading the actual code -- do not trust this summary):
- `src/q1/factoryLineLogic.ts`: `isFullFix` now takes a SINGLE tweak id (`string | null`), not an
  array/set -- there is no calling convention that represents "select everything". The UI
  (`src/q1/FactoryLineGame.tsx`, "tuning" phase) now renders the 3 tweaks as single-select (picking
  one deselects any previous pick), matching this signature.
- A new `MAX_DIAGNOSIS_ATTEMPTS` (1) caps wrong station guesses during diagnosis; exceeding it ends
  the chapter directly via a NEW "couldn't find the cause" partial outcome (numbers unchanged from
  BASE, since nothing was ever touched) -- distinct from the existing "found it, wrong tweak"
  partial outcome, via a `diagFailed` flag that changes the ending's title/text.
- `src/index.css`: the `iceStuck` keyframe now wobbles near the START of the line (~15-19%) instead
  of 64%, deliberately far from any station's actual board position. A new `.flow-ice.stutter`
  animation (visible hesitation partway through) is used for the "chose the wrong tweak" partial
  rerun, distinct from the smooth glide used for the correct-tweak full rerun.
- `factoryLineLogic.ts`'s BASE/FIXED/PARTIAL data: the non-bottleneck station s6 now also carries a
  small non-zero `loss` (4 in BASE) -- clearly less than the bottleneck's (30), but no longer zero,
  so "which station has ANY loss" alone no longer uniquely identifies the answer; magnitude must be
  compared.
- All three tweak descriptions were reworded to state only the literal equipment action, with no
  justification connecting it to why it would fix anything (e.g. guide's hint is now "包装フィルム
  の通り道の位置を、少し変える" with no "reduces jamming" clause).
- `factory/harness/gameplay-qa-line-debug.mjs` gained checks for all of the above (18 total, all
  passing).

Read the actual code:
- src/q1/FactoryLineGame.tsx (full component, especially the diagnosis onClick handler, the tuning
  phase's single-select rendering, and the two done-partial sub-cases)
- src/q1/factoryLineLogic.ts (data tables, isFullFix, MAX_DIAGNOSIS_ATTEMPTS)
- src/index.css (`.flow-ice`, `iceStuck`/`iceSmooth`/`iceStutter` keyframes, and confirm
  `.fstep.jam`/`.fstep-alert` were actually removed, not just unused)
- factory/harness/gameplay-qa-line-debug.mjs

Specifically verify:
1. Is there truly no way, via any UI interaction (multi-click, re-toggle, rapid clicking), to select
   more than one tweak at a time or otherwise reach the full fix without the tweak actually chosen
   being "guide" specifically?
2. Trace the diagnosis attempt-counting precisely: does opening stations (not guessing) ever
   consume a diagnosis attempt by mistake? Does the counter correctly persist across re-renders and
   correctly trigger the "couldn't find it" ending only after guessing wrong MORE than
   MAX_DIAGNOSIS_ATTEMPTS times, not before? Can a player still effectively brute-force success
   within the allowed attempts at a non-trivial rate, given 6 stations and a 1-wrong-guess budget?
3. Does the repositioned `iceStuck` animation avoid correlating with ANY station's actual position
   on the board (check the actual pixel/percent math, not just the intent)? Is there any OTHER
   remaining visual or textual tell (icon, ordering, size, color) that still leaks which station is
   the answer before data is opened?
4. With s6 now having its own non-zero loss, does distinguishing the true bottleneck genuinely
   require comparing magnitude across stations, or is there still a simpler single-field/single-tap
   shortcut (e.g., is stop time alone now sufficient, even if loss alone isn't)?
5. Do the 3 tweak descriptions read as genuinely comparable in specificity/register (none obviously
   "sounds right" or "sounds unrelated" by tone alone), forcing an actual data-based judgment?
6. Is the "couldn't find the cause" partial outcome reachable in practice (not dead code), and is it
   an honest, clearly-worse ending distinct from both the full success AND the "wrong tweak" partial
   outcome?
7. Any NEW defect introduced by this round: a phase transition that can get stuck, a state that
   doesn't reset correctly if the player leaves and re-enters, a case where `tweak` stays null but
   the confirm button is still enabled, console errors, or a QA harness check that doesn't actually
   test what it claims.
8. Gate C (C NECESSITY), Gate D (D AUTHENTICITY), Gate E (NO ANSWER LEAK), Gate F (CONSEQUENCE) from
   the standard, re-evaluated fresh against this round's changes. Is line_debug now release-ready,
   or does a genuine BLOCKER/HIGH remain?

Output (STRICT -- single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
