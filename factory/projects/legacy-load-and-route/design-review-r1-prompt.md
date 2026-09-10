You are the INDEPENDENT, ADVERSARIAL DESIGN REVIEWER for JIBUN CHOICE (a Japanese children's
career-exploration web game, target age 10-12). This is ROUND 1 of the design review for the
Legacy Q1 REBUILD "legacy-load-and-route" (給食食材の配送員、gameType load_and_route, 給食編). This
is a GAME_TRANSLATION_REBUILD: the reverse audit (factory/state/legacy/reverse-audits/
load_and_route.json) found the OLD implementation (src/q1/LogisticsGame.tsx) had
classification=GAME_TRANSLATION_REBUILD, exploit=memorize, player_judgment_required=false,
answer_leak=true, brute_force=true, GQ=58/CA=80 — the old game had 4 fixed cargo items with fixed
correct storage zones and 2 fixed schools with a hardcoded route order, zero randomization at all,
so a child could win every time by memorizing one fixed solution, and per-item failure messages
(e.g. "さばの温度が上がっています") let a brute-force "try every zone for every item" strategy
always eventually succeed too.

**IMPORTANT — exact current file paths.** This pipeline's artifact version numbers do NOT always
match the trailing "_vN" in the filename. The authoritative source is
`factory/projects/legacy-load-and-route/q1-pipeline.json`'s `artifacts.<type>.file`. As of this
round, CURRENT files are:
- fact_sheet: design/fact_sheet_v1.json (pipeline version 2)
- scope_core: design/scope_core_v1.json (pipeline version 2)
- ae: design/ae_v1.json (pipeline version 2)
- core_scope_check, play_seeds, reference_research, c_compression, game_translations,
  first_5_seconds, no_manual_exploit_check, core_back_check: all design/<type>_v1.json (pipeline
  version 1 each)
Do not read any other version-numbered file for these types as current truth.

Read, in this order: factory/rules/principles.md (BLOCKER list — ANSWER_LEAK, BRUTE_FORCE_SUCCESS,
C_NOT_NEEDED_FOR_D, D_REPLACED_BY_TRIVIA, CORE_DISTORTED_BY_GAME, FAILURE_DISGUISED_AS_SUCCESS
etc.); factory/rules/q1-first-play-standard.md; factory/state/legacy/reverse-audits/
load_and_route.json (the original audit finding); factory/projects/legacy-load-and-route/
research.md (the primary-source research this design is grounded in — read it in full, it's not
long); then the eleven CURRENT design files listed above, in pipeline order (fact_sheet ->
scope_core -> ae -> core_scope_check -> play_seeds -> reference_research -> c_compression ->
game_translations [adopted entry t1-zone-and-route — read the 2 rejected entries too] ->
first_5_seconds -> no_manual_exploit_check -> core_back_check); then design-sim.mjs,
design-sim-result.json, and route-tuning-notes.md — RUN THE SCRIPT YOURSELF
(`node factory/projects/legacy-load-and-route/design/design-sim.mjs`) and diff its stdout against
the committed design-sim-result.json (must match — note the file write may fail harmlessly in a
read-only sandbox with a printed warning; compare stdout to the committed file directly in that
case).

Verify specifically, with file:line evidence:
A. Factual grounding: does fact_sheet_v1.json's content genuinely match what research.md found
   (厚生労働省's storage-temperature table: raw fish 5℃, raw meat 10℃, frozen food -15℃, fresh
   vegetables ~10℃/avoid over-chilling, dairy 10℃, dry goods room temp; the "調理後2時間以内"
   deadline rule from 文部科学省/厚生労働省; that 検収 is the SCHOOL's job, not the delivery
   worker's)? Is fact_sheet honest that the OLD implementation's -18℃ frozen figure was
   unsupported (research.md found the real figure is -15℃, and -18℃ only appears for frozen eggs
   in the source table)? Is it honest that the specific school travel-time/deadline NUMBERS used
   in-game are NOT sourced (only the qualitative constraint structure is), per research.md's own
   explicit flag?
B. Is the OLD exploit (memorize a single fixed solution) genuinely closed? Verify design-sim.mjs's
   FOODS pool (8 entries, 3 zones represented) and the route model (TRAVEL_CHOICES/BETWEEN_CHOICES/
   DEADLINE_CHOICES) actually produce session-to-session variation — run the script and inspect
   `zone.results` and `route.results` yourself rather than trusting the summary.
C. THE DISCLOSED OPEN CONCERN (no_manual_exploit_check_v1.json's disclosed_open_concern,
   route-tuning-notes.md): the route-sequencing heuristics ("nearer first", "tighter deadline
   first") only fall ~14 percentage points below full reasoning (85.8%/85.5% vs 100%), a smaller
   margin than legacy-sow-and-grow's accepted 20.8pp. Is this margin adequate, or does it cross
   into "still too exploitable by a simple heuristic" territory? Give a clear verdict — if you
   judge it inadequate, propose a concrete parameter change (do the arithmetic yourself against
   the TRAVEL_CHOICES/BETWEEN_CHOICES/DEADLINE_CHOICES model in design-sim.mjs) rather than just
   flagging it.
D. Is the single-shot-commit design (no same-session retry, per game_translations_v1.json's
   retry_or_rethink and play_seeds_v1.json's s2-load-then-fix rejection) correctly justified? Verify
   the claimed BRUTE_FORCE_SUCCESS risk of an item-level-feedback retry loop is real by checking
   design-sim.mjs's model (would knowing "this specific food failed" meaningfully narrow the
   search space across a small number of retries, given only 3 zones and 4 items?).
E. Answer leaks: do the two school names (たんぽぽ小/けやき小) or the food category labels leak
   anything (distance, temperature) beyond what a legitimate reading of the disclosed numbers
   would reveal? Is card-order shuffling correctly specified as a MANDATORY design_spec/
   implementation requirement (no_manual_exploit_check_v1.json's position_leak field), not merely
   a deferred suggestion?
F. Scope/CORE consistency: does core_scope_check_v1.json's profession_name_hidden_test genuinely
   pass? Does the SCOPE (school-lunch delivery) stay reached honestly by this CORE?
G. Anything else rising to BLOCKER/HIGH per factory/rules/principles.md's list, using the
   FAILURE_CODES vocabulary in factory/harness/q1-factory-schema.mjs's FAILURE_ROUTES where
   applicable.

Severity calibration: BLOCKER = the game (as designed) would ship an answer leak, a fully
memorizable/brute-forceable win condition, or a CORE distortion. HIGH = a real defect that must be
fixed before GAME_DESIGN_READY (e.g. the route heuristic margin is genuinely too thin and needs a
concrete numeric fix, or a factual grounding gap/overreach). MEDIUM/LOW = polish, deferrable to
implementation. Do not invent findings beyond what's actually in the artifacts.

Output (STRICT — a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","file":"..."}],
 "checks":{"design_sim_ran":true|false,"design_sim_matches_committed_result":true|false,
 "memorization_exploit_genuinely_closed":true|false,"route_heuristic_margin_acceptable":true|false,
 "route_heuristic_margin_recommended_fix":"...","factual_grounding_plausible":true|false,
 "no_retry_justification_sound":true|false,"core_preserved_not_trivialized":true|false,
 "ready_for_game_spec":true|false},
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
