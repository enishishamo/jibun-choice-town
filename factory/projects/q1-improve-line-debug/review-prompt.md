You are an INDEPENDENT, ADVERSARIAL reviewer for JIBUN CHOICE (educational career-exploration
web game for Japanese elementary-school children, target age roughly 10-12). The game line_debug
(a factory-line worker fixing a jammed ice-cream production line, event "ice-price" / 物価高編,
chapter "④ 工場") has just been repaired for the first time under the current standard.

**Read `factory/rules/q1-first-play-standard.md` FIRST and apply it as the canonical quality
standard for this review.** Key points, so you evaluate correctly even without reading the file:
- Q1's purpose is the FIRST-PLAY EXPERIENCE (curiosity -> active play -> use C -> judge/act D ->
  consequence -> think again if wrong -> honest outcome -> Job Reveal), NOT repeat-play mastery.
- Do NOT flag "a returning player could memorize the fixed case on a second playthrough" as a
  HIGH/BLOCKER on its own -- replayability/mastery is PLUS QUALITY only, per an explicit 2026-09-07
  Human Decision. `factory/rules/game-critic-v2.md`'s MASTERY/REPLAY requirements are amended to
  PLUS QUALITY for this kind of task.
- DO flag anything exploitable on the very FIRST playthrough without reading/judging content:
  answer-leaking UI, a shortcut that wins via position/pattern alone, submitting N times to force
  success regardless of content, or the player's operation not actually affecting the outcome.

**Why this task exists**: a pre-existing audit (factory/state/audits/audit-summary.md, weakest-10
list, entry #3) found line_debug at GQ39/CA57 with two real defects:
1. The line board painted a red "！" alert directly on the bottleneck station (s5, 包装/packaging)
   the moment the line started running, BEFORE the player ever tapped anything -- the answer to
   "which station is broken" was on the screen itself, so opening stations to compare data was
   never actually necessary.
2. Picking ANY single tweak (of 3 offered), or all three, always produced the exact same hardcoded
   "fixed" result (400->460 per hour, stop 12->3 min, waste 30->10) -- the player's actual choice
   never affected the outcome, so D (judgment/action) was cosmetic.

**This repair's claims** (verify by reading the code -- do not trust this summary):
- The red "！"/jam-highlight is removed entirely from `src/q1/FactoryLineGame.tsx`'s board render;
  a station's data (rate/stop/queue/loss) is only visible after the player taps it open.
- The player must open at least `MIN_STEPS_SEEN` (3 of 6) stations before the "which station is the
  cause?" choice UI even appears, forcing an actual comparison rather than a single lucky/blind tap.
- Of the 3 tweak options (ガイドの位置を変える / ラインの速さを変える / 切替えの条件を変える),
  only choosing "ガイドの位置を変える" (guide) reaches the full fix (`isFullFix` in the new
  `src/q1/factoryLineLogic.ts`); choosing the other two without it reaches an honest, distinct
  "done-partial" outcome where flow improves somewhat (stop time down) but the waste/loss number --
  the thing the case data specifically flagged as abnormal -- barely improves, via the new PARTIAL
  data table. This is NOT a fake-success disguise: the outcome is visibly, numerically different,
  and still lets the player continue (Job Reveal unaffected) via a new `onPartialComplete` wiring,
  matching the established pattern already used in clue_board/lab_check this same day.
- The bottleneck (s5) is NOT the single lowest-rate station in the data (s6, downstream, reads even
  lower at 200/h vs s5's 240/h, because it's starved by s5's problem, not broken itself) --
  deliberately, so a player can't shortcut by "find the lowest number" alone; the real signal is
  that s5 uniquely has BOTH elevated stop-time AND non-zero loss.
- `factory/harness/gameplay-qa-line-debug.mjs` (new) tests the pure logic in factoryLineLogic.ts:
  14 checks, all passing.

Read the actual code:
- src/q1/FactoryLineGame.tsx (the full component -- board render, "found"/"tuning"/"rerun"/"done"/
  "done-partial" phases)
- src/q1/factoryLineLogic.ts (BASE/FIXED/PARTIAL data tables, BOTTLENECK, MIN_STEPS_SEEN, TWEAKS,
  isFullFix)
- factory/harness/gameplay-qa-line-debug.mjs (do these checks actually verify what they claim?)
- factory/state/audits/audit-summary.md (search "line_debug" for the original finding)
- factory/rules/q1-first-play-standard.md (primary standard for this review)

Specifically verify:
1. Is there truly ZERO visual/textual indicator anywhere on the board (before or during running)
   that reveals which station is the bottleneck, before the player opens data themselves?
2. Can a first-time player identify the true cause by reading ONLY one data field (e.g. rate) in
   isolation, or does it genuinely require comparing multiple fields (stop AND loss) across
   stations? Is `MIN_STEPS_SEEN` enforced before the diagnosis UI appears?
3. Does the player's ACTUAL tweak selection determine the outcome (full vs. partial), traced through
   the real code path -- not just asserted by a comment? Can a player reach the full "done" outcome
   without including "guide", via any button-mashing, re-toggling, or edge case?
4. Is the partial outcome an HONEST, visibly different consequence (not just a re-skinned identical
   success), and does progression continue rather than dead-end?
5. Any remaining or NEW defect: a shortcut that still lets the player win without reading data
   (e.g., always guessing the same station id, or a a tell in emoji/icon/ordering); a UI dead-end;
   crash; broken transition between phases; console errors.
6. Gate C (C NECESSITY), Gate D (D AUTHENTICITY), Gate E (NO ANSWER LEAK), Gate F (CONSEQUENCE) from
   the standard, specifically re-evaluated against this repair.
7. Is factoryLineLogic.ts's real-world model (a packaging line jamming due to guide misalignment,
   diagnosed via stop-time + waste rather than raw throughput alone) authentic enough for a
   factory-line-worker career depiction, or does it misrepresent the job in a way career_authenticity
   should penalize?

Output (STRICT -- single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
