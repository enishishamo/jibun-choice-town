You are an INDEPENDENT, ADVERSARIAL reviewer for JIBUN CHOICE (educational career-exploration
web game for Japanese elementary-school children, target age roughly 10-12). The game safety_plan
(a school-trip safety-lead/teacher, event "school-trip" chapter "100人の安全を守る") is on its
ROUND 2 (and FINAL allowed) repair attempt. This is the ONE auto-repair permitted by the AUTO
REPAIR RULE -- if a genuine non-overridable HIGH/blocker remains after this round, the task will be
parked in `factory/state/blocked-queue.md` for Human Decision rather than attempted again.

**Read `factory/rules/q1-first-play-standard.md` FIRST and apply it as the canonical standard.**

**Round 1 verdict** (`factory/projects/q1-improve-safety-plan/review.result.json`): FAIL, score 38.
Round 1 correctly closed the ORIGINAL audit defect (opening the allergy/motion-sickness cards was
pure ceremony -- now the content genuinely determines who must hold which role), but introduced a
NEW, more direct BLOCKER: the post-check issue text, on the very first failed check, stated the
exact literal rule outright ("花組の担当の先生が、救急用品を持つようにしよう。") -- so a player
could open both cards WITHOUT reading them, fail once, and copy the answer straight out of the
failure message. Gate C was bypassed by the repair's OWN feedback text. Two HIGH findings also
applied: (a) the 最後尾 (walk-at-the-back) role assigned to motion-sickness was an unmotivated,
invented pairing with no connection to the card's actual content (window seat, frequent breaks,
medicine); (b) the failure/success screens remain TEXT_ONLY_CONSEQUENCE (this half matches an
ALREADY-ESTABLISHED, Human-approved non-blocking precedent from elsewhere this session -- treat as
override-eligible again unless this implementation is categorically worse). A MEDIUM finding noted
that once `checked` became true it stayed true forever, letting a player watch `issues` update live
across any number of role changes -- a free, brute-forceable oracle.

**This round's fixes** (verify by reading the code AND doing the logic yourself -- do not trust
this summary):
- `src/q1/safetyPlanLogic.ts`: tsuki's (motion-sickness) required role changed from 最後尾 to 先頭
  (rationale: the front-walker sets pace and calls rest stops, which is what "こまめに休憩を" in the
  card is actually about -- unlike 最後尾, which has no connection to the card's content). The
  not-yet-opened messages ("花組の資料を、まだ確認していないよ。" / "月組の資料を、まだ確認してい
  ないよ。") no longer name the risk type (no "アレルギー"/"乗り物酔い"), only which band has an
  unread doc. The wrong-linkage messages, in EVERY reachable state (opened-and-wrong, at any point),
  now say only "🥜花組を担当している人と、役割の名前を見比べてみよう。資料も、もう一度たしかめて
  みて。" (or the 🚌月組 equivalent) -- they never name which specific role is correct, only nudge
  the player to compare the band's own adult against the role labels themselves (already visible on
  screen) and re-check the card. No staging/attempt-counting was added -- the hint is simply
  non-literal at every attempt, by construction.
- `src/q1/SafetyPlanGame.tsx`: the `checked` boolean was replaced with `revealed`, which resets to
  `false` the instant any of the 4 role assignments changes -- seeing the issues list again requires
  a fresh, deliberate "安全チェックをする" click each time, closing the live-oracle path (a player
  can no longer freely permute roles and watch feedback update in real time without re-submitting).
- `factory/harness/gameplay-qa-safety-plan.mjs` (rewritten, 17 checks, all passing): asserts no issue
  message in ANY reachable state contains the literal band->role phrasing; asserts the not-opened
  messages don't leak the risk type; asserts each link is independently detectable in isolation
  (fixing the round-1 harness bug where the "break tsuki" fixture accidentally also broke hana);
  asserts the specific hint stays gated behind having opened the doc; asserts a "same single adult
  in every role" fixed heuristic can satisfy AT MOST one of the two links (since hana's and tsuki's
  bands always get two DIFFERENT adults via the 1:1 assign-step mapping), never both at once; all
  pre-existing structural checks (every band assigned, head != tail, etc.) still pass; a fully
  correct, fully-informed plan has zero issues.
- Manually verified in-browser (Browser pane, dev server): assigned all 5 bands to 5 distinct
  adults; in the roles step, deliberately picked WRONG roles for both links, opened both cards,
  clicked check -- confirmed both hint texts appeared and neither named a specific role; changed one
  role -- confirmed the hints immediately disappeared (revealed reset), requiring a fresh check
  click; fixed both links -- confirmed the check then passed and Job Reveal showed the full-success
  chip. No console errors.

Read the actual code:
- src/q1/SafetyPlanGame.tsx (full component)
- src/q1/safetyPlanLogic.ts (ADULTS, computeIssues)
- src/q1/tripBands.ts (BANDS, including hana's/tsuki's `note` fields)
- factory/harness/gameplay-qa-safety-plan.mjs
- factory/projects/q1-improve-safety-plan/review.result.json (round 1, for the exact BLOCKER/HIGH text)
- factory/rules/q1-first-play-standard.md (primary standard)
- factory/state/blocked-queue.md (for the established TEXT_ONLY_CONSEQUENCE override precedent, and
  for the general class of "content-independent shortcut" defect that blocked several other Q1
  games this same session -- confirm this repair doesn't reopen that class in a new shape)

Specifically verify:
1. Walk through EVERY reachable combination of {openedDocs, placed, head/tail/medic/contact} and
   confirm no issue message, at any point, states or strongly implies the literal correct role for
   either band. Is the current wording ("役割の名前を見比べてみよう") genuinely non-leaking, or does
   it functionally amount to the same leak in slightly vaguer clothing (i.e., is there only ONE
   plausible role a 10-12 year old could infer from "見比べてみよう" combined with the visible role
   ICONS/LABELS, such that this is barely different from stating it outright)? If so, is that still
   an acceptable level of guidance given the standard's tolerance for natural, in-fiction nudges (cite
   the bus_ops/timetable precedent's own escalated-hint wording for comparison), or does it cross
   back into Gate C bypass territory?
2. Does the `revealed`-resets-on-role-change fix actually close the brute-force/oracle path, or is
   there a remaining way to get live feedback without an explicit re-check (e.g., does opening/
   closing an InfoCard, or switching steps, leave `revealed` true when it shouldn't)?
3. Is the round-1 HIGH about the 最後尾→先頭 relabeling now adequately motivated, or does swapping to
   先頭 introduce ITS OWN unmotivated-pairing problem (e.g., does 先頭's actual in-fiction
   responsibility, as understood by a 10-12 year old, plausibly connect to "watches for a
   motion-sick child and calls rest stops", or is this still a stretch)?
4. Is there STILL a content-independent shortcut -- e.g., can a player who never opens either card
   still succeed via a fixed, describable heuristic (not just "guess randomly forever", but a
   describable strategy) applied to the 5-adult/4-role/5-band search space? Walk through the "same
   adult everywhere" case and any other fixed pattern you can construct.
5. Any NEW defect: crash, a stale `revealed`/`placed` value across re-renders, or a QA harness check
   that doesn't verify what it claims.
6. Gate C (C NECESSITY), Gate D (D AUTHENTICITY), Gate E (NO ANSWER LEAK), Gate F (CONSEQUENCE) from
   the standard, evaluated fresh. Is safety_plan now release-ready?
7. Re-confirm the TEXT_ONLY_CONSEQUENCE finding from round 1 is still correctly override-eligible per
   the established precedent (cite it), and that nothing about this round's changes made the
   failure/success screens categorically worse than that precedent's other cases.

Output (STRICT -- single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
