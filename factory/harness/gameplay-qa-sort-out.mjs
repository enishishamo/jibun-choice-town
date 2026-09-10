#!/usr/bin/env node
// Automated gameplay QA for Q1 sort_out (legacy-sort-out rebuild, t1-observe-and-apply-once).
// Simulates player strategies against src/q1/sortOutLogic.ts directly -- same rules as the
// design-stage design-sim.mjs, now against the shipped module: fixed-slot heuristic guessing,
// random tool choice, and content-blind reads must stay well below full reasoning, and
// RecycleGame.tsx must never leak the answer via a fixed item identity, allow brute-force retry,
// or drop Gate G/H behavior.
//
// Usage: node factory/harness/gameplay-qa-sort-out.mjs
import { readFileSync } from "node:fs";
import { CORRECT_TOOL, ITEMS, PROPERTIES, TOOLS, newSession, sessionWin } from "../../src/q1/sortOutLogic.ts";

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
  check("3 items defined (item_a/item_b/item_c, matching design-sim.mjs's ITEMS exactly)", ITEMS.length === 3 && ITEMS.includes("item_a") && ITEMS.includes("item_b") && ITEMS.includes("item_c"));
  check("3 properties and 3 tools defined, each property maps to exactly one tool", PROPERTIES.length === 3 && TOOLS.length === 3 && PROPERTIES.every((p) => TOOLS.includes(CORRECT_TOOL[p])));
  check("win condition requires every item's applied tool to match its assigned property's correct tool", (() => {
    const s = { assignment: { item_a: "magnetic_metal", item_b: "light_film", item_c: "dense_small_nonmagnetic" } };
    return sessionWin(s, { item_a: "magnet", item_b: "wind", item_c: "hand" })
      && !sessionWin(s, { item_a: "wind", item_b: "wind", item_c: "hand" })
      && !sessionWin(s, { item_a: "magnet", item_b: "magnet", item_c: "hand" })
      && !sessionWin(s, { item_a: "magnet", item_b: "wind" });
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

  const legitimate = rate((s) => {
    const picks = {};
    for (const item of ITEMS) picks[item] = CORRECT_TOOL[s.assignment[item]];
    return sessionWin(s, picks);
  });
  const random = rate((s, rand) => {
    const picks = {};
    for (const item of ITEMS) picks[item] = TOOLS[Math.floor(rand() * TOOLS.length)];
    return sessionWin(s, picks);
  });
  const fixedMapping = rate((s) => sessionWin(s, { item_a: "magnet", item_b: "wind", item_c: "hand" }));
  const singleTool = rate((s) => sessionWin(s, { item_a: "hand", item_b: "hand", item_c: "hand" }));
  const elimination = rate((s, rand) => {
    const [a, b, c] = ITEMS;
    const seen = new Set([s.assignment[a], s.assignment[b]]);
    const remaining = PROPERTIES.filter((p) => !seen.has(p));
    const guessed = remaining.length === 1 ? remaining[0] : PROPERTIES[Math.floor(rand() * PROPERTIES.length)];
    return sessionWin(s, { [a]: CORRECT_TOOL[s.assignment[a]], [b]: CORRECT_TOOL[s.assignment[b]], [c]: CORRECT_TOOL[guessed] });
  });

  check("legitimate reasoning (read each item's actual property, pick the matching tool) always wins", legitimate === 1, `${legitimate}`);
  check("content-blind random tool-per-item stays well below full reasoning", random < 0.1, `${random}`);
  check("assuming a fixed slot->property mapping fails most of the time", fixedMapping < 0.3, `${fixedMapping}`);
  check("always using the same single tool for every item fails most of the time", singleTool < 0.2, `${singleTool}`);
  check("reading only 2 of 3 items and guessing the 3rd by elimination does not succeed reliably (ANSWER_LEAK_PERMUTATION_ELIMINATION stays closed)", elimination < 0.5, `${elimination}`);
}

// ---------------- source-level regression checks ----------------
{
  const body = readFileSync(new URL("../../src/q1/RecycleGame.tsx", import.meta.url), "utf8");
  const schoolLunch = readFileSync(new URL("../../src/data/content/schoolLunch.ts", import.meta.url), "utf8");
  const registry = readFileSync(new URL("../../src/q1/registry.ts", import.meta.url), "utf8");

  check("no free-retry tool dock reintroduced (old exploit: dock-btn/holding-based unlimited tool switching on the same item)", !/dock-btn|holding/.test(body));

  // impl review r1 HIGH BATCHING_STATE_CLOSURE: openItem/selectTool/apply must derive ENTIRELY
  // from their own setItemUI((prev) => ...) updater's `prev` -- never reading the outer-scope
  // `itemUI` variable (a sibling-state or even same-state render-scope read) inside the updater
  // body. The r1 bug was 3 separate useState pieces (openedItems/selectedTool/appliedTool) where
  // selectTool's updater read the render-scope `appliedTool[id]` and apply's updater read the
  // render-scope `selectedTool[id]` -- both fixed by consolidating into one itemUI object per
  // item so every transition is self-contained within `prev[id]`.
  for (const fnName of ["openItem", "selectTool", "apply"]) {
    const fn = body.split(`const ${fnName} = `)[1]?.split(/\n  const [a-zA-Z]+ = /)[0] ?? "";
    check(`${fnName}() is a functional-updater state change reading ONLY prev[id] -- no outer-scope itemUI read inside the updater body (impl review r1 BATCHING_STATE_CLOSURE regression)`, (() => {
      const updaterBody = fn.split("setItemUI((prev) => {")[1]?.split(/\n  \};?\n/)[0] ?? fn.split("setItemUI((prev) =>")[1] ?? "";
      return fn.includes("setItemUI((prev)") && updaterBody.includes("prev[id]") && !/(?<!set)itemUI\[/.test(updaterBody) && !/\bitemUI\)/.test(updaterBody);
    })());
  }

  check("the 'use' (使う) button only renders once the item's card has been opened and a tool has been selected, and only for a not-yet-applied item (disclosure + selection gate, bound to the actual card-rendering block)", (() => {
    const cardBlock = body.split("const allApplied = ITEMS.every")[1]?.split("<InfoCards")[0] ?? "";
    return cardBlock.includes("ui.opened &&") && cardBlock.includes('disabled={!ui.selectedTool}') && cardBlock.includes("使う");
  })());

  // impl review r1 MEDIUM QA_REGRESSION_VACUOUS: the previous version of this check counted
  // "📦 異物" occurrences across BOTH the playing and reflection branches combined, so a fixed
  // material identity introduced in only ONE branch could still pass if the other branch supplied
  // enough neutral-label matches. Now scoped to each branch independently.
  {
    const reflectBlock = body.split('outcome === "reflecting"')[1]?.split('const allApplied')[0] ?? "";
    const playingBlock = body.split("const allApplied = ITEMS.every")[1]?.split("<InfoCards")[0] ?? "";
    const noStaleIdentity = !/金属のスプーン|ビニール袋|プラスチックのスプーン/.test(body);
    check("the reflection branch's 3 item cards all render the SAME neutral label (📦 異物), not a fixed material identity (design review r1 CORE_CAUSAL_MODEL_DISTORTED regression)", (reflectBlock.match(/📦 異物/g) ?? []).length === 1 && noStaleIdentity);
    check("the playing branch's 3 item cards all render the SAME neutral label (📦 異物), not a fixed material identity (design review r1 CORE_CAUSAL_MODEL_DISTORTED regression)", (playingBlock.match(/📦 異物/g) ?? []).length === 1 && noStaleIdentity);
  }

  check("observation text does not repeat a tool's own kanji (磁選機/風力選別/手選別) inside sortOutLogic's PROPERTY_OBSERVATION (design review r1 MEDIUM LABEL_LEAK_TRIVIAL_MATCH regression)", (() => {
    const logic = readFileSync(new URL("../../src/q1/sortOutLogic.ts", import.meta.url), "utf8");
    const obsBlock = logic.split("export const PROPERTY_OBSERVATION")[1]?.split("export const TOOL_LABELS")[0] ?? "";
    return !/磁選機|風力選別|手選別/.test(obsBlock);
  })());

  check("an applied item's result text never claims the unmatched tools are ineffective or that the mismatch is permanently unresolvable -- scoped to 'この場面では' (design review r1 MISMATCH_PARTIAL_EFFECT_OVERCLAIM/EXCLUSIVITY_OVERCLAIM regression)", (() => {
    const cardBlock = body.split("const allApplied = ITEMS.every")[1]?.split("<InfoCards")[0] ?? "";
    return cardBlock.includes("この場面では") && !/実際に無効|完全に取り除|完全に解決/.test(cardBlock);
  })());

  check("the done branch (full win) and the reflecting branch (partial failure) are structurally distinct outcome() states, matching Gate H HONEST OUTCOME", body.includes('outcome === "done"') && body.includes('outcome === "reflecting"'));

  check("partial outcome calls onPartialComplete (falling back to onComplete), never onComplete directly on the reflecting branch", (() => {
    const reflectBlock = body.split('outcome === "reflecting"')[1]?.split('const allApplied')[0] ?? "";
    return reflectBlock.includes("onPartialComplete") && !/onClick=\{onComplete\}/.test(reflectBlock);
  })());

  check("the reflecting screen re-presents all 3 items' observation text read-only via PROPERTY_OBSERVATION (Gate G, THINK_AGAIN_CONTEXT_MISSING regression)", (() => {
    const reflectBlock = body.split('outcome === "reflecting"')[1]?.split('const allApplied')[0] ?? "";
    return reflectBlock.includes("ITEMS.map((id) =>") && reflectBlock.includes("PROPERTY_OBSERVATION[property]");
  })());

  check("the reflection continue button is disabled until a full reflection pick set is made (THINK_AGAIN_SKIPPABLE regression)", /disabled=\{!canFinish\}/.test(body));

  check("finishScreen() computes win purely from sessionWin(session, picks) built from itemUI[id].appliedTool -- the actual recorded applications, not a separately-tracked flag that could drift", (() => {
    const fn = body.split("const finishScreen = ")[1]?.split("const setReflectPick")[0] ?? "";
    return fn.includes("sessionWin(session, picks)") && fn.includes("itemUI[id].appliedTool");
  })());

  check("no old-implementation literals reintroduced (old exploit: unlimited tool-dock retry, fixed FOREIGNS identity list, net/ふるい tool)", !/FOREIGNS|dock-btn|net.*ふるい|ToolId = "magnet" \| "net"/.test(body));

  check("schoolLunch.ts's recycle-lunch experience entry has an empty tools: [] (the custom component renders its own tool UI, matching the delay_recover/hotel_receive precedent)", (() => {
    const entry = schoolLunch.slice(schoolLunch.indexOf('id: "recycle-lunch"'), schoolLunch.indexOf('id: "recycle-lunch"') + 1200);
    return /tools:\s*\[\]/.test(entry);
  })());

  check("schoolLunch.ts's recycle-lunch discoveryEcho does not reintroduce the stale '網' (old net/sieve tool) reference", (() => {
    const entry = schoolLunch.slice(schoolLunch.indexOf('id: "recycle-lunch"'), schoolLunch.indexOf('id: "recycle-lunch"') + 1200);
    return !/磁石や網/.test(entry) && entry.includes("discoveryEcho");
  })());

  check("registry.ts's sort_out comment mentions the observe-then-match structure, not just the generic old 'tool switching' shape", registry.includes("性質に合う道具"));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
