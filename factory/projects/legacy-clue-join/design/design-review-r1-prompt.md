You are the INDEPENDENT, ADVERSARIAL Q1 GAME DESIGN REVIEWER for JIBUN CHOICE (a Japanese
children's career-exploration web game, target age 10-12). This is ROUND 1 of the DESIGN-STAGE
review of the LEGACY REBUILD "legacy-clue-join" (医師, gameType `clue_join`, ch4 of the
救急外来/er-patient event, "④ 集まった手がかりを、まとめる"). This is a GAME_TRANSLATION_REBUILD
(classification: existing CORE/SCOPE were judged representative; only the TRANSLATION into a game
was flawed — the shipped implementation is a fixed-category card sort with answer-leaking hints
and a brute-forceable win condition). Judge rigorously; do not soften because this is "just a
legacy repair", and do not harden because of that history either.

**Why this rebuild exists** (factory/state/legacy/reverse-audits/clue_join.json): the CURRENT
shipped src/q1/DiagnoseGame.tsx has audit_scores game_quality=49, career_authenticity=70,
exploit="brute force", answer_leak=true. Its "？" tooltip on every clue card states outright which
category (lung/general/none) the card belongs to, and the win condition (≥3 "lung" cards, no
"none" card) is content-blind-solvable by opening every tooltip and pattern-matching a keyword.

**What this rebuild claims** (verify each in the JSON artifacts, with evidence):
1. fact_sheet v2 grounds the redesign in two official sources newly added this round: 日本呼吸器学会
   『成人肺炎診療ガイドライン2024』(https://www.jrs.or.jp/publication/jrs_guidelines/20240319125656.html)
   and 日本心臓財団の心不全所見解説 (https://www.jhf.or.jp/check/heart_failure/10/) — used to ground a
   genuine differential-diagnosis pattern (pneumonia: subacute onset, unilateral exam/imaging
   findings, elevated inflammatory markers vs. heart failure: bilateral pattern, edema/weight gain,
   normal inflammatory markers vs. asthma: acute onset, prior episodes, normal imaging).
2. scope_core v2 / ae v2 update CORE/A-E to state this differential-diagnosis reasoning explicitly
   (the v1 backfill had literally copied the FLAWED implementation's behavior as if it were the
   intended CORE — check whether the v2 wording is a genuine, factually-grounded improvement, not a
   post-hoc rationalization of whatever mechanic was chosen).
3. game_translations v1 (3 translations: t1-differential-exclusion ADOPTED, t2-elimination-ladder
   and t3-confidence-sort REJECTED with stated reasons). t1's ADOPTED mechanic: 3 diagnosis
   candidate cards (肺炎/心不全/喘息発作) are READ-ONLY reference material (a "？" reveals each
   candidate's GENERAL textbook pattern, in wording that does NOT mirror any evidence card's exact
   text) — there is NO separate "pick a diagnosis" scored step. The ONLY scored action is
   selecting, from the SAME 6 evidence cards the existing implementation already uses (話/診察/
   SpO₂/検査/画像/血圧), exactly the 4 that are the deciding evidence (話, 診察, 検査, 画像) —
   excluding SpO₂ (a nonspecific severity marker consistent with all three candidates) and 血圧
   (normal, decides nothing). Wrong-but-imprecise submissions get only a generic "too many / not
   enough decisive clues" message (never naming which card). The correct diagnosis is REVEALED as
   the OUTCOME of a correct evidence selection, never guessed in advance.
4. The translation's own adoption_rationale states that an EARLIER draft of t1 (which DID have a
   separate 3-way diagnosis-guess step) was rejected after design-sim showed a content-blind
   "guess evidence once + cycle the diagnosis label across the 2-attempt budget" strategy won
   55-67% of the time — verify this reasoning is sound and that the FINAL adopted mechanic (as
   described in point 3) actually removes that attack surface, per the sim below.
5. factory/projects/legacy-clue-join/design/design-sim.mjs / design-sim-result.json — RE-RUN IT
   YOURSELF (`node factory/projects/legacy-clue-join/design/design-sim.mjs`): legitimate 100%;
   select_all / select_all_minus_bp / select_all_minus_spo2 all 0% (of the 63 non-empty subsets of
   6 cards, exactly ONE — the 4-card set — wins); content-blind random-subset guessing (2 attempts)
   < 5%. Construct your OWN adversarial strategy beyond the sim's (e.g. reading only card LENGTH,
   position, or the presence of numbers vs. prose, without understanding clinical content) and
   state its win rate or reasoning. Also check: is there any leak in HOW "extra_evidence" vs.
   "missing_evidence" vs. "extra_and_missing" feedback is worded in first_5_seconds/game_translations
   that could let a player narrow down WHICH card is wrong without reading it?
6. no_manual_exploit_check v1 / core_back_check v1 — do these findings actually follow from the sim,
   or are they asserted without support?
7. Consistency with sibling chapters already shipped: src/q1/ClueBoardGame.tsx +
   src/q1/clueBoardLogic.ts (ch1, same patient, same underlying values: 3日前から発熱, 咳・動くと
   息苦しい, 右の胸でいつもと違う音, 体温38.6, SpO₂88%, 呼吸数24, 血圧128/78 normal) and
   src/data/content/medical.ts (med-lab ch2 for 白血球/CRP, med-radio ch3 for the X-ray finding,
   med-diagnose ch4 = this game). Do the NEW fact_sheet/scope_core/ae/translation contradict any
   value already established in ch1-3, or invent a fact not supported by them or by the newly
   cited sources?

**File version discipline:** read ONLY the exact current files (each has exactly one CURRENT
version; `factory/projects/legacy-clue-join/q1-pipeline.json` `.artifacts.<type>.file` is the
source of truth):
- factory/projects/legacy-clue-join/design/fact_sheet_v2.json
- factory/projects/legacy-clue-join/design/scope_core_v2.json
- factory/projects/legacy-clue-join/design/ae_v2.json
- factory/projects/legacy-clue-join/design/core_scope_check_v2.json
- factory/projects/legacy-clue-join/design/play_seeds_v2.json
- factory/projects/legacy-clue-join/design/reference_research_v2.json
- factory/projects/legacy-clue-join/design/c_compression_v2.json
- factory/projects/legacy-clue-join/design/game_translations_v2.json (adopted:
  t1-differential-exclusion — read THAT entry in full, and the top-level adoption_rationale)
- factory/projects/legacy-clue-join/design/first_5_seconds_v2.json
- factory/projects/legacy-clue-join/design/no_manual_exploit_check_v2.json
- factory/projects/legacy-clue-join/design/core_back_check_v2.json
- factory/projects/legacy-clue-join/design/design-sim.mjs and design-sim-result.json (RE-RUN)
- factory/projects/legacy-clue-join/q1-pipeline.json
- factory/state/legacy/reverse-audits/clue_join.json (the reverse audit that classified this rebuild)
- Context only, current shipped implementation being replaced: src/q1/DiagnoseGame.tsx; sibling
  chapters: src/q1/ClueBoardGame.tsx, src/q1/clueBoardLogic.ts, src/data/content/medical.ts
  (med-doctor/med-lab/med-radio/med-diagnose entries)

**Read `factory/rules/q1-first-play-standard.md` FIRST** (gates A-I, §3 RELEASE BLOCKER list) and
`factory/rules/principles.md`. Replayability/mastery is PLUS QUALITY only (§4 of the standard).

Verify specifically, with evidence:
1. CORE/SCOPE representativeness, Profession Name Hidden Test, A-E integrity for a REBUILD whose
   classification says CORE/SCOPE were already fine (does the v2 update stay faithful to that
   classification, or does it quietly redesign more than the translation stage should touch?).
2. C necessity, D authenticity, C→D causality — is "select exactly the discriminating evidence"
   genuine differential-diagnosis judgment, or does it collapse into a disguised trivia/label-match?
3. Answer leaks: candidate-card wording, evidence-card wording/order/format, feedback wording,
   button/UI hierarchy — anything that reveals which 4 cards are correct without reasoning.
4. Brute force / select-all / spam-submit — re-run the sim, try your own strategies.
5. Honest outcome, retry/think-again gate (§2 gate G), no instruction line, factual accuracy
   against fact_sheet_v2.json AND the two newly cited official sources, consistency with ch1-3.
6. Job Reveal: does the existing medical.ts med-diagnose entry (discoveryEcho/resolution, UNCHANGED
   this round) still accurately describe the NEW mechanic's play experience?
7. For each defect, name the pipeline failure code and severity, and say explicitly whether it is
   a §3 RELEASE BLOCKER-class defect or a polish item.

Severity calibration: BLOCKER = would fail §3 no matter how implemented; HIGH = must fix before
spec; implementation-only concerns = MEDIUM/LOW.

Output (STRICT — a single JSON object, no prose, no code fences):
{"verdict":"PASS|FAIL|HUMAN_REQUIRED","score":0-100,
 "career_authenticity_score":0-100,"game_quality_score":0-100,
 "blockers":[],"high":[],"medium":[],"low":[],
 "failure_codes":[{"code":"<FAILURE_CODE>","severity":"BLOCKER|HIGH|MEDIUM","finding":"...","fixable_by_local_repair":true|false}],
 "sim_verification":{"reran":true|false,"exactly_one_winning_subset":true|false,"own_adversarial_strategy":"...","notes":"..."},
 "factual_accuracy_vs_sources":"...","consistency_with_ch1_3":"...",
 "e_closes_inside_own_authority":true|false,
 "evidence":["file — finding"],"recommended_actions":[]}
score = min of the two axis scores. verdict must be FAIL if any blockers or high remain.
