// Pure rules for the 3 Q1 games of the library-detective world
// (「100年前の写真のなぞ」). No React: drives components AND
// factory/harness/gameplay-qa-library.mjs.
// Facts grounding: factory/projects/library-detective/research.result.json
//   - never conclude from ONE lookalike clue; 3+ independent matches = 確定,
//     2 matches = answer as 推定 (that is the professional answer, not failure)
//   - conservation: tape/laminate/peeling the mount DESTROY evidence; mold is
//     quarantined; "do nothing but record" is often the right treatment
//   - digitization: master = lossless & high dpi; uncertain titles stay 推定;
//     recognizable people => hold publication

// ============================== photo_clues =================================
export type Clue = "road" | "ridge" | "sign" | "pole";
export const CLUES: Clue[] = ["road", "ridge", "sign", "pole"];
export const CLUE_BUDGET = 4; // lookups
export const CONFIRM_MIN = 3; // matches needed to answer 確定

export interface Candidate {
  id: "kita" | "naka" | "minato";
  matches: Record<Clue, boolean>;
}
export interface PhotoCase {
  answer: Candidate["id"];
  candidates: Candidate[];
  /** how many clues the TRUE place can match (3 or 4): with 2 verifiable the
   * correct certainty is 推定 — generation keeps it >=3 so both labels occur
   * via the player's lookup budget instead. */
}

export function newPhotoCase(rand: () => number = Math.random): PhotoCase {
  const ids: Candidate["id"][] = ["kita", "naka", "minato"];
  const answer = ids[Math.floor(rand() * 3)];
  const decoy = ids[(ids.indexOf(answer) + 1 + Math.floor(rand() * 2)) % 3];
  const candidates = ids.map((id) => {
    const m: Record<Clue, boolean> = { road: false, ridge: false, sign: false, pole: false };
    if (id === answer) {
      // true place matches 3 or 4 clues
      const misses = rand() < 0.5 ? 0 : 1;
      const missIdx = Math.floor(rand() * 4);
      CLUES.forEach((c, i) => { m[c] = !(misses === 1 && i === missIdx); });
    } else if (id === decoy) {
      // the lookalike: ONE striking match (the famous novice trap)
      m[CLUES[Math.floor(rand() * 4)]] = true;
    }
    return { id, matches: m };
  });
  return { answer, candidates };
}

export type Certainty = "confirmed" | "probable";
export interface PhotoState {
  c: PhotoCase;
  checked: Clue[];
  mistakes: number;
  outcome: "open" | "done" | "mentor_fail";
  refusal?: string;
}
export function newPhotoState(rand: () => number = Math.random): PhotoState {
  return { c: newPhotoCase(rand), checked: [], mistakes: 0, outcome: "open" };
}

export function photoCheck(s: PhotoState, clue: Clue): PhotoState {
  if (s.outcome !== "open") return s;
  const st = { ...s, checked: [...s.checked] };
  delete st.refusal;
  if (st.checked.includes(clue)) return { ...s, refusal: "その手がかりは、もう照合ずみ。" };
  if (st.checked.length >= CLUE_BUDGET) return { ...s, refusal: "閉館まで、もう時間がない。" };
  st.checked.push(clue);
  return st;
}

/** verified matches for a candidate given the player's lookups */
export function verifiedMatches(s: PhotoState, id: Candidate["id"]): number {
  const cand = s.c.candidates.find((x) => x.id === id)!;
  return s.checked.filter((cl) => cand.matches[cl]).length;
}

export function photoConclude(
  s: PhotoState,
  id: Candidate["id"],
  certainty: Certainty,
): { state: PhotoState; correctPlace: boolean; correctCertainty: boolean } {
  const correctPlace = id === s.c.answer;
  if (s.outcome !== "open") return { state: s, correctPlace, correctCertainty: false };
  if (s.checked.length < 2) {
    return {
      state: { ...s, refusal: "受付票の「確認済み事項」欄が、まだ空っぽだ。" },
      correctPlace,
      correctCertainty: false,
    };
  }
  const v = verifiedMatches(s, id);
  // the professional rule: 確定 needs 3+ verified independent matches
  const correctCertainty = certainty === "confirmed" ? v >= CONFIRM_MIN : v >= 1 && v < CONFIRM_MIN;
  if (correctPlace && correctCertainty) return { state: { ...s, outcome: "done" }, correctPlace, correctCertainty };
  const mistakes = s.mistakes + 1;
  return {
    state: { ...s, mistakes, outcome: mistakes >= 2 ? "mentor_fail" : "open" },
    correctPlace,
    correctCertainty,
  };
}

// ============================== paper_rescue ================================
export type Damage = "dust" | "tear" | "mold" | "taped_before" | "fine";
export type Treatment = "brush" | "wrap" | "isolate" | "record_only" | "tape" | "laminate" | "peel";
export const RESCUE_ITEMS = 5;
export const RESCUE_MISTAKE_LIMIT = 2;

export interface PaperItem {
  id: string;
  label: string;
  damage: Damage;
}
export function newRescueRow(rand: () => number = Math.random): PaperItem[] {
  const base: Damage[] = ["dust", "tear", "mold", "fine", rand() < 0.5 ? "taped_before" : "dust"];
  for (let i = base.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }
  const labels: Record<Damage, string[]> = {
    dust: ["ほこりをかぶった写真", "すすけた絵はがき"],
    tear: ["はしが破れた手紙", "破れた台紙の写真"],
    mold: ["カビのにおいがするアルバム", "しみの広がった写真"],
    taped_before: ["昔テープで補修された地図", "セロハンテープあとの新聞"],
    fine: ["状態のよい写真", "きれいな絵はがき"],
  };
  return base.map((d, i) => ({ id: `P${i + 1}`, label: labels[d][Math.floor(rand() * labels[d].length)], damage: d }));
}

/** forbidden treatments are refused by the WORLD before they touch the item. */
export function rescueForbidden(t: Treatment): boolean {
  return t === "tape" || t === "laminate" || t === "peel";
}
export function rescueCorrect(d: Damage): Treatment {
  if (d === "dust") return "brush";
  if (d === "tear") return "wrap";
  if (d === "mold") return "isolate";
  if (d === "taped_before") return "record_only"; // do NOT try to remove old tape
  return "record_only"; // fine: restraint is the treatment
}

export interface RescueState {
  items: PaperItem[];
  idx: number;
  mistakes: number;
  outcome: "open" | "done" | "mentor_fail";
  refusal?: string;
}
export function newRescueState(rand: () => number = Math.random): RescueState {
  return { items: newRescueRow(rand), idx: 0, mistakes: 0, outcome: "open" };
}
export function rescueAct(s: RescueState, t: Treatment): { state: RescueState; correct: Treatment; forbidden: boolean } {
  const item = s.items[s.idx];
  const correct = rescueCorrect(item.damage);
  if (s.outcome !== "open") return { state: s, correct, forbidden: false };
  if (rescueForbidden(t)) {
    // the senior's hand gently stops yours — the item is untouched
    return {
      state: { ...s, refusal: "先輩の手が、そっときみの手を止めた。道具は棚に戻された。" },
      correct,
      forbidden: true,
    };
  }
  const st = { ...s };
  delete st.refusal;
  if (t !== correct) {
    st.mistakes += 1;
    if (st.mistakes >= RESCUE_MISTAKE_LIMIT) {
      st.outcome = "mentor_fail";
      return { state: st, correct, forbidden: false };
    }
    // wrong treatment: the item is NOT processed; it stays on the desk
    return { state: st, correct, forbidden: false };
  }
  st.idx += 1;
  if (st.idx >= RESCUE_ITEMS) st.outcome = "done";
  return { state: st, correct, forbidden: false };
}

// ============================== digi_archive ================================
export type Purpose = "master" | "viewing";
export type Spec = "tiff_400" | "jpeg_light";
export type MetaLabel = "confirmed" | "probable" | "unknown_place";
export const ARCHIVE_ITEMS = 3;
export const ARCHIVE_MISTAKE_LIMIT = 2;

export interface ArchiveItem {
  id: string;
  label: string;
  purpose: Purpose;
  evidence: 0 | 2 | 3; // verified place evidence carried over from the survey
  peopleVisible: boolean;
}
export function newArchiveRow(rand: () => number = Math.random): ArchiveItem[] {
  const evs: (0 | 2 | 3)[] = [3, 2, 0];
  for (let i = evs.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [evs[i], evs[j]] = [evs[j], evs[i]];
  }
  return [0, 1, 2].map((i) => ({
    id: `D${i + 1}`,
    label: ["商店街の古写真", "駅前どおりの絵はがき", "橋のたもとの記念写真"][i],
    purpose: (i === 1 ? "viewing" : rand() < 0.5 ? "master" : "viewing") as Purpose,
    evidence: evs[i],
    peopleVisible: i === 2 ? true : rand() < 0.25,
  }));
}

export interface ArchiveDecision {
  spec: Spec;
  label: MetaLabel;
  publish: boolean;
}
export function archiveCorrect(item: ArchiveItem): ArchiveDecision {
  return {
    spec: item.purpose === "master" ? "tiff_400" : "jpeg_light",
    label: item.evidence >= 3 ? "confirmed" : item.evidence === 2 ? "probable" : "unknown_place",
    publish: !item.peopleVisible,
  };
}

export interface ArchiveState {
  items: ArchiveItem[];
  idx: number;
  mistakes: number;
  outcome: "open" | "done" | "mentor_fail";
}
export function newArchiveState(rand: () => number = Math.random): ArchiveState {
  return { items: newArchiveRow(rand), idx: 0, mistakes: 0, outcome: "open" };
}
export function archiveAct(s: ArchiveState, d: ArchiveDecision): { state: ArchiveState; correct: ArchiveDecision; ok: boolean } {
  const item = s.items[s.idx];
  const correct = archiveCorrect(item);
  if (s.outcome !== "open") return { state: s, correct, ok: false };
  const ok = d.spec === correct.spec && d.label === correct.label && d.publish === correct.publish;
  const st = { ...s };
  if (!ok) {
    st.mistakes += 1;
    if (st.mistakes >= ARCHIVE_MISTAKE_LIMIT) {
      st.outcome = "mentor_fail";
      return { state: st, correct, ok };
    }
    // the registration bounces back for rework — the item stays
    return { state: st, correct, ok };
  }
  st.idx += 1;
  if (st.idx >= ARCHIVE_ITEMS) st.outcome = "done";
  return { state: st, correct, ok };
}
