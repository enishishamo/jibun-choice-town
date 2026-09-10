You are the INDEPENDENT, ADVERSARIAL DESIGN REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 1 of the design review of
the Legacy Q1 REBUILD "legacy-hotel-receive" (ホテル・旅館の団体受入担当、gameType hotel_receive).

Read, in this order: `factory/rules/q1-first-play-standard.md`, `factory/rules/principles.md`; then
`factory/projects/legacy-hotel-receive/research.md` in full; then the full CURRENT design chain (all
`_v1.json` files per `q1-pipeline.json`'s `artifacts.<type>.file`, in
`factory/projects/legacy-hotel-receive/design/`, plus `design-sim.mjs` — READ THE FULL SOURCE and
RUN it: `node factory/projects/legacy-hotel-receive/design/design-sim.mjs`).

Context — the reverse audit that triggered this rebuild
(`factory/state/legacy/reverse-audits/hotel_receive.json`) found two things in the OLD
implementation (`src/q1/HotelReceiveGame.tsx`): (1) `brute_force` — wrong room/meal placements could
be retried at zero cost; (2) a decorative-data problem — the old game's 月組 (Tsuki group) card said
"wants to rest immediately on arrival due to bus sickness," but the win condition never used that
fact at all (read or not read, the result was identical).

This redesign's approach to (2) is unusual and is the single most important thing to verify: rather
than inventing a use for that datum, the design team commissioned fresh research (research.md §4)
specifically to check whether ANY real-world causal link exists between a group's stated rest need
and a hotel's room-assignment decision. The research found NONE — real practice is either a
property-level spare-room reservation made at booking time (not a per-group placement decision), or
reactive care after a student actually falls ill (handled by the chaperone, not hotel staff). Given
that, the redesign does NOT carry the rest-need datum forward into the game AT ALL — not as a real
mechanic, not as a disclosed simplification, not even as pure narrative flavor with zero gameplay
effect (which would just recreate the original decorative-data complaint in a new form). Verify this
was actually done: confirm no live design field (ae/game_translations/play_seeds) reintroduces a
"rest need" data point in any form, and that game_translations' t3 (rejected) correctly documents WHY
inventing a position-based rule for it was rejected.

Instead, the redesign's CORE mechanic uses the two causal links research.md found ARE specifically,
directly documented: (a) a group's declared food allergens (7 real items, matching the actual 食物
アレルギー事前調査票 form) directly determine 通常メニュー vs 個別対応食（別膳）; (b) a group's size
directly determines which real room type (トリプルルーム定員3／基準室定員4／特別室定員6, from a
published school-trip guide) it fits into. Verify both of these claims against research.md yourself
— do not take the design docs' citations at face value.

Specific things to verify adversarially:

1. **CORE_CAUSAL_MODEL_DISTORTED check**: re-read research.md §1-2 and confirm the room-capacity and
   allergy-meal claims are genuinely, specifically supported (not just "a broad category exists" —
   research.md needs to actually tie THIS SPECIFIC decision to THIS SPECIFIC data, the way
   legacy-move-try's later, more careful rounds required). Also check design-sim.mjs's `newGroup`
   function: group sizes are constructed to EXACTLY match one of the three room capacities (3, 4, or
   6) every session — confirm the design docs correctly disclose this as a simplification (real group
   sizes wouldn't always exactly match a capacity tier) rather than implying real school groups always
   arrive at exactly 3, 4, or 6 people.
2. **Exploit resistance**: RUN design-sim.mjs yourself, confirm all 6 checks pass, and independently
   sanity-check that the numbers make sense given the mechanic (no combinatorial axis-reading trick
   needed here since room and meal are independent per-group judgments — verify this simplicity isn't
   hiding an actual exploit, e.g. check whether a strategy that ignores BOTH cards for ALL 3 groups
   but somehow succeeds via display-order pattern-matching is actually prevented, e.g. by button-order
   shuffling being specified).
3. **BRUTE_FORCE_SUCCESS**: confirm the single-commit-per-group design genuinely closes the original
   audit finding (no retry after a wrong commit, per ae_v1.json/game_translations_v1.json).
4. **Gate H (HONEST OUTCOME)** and **Gate G (THINK AGAIN)**: confirm onComplete/onPartialComplete are
   correctly specified, and that the non-scored reflection step re-presents the original data
   (read-only) rather than just offering a re-pick with no context — this exact defect
   (THINK_AGAIN_CONTEXT_MISSING) was found in a prior game's implementation review; check it's
   addressed at the design level here.
5. **Answer leak**: check no_manual_exploit_check_v1.json's label_leak/position_leak/color_leak
   reasoning is actually sound, not just asserted.
6. **play_seeds plausibility**: s3 (skim-allergy-trap) and s4 (misjudge-then-reflect) are meant to be
   credible child-level errors that still satisfy the disclosure gate (both cards opened) — judge
   whether they read as genuine, relatable mistakes or as contrived scenarios.
7. **Career authenticity**: does the overall B/C/D genuinely reflect what a hotel/ryokan group
   reception worker does, per research.md, without distorting the real role split (school decides
   grouping; hotel decides room-type fit) or overstating the hotel worker's authority?

Severity calibration: BLOCKER = a genuine exploit/answer-leak/causal-realism error/CORE-distortion
exists. HIGH = a real defect that must fix before implementation. MEDIUM/LOW = polish, must NOT gate
PASS. If you find nothing rising to BLOCKER or HIGH, say so plainly — this is the first round for a
freshly, carefully researched design, so a clean PASS is a plausible outcome, but review with full
rigor regardless — do not go easy on it because of how the design chain frames its own carefulness.

Output (STRICT — a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","file":"..."}],
 "checks":{"design_sim_ran":true|false,"design_sim_result":"...","brute_force_closed":true|false,
 "rest_need_datum_not_reintroduced":true|false,"room_and_meal_mappings_grounded":true|false,
 "gate_g_data_represented":true|false,"gate_h_specified":true|false,"ready_for_implementation":true|false},
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
