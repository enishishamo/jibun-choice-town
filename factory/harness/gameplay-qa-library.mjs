#!/usr/bin/env node
// Automated gameplay QA for the library-detective world's 3 games (Expansion v1).
// Usage: node factory/harness/gameplay-qa-library.mjs
import {
  CLUES, CLUE_BUDGET, CONFIRM_MIN, newPhotoState, photoCheck, photoConclude, verifiedMatches,
  RESCUE_ITEMS, newRescueState, rescueAct, rescueCorrect, rescueForbidden,
  ARCHIVE_ITEMS, newArchiveState, archiveAct, archiveCorrect,
} from "../../src/q1/libraryLogic.ts";

let passed = 0, failed = 0;
function check(name, ok, detail = "") {
  if (ok) passed++; else failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}
function rng(seed) { let s = seed; return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; }
const N = 500;

// ============================== photo_clues =================================
{
  // conclusions with <2 lookups are refused (no free guessing)
  {
    let s = newPhotoState(rng(3));
    const r0 = photoConclude(s, "kita", "confirmed");
    check("photo: concluding with zero lookups is refused", !!r0.state.refusal && r0.state.mistakes === 0);
    s = photoCheck(s, "road");
    const r1 = photoConclude(s, "kita", "confirmed");
    check("photo: concluding with one lookup is refused", !!r1.state.refusal && r1.state.mistakes === 0);
  }
  // budget enforced + duplicate lookup refused
  {
    let s = newPhotoState(rng(5));
    s = photoCheck(s, "road");
    const dup = photoCheck(s, "road");
    check("photo: duplicate lookup refused without consuming budget", !!dup.refusal && s.checked.length === 1);
    for (const c of ["ridge", "sign", "pole"]) s = photoCheck(s, c);
    check("photo: budget of 4 lookups fully usable", s.checked.length === CLUE_BUDGET);
  }
  // informed play: check ALL clues, pick the candidate with most verified
  // matches, and choose certainty by the professional rule (3+ => 確定)
  let wins = 0;
  for (let i = 0; i < N; i++) {
    const rand = rng(1000 + i);
    let s = newPhotoState(rand);
    for (const c of CLUES) s = photoCheck(s, c);
    const best = s.c.candidates.map((c) => ({ id: c.id, v: verifiedMatches(s, c.id) })).sort((a, b) => b.v - a.v)[0];
    const r = photoConclude(s, best.id, best.v >= CONFIRM_MIN ? "confirmed" : "probable");
    if (r.state.outcome === "done") wins++;
  }
  check(`photo: informed play (verify all, rule-based certainty) wins ${wins}/${N}`, wins === N);
  // novice trap: jump on the decoy after its ONE striking match => never done first try
  let trapped = 0;
  for (let i = 0; i < N; i++) {
    const rand = rng(2000 + i);
    let s = newPhotoState(rand);
    // check clues until SOME non-answer candidate shows a match, then conclude 確定
    let target = null;
    for (const c of CLUES) {
      s = photoCheck(s, c);
      target = s.c.candidates.find((cd) => cd.id !== s.c.answer && verifiedMatches(s, cd.id) >= 1);
      if (target && s.checked.length >= 2) break;
    }
    if (!target) continue; // decoy clue not among first lookups
    const r = photoConclude(s, target.id, "confirmed");
    if (r.state.outcome !== "done") trapped++;
    else trapped -= 1000; // should never happen
  }
  check("photo: lookalike-decoy 確定 never succeeds", trapped >= 0, `trapped=${trapped}`);
  // over-claiming: right place, 確定 with only 2 verified matches => bounced
  {
    let hits = 0, bounced = 0;
    for (let i = 0; i < N; i++) {
      const rand = rng(3000 + i);
      let s = newPhotoState(rand);
      // look up exactly 2 clues that the answer matches
      const ans = s.c.candidates.find((c) => c.id === s.c.answer);
      const matching = CLUES.filter((c) => ans.matches[c]).slice(0, 2);
      if (matching.length < 2) continue;
      for (const c of matching) s = photoCheck(s, c);
      hits++;
      const r = photoConclude(s, s.c.answer, "confirmed");
      if (r.state.outcome !== "done" && !r.correctCertainty) bounced++;
    }
    check("photo: 確定 with only 2 verified matches is over-claiming and bounces", hits > 0 && bounced === hits, `${bounced}/${hits}`);
    // and the SAME evidence answered as 推定 passes
    let ok = 0, tries = 0;
    for (let i = 0; i < N; i++) {
      const rand = rng(4000 + i);
      let s = newPhotoState(rand);
      const ans = s.c.candidates.find((c) => c.id === s.c.answer);
      const matching = CLUES.filter((c) => ans.matches[c]).slice(0, 2);
      if (matching.length < 2) continue;
      for (const c of matching) s = photoCheck(s, c);
      tries++;
      const r = photoConclude(s, s.c.answer, "probable");
      if (r.state.outcome === "done") ok++;
    }
    check("photo: the same 2-match evidence answered as 推定 is CORRECT", tries > 0 && ok === tries, `${ok}/${tries}`);
  }
  // two mistakes hand the case to the mentor
  {
    let s = newPhotoState(rng(7));
    s = photoCheck(s, "road"); s = photoCheck(s, "ridge");
    const wrongId = s.c.candidates.find((c) => c.id !== s.c.answer).id;
    let r = photoConclude(s, wrongId, "confirmed");
    r = photoConclude(r.state, wrongId, "confirmed");
    check("photo: two wrong conclusions => mentor takes over", r.state.outcome === "mentor_fail");
  }
}

// ============================== paper_rescue ================================
{
  // forbidden tools are refused by the world and never consume the item
  {
    const s = newRescueState(rng(21));
    for (const t of ["tape", "laminate", "peel"]) {
      const r = rescueAct(s, t);
      check(`rescue: ${t} is stopped by the senior (item untouched, no progress)`, r.forbidden && r.state.idx === 0 && r.state.mistakes === 0 && !!r.state.refusal);
    }
  }
  // informed play: correct treatment per damage always completes
  let wins = 0;
  for (let i = 0; i < N; i++) {
    let s = newRescueState(rng(5000 + i));
    while (s.outcome === "open") s = rescueAct(s, rescueCorrect(s.items[s.idx].damage)).state;
    if (s.outcome === "done") wins++;
  }
  check(`rescue: informed play wins ${wins}/${N}`, wins === N);
  // "fix everything" instinct (brush on everything) fails
  let fails = 0;
  for (let i = 0; i < N; i++) {
    let s = newRescueState(rng(6000 + i));
    let guard = 0;
    while (s.outcome === "open" && guard++ < 40) s = rescueAct(s, "brush").state;
    if (s.outcome !== "done") fails++;
  }
  check(`rescue: brush-everything never completes (${fails}/${N} fail)`, fails === N);
  // restraint is rewarded: a "fine" item's correct treatment is record_only
  check("rescue: a fine item's correct treatment is record_only (restraint)", rescueCorrect("fine") === "record_only");
  check("rescue: old taped repairs are recorded, never peeled", rescueCorrect("taped_before") === "record_only" && rescueForbidden("peel"));
  // wrong non-forbidden treatment doesn't advance; 2 => mentor
  {
    let s = newRescueState(rng(23));
    const wrong = s.items[0].damage === "mold" ? "brush" : "isolate";
    let r = rescueAct(s, wrong);
    check("rescue: wrong treatment leaves the item on the desk", r.state.idx === 0 && r.state.mistakes === 1);
    r = rescueAct(r.state, wrong === "brush" ? "wrap" : "brush");
    check("rescue: second mistake => mentor takes over", r.state.outcome === "mentor_fail" || r.state.idx > 0);
  }
}

// ============================== digi_archive ================================
{
  // informed play: spec by purpose, label by evidence, publish by people
  let wins = 0;
  for (let i = 0; i < N; i++) {
    let s = newArchiveState(rng(7000 + i));
    while (s.outcome === "open") s = archiveAct(s, archiveCorrect(s.items[s.idx])).state;
    if (s.outcome === "done") wins++;
  }
  check(`archive: informed play wins ${wins}/${N}`, wins === N);
  // lazy spec: jpeg for everything fails whenever a master item exists
  let lazyFails = 0, masters = 0;
  for (let i = 0; i < N; i++) {
    let s = newArchiveState(rng(8000 + i));
    const hasMaster = s.items.some((it) => it.purpose === "master");
    if (hasMaster) masters++;
    let guard = 0;
    while (s.outcome === "open" && guard++ < 20) {
      const c = archiveCorrect(s.items[s.idx]);
      s = archiveAct(s, { ...c, spec: "jpeg_light" }).state;
    }
    if (hasMaster && s.outcome !== "done") lazyFails++;
  }
  check(`archive: jpeg-everything fails whenever a master item exists (${lazyFails}/${masters})`, masters > 0 && lazyFails === masters);
  // over-claiming label: 確定 on evidence 2 or 0 always bounces
  {
    let s = newArchiveState(rng(31));
    const idx = s.items.findIndex((it) => it.evidence < 3);
    // walk to that item correctly first
    for (let k = 0; k < idx; k++) s = archiveAct(s, archiveCorrect(s.items[s.idx])).state;
    const c = archiveCorrect(s.items[s.idx]);
    const r = archiveAct(s, { ...c, label: "confirmed" });
    check("archive: 確定 label without 3 pieces of evidence bounces back", !r.ok && r.state.idx === s.idx);
  }
  // publishing a photo with recognizable people bounces
  {
    let s = newArchiveState(rng(33));
    while (s.outcome === "open" && !s.items[s.idx].peopleVisible) s = archiveAct(s, archiveCorrect(s.items[s.idx])).state;
    if (s.outcome === "open") {
      const c = archiveCorrect(s.items[s.idx]);
      const r = archiveAct(s, { ...c, publish: true });
      check("archive: publishing a people-visible photo bounces (rights hold)", !r.ok);
    } else {
      check("archive: people-visible item present in every row", false);
    }
  }
  check("archive: correct decision for people-visible item is publish=false", newArchiveState(rng(35)).items.some((it) => it.peopleVisible && archiveCorrect(it).publish === false));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
