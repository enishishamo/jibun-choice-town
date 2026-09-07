You are an INDEPENDENT, ADVERSARIAL reviewer for JIBUN CHOICE, continuing a review chain (round 2)
for timetable (event stage manager, event "town-festival" chapter "このままだと時間どおり終わら
ない！").

Read `factory/projects/q1-improve-timetable/review.result.json` (round 1) FIRST. It found 0
blockers but 2 HIGH:
- HIGH: the submit gate only required `line.length >= 4` (open + end + 2 optional acts), so a
  player could add literally ANY 2 optional acts and always win -- every 2-act lineup fit
  comfortably regardless of choice or order. The entire round-1 rebalance (making all-5-acts
  overflow, making some single-act-cuts order-sensitive) was irrelevant because the game never
  forced a player to reach that decision point at all.
- HIGH: the very first overtime submission immediately stated the full solution ("演目を減らすか、
  同じ作りの演目を続けて転換をへらしてみよう" -- reduce acts OR keep same-setup acts consecutive),
  a direct answer-leak handing over the grouping strategy before the player had done any reasoning
  or even necessarily opened the rule card.
It also flagged (MEDIUM) that the mission text ("このままだと時間どおり終わらない！" -- as it
stands, it won't finish on time) implied an already-overfull starting schedule, but the game
actually started with just open+end (nothing to trim), so the player never encountered the
situation the mission describes.

**Read `factory/rules/q1-first-play-standard.md`** as the canonical standard (FIRST-PLAY focus,
not repeat-play mastery; flag anything exploitable on the very first playthrough without reading
content).

**This round's fix** (verify by reading the actual code and doing your own arithmetic -- do not
trust this summary or the producer's stated numbers):
- `src/q1/TimetableGame.tsx`: the lineup now starts with EVERY act already included
  (`useState(ACTS.map((a) => a.id))`) instead of just open+end. This directly matches the mission's
  "already won't finish" framing (confirmed by a new QA check: the default order, completely
  unmoved, overflows END) and eliminates the "add just 2 acts and win" path entirely -- there is
  nothing to ADD at the start; the player's first available action is REMOVING something via the
  × buttons (the "waiting" pool only appears once at least one act has been removed).
- The overtime-failure message is now staged by attempt count (`overAttempts` state): the FIRST
  failure shows only the overage amount and a generic "change the count or order and try again",
  with NO mention of the same-setup-grouping strategy; only the SECOND and later failures gently
  point at the rule card ("🔁の資料も見てみて") without stating the grouping strategy outright.
- `factory/harness/gameplay-qa-timetable.mjs` gained a new check verifying the full default lineup
  (every act, in declared order, completely unmoved) genuinely overflows END -- i.e. the game
  really does start broken, not just theoretically overflowable in some other order. All 10 checks
  pass (the 9 from round 1, unaffected by this round's changes to the initial-state/hint logic, plus
  this new one).

Read the actual code:
- src/q1/TimetableGame.tsx (full component, especially the initial `line` state, the `waiting`
  pool's visibility condition, and the staged overAttempts hint logic)
- src/q1/timetableLogic.ts (unchanged from round 1 -- ACTS, START, END, SWAP, SAME, computeSchedule)
- factory/harness/gameplay-qa-timetable.mjs
- factory/projects/q1-improve-timetable/review.result.json (round 1, for exact prior findings)

Specifically verify:
1. Does the game genuinely start with all 5 optional acts (plus open/end) already in the lineup, in
   an overflowing state? Is there truly no way to reach a passing submission without removing at
   least one act first (i.e., is the OLD "just add 2" path structurally impossible now, not just
   discouraged)?
2. Is the "waiting" (再度追加できる演目) pool correctly hidden until at least one act has been
   removed, and does re-adding a removed act work correctly without reintroducing round 1's defect
   (e.g., could a player remove 4 acts then re-add exactly 2 of them and stumble into an easy,
   content-blind win -- is that meaningfully different from the original "just add 2" problem)?
3. Does the first overtime submission genuinely withhold the grouping strategy, and does the SECOND
   one still stop short of stating it outright (only gesturing at the rule card)? Is there any
   OTHER place in the UI (e.g. the persistently-visible rule card itself, always accessible) that
   already makes this a non-issue regardless of the staged wording -- i.e., is staging even
   meaningful given the card was always one tap away?
4. Does removing just the single "obviously biggest" act (band, 45 min) without ANY reordering at
   all still trivially succeed, the way round 1's evidence showed? If so, is that itself now a
   content-independent shortcut worth flagging (a player never needs to understand
   changeover/setup grouping AT ALL if "cut the longest act" always works on its own), or is one
   such easy path acceptable alongside the harder, more interesting "cut quiz and group carefully"
   path, given the standard's FIRST-PLAY (not exhaustive-optimality) framing?
5. Any NEW defect introduced by this round: a case where `overAttempts` doesn't reset appropriately,
   a case where the initial overflowing state renders incorrectly (wrong colors/classes on the
   already-broken schedule), console errors, or a QA harness check that doesn't actually verify
   what it claims.
6. Gate C (C NECESSITY), Gate D (D AUTHENTICITY), Gate E (NO ANSWER LEAK), Gate F (CONSEQUENCE) from
   the standard, re-evaluated fresh. Is timetable now release-ready, or does a genuine BLOCKER/HIGH
   remain?

Output (STRICT -- single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
