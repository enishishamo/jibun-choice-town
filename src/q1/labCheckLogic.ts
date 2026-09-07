// Pure rules for the clinical lab technologist Q1 (gameType: lab_check).
// No React here: the same functions drive the component AND automated
// gameplay QA.
//
// 2026-09-06 (Continuous Product Loop, Autonomous Execution Mode): the
// original version let the player run every test with no cost, so "select
// all" always produced the complete result — GQ18/CA41 in
// factory/state/audits/q1-audit.json, flagged as a select-all exploit with
// no real "検査選択" judgment despite the mission's own seed claiming one
// ("何を調べるか選ぶ"). The fix adds a genuine, age-appropriate constraint
// (a lab tech only gets one small tube — not enough to run every possible
// test) so which 2 of 3 tests to run must be judged from the mission's own
// symptom text, WITHOUT reintroducing precision-management/retest jargon
// (deliberately excluded per this component's original design note — that
// was previously judged too technical for the target age).
//
// 2026-09-06 repair (independent Codex review,
// factory/projects/q1-improve-lab-check/final-review.result.json, verdict
// FAIL, 2 HIGH): (1) white cell count and hemoglobin are normally drawn
// together in ONE panel (CBC) in real practice, not competing single-
// purpose tests fighting over the same limited tube — replaced the
// hemoglobin/oxygen-carrying test with kidney function (creatinine), a
// genuinely separate assay a real lab runs distinctly from a CBC, commonly
// checked as a baseline in an elderly patient but not informative for THIS
// case's infection/inflammation question — a medically honest distractor.
// (2) the unlimited "pick again" retry meant a player could brute-force
// all 3 possible pairs within this one experience without ever reading the
// case, still always reaching the good ending — closed in LabCheckGame.tsx
// by removing the in-place retry loop (a wrong pair now ends the
// experience honestly, not blocked from progressing, but not silently
// re-tried into eventual success either; the app's own "← もどる" already
// provides a real do-over by leaving and re-entering the chapter).
export interface LabTest {
  id: string;
  icon: string;
  name: string;
  hint: string;
  label: string;
  value: string;
  means: string;
  off: boolean;
  /** Does this test actually inform THIS patient's presentation (fever, cough, breathlessness -> suspected infection/inflammation)? Internal only — never shown to the player as a label. */
  relevant: boolean;
}

export const MAX_TESTS_RUNNABLE = 2;

// 2026-09-07 repair (Human Decision — Q1 First-Play Standard V1, HIGH:
// "患者文脈を使わない固定攻略が成立する" — round 1 of this repair made
// cells/fire's pre-run text fully circular ("ある物質"/"ある種類の細胞")
// while leaving kidney's specifically organ-named ("腎臓のはたらき"),
// which independent review correctly flagged as the SAME shortcut in the
// opposite direction: "the one that names an actual organ = probably not
// it" replaces the original "the one that sounds unrelated = probably not
// it". Fixed by giving all three an EQUALLY specific real test name
// (白血球/CRP/クレアチニン — a child likely doesn't already know any of
// these terms, so none is a free giveaway) and a hint that describes real
// PURPOSE/function (needed for genuine Gate C reasoning — see
// q1-first-play-standard.md — a purely circular hint gives the player
// nothing to connect to the patient's symptoms with) without stating
// off/normal status. Kidney's hint is deliberately framed as a routine,
// general-purpose check (which is medically honest — creatinine IS a
// common baseline test in an unwell patient) rather than "clearly
// unrelated to breathing", so eliminating it requires actually recognizing
// it doesn't specifically address THIS patient's respiratory/infection
// presentation — not just noticing it "sounds different".
export const TESTS: LabTest[] = [
  {
    id: "cells", icon: "🔬", name: "白血球の数を調べる", hint: "からだの中で、ばい菌などとたたかう細胞の数を調べる。",
    label: "たたかう係（白血球）", value: "13,200", means: "ふだんよりずっと多い。からだが何かとたたかっている", off: true, relevant: true,
  },
  {
    id: "fire", icon: "🧪", name: "CRPの量を調べる", hint: "からだのどこかで炎症が起きていないかを示す、目印になる数字。",
    label: "炎症のしるし（CRP）", value: "12.4", means: "強い炎症が起きているときの数字", off: true, relevant: true,
  },
  {
    id: "kidney", icon: "💧", name: "クレアチニンの量を調べる", hint: "からだ全体の調子をみるために、いつもチェックしておく目安の一つ。",
    label: "腎臓のはたらき（クレアチニン）", value: "0.8", means: "こちらは、ふだんどおり", off: false, relevant: false,
  },
];

export const RELEVANT_IDS = TESTS.filter((t) => t.relevant).map((t) => t.id);

/** Can another test still be run this round, given the sample is limited? */
export function canRunAnother(picked: string[]): boolean {
  return picked.length < MAX_TESTS_RUNNABLE;
}

/** The complete, doctor-useful picture for THIS case: exactly the relevant tests, nothing wasted on a non-informative one. */
export function isCompletePicture(picked: string[]): boolean {
  if (picked.length !== RELEVANT_IDS.length) return false;
  return RELEVANT_IDS.every((id) => picked.includes(id));
}
