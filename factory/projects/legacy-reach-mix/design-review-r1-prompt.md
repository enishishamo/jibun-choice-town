You are the INDEPENDENT, ADVERSARIAL DESIGN REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 1 of the design
review of the Legacy Q1 REBUILD "legacy-reach-mix" (イベントを知らせる仕事／主催団体の広報
担当・実行委員会メンバー, gameType reach_mix) -- design_iteration 1, repair_count 0/1,
redesign_count 0/2 (full budget available).

**Essential context -- read this before judging anything else.** In this same Factory
session, two other legacy rebuilds were just ESCALATED (Human Decision Required) after
6 design review rounds each:
- `factory/state/blocked-queue.md`'s `legacy-place-and-test` entry: a park-safety-measure
  matching game whose evidentiary base reduced to essentially 1 conditional fact (wind
  affects two mitigations), and which never escaped principles.md's "明らかな正解だけの2択"
  (OBVIOUS_BINARY_CHOICE) ban across 4 structurally different option-count/distractor
  redesigns.
- `legacy-venue-layout` entry: a venue-layout-safety game whose evidentiary base reduced
  to 2 static rules (keep the entrance clear; keep fire-using stalls 3m from seating), and
  which never escaped OBVIOUS_BINARY_CHOICE across 4 structurally DIFFERENT mechanics
  (free construction, zero-slack construction, discover-by-placing, and finally
  inspection/diagnosis of a pre-made layout) -- the reviewer's own final verdict in round 6
  was that changing the FORM of the player's action is structurally powerless against
  OBVIOUS_BINARY_CHOICE when the grounded evidence itself is only 1-2 simple rules, and
  recommended either a measurement/trade-off-based redesign or scaling back the whole
  career experience.

`legacy-reach-mix` was deliberately chosen as the next candidate (over the higher raw-
priority `scene_audit`, whose CORE is an inspection/checklist mechanic structurally similar
to venue-layout's failed final approach) specifically because `research.md` found TWO
INDEPENDENT strong primary sources for this profession -- unlike either escalated game:
(1) 竹内裕二(2023)'s real N=334 event-attendee survey (an actual measured channel-
effectiveness ranking: chirashi148 > TV116 > newspaper39 > word-of-mouth24 > SNS-total22),
and (2) 総務省情報通信政策研究所's national age-bracket survey (concrete SNS-usage/media-
importance splits by decade). Your job is to give your fully independent, rigorous verdict
on whether this design ACTUALLY translates that richer evidentiary base into a game that
avoids both EXCLUSIVITY_OVERCLAIM (inventing causal claims/thresholds beyond what the
sources solidly support) and OBVIOUS_BINARY_CHOICE (a mechanic that is, in substance, a
trivial/obvious-answer task) -- or whether it just LOOKS richer on paper while still
reducing to one of these two failure modes in practice. Do not defer to the design chain's
own optimism about this; form your own judgment.

**What this design actually does (verify all of this against the real files, don't take
this summary on faith):**
- 3 audience segments (family/young/older), each grounded in a DIFFERENT primary source
  leg: family via targeted school/daycare flyer distribution (竹内2023's #1 real channel),
  young via SNS (総務省's age-bracket usage gap), older via TV/newspaper/media-relations
  (both 竹内2023's #2 channel and 総務省's age-bracket importance reversal at 60s).
- Every session independently randomizes which ONE audience is this session's "primary"
  (higher threshold) vs "secondary" (lower threshold) -- this is what closes the OLD
  implementation's brute-force exploit (PromoGame.tsx: fixed thresholds, fixed reach
  values, unlimited free re-toggling on one screen) AND, the design chain claims, a
  subtler "memorize one universal combo" risk the escalated games' post-mortems flagged as
  a related concern.
- 6 media channels, re-derived from research (drops the old "email" channel, which had NO
  primary-source backing at all per research.md FACT_CHECK_REQUIRED #5; adds "media
  relations" -- pitching press clubs for TV/newspaper/radio coverage -- the one channel
  research.md found is qualitatively different: coverage is never guaranteed, it depends
  on the press's own editorial judgment, not something labor/money can directly buy).
- `design/design-sim.mjs` (RUN it yourself: `node factory/projects/legacy-reach-mix/design/design-sim.mjs`,
  expect "20 passed, 0 failed"). Key verified properties:
  - family-primary and young-primary sessions are ALWAYS solvable via certain (non-random)
    channels alone (rate 1.0) -- a correctly-reasoning child never has to gamble to fully
    succeed on those.
  - older-primary sessions are the ONE case requiring a disclosed 50/50 gamble on
    media_relations for full success (matches MEDIA_RELATIONS_SUCCESS_PROB=0.5 almost
    exactly, 0.5055 measured) -- but even on failure, a backup-inclusive combo keeps the
    family/young secondary thresholds met (never a total wipeout).
  - the minimum cost to satisfy all 3 audiences at the PRIMARY level simultaneously (7)
    exceeds BUDGET (5) -- no single "big enough" combo can win regardless of session.
  - naive strategies (random-within-budget ~0.18, three different fixed ignore-session
    combos ~0.34 each, cheapest-first-blind ~0.33) all stay well below legitimate
    reasoning, and compound down further under the established 3-round-triple pattern
    (legitimate ~0.58 vs fixed ~0.036 vs random ~0.006).
- The exact reach numbers, channel costs, and the 0.5 coverage probability are explicitly
  disclosed throughout the design chain (fact_sheet's uncertainties, c_compression's
  failure_risk, reference_research) as game-balance choices preserving research.md's
  ORDINAL findings, not literal transcriptions of 竹内(2023)'s counts or a measured
  press-pickup rate (research.md found no primary source for an actual coverage
  probability).

Verify critically -- these are the specific things that sank the two escalated games, so
scrutinize whether reach_mix actually avoids them or just has different surface details:

1. RUN `node factory/projects/legacy-reach-mix/design/design-sim.mjs` yourself and confirm
   it actually passes 20/20 as claimed, and that the numbers in `design-sim-result.json`
   match a fresh run.
2. **EXCLUSIVITY_OVERCLAIM check**: read `fact_sheet_v1.json`'s `uncertainties`,
   `reference_research_v1.json`, and `c_compression_v1.json`'s `failure_risk` in full.
   Does the design chain honestly disclose which specific numbers (reach values, channel
   costs, the 0.5 coverage probability, the 3-way audience taxonomy itself) are NOT directly
   sourced, the way research.md's own §7 demands? Or does any player-facing text (especially
   `game_translations_v1.json`'s adopted translation `t1`'s `C_interaction`/`system_reaction`/
   `E_consequence`/`job_reveal_bridge`) assert something research.md does NOT actually
   support as if it were a documented fact (e.g. a specific coverage percentage stated to
   the child as if measured, or a claim that SNS is broadly weak/strong rather than
   specifically age-split)?
3. **OBVIOUS_BINARY_CHOICE check, the decisive question**: read a candidate's primary target,
   read 6 channel cards, pick a budget-constrained subset -- is this genuinely non-trivial
   professional judgment for a 10-12 year old, or does it reduce to a lookup ("primary=X →
   always pick combo X") that a child could learn once and reapply mechanically every
   session, with the session-randomization being surface variety rather than a genuine
   obstacle to memorization? Specifically check: with only 3 possible primary values and
   (per design-sim.mjs) an essentially FIXED optimal/recommended combo per primary value
   (`CERTAIN_SOLUTIONS.family`, `CERTAIN_SOLUTIONS.young`, `OLDER_RECOMMENDED`), does this
   collapse to "memorize 3 answers, pick the one matching today's primary" -- which may
   itself be a form of the same triviality problem the escalated games had, just with 3
   buckets instead of 2? Give your fully independent, rigorous verdict on whether 3
   memorizable buckets is meaningfully different from 2, and why or why not.
4. Verify BRUTE_FORCE_SUCCESS is actually closed in the translation spec (single commit,
   no free re-toggle -- check `t1`'s `retry_or_rethink` and `no_manual_exploit_check_v1.json`'s
   `exploit_check.spam_submit`/`select_all`) and that Gate G (non-scored reflection after
   failure, per `play_seeds_v1.json`'s `s4-misjudge-then-reflect`) and Gate H (honest
   failure, not disguised as success) are both genuinely specified.
5. Verify `scope_core_v1.json`'s `profession_name_hidden_test` and research.md §6's overlap
   analysis actually hold against `legacy-crowd-flow`, `legacy-venue-layout`, and the
   existing `sound_check` implementation (different D, different timing, different "inside
   vs outside the venue" framing -- check this is genuinely true, not just asserted).
6. Check for STALE_ARTIFACT_REFERENCE or internal inconsistency across the whole chain
   (e.g. does `game_translations_v1.json`'s adopted translation actually match what
   `ae_v1.json`'s D/E describe? Does `first_5_seconds_v1.json` match the adopted
   translation's `first_visible_state`?).
7. Verify `first_5_seconds_v1.json` describes a first screen a 10-12 year old can parse
   without prior explanation.
8. Independently assess: does introducing genuine probabilistic uncertainty (the
   media_relations gamble) into a children's career game raise any concern of its own (e.g.
   a child doing everything "right" but still losing to bad luck, contrary to this
   Factory's established pattern where every other RELEASED Q1 game rewards correct
   reasoning with reliable, deterministic success)? Is the disclosed 50/50 framing and the
   backup-preserves-partial-credit design (verified in design-sim.mjs) sufficient to make
   this feel fair rather than punishing to a 10-12 year old, or is this itself a new risk
   this design introduces that the two escalated games never had to deal with?

Read, in this order:
1. `factory/rules/q1-first-play-standard.md`, `factory/rules/principles.md`
2. `factory/state/blocked-queue.md`'s `legacy-place-and-test` and `legacy-venue-layout`
   entries in full (for the EXCLUSIVITY_OVERCLAIM/OBVIOUS_BINARY_CHOICE pattern this design
   is trying to avoid)
3. `factory/projects/legacy-reach-mix/research.md` in full (especially §0, §7)
4. The full design chain: `fact_sheet_v1.json`, `scope_core_v1.json`, `ae_v1.json`,
   `core_scope_check_v1.json`, `play_seeds_v1.json`, `reference_research_v1.json`,
   `c_compression_v1.json`, `game_translations_v1.json` (all 3 translations, adopted=t1),
   `first_5_seconds_v1.json`, `no_manual_exploit_check_v1.json`, `core_back_check_v1.json`,
   plus `design/design-sim.mjs` (RUN it) and `design/design-sim-result.json`

Severity calibration: BLOCKER = a genuine exploit/answer-leak/causal-realism error/CORE-
distortion, including any form of the overclaim family, OR a genuine, substantively
obvious/trivial-choice problem (including the "3 memorizable buckets" concern in item 3
above, if you find it applies). HIGH = a real defect that must fix before implementation.
MEDIUM/LOW = polish. Give your most honest, precise, independent verdict.

Output (STRICT -- a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","file":"..."}],
 "checks":{"design_sim_ran":true|false,"design_sim_result":"...","brute_force_closed":true|false,
 "no_invented_threshold":true|false,"obvious_binary_choice_resolved":true|false,
 "three_bucket_memorization_risk_assessed":true|false,"probability_disclosed_honestly":true|false,
 "gambling_element_feels_fair_not_punishing":true|false,
 "no_overlap_with_crowd_flow_venue_layout_or_sound_check":true|false,
 "file_naming_consistent":true|false,"player_facing_copy_clear":true|false,
 "gate_g_specified":true|false,"gate_h_specified":true|false,
 "e_shows_visible_world_consequence":true|false,"ready_for_implementation":true|false},
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
