#!/usr/bin/env node
// Automated gameplay QA for Q1 observe_care (legacy-observe-care rebuild, t1-mark-and-share-once).
// Simulates player strategies against src/q1/nurseObserveLogic.ts directly -- same rules as the
// design-stage design-sim.mjs, now against the shipped module: fixed-mark heuristics, and
// content-blind reads must stay well below full reasoning, and NurseObserveGame.tsx must never leak
// the answer, allow brute-force retry, certify a named diagnosis or a derived report/watch action, or
// drop Gate G/H behavior.
//
// Usage: node factory/harness/gameplay-qa-observe-care.mjs
import { readFileSync } from "node:fs";
import { EVIDENCE_ITEMS, newSession, sessionWin } from "../../src/q1/nurseObserveLogic.ts";

let passed = 0, failed = 0;
function check(name, ok, detail = "") { if (ok) passed++; else failed++; console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`); }

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------- pure rule-level checks (mirror design-sim.mjs) ----------------
{
  check("3 evidence items defined (meal/fluid/urine, matching design-sim.mjs's EVIDENCE_ITEMS exactly)", EVIDENCE_ITEMS.length === 3 && EVIDENCE_ITEMS.includes("meal") && EVIDENCE_ITEMS.includes("fluid") && EVIDENCE_ITEMS.includes("urine"));
  check("win condition requires exact per-item mark agreement AND mandatory sharing", (() => {
    const s = { evidence: { meal: true, fluid: false, urine: true } };
    return sessionWin(s, { meal: true, fluid: false, urine: true }, true)
      && !sessionWin(s, { meal: true, fluid: false, urine: true }, false)
      && !sessionWin(s, { meal: false, fluid: false, urine: true }, true);
  })());
}

// ---------------- strategies (mirror design-sim.mjs's verification block) ----------------
{
  const N = 20000;
  function rate(fn) {
    let w = 0;
    for (let i = 0; i < N; i++) {
      const rand = mulberry32(i * 7919 + 13);
      const s = newSession(rand);
      if (fn(s, rand)) w++;
    }
    return Number((w / N).toFixed(4));
  }

  const legitimate = rate((s) => sessionWin(s, { ...s.evidence }, true));
  const random = rate((s, rand) => {
    const flags = {};
    for (const k of EVIDENCE_ITEMS) flags[k] = rand() < 0.5;
    return sessionWin(s, flags, rand() < 0.5);
  });
  const allConcerning = rate((s) => {
    const flags = {};
    for (const k of EVIDENCE_ITEMS) flags[k] = true;
    return sessionWin(s, flags, true);
  });
  const noneConcerning = rate((s) => {
    const flags = {};
    for (const k of EVIDENCE_ITEMS) flags[k] = false;
    return sessionWin(s, flags, true);
  });
  const neverShare = rate((s) => sessionWin(s, { ...s.evidence }, false));
  const guessThird = rate((s, rand) => {
    const [a, b, c] = EVIDENCE_ITEMS;
    const flags = { [a]: s.evidence[a], [b]: s.evidence[b], [c]: rand() < 0.5 };
    return sessionWin(s, flags, true);
  });

  check("legitimate reasoning (mark each item's actual concern state, always share) always wins", legitimate === 1, `${legitimate}`);
  check("content-blind random marks+share stays well below full reasoning", random < 0.1, `${random}`);
  check("marking everything concerning regardless of content fails most of the time", allConcerning < 0.2, `${allConcerning}`);
  check("marking nothing concerning regardless of content fails most of the time", noneConcerning < 0.2, `${noneConcerning}`);
  check("getting every mark right but never sharing always fails (sharing is never optional)", neverShare === 0, `${neverShare}`);
  check("reading only 2 of 3 evidence items and guessing the 3rd's mark does not reliably succeed", guessThird < 0.6, `${guessThird}`);
}

// ---------------- source-level regression checks ----------------
{
  const body = readFileSync(new URL("../../src/q1/NurseObserveGame.tsx", import.meta.url), "utf8");
  const medical = readFileSync(new URL("../../src/data/content/medical.ts", import.meta.url), "utf8");
  const registry = readFileSync(new URL("../../src/q1/registry.ts", import.meta.url), "utf8");

  check("no old-implementation literals reintroduced (old exploit: GUESSES named-diagnosis array, CARES multi-select array, step-based free retry)", !/GUESSES|CARES\s*=|step === "guess"|step === "care"/.test(body));

  check("openEvidence/markEvidence/openFixed are functional-updater state changes reading ONLY prev[id] -- no outer-scope evidenceUI/fixedOpened read inside the updater body (batching-safety, preemptively applying the lesson from legacy-sort-out's implementation review r1)", (() => {
    const fns = ["openEvidence", "markEvidence", "openFixed"];
    return fns.every((fnName) => {
      const fn = body.split(`const ${fnName} = `)[1]?.split(/\n  const [a-zA-Z]+ =/)[0] ?? "";
      const usesFunctionalSetter = /set(EvidenceUI|FixedOpened)\(\(prev\)/.test(fn);
      const noOuterScopeRead = !/(?<!set)(evidenceUI|fixedOpened)\[/.test(fn) && !/\b(evidenceUI|fixedOpened)\)/.test(fn);
      return usesFunctionalSetter && noOuterScopeRead;
    });
  })());

  check("marks cannot be changed once made (no unmark path) and evidence cards cannot be closed", !/mark: null(?!\s*[,}])/.test(body.split("const markEvidence")[1]?.split("const openFixed")[0] ?? "") && !/setEvidenceUI.*opened: false/.test(body));

  check("the confirm button and share checkbox are gated by disabled={} on actual prerequisite state (allMarked / shareChecked), not just visually styled", /disabled=\{!allMarked\}/.test(body) && /disabled=\{!allMarked \|\| !shareChecked\}/.test(body));

  check("share checkbox cannot be checked until all 3 evidence items are marked (fail-closed, design review r1 MEDIUM SHARE_FAILURE_PATH_AMBIGUOUS regression)", body.includes("disabled={!allMarked}") && body.includes('type="checkbox"'));

  check("confirm() computes win purely from sessionWin(session, flags, shareChecked) using the actual recorded marks, not a separately-tracked flag that could drift", (() => {
    const fn = body.split("const confirm = ")[1]?.split("const setReflectPick")[0] ?? "";
    return fn.includes("sessionWin(session, flags, shareChecked)") && fn.includes("evidenceUI[id].mark");
  })());

  check("no named diagnosis or derived report/watch action anywhere in the adopted mechanic's child-facing text (design review r1 EXCLUSIVITY_OVERCLAIM/CORE_CAUSAL_MODEL_DISTORTED regression)", !/報告する|経過観察を続ける|肺炎がまた悪くなっている/.test(body));

  check("success result text does not claim the patient's condition improved or that a specific response was certified correct -- it only claims the observation was correctly shared", (() => {
    const doneBlock = body.split('outcome === "done"')[1]?.split('outcome === "reflecting"')[0] ?? "";
    return doneBlock.includes("正しく見極め") && doneBlock.includes("伝えられた") && !/楽になった|完全に|治った/.test(doneBlock);
  })());

  check("the done branch (full win) and the reflecting branch (partial failure) are structurally distinct outcome() states, matching Gate H HONEST OUTCOME", body.includes('outcome === "done"') && body.includes('outcome === "reflecting"'));

  check("partial outcome calls onPartialComplete (falling back to onComplete), never onComplete directly on the reflecting branch", (() => {
    const reflectBlock = body.split('outcome === "reflecting"')[1]?.split("return (\n    <div className=\"game board-game\">\n      <div className=\"task-bar\"")[0] ?? "";
    return reflectBlock.includes("onPartialComplete") && !/onClick=\{onComplete\}/.test(reflectBlock);
  })());

  check("the reflecting screen re-presents all 3 evidence items' actual observation text read-only via session.evidence/EVIDENCE_OBSERVATION (Gate G, THINK_AGAIN_CONTEXT_MISSING regression)", (() => {
    const reflectBlock = body.split('outcome === "reflecting"')[1] ?? "";
    return reflectBlock.includes("EVIDENCE_ITEMS.map((id) =>") && reflectBlock.includes("EVIDENCE_OBSERVATION[id]");
  })());

  check("the reflection continue button is disabled until a full reflection pick set is made (THINK_AGAIN_SKIPPABLE regression)", /disabled=\{!canFinish\}/.test(body));

  check("medical.ts's med-nurse experience entry has an empty tools: [] (the custom component renders its own UI, matching the delay_recover/hotel_receive/sort_out precedent)", (() => {
    const entry = medical.slice(medical.indexOf('id: "med-nurse"'), medical.indexOf('id: "med-nurse"') + 600);
    return /tools:\s*\[\]/.test(entry);
  })());

  check("medical.ts's med-nurse seeds/discoveryEcho/resolution reflect the new mechanic (見極める/共有する present) and do not reintroduce the old care-selection or diagnosis-guessing language (原因を考える/ケアする/少し楽になった)", (() => {
    const entry = medical.slice(medical.indexOf('id: "med-nurse"'), medical.indexOf('id: "med-nurse"') + 600);
    return entry.includes("見極める") && entry.includes("共有する") && !/原因を考える|ケアする|少し楽になった/.test(entry);
  })());

  check("registry.ts's observe_care comment mentions the observe-then-mark-then-share structure, not the generic old 気づく→観察→見立て→ケア shape", registry.includes("必ずチームに共有"));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
