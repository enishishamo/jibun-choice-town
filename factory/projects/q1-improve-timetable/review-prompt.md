You are an INDEPENDENT, ADVERSARIAL reviewer for JIBUN CHOICE (educational career-exploration
web game for Japanese elementary-school children, target age roughly 10-12). The game timetable
(an event stage manager building a same-day schedule, event "town-festival" chapter "このままだと
時間どおり終わらない！") has just been repaired for the first time under the current standard.

**Read `factory/rules/q1-first-play-standard.md` FIRST and apply it as the canonical quality
standard.** Key points: Q1's purpose is the FIRST-PLAY EXPERIENCE, not repeat-play mastery -- do
not flag memorization on a SECOND playthrough as HIGH/BLOCKER on its own. DO flag anything
exploitable on the very FIRST playthrough without reading/judging content: answer-leaking UI, a
shortcut that wins regardless of judgment, C not needed, D not affecting the outcome.

**Why this task exists**: `factory/state/audits/audit-summary.md` (search "timetable") found
GQ43/CA67: "全演目を選択しても15時までに収まり、中心となる取捨選択や転換最適化をせず成功できる"
-- selecting literally every optional act (band/dance/magic/singer/quiz) still finished before the
end time NO MATTER what order they were arranged in, including the worst possible changeover-heavy
order. The whole point of the game (weigh which acts to keep, group same-stage-setup acts together
to cut changeover time) was decorative: nothing the player did could ever cause failure once
they'd added every act, so nothing they did could ever be a meaningfully WRONG choice either.

**This repair's claims** (verify by reading the code and, most importantly, by doing the actual
arithmetic yourself -- do not trust this summary or the producer's stated numbers):
- `src/q1/timetableLogic.ts` (new, extracted pure logic matching the labCheckLogic.ts/
  clueBoardLogic.ts/factoryLineLogic.ts pattern): the end time was moved from 15:00 to 13:40
  (START stays 10:00), shrinking the available budget from 300 to 220 minutes, specifically so
  that even the BEST possible ordering of all 5 optional acts (open + all 5 + end, changeovers
  grouped as tightly as physically possible given each act's stage-setup type) now overflows.
  At least one act must always be cut.
- Which single act gets cut now matters differently: cutting the short "◯×クイズ" (20 min, "none"
  setup) leaves a lineup where even the BEST ordering barely fits but the WORST ordering overflows
  -- genuinely requires grouping band-setup acts together and light-setup acts together. Cutting
  any of the other 4 acts leaves enough slack that the lineup fits regardless of ordering.
- The オープニング/エンディング (open/end) acts are now pinned to the first/last position --
  `TimetableGame.tsx`'s `move()` refuses to move them or move anything into their slot -- since
  neither the fiction (an opening act mid-show makes no sense) nor the schedule math benefited from
  letting them drift.
- `factory/harness/gameplay-qa-timetable.mjs` (new) brute-forces all 5! = 120 orderings of the
  5 optional acts (not just a couple of hand-picked cases) to verify: no ordering of all 5 fits;
  cutting any single act makes SOME ordering fit; cutting at least one specific act requires a good
  ordering (worst case for it still overflows); cutting at least one other act is forgiving
  regardless of order. 9 checks, all passing.

Read the actual code:
- src/q1/timetableLogic.ts (ACTS, START, END, SWAP, SAME, computeSchedule)
- src/q1/TimetableGame.tsx (full component, especially the move() guard and the submit button's
  over/line.length checks)
- factory/harness/gameplay-qa-timetable.mjs (does the brute-force search actually cover what it
  claims -- all 120 orderings, not a subset?)
- factory/state/audits/audit-summary.md (search "timetable" for the original finding)
- factory/rules/q1-first-play-standard.md (primary standard for this review)

Specifically verify:
1. Redo the arithmetic yourself for at least: (a) the single best possible full-5-acts ordering's
   total finish time vs. END, (b) the worst-case ordering after cutting only "◯×クイズ", and (c)
   one ordering after cutting a different single act that the producer claims always fits regardless
   of order. Do your own numbers match the claims and the QA harness's output?
2. Is there any ordering of ALL 5 acts (not necessarily "best" by the producer's definition) that
   still fits, which the brute-force search might have missed due to a bug in computeSchedule or
   the harness's own permutation logic?
3. With open/end now pinned, does this actually reduce the game to a MEANINGFUL decision (which act
   to cut, how to order the rest), or does pinning them remove so much freedom that the "correct"
   solution becomes trivially obvious/unique in a way that removes genuine choice (Gate D)?
4. Is there any leftover UI/text hint that reveals which act is "safest" to cut, or which stage-setup
   grouping is required, BEFORE the player has read the 転換 (changeover) rule card and the each
   act's own setup type? (Gate E / Gate C)
5. Does the submit button still correctly refuse an over-time lineup (no fake success), and does the
   "at least 4 total" (>=2 optional acts) minimum-content nudge still make sense given the new,
   tighter budget?
6. Any NEW defect: a crash, a case where move() permanently locks something it shouldn't, a
   mismatch between what's displayed (fmt(END) etc.) and the actual END constant, or inconsistent
   flavor text (e.g. does anything still say "15:00" or reference the old budget anywhere)?
7. Gate C (C NECESSITY), Gate D (D AUTHENTICITY), Gate E (NO ANSWER LEAK), Gate F (CONSEQUENCE) from
   the standard, evaluated fresh against this repair. Is timetable now release-ready?
8. Is the underlying stage-manager model (balancing act runtimes against changeover costs driven by
   stage-setup type, within a fixed show window) authentic enough for the career depiction?

Output (STRICT -- single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
