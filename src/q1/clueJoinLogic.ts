// Pure rules for the doctor Q1 (gameType: clue_join), redesigned as
// t1d-flexible-commit-and-defend (factory/projects/legacy-clue-join).
// Same pattern as labCheckLogic.ts/clueBoardLogic.ts: no React here.
//
// The child commits to ONE of 4 diagnosis candidates and picks which of
// 6 gathered findings are the actual decisive evidence for it. Both must
// be right on the SAME submission (design-sim.mjs verified this joint
// check, plus the flat/uninformative feedback below, keep every
// content-blind strategy — select-all, category/number/alarm heuristics,
// fixed-position guessing — at or below chance).
export interface Evidence { id: string; from: string; text: string }

export const EVIDENCE: Evidence[] = [
  { id: "talk", from: "話", text: "3日前からの発熱・せき・動くと息苦しいという経過" },
  { id: "exam", from: "診察", text: "右胸で、パチパチ・プツプツという音" },
  { id: "spo2", from: "呼吸状態", text: "SpO₂ 88%・呼吸数 24回/分" },
  { id: "lab", from: "検査", text: "白血球 13,200・CRP 12.4（ともに高値）" },
  { id: "xray", from: "画像", text: "右の肺に、白くうつっている部分がある" },
  { id: "bp", from: "循環", text: "血圧 128/78" },
];
export const EVIDENCE_IDS = EVIDENCE.map((e) => e.id);

export interface Diagnosis { id: string; name: string; pattern: string; source: string }

// fact_sheet.candidate_reference_cards — tendency wording only ("〜ことが
// 多い"), never an absolute exclusion rule; see fact_sheet for citations.
export const DIAGNOSES: Diagnosis[] = [
  {
    id: "pneumonia",
    name: "肺炎（はいえん）",
    pattern: "からだの一部で炎症が起き、数日かけて熱・せきが出ることが多い。聴診でパチパチ・プツプツという音、画像でその部分に変化が出やすく、血液の炎症の数値も上がりやすい。",
    source: "日本呼吸器学会 成人肺炎診療ガイドライン2024",
  },
  {
    id: "heart_failure",
    name: "心不全（しんふぜん）",
    pattern: "心臓のポンプの力が落ち、胸部X線で心臓の影が大きく見えたり、肺に水がたまる（肺うっ血）ことがある。",
    source: "日本心臓財団 心不全の診断と検査",
  },
  {
    id: "asthma",
    name: "喘息発作（ぜんそくほっさ）",
    pattern: "気道が狭くなり、発作的にゼーゼー・ヒューヒューという音とともに息苦しくなることが多い。前にも同じような発作をくり返していることが多い。",
    source: "日本呼吸器学会 気管支喘息 citizen page",
  },
  {
    id: "pneumothorax",
    name: "気胸（ききょう）",
    pattern: "肺から空気が漏れて胸の中にたまり、肺がしぼむ。突然、胸の痛みや息苦しさが起こる。",
    source: "日本呼吸器学会 気胸 citizen page",
  },
];

export const CORRECT_DIAGNOSIS = "pneumonia";
// decisive evidence must include both core findings and may optionally
// include either/both support findings; spo2/bp are real and important
// (severity/circulation) but never decisive for WHICH illness this is.
export const CORE_MINIMUM = new Set(["lab", "xray"]);
export const OPTIONAL_SUPPORT = new Set(["talk", "exam"]);
export const ALLOWED_MAX = new Set([...CORE_MINIMUM, ...OPTIONAL_SUPPORT]);

export function evidenceAcceptable(selected: string[]): boolean {
  return [...CORE_MINIMUM].every((id) => selected.includes(id)) && selected.every((id) => ALLOWED_MAX.has(id));
}

export function isWinningAttempt(diagnosis: string | null, selected: string[]): boolean {
  return diagnosis === CORRECT_DIAGNOSIS && evidenceAcceptable(selected);
}

export const MAX_ATTEMPTS = 2;

// per-session shuffle: independent random permutations of the diagnosis
// and evidence display order, fixed for the whole session (mirrors
// clueBoardLogic.ts shuffledVitals — shuffle once per mount, id-based
// scoring only, never position-based; re-shuffled on restart/new case).
export function shuffledIds(ids: string[], rand: () => number = Math.random): string[] {
  const arr = [...ids];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
