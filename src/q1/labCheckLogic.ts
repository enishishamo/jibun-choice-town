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

export const TESTS: LabTest[] = [
  {
    id: "cells", icon: "🔬", name: "血のつぶを数える", hint: "ばい菌とたたかう係が、どれくらいいる？",
    label: "たたかう係（白血球）", value: "13,200", means: "ふだんよりずっと多い。からだが何かとたたかっている", off: true, relevant: true,
  },
  {
    id: "fire", icon: "🔥", name: "炎症のしるしを調べる", hint: "からだのどこかが「もえている」ときに増えるもの",
    label: "炎症のしるし（CRP）", value: "12.4", means: "強い炎症が起きているときの数字", off: true, relevant: true,
  },
  {
    id: "oxy", icon: "🫁", name: "酸素のはこび役を調べる", hint: "血が酸素をはこべているか",
    label: "はこび役（ヘモグロビン）", value: "13.2", means: "こちらは、ふだんどおり", off: false, relevant: false,
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
