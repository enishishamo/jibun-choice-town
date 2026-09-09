#!/usr/bin/env node
// Design-stage exploit simulation for legacy-clue-join / t1c-shuffled-commit-and-defend (v3, design
// review r2 repair).
//
// r2 FAIL (2 NEW BLOCKERs) on the r1-repaired "commit-and-defend" design: even after relabeling
// categories and mixing number/alarm-sounding patterns, the CORRECT diagnosis was always the first
// displayed candidate and the CORRECT evidence cards always sat at fixed array positions 1,2,4,5 --
// a reviewer-constructed strategy ("always pick candidate 1, always pick evidence positions
// 1,2,4,5") won on the FIRST try with zero content reading. Fix: diagnosis-card order and
// evidence-card order are now shuffled independently, ONCE per session (stable within one night,
// re-shuffled only when a new case/session starts) -- matching the existing
// src/q1/clueBoardLogic.ts shuffledVitals precedent for the exact same class of problem in the
// sibling ch1 chapter. This sim models many independent shuffled sessions and verifies that a
// fixed-POSITION strategy no longer beats random guessing once the underlying id-to-position
// mapping varies session to session.
//
// r1 FAIL (2 BLOCKERs) on the earlier "evidence-subset-only" design:
//  (a) C_NOT_NEEDED_FOR_D / ANSWER_LEAK_LABEL_POSITION: the required 4-card set exactly equaled
//      "every card NOT categorized as a vital sign", and additionally sat at fixed array
//      positions 1,2,4,5 -- both are content-blind, non-diagnostic shortcuts.
//  (b) D_NOT_EXTERNALIZED: the mechanic never asked the child to commit to a diagnostic
//      hypothesis at all; the system just filtered a card set and announced the diagnosis.
//
// Fix: (1) the child must EXPLICITLY commit to one of the 3 diagnosis candidates (restores
// D_NOT_EXTERNALIZED -- matches ae.D/play_seeds' "choose a candidate" framing); (2) evidence
// categories were relabeled so no two cards share a category substring (話/診察/呼吸状態/検査/
// 画像/循環 -- previously spo2+bp both said "バイタル"), and a real number now appears on BOTH a
// required card (lab: actual WBC/CRP values; talk: actual 38.6C already established in ch1) and
// an excluded card (spo2, bp) so "has a raw number" no longer predicts membership either; (3) the
// win-check is JOINT (diagnosis AND evidence must both be exactly right on the SAME submission);
// (4) all failure feedback is now ONE flat, diagnosis-blind, evidence-blind message -- no
// extra/missing distinction, no per-card hint -- closing the informative-feedback exploit found
// in the earlier "exact_evidence_random_diagnosis" simulation (55-67% via diagnosis-cycling).
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));

const EVIDENCE = [
  { id: "talk", category: "話", hasNumber: false, soundsAlarming: true }, // r3: purely qualitative (history); no longer carries the 38.6C vitals number (provenance fix -- see header note)
  { id: "exam", category: "診察", hasNumber: false, soundsAlarming: true }, // r3: text limited to パチパチ/プツプツ; the wheeze word overlapping the asthma candidate was removed from the card text (clinical-model fix, id-level model unchanged)
  { id: "spo2", category: "呼吸状態", hasNumber: true, soundsAlarming: true },
  { id: "lab", category: "検査", hasNumber: true, soundsAlarming: true },
  { id: "xray", category: "画像", hasNumber: false, soundsAlarming: true },
  { id: "bp", category: "循環", hasNumber: true, soundsAlarming: false },
];
const IDS = EVIDENCE.map((e) => e.id);
const DIAGNOSES = ["pneumonia", "heart_failure", "asthma", "pneumothorax"]; // 4th candidate added after r1: reduces blind diagnosis-cycling odds (2/4 vs 2/3)
const CORRECT_DIAGNOSIS = "pneumonia";
// r4 fix (CLINICAL_MODEL_UNDERDETERMINED, non-repairable finding): exact-set matching rejected
// clinically defensible alternatives -- e.g. {talk,lab,xray} (the reviewer's own example: course +
// inflammatory markers + focal imaging already form a coherent pneumonia case without crackles,
// and the cited heart-failure source itself says crackles also occur in heart failure, so "exam"
// is not independently pneumonia-specific). Fix: accept any evidence set that is a SUPERSET of the
// CORE minimum {lab, xray} (elevated inflammatory markers + focal infiltrate -- the two least
// disputed, most specific findings) and a SUBSET of {talk, exam, lab, xray} (spo2 and bp remain
// excluded as genuinely non-discriminating severity/normal readings, per fact_sheet's tendency
// framing). talk and exam are each independently optional. This yields exactly 4 acceptable
// evidence sets instead of 1, all requiring diagnosis === pneumonia.
const CORE_MINIMUM = new Set(["lab", "xray"]);
const OPTIONAL_SUPPORT = new Set(["talk", "exam"]);
const ALLOWED_MAX = new Set([...CORE_MINIMUM, ...OPTIONAL_SUPPORT]); // {lab,xray,talk,exam}
const BUDGET = 2;

function evidenceAcceptable(selected) {
  // superset of the core minimum, subset of the allowed maximum -- exactly 4 valid combinations
  return [...CORE_MINIMUM].every((e) => selected.includes(e)) && selected.every((e) => ALLOWED_MAX.has(e));
}
function attempt(diagnosis, selected) {
  const win = diagnosis === CORRECT_DIAGNOSIS && evidenceAcceptable(selected);
  // flat, uninformative feedback: no distinction between "diagnosis wrong", "evidence wrong",
  // "too many", "too few" -- a wrong attempt on try 1 reveals NOTHING that narrows try 2
  return { win, feedbackKind: win ? "success" : "generic_rethink" };
}

// per-session shuffle: independent random permutations of the 4 diagnosis ids and 6 evidence ids,
// fixed for the whole session (mirrors clueBoardLogic.ts shuffledVitals -- shuffle once per mount)
function fisherYates(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function newSession(rand) {
  return { diagnosisOrder: fisherYates(DIAGNOSES, rand), evidenceOrder: fisherYates(IDS, rand) };
}
function play(planFn, seed) {
  const rand = mulberry32(seed);
  const history = [];
  for (let i = 0; i < BUDGET; i++) {
    const { diagnosis, evidence } = planFn(history, rand);
    const r = attempt(diagnosis, evidence);
    history.push({ diagnosis, evidence, ...r });
    if (r.win) return { win: true, attempts: i + 1 };
  }
  return { win: false, attempts: BUDGET };
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const byFlag = (flag) => IDS.filter((id) => EVIDENCE.find((e) => e.id === id)[flag]);
const randDiagnosis = (rand) => DIAGNOSES[Math.floor(rand() * DIAGNOSES.length)];
const randSubset = (rand) => { let s; do { s = IDS.filter(() => rand() < 0.5); } while (s.length === 0); return s; };

const N = 8000;
const strategies = {
  legitimate: () => play(() => ({ diagnosis: CORRECT_DIAGNOSIS, evidence: ["talk", "exam", "lab", "xray"] }), 1),
  // the reviewer's own suggested alternative -- must now ALSO win
  legitimate_reviewer_alt_no_exam: () => play(() => ({ diagnosis: CORRECT_DIAGNOSIS, evidence: ["talk", "lab", "xray"] }), 1),
  legitimate_core_minimum_only: () => play(() => ({ diagnosis: CORRECT_DIAGNOSIS, evidence: ["lab", "xray"] }), 1),
  legitimate_lab_xray_exam_no_talk: () => play(() => ({ diagnosis: CORRECT_DIAGNOSIS, evidence: ["exam", "lab", "xray"] }), 1),
  // r1's exact exploit: does grouping evidence by shared CATEGORY LABEL substring still reveal the
  // answer? With the new distinct labels (話/診察/呼吸状態/検査/画像/循環) no two categories share a
  // substring, so a "drop everything in categories that share a common word" rule has nothing to grab
  // onto; the only subset a category-substring rule can even propose here is "drop nothing" (all 6
  // categories are unique), which fails outright.
  category_substring_grouping_proposes_no_valid_subset: (seed) => play((h, rand) => ({ diagnosis: randDiagnosis(rand), evidence: [...IDS] }), seed),
  keep_only_no_number_cards: (seed) => play((h, rand) => ({ diagnosis: randDiagnosis(rand), evidence: IDS.filter((id) => !EVIDENCE.find((e) => e.id === id).hasNumber) }), seed), // now {talk,exam,xray} = 3 cards: wrong size alone defeats this
  keep_only_has_number_cards: (seed) => play((h, rand) => ({ diagnosis: randDiagnosis(rand), evidence: byFlag("hasNumber") }), seed),
  keep_only_alarming_sounding_cards: (seed) => play((h, rand) => ({ diagnosis: randDiagnosis(rand), evidence: byFlag("soundsAlarming") }), seed),
  select_all: (seed) => play((h, rand) => ({ diagnosis: randDiagnosis(rand), evidence: [...IDS] }), seed),
  select_all_diagnosis_cycled_across_2_tries: (seed) => {
    const rand = mulberry32(seed);
    const order = [...DIAGNOSES].sort(() => rand() - 0.5);
    for (let i = 0; i < BUDGET; i++) { const r = attempt(order[i], [...IDS]); if (r.win) return { win: true }; }
    return { win: false };
  },
  // r2's EXACT reviewer-constructed exploit: always the first-displayed diagnosis candidate, always
  // display-positions 1,2,4,5 of the evidence list -- now run against a freshly shuffled session
  first_displayed_diagnosis_plus_positions_1245: (seed) => {
    const rand = mulberry32(seed);
    const { diagnosisOrder, evidenceOrder } = newSession(rand);
    const evidence = [evidenceOrder[0], evidenceOrder[1], evidenceOrder[3], evidenceOrder[4]]; // positions 1,2,4,5 (0-indexed 0,1,3,4)
    return attempt(diagnosisOrder[0], evidence);
  },
  // the r2 finding generalized: fixed positions across BOTH tries, two different diagnosis positions
  fixed_positions_1245_diagnosis_cycle_2_tries: (seed) => {
    const rand = mulberry32(seed);
    const { diagnosisOrder, evidenceOrder } = newSession(rand);
    const evidence = [evidenceOrder[0], evidenceOrder[1], evidenceOrder[3], evidenceOrder[4]];
    for (let i = 0; i < BUDGET; i++) { if (attempt(diagnosisOrder[i], evidence).win) return { win: true }; }
    return { win: false };
  },
  random_evidence_random_diagnosis_each_try: (seed) => play((h, rand) => ({ diagnosis: randDiagnosis(rand), evidence: randSubset(rand) }), seed),
  // the theoretical worst case: evidence ALREADY guessed exactly right (this itself requires having
  // done the real differential-reasoning, since only 1 of 63 subsets is exact) but the diagnosis LABEL
  // is then chosen with NO further reasoning. Modeled as an OPTIMAL blind adversary who tries two
  // DISTINCT labels across the 2-try budget (no benefit to repeating a failed guess since feedback is
  // flat and carries no information): win rate = 2/|DIAGNOSES|.
  exact_evidence_optimal_blind_diagnosis_cycle: (seed) => {
    const rand = mulberry32(seed);
    const order = [...DIAGNOSES];
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; } // Fisher-Yates
    for (let i = 0; i < BUDGET; i++) { if (attempt(order[i], ["talk", "exam", "lab", "xray"]).win) return { win: true }; }
    return { win: false };
  },
};
function rate(fn) { let w = 0; for (let i = 0; i < N; i++) if (fn(i * 7919 + 13).win) w++; return Number((w / N).toFixed(4)); }
const results = Object.fromEntries(Object.entries(strategies).map(([k, f]) => [k, { win_rate: rate(f) }]));

// exhaustive: of 4 diagnoses x 63 non-empty evidence subsets = 252 joint combos, exactly 4 win
// (one per {lab,xray} + any subset of the 2 optional cards {talk,exam}, all requiring pneumonia)
let winning = 0;
for (const d of DIAGNOSES) for (let mask = 1; mask < 64; mask++) { const s = IDS.filter((_, i) => mask & (1 << i)); if (attempt(d, s).win) winning++; }

const verdict = {
  legitimate_strategy_wins_every_case: results.legitimate.win_rate === 1,
  exactly_four_winning_combos_out_of_252: winning === 4,
  all_four_legitimate_variants_win: results.legitimate.win_rate === 1 && results.legitimate_reviewer_alt_no_exam.win_rate === 1 && results.legitimate_core_minimum_only.win_rate === 1 && results.legitimate_lab_xray_exam_no_talk.win_rate === 1,
  category_relabeling_closes_r1_exploit: results.category_substring_grouping_proposes_no_valid_subset.win_rate === 0,
  no_number_format_shortcut: results.keep_only_no_number_cards.win_rate === 0 && results.keep_only_has_number_cards.win_rate === 0,
  no_alarming_sounding_shortcut: results.keep_only_alarming_sounding_cards.win_rate === 0,
  select_all_never_wins: results.select_all.win_rate === 0 && results.select_all_diagnosis_cycled_across_2_tries.win_rate === 0,
  // r2 BLOCKER regression tests: under per-session shuffling, a fixed-position strategy must fall
  // back to the baseline chance rate for BOTH axes matching by coincidence: P(diagnosis slot 0 is
  // correct) x P(evidence positions {1,2,4,5} happen to hold exactly the 4 required ids, any
  // internal order) = (1/|DIAGNOSES|) x (4!*2!/6!) = (1/4)*(1/15) = 1/60 for a single try, and
  // (2/4)*(1/15) = 1/30 for the 2-try cycled variant -- i.e. no better than blind guessing once
  // position no longer correlates with the answer across sessions.
  position_leak_closed_single_try: Math.abs(results.first_displayed_diagnosis_plus_positions_1245.win_rate - (1 / DIAGNOSES.length) * (1 / 15)) < 0.01,
  position_leak_closed_cycled: Math.abs(results.fixed_positions_1245_diagnosis_cycle_2_tries.win_rate - (2 / DIAGNOSES.length) * (1 / 15)) < 0.01,
  content_blind_random_guessing_below_5pct: results.random_evidence_random_diagnosis_each_try.win_rate < 0.05,
  // this strategy already REQUIRES correctly reasoning out the exact evidence set (the hard part);
  // with flat/uninformative feedback a random diagnosis-label guess is bounded near the blind rate
  // per try and does not benefit from cycling (no information is leaked about which try was closer)
  diagnosis_cycling_bounded_by_candidate_count_not_leaked_feedback: Math.abs(results.exact_evidence_optimal_blind_diagnosis_cycle.win_rate - 2 / DIAGNOSES.length) < 0.02,
  // this residual risk requires the hard sub-problem (deriving the exact 4-card discriminating set,
  // 1/63 subsets) to ALREADY be solved correctly by genuine reasoning; a reasoner who correctly
  // recognizes why spo2/bp don't discriminate has, by construction, already compared all 4 remaining
  // findings against all 4 candidate patterns and would not rationally then guess the label blind --
  // this is a documented theoretical bound, not an operationally content-blind exploit (see notes)
};
const out = {
  generated_at: new Date().toISOString(),
  rules: { evidence: EVIDENCE.map((e) => e.id), categories: Object.fromEntries(EVIDENCE.map((e) => [e.id, e.category])), diagnoses: DIAGNOSES, correct: CORRECT_DIAGNOSIS, core_minimum_evidence: [...CORE_MINIMUM], allowed_max_evidence: [...ALLOWED_MAX], accepted_evidence_combinations: 4, budget: BUDGET, feedback: "single flat message on any failure; no extra/missing/diagnosis-specific hint", presentation_order: "diagnosis-card order and evidence-card order are each shuffled independently once per session (fixed within one night, re-shuffled on a new case/restart) -- mirrors clueBoardLogic.ts shuffledVitals" },
  cases_per_strategy: N,
  joint_combo_space: DIAGNOSES.length * 63,
  strategies: results,
  winning_joint_combos: winning,
  notes: "design review r2 (FAIL 54, 2 BLOCKERs) found that the r1-repaired mechanic, despite closing the category/format leak, still had the correct diagnosis always first-displayed and the correct evidence always at fixed array positions 1,2,4,5 -- a zero-reading strategy won on try 1. Fix: independent per-session Fisher-Yates shuffles of both the diagnosis-card order and the evidence-card order (matching src/q1/clueBoardLogic.ts shuffledVitals for the same class of issue in the sibling ch1 chapter). first_displayed_diagnosis_plus_positions_1245 and its 2-try cycled variant are RE-TESTED against many independently shuffled sessions and now match the correct combinatorial chance baseline (1/60 and 1/30 respectively -- i.e. no better than blind guessing) rather than winning outright. The one remaining documented theoretical residual (exact_evidence_optimal_blind_diagnosis_cycle, ~51%) requires ALREADY solving the hard evidence-discrimination sub-problem (1-in-63) correctly and then guessing the diagnosis label with no further reasoning despite that reasoning strongly implying the label -- disclosed as a theoretical bound, not treated as an operational content-blind exploit; the independent reviewer should make the final call on whether this residual is acceptable.\n\nr3 fixes (non-BLOCKER HIGH/MEDIUM from design-review-r3.result.json): the talk card's number (previously the ch1 VITALS temperature reading, misattributed onto a history/ASK-sourced card) was removed -- it is now purely qualitative; the exam card's text is limited to パチパチ/プツプツ (crackle-quality) to avoid overlapping the asthma candidate's own ゼーゼー (wheeze) description; candidate_reference_cards in fact_sheet.json were reworded to tendency language (\u301c\u3053\u3068\u304c\u591a\u3044) rather than absolute exclusion rules; scope_core/c_compression/play_seeds were brought fully into 4-candidate/flat-feedback consistency (ARTIFACT_CHAIN_INCONSISTENT). Shuffle-lifecycle correctness (one shuffle per session, ID-based scoring never index-based, re-shuffle only on new-case/restart) and the full 375px/10-card layout are implementation-stage verification items (SHUFFLE_LIFECYCLE_UNVERIFIED, VISUAL_GAMEPLAY_LEGIBILITY_UNVERIFIED) -- gameplay-qa-clue-join.mjs must assert both mechanically once implemented.\n\nr4 fixes (design-review-r4.result.json, FAIL 55, 0 blockers, 3 HIGH): (1) CLINICAL_MODEL_UNDERDETERMINED (not locally repairable as wording -- required a mechanic change): exact-set matching against {talk,exam,lab,xray} rejected the reviewer's own clinically defensible alternative {talk,lab,xray} (course + inflammatory markers + focal imaging already cohere without crackles, and the cited heart-failure source itself says crackles also occur in heart failure). Fixed by loosening acceptance to ANY superset of the CORE_MINIMUM {lab,xray} that is also a subset of {lab,xray,talk,exam} -- 4 valid combinations instead of 1, all still requiring the correct diagnosis and still excluding spo2/bp (genuinely non-discriminating). (2) ARTIFACT_CHAIN_INCONSISTENT: ae.E still described system-pointed contradictions after r3's fix only touched play_seeds/c_compression/scope_core -- corrected to the same fully flat feedback. (3) FACTUAL_GROUNDING_INCOMPLETE: the heart-failure candidate card's claim that inflammatory markers usually do not rise in heart failure was not supported by the cited 日本心臓財団 page (which discusses BNP, not WBC/CRP) -- removed; the card now states only what that source actually supports (BNP, cardiomegaly, bilateral pattern).",
  verdict,
};
writeFileSync(join(HERE, "design-sim-result.json"), JSON.stringify(out, null, 2) + "\n");
console.log(JSON.stringify(out, null, 2));
