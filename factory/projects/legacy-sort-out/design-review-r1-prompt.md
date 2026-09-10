You are the INDEPENDENT, ADVERSARIAL DESIGN REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 1 of the design review of
the Legacy Q1 REBUILD "legacy-sort-out" (食品残渣を選別し肥料化するリサイクル工場作業員、gameType
sort_out). This game's design chain was built AFTER, and explicitly informed by, legacy-crowd-flow's
extremely difficult 6-round saga (design reviews r1-r6, scores 58/54/52/48/40/44, ending in a
mechanical ESCALATE with both repair and redesign budgets exhausted). Verify independently whether
this new design actually avoided crowd-flow's failure family, or only appears to on the surface.

Background on what to watch for (from legacy-crowd-flow's blocked-queue.md entry, do not take the
current designer's claim of having applied these lessons at face value -- verify each one):

1. **EXCLUSIVITY_OVERCLAIM family**: any claim, in success OR failure result text, that a single
   matched tool/action (a) fully resolves the situation in the real world, (b) proves the child's
   professional judgment was validated/correct, or (c) is definitively THE one correct real-world
   answer with no room for combined/supplementary measures.
2. **MISMATCH_PARTIAL_EFFECT_OVERCLAIM**: guaranteeing that a wrong/mismatched choice still has SOME
   specific positive (or negative) real-world effect, when the research doesn't establish that for
   every possible mismatch.
3. **DOCUMENTED_EXAMPLE_AUTHORITY_OVERCLAIM**: claiming a cause->tool (or property->tool) pairing is
   literally what a cited source states as its own example, when the source only supports it via
   synthesis, general principle, or the designer's own reasonable inference.
4. **ANSWER_LEAK_PERMUTATION_ELIMINATION**: if the observed variable (in this case, which of 3
   material properties each item has) is assigned via a permutation (each property used exactly once)
   rather than independent sampling, reading 2 of 3 items lets the 3rd be deduced by elimination.

This design's specific claims to verify:
- research.md §6 states real food-recycling practice explicitly denies that a single sorting tool
  fully removes contamination (FOOD TOWN: "選別機一台導入すれば複数の異物を排除できるということでは
  ない"), and that magnet separators can miss items without proper feed tuning, with hand-sort existing
  specifically as a supplementary final check. The adopted translation (`t1-observe-and-apply-once` in
  `game_translations_v1.json`) claims to have designed around this from the start by making success/
  failure text state ONLY whether the chosen tool's physical principle matched the observed property,
  never claiming the facility's overall contamination is fully resolved or that professional judgment
  was certified.
- research.md also documents a designed correction from the OLD implementation (`src/q1/RecycleGame.tsx`):
  the old "net/sieve (網／ふるい)" tool, previously paired with large plastic bags, is replaced with
  "wind separator (風力選別)" because sieves are mainly used, per the sources found, to size-screen
  FINISHED compost rather than catch bags on the incoming sorting line, while wind separation is the
  better-grounded match for light film material. Verify this claim against `reference_research_v1.json`
  and the underlying research.md citations, and check whether `fact_sheet_v2.json`, `ae_v2.json`, and
  `game_translations_v1.json` consistently reflect this replacement (no stale references to the old
  "網/ふるい" tool anywhere in the CURRENT chain, only in the explicitly-rejected historical
  `t2-keep-retry-rejected` translation which deliberately preserves the OLD implementation as a
  rejected alternative for comparison).
- `design-sim.mjs` claims per-item material property is sampled independently (with replacement) from
  the start, not via a permutation, specifically to preempt ANSWER_LEAK_PERMUTATION_ELIMINATION.

Verify critically:

1. Read `game_translations_v1.json`'s adopted `t1-observe-and-apply-once` entry in FULL -- `goal`,
   `C_interaction`, `system_reaction`, `E_consequence`, `job_reveal_bridge` (not just rationale
   fields). Does the CHILD-FACING text avoid, everywhere, claiming: (a) the facility's contamination is
   now fully/completely resolved, (b) the child's professional judgment was certified/validated as
   correct, (c) the chosen tool has literally zero effect if mismatched (or conversely, a guaranteed
   positive effect if mismatched)? Find ANY sentence, anywhere in the current chain, that slips into
   any of these claim types.
2. Cross-check the three property->tool pairings (magnetic_metal->magnet, light_film->wind,
   dense_small_nonmagnetic->hand) against `reference_research_v1.json`'s citations and research.md's
   underlying sources. Is each pairing's grounding claim (in `reference_research_v1.json`'s
   `borrowed_principle` fields) accurate about how directly vs. loosely each is supported? Does
   anything overclaim a pairing as more directly documented than the sources actually show?
3. RUN `node factory/projects/legacy-sort-out/design/design-sim.mjs` yourself (expect 7/7 passing:
   legitimate_full_reasoning=1, random_pick/always_assume_fixed_mapping/always_X_everywhere all
   roughly 0.035-0.04, two_observed_plus_elimination_guess_third roughly 0.33). Confirm properties are
   genuinely sampled independently per item (`newSession` in `design-sim.mjs`), not via a permutation.
4. Verify BRUTE_FORCE_SUCCESS closure: single commit per item, no retry after a wrong tool choice
   (check `retry_or_rethink` in the adopted translation and confirm the rejected `t2-keep-retry-rejected`
   correctly represents what was REJECTED, i.e. the old exploit, not something still live).
5. Verify Gate G (non-scored reflection) and Gate H (honest partial-failure result) are both specified:
   check `play_seeds_v1.json`'s `s4-misjudge-then-reflect` seed and the adopted translation's
   `retry_or_rethink`/`E_consequence` fields for a read-only re-presentation of the original 3 items'
   data in the reflection step, and a distinct, non-flattering onPartialComplete outcome.
6. Verify `first_5_seconds_v1.json` describes a first screen a 10-12 year old can actually parse and
   act on without instructions (tap a card, read it, then a button enables) -- consistent with the
   adopted translation's `first_visible_state`/`primary_action`.
7. Verify career authenticity: does `fact_sheet_v2.json`'s claim about the legal/regulatory basis
   (肥料法第25条, 異物混入禁止) for why sorting matters check out as a real, applicable law, and is it
   used honestly (not overstated into a specific numeric/technical claim beyond what's cited)?
8. Check for any STALE_ARTIFACT_REFERENCE: does any CURRENT artifact in the chain cite a stale version
   of another artifact, or reference content that doesn't match the current design (e.g., leftover
   mentions of "網/ふるい" outside the explicitly-rejected t2/t3 historical entries)?

Read, in this order:
1. `factory/rules/q1-first-play-standard.md`, `factory/rules/principles.md`
2. `factory/projects/legacy-sort-out/research.md` in full
3. The full CURRENT design chain: `fact_sheet_v2.json`, `scope_core_v2.json`, `ae_v2.json`,
   `core_scope_check_v2.json`, `play_seeds_v1.json`, `reference_research_v1.json`,
   `c_compression_v1.json`, `game_translations_v1.json` (all 3 translations, adopted=t1),
   `first_5_seconds_v1.json`, `no_manual_exploit_check_v1.json`, `core_back_check_v1.json`, plus
   `design-sim.mjs` (RUN it) and `design-sim-result.json`
4. For context only (do not treat as authoritative for THIS game): the legacy-crowd-flow
   blocked-queue.md entry and its `design-review-r4.result.json`/`design-review-r5.result.json`/
   `design-review-r6.result.json`, to understand the failure family this design claims to have
   avoided from the start.

Severity calibration: BLOCKER = a genuine exploit/answer-leak/causal-realism error/CORE-distortion
exists, including any form of the overclaim family described above. HIGH = a real defect that must fix
before implementation. MEDIUM/LOW = polish, must NOT gate PASS. This is round 1 -- do not go easy
because the designer claims lessons were pre-applied, but also do not invent findings; if the design
genuinely avoided the known failure modes, say so plainly and PASS it.

Output (STRICT -- a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","file":"..."}],
 "checks":{"design_sim_ran":true|false,"design_sim_result":"...","brute_force_closed":true|false,
 "old_tool_not_reintroduced":true|false,"property_tool_pairs_grounded":true|false,
 "no_exclusivity_overclaim":true|false,"no_mismatch_partial_effect_overclaim":true|false,
 "no_documented_example_authority_overclaim":true|false,"elimination_leak_closed":true|false,
 "file_naming_consistent":true|false,"player_facing_copy_clear":true|false,
 "gate_g_data_represented":true|false,"gate_h_specified":true|false,"ready_for_implementation":true|false},
 "evidence":["file:line — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
