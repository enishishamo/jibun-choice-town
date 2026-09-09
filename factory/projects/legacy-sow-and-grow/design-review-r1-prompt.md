You are the INDEPENDENT, ADVERSARIAL DESIGN REVIEWER for JIBUN CHOICE (a Japanese children's
career-exploration web game, target age 10-12). This is ROUND 1 of the design review for the
Legacy Q1 REBUILD "legacy-sow-and-grow" (農家・生産者、gameType sow_and_grow, 給食編). This is a
GAME_TRANSLATION_REBUILD: the reverse audit (factory/state/legacy/reverse-audits/sow_and_grow.json)
found the OLD implementation (src/q1/FarmGame.tsx) had classification=GAME_TRANSLATION_REBUILD,
exploit=memorize, player_judgment_required=false, GQ=52/CA=72 — the old game's result was fully
determined by which of 3 fixed varieties the child picked once (fixed month/deadline/forecast
every session), so a child could win by memorizing "always plant あかね夏" without reading
anything. This round proposes a full redesign at and downstream of GAME_TRANSLATION (CORE/SCOPE/
A-E were also refreshed against real primary sources during this rebuild, since the reverse-audit
backfill had only placeholder/unverified content — read the fact_sheet's revision_note for why).

Read, in this order: factory/rules/principles.md (the BLOCKER list — ANSWER_LEAK, BRUTE_FORCE_
SUCCESS, C_NOT_NEEDED_FOR_D, D_REPLACED_BY_TRIVIA, CORE_DISTORTED_BY_GAME, FAILURE_DISGUISED_AS_
SUCCESS etc.); factory/rules/q1-first-play-standard.md; factory/state/legacy/reverse-audits/
sow_and_grow.json (the original audit finding); then IN ORDER: fact_sheet_v2.json, scope_core_v3.json,
ae_v3.json, core_scope_check_v2.json, play_seeds_v2.json, reference_research_v2.json,
c_compression_v2.json, game_translations_v2.json (adopted entry t1-season-deadline-match — read
the other 2 rejected entries too, they explain what was ruled out and why), first_5_seconds_v1.json,
no_manual_exploit_check_v3.json (note the exploit_check.disclosed_open_concern field — read it),
core_back_check_v1.json, design-sim.mjs and design-sim-result.json (run
`node factory/projects/legacy-sow-and-grow/design/design-sim.mjs` yourself and compare the output
to the committed design-sim-result.json — they must match). Do NOT read scope_core_v1/v2,
ae_v1/v2, or core_scope_check_v1 — only the CURRENT versions cited above matter (the earlier ones
were superseded within this same round because a same-session "switch variety" idea turned out to
be non-functional once modeled — see ae_v3.json's revision_note for why that was caught and fixed
BEFORE this review, not left for you to find).

Verify specifically, with file:line evidence:
A. Factual grounding: does fact_sheet_v2.json's content genuinely match its cited sources
   (タキイ種苗のニンジン栽培マニュアル PDF, JAあつぎ, 福井県 坂井農林総合事務所の実証データ)? Are
   the specific numbers (発芽適温15〜25℃、播種後8〜10日で発芽、収穫まで約110〜112日という実測
   データ) plausible and not fabricated? Is anything stated as fact that the cited source doesn't
   actually support (per this Factory's FACTUAL_GROUNDING_INCOMPLETE standard, see
   factory/projects/legacy-clue-join/design/fact_sheet_v12.json's revision history for the
   severity this Factory has historically assigned this class of finding)? You do not need to
   re-fetch the URLs yourself if unable to; judge plausibility and internal consistency, and flag
   anything that reads as invented specificity.
B. Is the GAME_TRANSLATION_REBUILD's actual root problem (memorization exploit, zero real
   judgment) genuinely fixed by t1, not just relabeled? Specifically: does session-to-session
   randomization of today's month / deadline offset / forecast (per game_translations_v2.json,
   c_compression_v2.json) actually prevent a fixed always-pick-X strategy from winning reliably?
   Run design-sim.mjs yourself and check its own verdict fields for consistency — do you agree
   memorization_exploit_closed is correctly computed, or does the model have a flaw that makes the
   simulation's own claim not trust worthy (e.g. does newSession() have any bias, does evaluate()
   correctly implement the 3-criterion AND, is monthsNeeded's ceiling function right)?
C. THE ZERO_WINNER_SESSION_RATE CONCERN (already disclosed in no_manual_exploit_check_v3.json and
   game_translations_v2.json's weaknesses field, ~39.3%): is ~2-in-5 sessions being unwinnable
   regardless of skill an acceptable honest-difficulty design for a children's career-exploration
   game, or does it cross into FAILURE_DISGUISED_AS_SUCCESS / unfair-by-design territory? This is
   the single most important open judgment call in this submission — give a clear verdict and, if
   you judge it unacceptable, a concrete numeric fix (e.g. widen deadlineOffsetMonths' range, or
   change how forecast/heat interacts) rather than just flagging it.
D. CORE/D preserved: does the single-commit mechanic (ae_v3.json, game_translations_v2.json) still
   express the profession's real judgment, or has compressing away same-session retry made D too
   thin / trivial (D_REPLACED_BY_TRIVIA)? Is a single win/lose commit per playthrough, with a full
   chapter replay as the only "do-over" (mirroring src/q1/labCheckLogic.ts's established
   single-shot precedent — verify that file actually establishes what this rebuild claims it does),
   a legitimate design choice here, or does sow_and_grow's real-world judgment genuinely require
   some form of within-session adaptation that this design wrongly gave up on?
E. Answer leaks / brute force: per no_manual_exploit_check_v3.json's exploit_check, is anything
   about the 3 variety cards' names, order, or presentation likely to leak the answer once actually
   implemented (position_leak is flagged as an implementation-stage requirement, not yet
   implemented — is that acceptable to defer, or does it need to be a harder gate before
   GAME_DESIGN_READY)?
F. Scope/CORE consistency: does the SCOPE (given school-lunch supply) still get reached honestly by
   this CORE, and does core_scope_check_v2.json's profession_name_hidden_test genuinely pass (i.e.
   is farming still recognizable as a distinct judgment from any other profession in this game)?
G. Anything else you'd flag as a BLOCKER/HIGH per factory/rules/principles.md's list, using the
   FAILURE_CODES vocabulary in factory/harness/q1-factory-schema.mjs's FAILURE_ROUTES where
   applicable (e.g. CLINICAL_MODEL_UNDERDETERMINED-equivalent for an over-tight rule, ANSWER_LEAK,
   BRUTE_FORCE_SUCCESS, C_NOT_NEEDED_FOR_D, CORE_DISTORTED_BY_GAME, FIRST_ACTION_NOT_INFERABLE).

Severity calibration: BLOCKER = the game (as designed) would ship an answer leak, a fully
memorizable/brute-forceable win condition, or a CORE distortion. HIGH = a real defect that must be
fixed before GAME_DESIGN_READY (e.g. the zero-winner rate is genuinely too high and needs a
concrete numeric fix, or a factual grounding gap). MEDIUM/LOW = polish, deferrable to
implementation. Do not invent findings beyond what's actually in the artifacts.

Output (STRICT — a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","file":"..."}],
 "checks":{"design_sim_ran":true|false,"design_sim_matches_committed_result":true|false,
 "memorization_exploit_genuinely_closed":true|false,"zero_winner_rate_acceptable":true|false,
 "zero_winner_rate_recommended_fix":"...","factual_grounding_plausible":true|false,
 "core_preserved_not_trivialized":true|false,"ready_for_game_spec":true|false},
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
