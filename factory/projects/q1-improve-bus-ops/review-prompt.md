You are an INDEPENDENT, ADVERSARIAL reviewer for JIBUN CHOICE (educational career-exploration
web game for Japanese elementary-school children, target age roughly 10-12). The game bus_ops
(a chartered-bus dispatcher, event "school-trip" chapter "バスを安全に走らせる") has just been
repaired for the first time under the current standard.

**Read `factory/rules/q1-first-play-standard.md` FIRST and apply it as the canonical standard.**
Key points: Q1's purpose is the FIRST-PLAY EXPERIENCE, not repeat-play mastery -- do not flag
memorization on a SECOND playthrough as HIGH/BLOCKER on its own. DO flag anything exploitable on
the very FIRST playthrough without reading/judging content: answer-leaking UI, a shortcut that wins
regardless of judgment, C not needed, D not affecting the outcome. Also apply the recent, hard-won
lesson from THIS SAME game family (bus_ops's sibling Q1 games line_debug and timetable were both
blocked this same day after their own repairs left a "win via one arbitrary/content-blind choice"
path open) -- specifically check whether bus_ops has that same class of residual defect, since it
uses a similarly small set of options.

**Why this task exists**: `factory/state/audits/audit-summary.md` (search "bus_ops") found GQ43/
CA55: "道路条件が固定され、山道は必ず失敗するため資料から唯一の安全入力を転記する構造になって
いる" -- the mountain route ALWAYS failed regardless of anything the player did (a hardcoded
`blocked = true` on every departure), so the only way to "succeed" was to always pick the coast
route for every bus -- a fact copy-able directly from the road-info card's flavor text, with zero
actual risk assessment, and with mountain existing only as bait with a guaranteed-wrong answer.

**This repair's claims** (verify by reading the code AND doing the arithmetic/logic yourself --
do not trust this summary or the producer's stated numbers):
- `src/q1/busOpsLogic.ts` (new, extracted pure logic matching the labCheckLogic.ts/clueBoardLogic.ts/
  factoryLineLogic.ts/timetableLogic.ts pattern): a shared departure-time choice (9:00 / 11:00 /
  13:00) now determines whether the mountain route is actually closed. The road-info card states
  the exact closure window (10:30-12:00), so only 11:00 is unsafe for mountain; 9:00 and 13:00 are
  completely safe. Coast remains safe at every departure time (a legitimate, always-valid, slower
  fallback -- 65 vs 45 minutes, and it needs a rest stop mountain doesn't).
- `hitsClosure(departureId, routes)` only returns true if the CHOSEN departure time is in the
  closure window AND at least one bus is actually routed via mountain -- an all-coast fleet is safe
  regardless of departure time (route choice still matters, not just timing).
- `src/q1/BusOpsGame.tsx`: the departure-time picker is required (alongside routes) before
  departure is allowed; the failure screen mentions time and route can both be changed.
- `factory/harness/gameplay-qa-bus-ops.mjs` (new) checks all of the above: each departure time's
  safety matches its declared `inClosure` flag, coast is always safe, no-selection never triggers a
  false hit, mountain is genuinely faster (a reason to want to use it), coast genuinely needs rest
  (its own real cost). 13 checks, all passing.

Read the actual code:
- src/q1/BusOpsGame.tsx (full component -- assign/route/run phases, the departure-time UI, the
  submit gating, the failure/success screens)
- src/q1/busOpsLogic.ts (DEPARTURE_TIMES, ROUTES, hitsClosure)
- factory/harness/gameplay-qa-bus-ops.mjs
- factory/state/audits/audit-summary.md (search "bus_ops" for the original finding)
- factory/rules/q1-first-play-standard.md (primary standard)

Specifically verify -- this is the most important check, given what happened to line_debug and
timetable this same day:
1. Is there a content-independent, first-play-discoverable shortcut that ALWAYS wins regardless of
   reading anything? Specifically: does "put every bus on coast, ignore the departure-time picker
   entirely (or pick any option blindly), fill capacity/drivers correctly" still always succeed
   without ever opening the road-info card or engaging with the closure logic at all? If so, is that
   itself a Gate C violation (the same class of defect line_debug's and timetable's repairs left
   open), or is an "always-safe, always-available conservative fallback" (real dispatchers can
   legitimately choose to never risk a closure) acceptably different from those two other cases --
   explain WHY it is or isn't, don't just assert it.
2. Is there any way to determine the safe departure time from something OTHER than actually reading
   the road-info card (e.g. an accidental visual or textual tell, or the fact that 2 of 3 options
   are safe making blind-guessing likely to succeed)? Compute the actual blind-guess success rate
   for "use mountain for at least one bus, pick a random departure time" and judge whether it's low
   enough to not be "win by submitting N times regardless of content" in spirit.
3. Walk through hitsClosure's logic precisely: can a player reach a false-negative (mountain used
   during closure but game says safe) or false-positive (mountain used outside closure but game
   says blocked) through any combination of inputs?
4. Does the "rest" mechanic (coast needing a rest stop) and the "capacity" mechanic (2 bands per
   bus) remain functioning and still require real engagement, unaffected by this change?
5. Any NEW defect: a crash, a case where `blocked` state leaks between the failure retry and a
   subsequent successful departure, console errors, or a QA harness check that doesn't verify what
   it claims.
6. Gate C (C NECESSITY), Gate D (D AUTHENTICITY), Gate E (NO ANSWER LEAK), Gate F (CONSEQUENCE) from
   the standard, evaluated fresh. Is bus_ops now release-ready?
7. Is the underlying dispatcher model (balancing capacity, driver assignment, route choice tied to a
   real time-window closure, and fatigue/rest management) authentic enough for the career depiction?

Output (STRICT -- single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
