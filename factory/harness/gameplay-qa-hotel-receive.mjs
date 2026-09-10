#!/usr/bin/env node
// Automated gameplay QA for Q1 hotel_receive (legacy-hotel-receive redesign, t1-check-in-per-group).
// Simulates player strategies against src/q1/hotelReceiveLogic.ts directly -- same rules as the
// design-stage design-sim.mjs, now against the shipped module: fixed-choice guessing, ignoring
// either card, and content-blind reads must stay well below full reasoning, every session must be
// winnable, and HotelReceiveGame.tsx must never leak the answer, allow brute-force retry, or drop
// Gate G/H behavior.
//
// Usage: node factory/harness/gameplay-qa-hotel-receive.mjs
import { readFileSync } from "node:fs";
import {
  ALLERGENS,
  GROUP_IDS,
  ROOM_CAPACITY,
  ROOM_TYPES,
  groupWin,
  newSession,
  sessionWin,
} from "../../src/q1/hotelReceiveLogic.ts";

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
  check("3 groups defined (hana/tsuki/hoshi, matching the approved design-sim.mjs GROUP_NAMES exactly -- impl review r1 MEDIUM DESIGN_GROUP_ID_DRIFT regression)", GROUP_IDS.length === 3 && GROUP_IDS.includes("hana") && GROUP_IDS.includes("tsuki") && GROUP_IDS.includes("hoshi"));
  check("3 room types with distinct capacities (3/4/6)", ROOM_TYPES.length === 3 && ROOM_CAPACITY.triple === 3 && ROOM_CAPACITY.basic === 4 && ROOM_CAPACITY.special === 6);
  check("7 real allergen items defined", ALLERGENS.length === 7);
}

// ---------------- strategies ----------------
const N = 8000;
function rate(fn) { let w = 0; for (let i = 0; i < N; i++) { const rand = mulberry32(i * 7919 + 13); const s = newSession(rand); if (fn(s, rand)) w++; } return Number((w / N).toFixed(4)); }

function legitimatePicks(session) {
  return Object.fromEntries(GROUP_IDS.map((id) => [id, { acceptRoom: session.groups[id].roomOk, specialMealMembers: session.groups[id].flaggedMembers }]));
}

const results = {};
results.legitimate_full_reasoning = rate((s) => sessionWin(s, legitimatePicks(s)));
results.random_pick = rate((s, rand) =>
  sessionWin(
    s,
    Object.fromEntries(
      GROUP_IDS.map((id) => {
        const g = s.groups[id];
        return [id, {
          acceptRoom: rand() < 0.5,
          specialMealMembers: Array.from({ length: g.size }, (_, i) => i).filter(() => rand() < 0.5),
        }];
      }),
    ),
  ),
);
results.room_always_accept = rate((s) =>
  sessionWin(s, Object.fromEntries(GROUP_IDS.map((id) => [id, { acceptRoom: true, specialMealMembers: s.groups[id].flaggedMembers }]))),
);
results.room_always_reject = rate((s) =>
  sessionWin(s, Object.fromEntries(GROUP_IDS.map((id) => [id, { acceptRoom: false, specialMealMembers: s.groups[id].flaggedMembers }]))),
);
results.meal_ignored_selects_nobody = rate((s) =>
  sessionWin(s, Object.fromEntries(GROUP_IDS.map((id) => [id, { acceptRoom: s.groups[id].roomOk, specialMealMembers: [] }]))),
);
results.meal_ignored_selects_everyone = rate((s) =>
  sessionWin(
    s,
    Object.fromEntries(
      GROUP_IDS.map((id) => {
        const g = s.groups[id];
        return [id, { acceptRoom: g.roomOk, specialMealMembers: Array.from({ length: g.size }, (_, i) => i) }];
      }),
    ),
  ),
);

check("legitimate reasoning always wins (every session is solvable)", results.legitimate_full_reasoning === 1, `${results.legitimate_full_reasoning}`);
check("content-blind random guessing stays well below full reasoning", results.random_pick < 0.05, `${results.random_pick}`);
check("always-accept room verdict fails well below full reasoning", results.room_always_accept <= 0.5, `${results.room_always_accept}`);
check("always-reject room verdict fails well below full reasoning", results.room_always_reject <= 0.5, `${results.room_always_reject}`);
check("ignoring the allergy roster (selecting nobody) fails well below full reasoning", results.meal_ignored_selects_nobody <= 0.5, `${results.meal_ignored_selects_nobody}`);
check("over-cautiously selecting everyone for special meal fails well below full reasoning (the exact distortion design review r1 BLOCKER warned against)", results.meal_ignored_selects_everyone <= 0.3, `${results.meal_ignored_selects_everyone}`);

// ---------------- session generation ----------------
{
  let allSolvable = true;
  for (let i = 0; i < 500; i++) {
    const s = newSession(mulberry32(i * 13 + 1));
    if (!sessionWin(s, legitimatePicks(s))) { allSolvable = false; break; }
  }
  check("newSession never returns an unwinnable session (500 samples)", allSolvable);

  let sawInsufficientRoom = false, sawSufficientRoom = false, sawSomeAllergy = false, sawNoAllergy = false;
  for (let i = 0; i < 500; i++) {
    const s = newSession(mulberry32(i * 29 + 3));
    for (const id of GROUP_IDS) {
      const g = s.groups[id];
      if (g.roomOk) sawSufficientRoom = true; else sawInsufficientRoom = true;
      if (g.flaggedMembers.length > 0) sawSomeAllergy = true; else sawNoAllergy = true;
    }
  }
  check("both room-sufficient and room-insufficient groups occur across sessions (not a fixed always-fits/always-too-small game)", sawSufficientRoom && sawInsufficientRoom);
  check("both allergy-present and allergy-free groups occur across sessions", sawSomeAllergy && sawNoAllergy);
}

// ---------------- groupWin correctness ----------------
{
  const rand = mulberry32(42);
  const s = newSession(rand);
  const g = s.groups.hana;
  check("groupWin requires an exact match of the flagged-member set (missing someone fails)", g.flaggedMembers.length > 0 ? !groupWin(g, { acceptRoom: g.roomOk, specialMealMembers: [] }) : true);
  check("groupWin requires an exact match of the flagged-member set (over-including someone fails)", groupWin(g, { acceptRoom: g.roomOk, specialMealMembers: Array.from({ length: g.size }, (_, i) => i) }) === (g.flaggedMembers.length === g.size));
  check("groupWin fails when the room verdict is wrong even if meal selection is correct", !groupWin(g, { acceptRoom: !g.roomOk, specialMealMembers: g.flaggedMembers }));
}

// ---------------- source-level checks on the component ----------------
{
  const src = readFileSync(new URL("../../src/q1/HotelReceiveGame.tsx", import.meta.url), "utf8");
  const body = src.replace(/^import[\s\S]*?from\s+"[^"]+";\s*$/gm, "");
  const schoolTripSrc = readFileSync(new URL("../../src/data/content/schoolTrip.ts", import.meta.url), "utf8");
  const registrySrc = readFileSync(new URL("../../src/q1/registry.ts", import.meta.url), "utf8");

  check("session is generated once per mount via a useState initializer, not recomputed every render", src.includes("useState<Session>(() => newSession())"));
  check("component imports group/room/allergen data from hotelReceiveLogic instead of redeclaring its own", src.includes('from "./hotelReceiveLogic"') && !/const\s+(GROUP_IDS|ROOM_TYPES|ROOM_CAPACITY|ALLERGENS)\s*[:=]/.test(body));
  const codeOnly = body.split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
  check("no old-implementation literals reintroduced (old exploit: drag-drop room grid, staffNear proximity check, bath time slots)", !codeOnly.includes("useDragDrop") && !codeOnly.includes("staffNear") && !codeOnly.includes("SLOTS") && !codeOnly.includes("BATH_CAP"));
  check("no rest-need / position-based datum reintroduced in the component (research.md found no real link -- must not be a scored mechanic)", !codeOnly.includes("休ませ") && !codeOnly.includes("酔い"));
  check("no rest-need / position-based datum reintroduced in child-visible content (schoolTrip.ts) -- impl review r1 MEDIUM QA_REGRESSIONS_OVERCLAIM_COVERAGE regression, the component-only scan above does not cover this", !schoolTripSrc.includes("休ませ") && !/月組.{0,40}酔い/.test(schoolTripSrc));
  check("no old 3-part room/meal/bath mechanic description reintroduced in child-visible content -- impl review r1 HIGH STALE_OLD_MECHANIC_CONTENT regression", !schoolTripSrc.includes("部屋・食事・入浴") && !/入浴時間/.test(schoolTripSrc));
  check("the hotel experience does not reference the old-mechanic school-trip-hotel scene image (art_brief_v1.json: no_art_required, this image depicts the removed grid/bath mechanic) -- impl review r1 HIGH STALE_OLD_MECHANIC_CONTENT regression", !/hotel-trip[\s\S]{0,400}school-trip-hotel/.test(schoolTripSrc));
  check("registry.ts comment for hotel_receive does not describe the old 3-stage room/meal/bath mechanic", !/hotel_receive:[^\n]*入浴/.test(registrySrc));

  // impl review r1 HIGH IMPLEMENTATION_FLOW_DIVERGENCE regression: game_spec_v1.json's
  // initial_visual_state requires all 3 group cards to be visible simultaneously (not a
  // one-group-at-a-time wizard), each with its own status icon that updates immediately on that
  // group's own commit.
  check("all 3 groups are rendered in a single pass over GROUP_IDS in the main playing view (not gated behind a single 'current index'), so all 3 cards are visible at once -- IMPLEMENTATION_FLOW_DIVERGENCE regression", (() => {
    // The playing view's per-group map uses an explicit block body ("=> {") to branch on
    // ui.committed; the done/reflecting screens' order.map calls all use implicit-return
    // parens ("=> (") instead, so this pattern is unique to the always-visible 3-card view.
    return (body.match(/order\.map\(\(id\) => \{/g) || []).length === 1 && !/const index/.test(body) && !/const currentId/.test(body);
  })());
  check("a committed group renders a locked, non-interactive result summary (own status icon/text) INSTEAD of its interactive controls -- proves there is no retry path back into an already-committed group, and that the result is shown immediately, not silently advanced past", (() => {
    const committedBranch = body.match(/if \(ui\.committed\) \{([\s\S]*?)\n\s{8}\}/)?.[1] ?? "";
    return (
      committedBranch.includes("チェックインが完了した") &&
      committedBranch.includes("まだチェックインできない") &&
      !committedBranch.includes("チェックインする") && // the commit button itself must not appear once committed
      !committedBranch.includes("dx-more") // the disclosure-open buttons must not appear once committed either
    );
  })());
  check("committing a group is a single-shot operation: the per-group commit(id) function requires acceptRoom to already be set and immediately marks that group committed with its computed win result (no path re-enters an already-committed group's interactive branch, per the check above)", (() => {
    const commitFn = body.match(/const commit = \(id: GroupId\) => \{([\s\S]*?)\n  \};/)?.[1] ?? "";
    return commitFn.includes("if (ui.acceptRoom === null) return") && commitFn.includes("groupWin(") && commitFn.includes("committed: true");
  })());
  check("partial outcome calls onPartialComplete (falling back to onComplete), never onComplete directly on the reflecting branch -- Gate H HONEST OUTCOME", (() => {
    const reflectBlock = body.split('outcome === "reflecting"')[1] ?? body;
    return reflectBlock.includes("onPartialComplete") && !/onClick=\{onComplete\}/.test(reflectBlock);
  })());
  check("the done branch calls onComplete only when every group actually won (finalWin computed via sessionWin against the actually-committed picks, not assumed from allWin tracking alone)", (() => {
    const doneBlock = body.split('outcome === "done" && finalPicks')[1]?.split('outcome === "reflecting"')[0] ?? "";
    return doneBlock.includes("finalWin") && doneBlock.includes("sessionWin(session, finalPicks)") && /onClick=\{finalWin \? onComplete : \(onPartialComplete \?\? onComplete\)\}/.test(doneBlock);
  })());
  check("each group's commit button requires BOTH of that group's own cards opened AND a room verdict selected -- CORE_DATA_DISCLOSURE_NOT_REQUIRED regression", (() => {
    const canCommitLine = body.match(/const canCommit = ([^;]+);/)?.[1] ?? "";
    const allReadLine = body.match(/const allRead = ([^;]+);/)?.[1] ?? "";
    return /disabled=\{!canCommit\}/.test(body) && canCommitLine.includes("allRead") && canCommitLine.includes("ui.acceptRoom !== null") && allReadLine.includes('ui.openCards.has("size")') && allReadLine.includes('ui.openCards.has("allergy")');
  })());
  check("room-verdict and member-selection buttons are disabled until that group's own both cards are read (no answering before reading)", (body.match(/disabled=\{!allRead\}/g) || []).length >= 2);
  check("opened-card tracking is add-only per group (no delete/filter that could un-read a card)", (() => {
    const toggleFn = body.split("const toggleCard = ")[1]?.split("const toggleMember = ")[0] ?? "";
    return toggleFn.includes("new Set(prev[id].openCards)") && toggleFn.includes(".add(card)") && !/delete|filter/.test(toggleFn);
  })());
  check("toggleCard/toggleMember read the PREVIOUS state from setGroupUI's functional updater (prev[id]), not the render-scope groupUI[id] closure -- a closure read would make rapid same-tick clicks (React 18 automatic batching) silently drop all but the last toggle, since each call would compute its result from the same stale snapshot", (() => {
    const toggleCardFn = body.split("const toggleCard = ")[1]?.split("const toggleMember = ")[0] ?? "";
    const toggleMemberFn = body.split("const toggleMember = ")[1]?.split("const commit = ")[0] ?? "";
    return /setGroupUI\(\(prev\)/.test(toggleCardFn) && !toggleCardFn.includes("groupUI[id]") &&
      /setGroupUI\(\(prev\)/.test(toggleMemberFn) && toggleMemberFn.includes("new Set(prev[id].specialMealMembers)") && !toggleMemberFn.includes("groupUI[id]");
  })());
  check("the reflection continue button is disabled until every group has a reflection room-verdict pick -- THINK_AGAIN_SKIPPABLE regression", (() => {
    const reflectBlock = body.split('outcome === "reflecting"')[1]?.split("return (")[1]?.split(/^\s*return \(/m)[0] ?? "";
    return reflectBlock.includes("canFinishReflection") && /disabled=\{!canFinishReflection\}/.test(reflectBlock);
  })());
  check("the reflection screen re-presents all 3 groups' size/room/allergy data by mapping the real session data, not a cached snapshot (THINK_AGAIN_CONTEXT_MISSING regression)", (() => {
    const reflectBlock = body.split('outcome === "reflecting"')[1] ?? "";
    const beforeCanFinish = reflectBlock.split("canFinishReflection")[0];
    return beforeCanFinish.includes("session.groups[id].proposedRoom") && beforeCanFinish.includes("session.groups[id].memberAllergens") && beforeCanFinish.includes("order.map");
  })());
  check("scoring is id-based (groupWin/sessionWin read by GroupId), never array-index/position-based across groups", !/results\[order\[\d/.test(body) && !/session\.groups\[order\[\d/.test(body));
  check("per-group UI state is keyed by real GroupId (hana/tsuki/hoshi), not by shuffled display position", body.includes("Record<GroupId, GroupUI>"));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
