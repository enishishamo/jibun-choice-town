You are an INDEPENDENT, ADVERSARIAL reviewer for JIBUN CHOICE (educational career-exploration
web game for Japanese elementary-school children, target age 10-12). This is the IMPLEMENTATION
review of a LEGACY LOCAL_REPAIR of the game forecast_and_balance (PowerGame — a power-grid
supply/demand balancer, event "heat-wave"), performed under the Q1 Autonomous Game Factory
(factory/rules/q1-autonomous-factory.md; pipeline record
factory/projects/legacy-forecast-and-balance/q1-pipeline.json; reverse audit
factory/state/legacy/reverse-audits/forecast_and_balance.json, classification LOCAL_REPAIR).

**Read `factory/rules/q1-first-play-standard.md` FIRST** (gates A-I, §3 BLOCKER list, and §6b —
the TEXT_ONLY_CONSEQUENCE finding is an established, Human-approved NON-BLOCKING precedent in
this codebase: factory/state/blocked-queue.md; do not re-raise it as HIGH unless this change made
it categorically worse).

**History (read the raw files, don't trust this summary):**
- factory/projects/q1-improve-power/review.result.json (round 1) and round2-review.result.json
  (round 2): the round-1 repair closed the original select-all exploit (hydro = 1-hour reserve,
  peak needs all three sources; all confirmed closed in round 2). Round 2 left two HIGH findings:
  (H1) the badge/bars judged the NEXT hour but sat unlabeled next to the current-usage number, so
  the 13:00 screen showed "使用量 4650" beside a red badge — a readable contradiction for a
  10-12 year old; (H2) at 17:00 (last hour) `checkDemandFor` fell back to the current hour's own
  demand for the badge, but `advance()` ended the day unconditionally, so "🔴 足りない" could be
  followed by success.
- This LOCAL_REPAIR claims to fix exactly H1 and H2 and nothing else.

**What changed (verify by reading the code):**
- src/q1/PowerGame.tsx: `nextHour` derived; the badge text is now prefixed with the hour it
  forecasts ("15:00 の見通し 🔴 足りない"; at the last hour "この時こく …"); the demand bar label
  names the forecast hour ("15:00 に使う量（予想）"; last hour "使う量"); `advance()` at the
  last step now requires `canCover(supply, cur.demand)` before `setDone(true)`, else
  `setBlackoutAt(cur.h)`.
- src/q1/powerLogic.ts: unchanged (checkDemandFor already falls back to the last hour's own
  demand — verify it matches what advance() now checks).
- factory/harness/gameplay-qa-power.mjs: simulate() mirrors the last-hour rule; two new checks
  (all-off at 17:00 → blackout at 17; the badge for that state is red). 23/23 PASS.
- Browser-verified (claimed): 13:00 badge "14:00 の見通し 🔴 足りない" with bar "14:00 に使う量
  （予想）"; correct play reaches 17:00; switching every source off at 17:00 shows "この時こく
  🔴 足りない" and pressing 夕方まで進める yields the 17時 blackout; no console errors.

Read: src/q1/PowerGame.tsx, src/q1/powerLogic.ts, factory/harness/gameplay-qa-power.mjs,
factory/projects/q1-improve-power/round2-review.result.json,
factory/projects/legacy-forecast-and-balance/implementation.json and implementation_qa.json.

Verify specifically:
1. Is H1 closed? Walk every screen 13:00–17:00 with the correct strategy and with the naive one:
   is there any remaining state where the mission-bar number, the badge, the bar label, and what
   `advance()` will actually do disagree or could be read as contradicting each other by a child?
   Is the new wording itself clear for a 10-12 year old ("の見通し", "（予想）", "この時こく")?
2. Is H2 closed? At the last hour, does the outcome of 夕方まで進める always agree with the badge
   colour (red ⇒ blackout, yellow/green ⇒ success)? Any off-by-one between `checkDemandFor(last)`
   and the value `advance()` checks?
3. Did the repair change D or the balance (hydro necessity at 15:00, naive all-on failing at 15:00,
   thermal+buy alone failing at the peak)? Re-derive the arithmetic from powerLogic.ts.
4. Does the harness's simulate() now match the component's advance() for ALL steps including the
   last one, or could the harness pass a plan the component fails (or vice versa)?
5. Any NEW defect (crash, stale state across restart, a label that leaks the answer — e.g. does
   naming the next hour's predicted demand on the bar hand the player the number they need
   without the forecast card, and is that acceptable given the demand graph card already shows
   it?).
6. Gates A-I fresh. Is this LOCAL_REPAIR release-ready?

Output (STRICT -- single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
