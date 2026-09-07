You are an INDEPENDENT, ADVERSARIAL reviewer for JIBUN CHOICE (educational career-exploration
web game for Japanese elementary-school children, target age roughly 10-12). The game
forecast_and_balance (a power-grid demand/supply balancer, event "heat-wave" chapter "電気を使う
量が、どんどん増えてる！") is on its ROUND 2 (and FINAL allowed) repair attempt. This is the ONE
auto-repair permitted by the AUTO REPAIR RULE -- if a genuine non-overridable HIGH/blocker remains
after this round, the task will be parked in `factory/state/blocked-queue.md` for Human Decision
rather than attempted again.

**Read `factory/rules/q1-first-play-standard.md` FIRST and apply it as the canonical standard.**

**Round 1 verdict** (`factory/projects/q1-improve-power/review.result.json`): FAIL, score 58, 0
blockers, 2 HIGH. The round-1 repair itself was praised as correctly closing the original audit
defect (GQ48/CA57 -- "全供給源を最初から稼働すれば予報も各電源の制約も無視して確実に勝てる": all
arithmetic paths for the guaranteed-win-immediately exploit were confirmed closed). The two HIGH
findings were:
1. A display-consistency bug: immediately after correctly surviving the 15:00 peak (hydro's
   1-hour budget spent on exactly the right hour), hydro auto-turns off, dropping the CURRENT
   displayed supply below the CURRENT hour's OWN demand -- so the badge falsely showed "🔴
   足りない" on an hour that had already been secured (the transition check that mattered had
   already passed with hydro included). This contradicted the actual game state and could confuse
   or wrongly punish/alarm a player who had done everything correctly.
2. TEXT_ONLY_CONSEQUENCE: the blackout failure screen communicates loss only via a static emoji
   row and explanatory sentences, no animated world-state change. This matches the
   ALREADY-ESTABLISHED, Human-approved non-blocking override precedent from this same session
   (clue_board, lab_check, line_debug, rx_check, and bus_ops all had this exact finding and it was
   confirmed non-blocking each time) -- treat it as override-eligible again here unless something
   about THIS game makes it categorically different from those precedents (explain why if so,
   don't just assert it).

**This round's fix for finding #1** (verify by reading the code AND doing the arithmetic yourself
-- do not trust this summary):
- `src/q1/powerLogic.ts`: new pure helper `checkDemandFor(step)` -- returns `HOURS[step+1].demand`
  when a next hour exists, otherwise falls back to `HOURS[step].demand` (the last hour, 17:00, has
  nothing left to preview).
- `src/q1/PowerGame.tsx`: the margin/badge/color AND the balance-bar's demand-bar width now all use
  `checkDemandFor(step)` instead of `cur.demand` as the comparison basis -- i.e. they always answer
  "will this current supply plan survive the NEXT advance", the exact same question `advance()`
  itself checks, rather than a question about the current (already-resolved) hour. This directly
  matches the existing copy's own forward-looking framing ("このまま進めたら、どうなるんだろう？").
  The top mission-bar's "電気の使用量：{cur.demand}万kW" text is unchanged (a factual readout of
  actual current usage, not a risk indicator, so it intentionally still shows the current hour's
  own number).
- `factory/harness/gameplay-qa-power.mjs`: added checks that `checkDemandFor` previews the correct
  next hour at every step and correctly falls back at the last hour, plus a direct regression test
  reproducing the exact round-1 bug scenario (supply=5250 at the 15:00 arrival after hydro
  auto-exhausts, comparing what the STALE logic would have shown -- red -- against what the FIXED
  logic shows -- confirmed not red). 21 checks total, all passing.
- Manually verified in-browser (Browser pane, dev server), replaying the exact correct-strategy
  path: at 14:00 (thermal+buy only, hydro not yet added) the badge correctly shows red (warning
  that advancing now, without hydro, WILL fail at 15:00 -- this is new/improved behavior, not a
  regression: it makes the warning MORE accurate and timely than before, since previously this
  same moment showed only "yellow"); after adding hydro and advancing to 15:00, hydro
  auto-exhausts as expected and the badge now correctly shows yellow (not the round-1 bug's false
  red), because it's comparing against 16:00's comfortably-covered demand; continuing through
  16:00 (green) and 17:00 (green) to a full, uninterrupted success. Also re-verified the round-1
  fix is intact: turning all 3 sources on at 13:00 and never touching them again still correctly
  fails at 15:00. No console errors on any path.

Read the actual code:
- src/q1/PowerGame.tsx (full component)
- src/q1/powerLogic.ts (HOURS, BASE_SUPPLY, SOURCES, HYDRO_BUDGET_HOURS, computeSupply, marginLevel, canCover, checkDemandFor)
- factory/harness/gameplay-qa-power.mjs
- factory/projects/q1-improve-power/review.result.json (round 1, for the exact HIGH text)
- factory/rules/q1-first-play-standard.md (primary standard)
- factory/state/blocked-queue.md (for the exact TEXT_ONLY_CONSEQUENCE override precedent language
  used elsewhere this same session, to confirm consistent application)

Specifically verify:
1. Walk through `checkDemandFor` for every step (0..4) yourself and confirm it always returns the
   correct next hour's demand, falling back only at the true last step. Does this fix fully close
   finding #1 -- i.e., is there ANY reachable game state (any combination of `on`, `hydroLeft`,
   `step`) where the displayed badge/color/margin still contradicts what `advance()` will actually
   do if the player proceeds right now? Check especially: right after `restart()`, right after
   hydro auto-exhausts, and at the very first screen (13:00, nothing turned on yet).
2. Does shifting the badge to a forward-looking (next-hour) basis introduce any NEW confusion or
   inconsistency -- e.g., does the mission-bar's factual "現在の使用量" number now visually clash
   with a badge that's silently answering a different (future) question, in a way that could
   mislead a 10-12 year old rather than just being a harmless "current status vs. risk forecast"
   split?
3. Is the TEXT_ONLY_CONSEQUENCE finding correctly still override-eligible per the established
   precedent, or does something about this specific implementation (e.g., the blackout screen's
   exact content) make it categorically worse than the clue_board/lab_check/line_debug/rx_check/
   bus_ops precedent cases?
4. Any NEW defect introduced by this round's change: crash, an off-by-one in `checkDemandFor`, a
   stale closure capturing an old `step`/`on` value, or a QA harness check that doesn't actually
   verify what it claims (e.g. does the harness's "stale vs fixed" comparison correctly model what
   the component's own state transitions actually produce, not just an idealized scenario)?
5. Gate C (C NECESSITY), Gate D (D AUTHENTICITY), Gate E (NO ANSWER LEAK), Gate F (CONSEQUENCE)
   from the standard, evaluated fresh, now that this correctness bug is addressed. Is
   forecast_and_balance now release-ready?
6. Re-confirm the round-1 fix itself hasn't regressed: does "turn all 3 sources on at 13:00 and
   never touch them again" still deterministically fail at 15:00? Does the correct
   forecast-aware strategy (hold hydro until the 14:00 screen) still deterministically succeed?

Output (STRICT -- single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
