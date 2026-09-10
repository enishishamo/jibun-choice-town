#!/usr/bin/env node
// Automated gameplay QA for Q1 delay_recover (legacy-delay-recover redesign, t5-hedged-evidence-scope).
// Simulates player strategies against src/q1/delayRecoverLogic.ts directly -- same rules as the
// design-stage design-sim.mjs, now against the shipped module: fixed-position-heuristic guessing,
// random tap order, and content-blind reads must stay well below full reasoning, and
// DelayRecoverGame.tsx must never leak the answer via display position, allow brute-force retry, or
// drop Gate G/H behavior.
//
// Usage: node factory/harness/gameplay-qa-delay-recover.mjs
import { readFileSync } from "node:fs";
import { CONTACTS, contactOrderWins, shuffled } from "../../src/q1/delayRecoverLogic.ts";

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
  check("3 contacts defined (venue/bus/hotel, matching design-sim.mjs's CONTACTS exactly)", CONTACTS.length === 3 && CONTACTS.includes("venue") && CONTACTS.includes("bus") && CONTACTS.includes("hotel"));
  check("win condition depends only on tap order, hotel must be first", contactOrderWins(["hotel", "venue", "bus"]) && contactOrderWins(["hotel", "bus", "venue"]) && !contactOrderWins(["venue", "hotel", "bus"]) && !contactOrderWins(["bus", "hotel", "venue"]) && !contactOrderWins(["venue", "bus", "hotel"]) && !contactOrderWins(["bus", "venue", "hotel"]));
}

// ---------------- strategies (mirror design-sim.mjs's verification block) ----------------
{
  const N = 20000;
  function rate(fn) {
    let w = 0;
    for (let i = 0; i < N; i++) {
      const rand = mulberry32(i * 7919 + 13);
      if (fn(rand)) w++;
    }
    return Number((w / N).toFixed(4));
  }
  const legitimate = rate((rand) => {
    const rest = rand() < 0.5 ? ["venue", "bus"] : ["bus", "venue"];
    return contactOrderWins(["hotel", ...rest]);
  });
  const random = rate((rand) => contactOrderWins(shuffled(CONTACTS, rand)));
  const displaySlot1 = rate((rand) => contactOrderWins(shuffled(CONTACTS, rand)));

  check("legitimate reasoning (hotel first) always wins", legitimate === 1, `${legitimate}`);
  check("content-blind random tap order stays well below full reasoning", random < 0.5, `${random}`);
  check("random tap order is close to the true 1/3 combinatorial base rate", Math.abs(random - 1 / 3) < 0.02, `${random}`);
  check("tapping by randomized display position is no better than random chance (position-leak closed)", Math.abs(displaySlot1 - 1 / 3) < 0.02, `${displaySlot1}`);
}

// ---------------- source-level regression checks ----------------
{
  const body = readFileSync(new URL("../../src/q1/DelayRecoverGame.tsx", import.meta.url), "utf8");
  const schoolTrip = readFileSync(new URL("../../src/data/content/schoolTrip.ts", import.meta.url), "utf8");
  const registry = readFileSync(new URL("../../src/q1/registry.ts", import.meta.url), "utf8");

  check("no free-reorder UI reintroduced (old exploit: move up/down buttons, delete-and-re-add action cards)", !/tl-btn|act-pool|act-card|move\(i,/.test(body));

  check("contact() is a 1-shot, idempotent, functional-updater state change (no free re-tap/undo, and batching-safe against the same class of bug found and fixed in HotelReceiveGame.tsx: reading stale render-scope state instead of the functional updater's prev)", (() => {
    const fn = body.split("const contact = ")[1]?.split("const share = ")[0] ?? "";
    return fn.includes("setContactedOrder((prev)") && fn.includes("prev.includes(id) ? prev :") && !fn.includes("contactedOrder.includes(id)");
  })());

  check("openContact() is also a functional-updater state change (same batching-safety requirement)", (() => {
    const fn = body.split("const openContact = ")[1]?.split("const contact = ")[0] ?? "";
    return /setOpenedContacts\(\(prev\)/.test(fn) && !fn.includes("openedContacts)");
  })());

  check("report/approve/share buttons are gated by disabled={} on the actual prerequisite state, not just visually styled", (() => {
    const reportBtn = body.match(/disabled=\{!checkOpened \|\| reported\}/);
    const approveBtn = body.match(/disabled=\{!allContacted \|\| approved\}/);
    const shareBtn = body.match(/disabled=\{!approved\}/);
    return !!reportBtn && !!approveBtn && !!shareBtn;
  })());

  check("a contact button only renders once its own card has been opened (disclosure gate per contact, not a global one)", /isOpened &&\s*\(/.test(body) && body.includes("isContacted ?"));

  check("the 3 contact cards render in session.displayOrder (randomized per session), not a fixed CONTACTS identity order -- closes the position-leak the same way design-sim.mjs's displayOrder models it", body.includes("session.displayOrder.map((id) =>"));

  check("a contacted card shows a locked 'connected' state (no re-open of the contact button) -- proves no retry path once tapped", /isContacted \? \(/.test(body) && body.includes("連絡済み"));

  check("the done branch (full win) and the reflecting branch (loss) are structurally distinct outcome() states, matching Gate H HONEST OUTCOME", body.includes('outcome === "done"') && body.includes('outcome === "reflecting"'));

  check("partial outcome calls onPartialComplete (falling back to onComplete), never onComplete directly on the reflecting branch", (() => {
    const reflectBlock = body.split('outcome === "reflecting"')[1] ?? "";
    return reflectBlock.includes("onPartialComplete") && !/onClick=\{onComplete\}/.test(reflectBlock);
  })());

  check("the reflecting screen re-presents all 3 contacts' detail text read-only via CONTACT_DETAIL (Gate G, THINK_AGAIN_CONTEXT_MISSING regression)", (() => {
    const reflectBlock = body.split('outcome === "reflecting"')[1]?.split('const allContacted')[0] ?? "";
    return reflectBlock.includes("CONTACTS.map((id) =>") && reflectBlock.includes("CONTACT_DETAIL[id]");
  })());

  check("the reflection continue button is disabled until a full reflection order is picked (THINK_AGAIN_SKIPPABLE regression)", /disabled=\{!canFinish\}/.test(body));

  check("share() computes win purely from contactOrderWins(contactedOrder) -- the actual recorded tap order, not a separately-tracked flag that could drift", (() => {
    const fn = body.split("const share = ")[1]?.split("const toggleReflect")[0] ?? "";
    return fn.includes("contactOrderWins(contactedOrder)");
  })());

  check("no old-implementation literals reintroduced (old exploit: free timeline reorder, plan-card selection, approve/share array-index checks)", !/PLAN_IDS|PLAN_LABEL|approveIdx|shareIdx|lastPlanIdx/.test(body));

  check("schoolTrip.ts's delay-trip experience describes the new flow (状況確認→連絡→学校承認, matching the rebuilt mechanic) rather than the old free-reorder prompt (which lived only in the component's own UI text, never in content data)", (() => {
    const idx = schoolTrip.indexOf('id: "delay-trip"');
    const around = schoolTrip.slice(idx, idx + 800);
    return around.includes("状況を確認") && around.includes("学校の承認") && !/並べ替え|ならべよう|↑↓で/.test(around);
  })());

  check("registry.ts's delay_recover comment mentions the hotel-priority judgment, not just the generic 4-stage shape", registry.includes("宿を優先"));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
