You are an INDEPENDENT, ADVERSARIAL reviewer for JIBUN CHOICE (educational career-exploration
web game for Japanese elementary-school children, target age roughly 10-12). The game bus_ops
(a chartered-bus dispatcher, event "school-trip" chapter "バスを安全に走らせる") is on its
ROUND 2 (and FINAL allowed) repair attempt. This is the ONE auto-repair permitted by the AUTO
REPAIR RULE — if a genuine non-overridable HIGH/blocker remains after this round, the task will
be parked in `factory/state/blocked-queue.md` for Human Decision rather than attempted again.

**Read `factory/rules/q1-first-play-standard.md` FIRST and apply it as the canonical standard.**

**Round 1 verdict** (`factory/projects/q1-improve-bus-ops/review.result.json`): FAIL, score 43.
BLOCKER: an all-coast fleet at ANY departure time produced the IDENTICAL full-success outcome as
correctly using mountain when it was safe — so the road-info card and the departure-time picker
were never actually needed; coast was mechanically dominant. HIGH findings: (1) blind mountain
play succeeded 2 of 3 departure times (too permissive, 66.7% first-attempt success without
reading anything); (2) the consequence was TEXT_ONLY (no visible world-state change, just an
emoji + sentence) — this one is a KNOWN, ALREADY-ESTABLISHED override precedent (matches
clue_board/lab_check/line_debug/rx_check's TEXT_ONLY_CONSEQUENCE pattern in this same codebase,
confirmed non-blocking by prior Human Decision) — do not re-flag it as blocking unless something
about THIS game's implementation makes it categorically worse than those precedents; (3) the
first failure named the road-info document and both solution dimensions outright (time AND
route), skipping the staged-hint requirement.

**This round's changes** (verify by reading the code AND doing the arithmetic yourself — do not
trust this summary):
- `src/q1/busOpsLogic.ts`: `DEPARTURE_TIMES` rebalanced so only 1 of 3 times (14:00) is safe for
  mountain (was 2 of 3) — the closure window is now stated as 9:00–13:00 in the road-info card,
  matching `inClosure` on 9:30 and 11:00. New `mountainSafe(departureId)` helper. New
  `isOptimalPlan(departureId, routes)`: returns `false` (suboptimal) if mountain was actually
  safe for the chosen departure time AND at least one bus is needlessly on coast; returns `true`
  otherwise (including when coast was the only safe choice — not a compromise in that case).
- `src/q1/BusOpsGame.tsx`: the success screen now branches on `isOptimalPlan` — a fully-optimal
  plan (all-mountain when safe, or all-coast when mountain was genuinely unsafe) shows the
  original green "無事に走らせられた！" card and calls `onComplete`; a plan that used coast when
  mountain was safe shows a neutral (non-green) "ちょっと遠回りだった" card with an honest
  in-fiction explanation ("この時こくなら山道も安全だった。海沿いルートは、こういうときは遠回り
  になる。") and calls `onPartialComplete ?? onComplete` (matches the established
  RxCheckGame.tsx partial-outcome pattern — Job Reveal still happens, just shows the 🤔 chip
  instead of 🎉). The closure-failure screen now stages its hint: first failure shows only the
  consequence ("予定どおりには走れなかった。組みなおしてみよう。" — no document reference, no
  solution dimensions); the SECOND and later failures point at the road-info document without
  restating the answer ("🚧道路情報の資料をもう一度見てみよう。手がかりがあるはず。").
- `factory/harness/gameplay-qa-bus-ops.mjs`: updated for the new DEPARTURE_TIMES ids
  (t930/t11/t14) and adds checks for `mountainSafe` and `isOptimalPlan`, including the specific
  regression case this round exists to fix (all-coast-on-a-safe-day must NOT be optimal). 23
  checks, all passing.
- Manually verified in-browser (Browser pane, dev server): (a) all-mountain + 9:30 (unsafe) →
  closure failure, staged hint correctly escalates only on the SECOND failure, not the first; (b)
  all-mountain + 14:00 (safe) → full green success; (c) all-coast + 14:00 (safe, but coast wasn't
  needed) → the new neutral "ちょっと遠回りだった" card, and Job Reveal correctly shows the 🤔
  (partial) chip instead of 🎉. No console errors in any path.

Read the actual code:
- src/q1/BusOpsGame.tsx (full component)
- src/q1/busOpsLogic.ts (DEPARTURE_TIMES, ROUTES, hitsClosure, mountainSafe, isOptimalPlan)
- factory/harness/gameplay-qa-bus-ops.mjs
- factory/projects/q1-improve-bus-ops/review.result.json (round 1, for the exact blocker/high text)
- factory/rules/q1-first-play-standard.md (primary standard)
- factory/state/blocked-queue.md (for the TEXT_ONLY_CONSEQUENCE override precedent language, and
  to see the class of "content-independent dominant default path" defect that blocked line_debug
  and timetable this same day — confirm bus_ops's fix actually closes that same defect class
  rather than reopening it in a new shape)

Specifically verify:
1. Is the round-1 BLOCKER actually closed? Walk through `isOptimalPlan` yourself: for a safe day
   (mountain unsafe=false), does an all-coast fleet get a WORSE (not identical) outcome than an
   all-mountain fleet? For an unsafe day, does an all-coast fleet (the only valid choice) still
   get the fully-optimal outcome (not incorrectly penalized)? Any missed case (e.g. a MIXED fleet
   on a safe day — some buses on mountain, some needlessly on coast)?
2. Recompute the blind-guess success rate: "use mountain for at least one bus, pick a random
   departure time" — is 1-of-3 low enough to no longer be "win by submitting N times regardless
   of content" in spirit? Is the FIRST listed departure option (9:30) itself unsafe (no free
   deterministic first-try win)?
3. Does the "outcome differs by route quality" fix ITSELF introduce a new problem — e.g. does it
   make coast strictly WORSE in every case (turning it from "legitimate conservative fallback"
   into "never rational to choose", which would be its own authenticity problem), or is it only
   worse when mountain was demonstrably safe and unused (the correct scope)?
4. Is the staged hint on the closure-failure screen genuinely staged (verify the exact state
   variable and its increment site — does the SECOND failure correctly get the escalated hint, or
   is there an off-by-one making it escalate one attempt too late/early)? Does the first-failure
   text avoid naming the road-info document or either solution dimension?
5. Any NEW defect: crash, stale `blocked` state leaking between retries, a QA harness check that
   doesn't verify what it claims, or a departure/route combination that was reachable in round 1
   but is now unreachable or behaves inconsistently.
6. Gate C (C NECESSITY), Gate D (D AUTHENTICITY), Gate E (NO ANSWER LEAK), Gate F (CONSEQUENCE)
   from the standard, evaluated fresh. Is bus_ops now release-ready?
7. Per the standing precedent, is the TEXT_ONLY_CONSEQUENCE finding (HIGH #2 from round 1) still
   present, and if so, is it correctly classified as override-eligible (non-blocking) per the
   established clue_board/lab_check/line_debug/rx_check precedent, or does something about THIS
   game make it categorically different?

Output (STRICT -- single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
