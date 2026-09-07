You are an INDEPENDENT, ADVERSARIAL reviewer for JIBUN CHOICE (educational career-exploration
web game for Japanese elementary-school children, target age roughly 10-12). The game
forecast_and_balance (a power-grid demand/supply balancer, event "heat-wave" chapter "電気を使う
量が、どんどん増えてる！") has just been repaired for the first time under the current standard.

**Read `factory/rules/q1-first-play-standard.md` FIRST and apply it as the canonical standard.**
Key points: Q1's purpose is the FIRST-PLAY EXPERIENCE, not repeat-play mastery -- do not flag
memorization on a SECOND playthrough as HIGH/BLOCKER on its own. DO flag anything exploitable on
the very FIRST playthrough without reading/judging content: answer-leaking UI, a shortcut that
wins regardless of judgment, C not needed, D not affecting the outcome. Also apply the recent,
hard-won lesson from THIS SAME session's other Q1 repairs (line_debug, timetable, and bus_ops were
ALL found, across their own repair rounds, to have left a "win via one arbitrary/content-blind
choice, ignore the resource constraints entirely" path open even after an initial fix) --
specifically check whether this repair has that same class of residual defect from a different
angle, since power_and_balance also has a small number of discrete choices (3 supply sources, 5
hourly steps).

**Why this task exists**: `factory/state/audits/audit-summary.md` (search "forecast_and_balance")
found GQ48/CA57: "全供給源を最初から稼働すれば予報も各電源の制約も無視して確実に勝てる" -- turning
on all 3 supply sources immediately at 13:00 and never touching anything again used to guarantee
success for the whole day, because thermal(+300)+buy(+250) alone already exceeded the OLD peak
demand (5200) with room to spare. The temperature-forecast card and demand-graph card (both
already present, both already narratively pointing at 15:00 as the peak) were purely decorative --
never mechanically load-bearing.

**This repair's claims** (verify by reading the code AND doing the arithmetic yourself -- do not
trust this summary or the producer's stated numbers):
- `src/q1/powerLogic.ts` (new, extracted pure logic matching the labCheckLogic.ts/clueBoardLogic.ts/
  busOpsLogic.ts pattern): peak demand (15:00) raised from 5200 to 5300万kW. Hydro (+200) now has a
  hard, ONE-TIME-PER-DAY budget of exactly 1 hour of use (`HYDRO_BUDGET_HOURS = 1`) -- once its
  budget is spent (consumed on any hour where it was switched on when `advance()` is called), it
  auto-switches off and its button becomes permanently disabled for the rest of that playthrough.
  Thermal and buy remain freely toggleable with no budget limit (only their emoji/flavor notes
  reference limits, unchanged from before).
- Numerically: thermal+buy alone = 5250万kW, which is now LESS than the new peak (5300) -- hydro is
  therefore mandatory specifically at 15:00, not optional. Any 2-of-3 combination is insufficient
  at the peak; all 3 are required simultaneously. No single source, and no 2-source combination,
  carries the whole day.
- `src/q1/PowerGame.tsx`: turning hydro on early (e.g. at 13:00, alongside the other two) spends its
  only hour on an hour that didn't need it (13:00->14:00 demand is comfortably covered without it),
  leaving nothing in reserve for the 14:00->15:00 advance -- which now fails deterministically
  (blackout at 15:00) with these numbers. Reaching 15:00 successfully requires holding hydro back
  and switching it on specifically for the 14:00->15:00 advance (i.e., roughly informed timing, not
  necessarily literal document-reading -- the balance-bar's own live "余裕が少ない" warning at 14:00
  already nudges toward adding more capacity before that specific advance).
- `factory/harness/gameplay-qa-power.mjs` (new, 14 checks, all passing): simulates full-day
  strategies against the pure logic -- confirms "turn everything on at 13:00, never touch again"
  now fails at 15:00; confirms holding hydro until the 14:00 screen succeeds for the whole day;
  confirms doing nothing fails immediately; confirms thermal+buy alone (hydro never used) fails at
  the peak; confirms no single source survives the day; confirms hydro cannot be reactivated once
  its 1-hour budget is spent even if the player keeps trying.
- Manually verified in-browser (Browser pane, dev server): (a) turn all 3 on at 13:00, never touch
  again -> blackout at 15:00 exactly as intended; (b) thermal+buy from 13:00, add hydro at the 14:00
  screen before advancing -> full success through 17:00, hydro correctly shown exhausted/disabled
  after the 15:00 advance. No console errors on either path.

Read the actual code:
- src/q1/PowerGame.tsx (full component)
- src/q1/powerLogic.ts (HOURS, BASE_SUPPLY, SOURCES, HYDRO_BUDGET_HOURS, computeSupply, marginLevel, canCover)
- factory/harness/gameplay-qa-power.mjs
- factory/state/audits/audit-summary.md (search "forecast_and_balance" for the original finding)
- factory/rules/q1-first-play-standard.md (primary standard)
- factory/state/blocked-queue.md (for the exact class of "content-independent dominant/default
  path" defect that blocked line_debug, timetable, and bus_ops this same day in this same
  session -- confirm this repair's fix actually closes that defect class for THIS game rather than
  reopening it in a new shape, the way bus_ops's own round-1 fix initially did)

Specifically verify -- this is the most important check, given the pattern this same session:
1. Is there ANY content-independent, first-play-discoverable sequence of toggles that guarantees
   success regardless of when in the day it's applied? Specifically check: (a) turn on all 3
   immediately and never touch them again (should now fail -- confirm the exact math); (b) turn on
   all 3 immediately, then IMMEDIATELY turn hydro back off again after one advance and back on
   later -- does the budget-tracking correctly prevent reusing hydro, or is there a toggle-off/
   toggle-on loophole that resets or refunds its budget?
2. Is 15:00 the objectively correct/necessary hour for hydro, or could a player succeed by
   guessing ANY other hour to spend hydro's one hour, making the "peak" irrelevant in practice
   (i.e., is the margin at other hours generous enough that a wrong guess still succeeds)? Compute
   this precisely for all 5 possible "which hour do I turn hydro on" choices.
3. Does the balance-bar / margin warning ("余裕が少ない") appear at exactly the hours where it
   should (i.e., does it reliably telegraph danger before the player commits to advancing into a
   blackout), and does it ever falsely re-color a genuinely safe hour as dangerous or vice versa?
4. Any way to reach a blackout-avoidance WITHOUT genuine forward planning -- e.g., is the
   1-hour-remaining margin so forgiving that "add hydro reactively the instant the bar turns
   yellow/red, every single hour, no forecast reading needed" trivially succeeds regardless of
   which hour that first happens to be?
5. Any NEW defect: crash, a QA harness check that doesn't verify what it claims, a stale `on` state
   leaking across `restart()`, or a hydro-budget edge case (e.g. off-by-one in when the budget is
   decremented relative to which hour's demand check it protects).
6. Gate C (C NECESSITY), Gate D (D AUTHENTICITY), Gate E (NO ANSWER LEAK), Gate F (CONSEQUENCE)
   from the standard, evaluated fresh. Is forecast_and_balance now release-ready?
7. Is the underlying power-grid dispatcher model (a fixed demand curve, a genuinely scarce fast-
   reserve resource, freely-dispatchable baseload additions) authentic enough for the career
   depiction, or does the new hydro-scarcity mechanic feel arbitrary/gamey rather than realistic?

Output (STRICT -- single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
