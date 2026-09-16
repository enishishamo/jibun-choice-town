#!/usr/bin/env node
// Automated gameplay QA for the redesigned SafetyPlanGame (Continuous
// Product Loop, 2026-09-07 -- factory/state/audits/audit-summary.md
// flagged safety_plan GQ48/CA47: opening the allergy/motion-sickness info
// cards was a pure click-tracking gate whose content never affected any
// actual role assignment).
//
// Round 1's fix required a specific band's own adult to hold a matching
// role, but independent review found the post-check TEXT stated that
// exact rule outright on the first failure (a Gate C bypass: read the
// error message instead of the card) and that 最後尾 was an unmotivated
// pairing for motion-sickness. Round 2 (tested here): 月組's required
// role is now 先頭 (paces the group / calls rest stops -- matches "こま
// めに休憩" in the card), and NEITHER the not-opened NOR the
// wrong-assignment messages ever state the literal band->role rule.
//
// Drives the pure rules in src/q1/safetyPlanLogic.ts directly.

import { ADULTS, computeIssues } from "../../src/q1/safetyPlanLogic.ts";

let passed = 0, failed = 0;
function check(name, ok, detail = "") {
  if (ok) passed++; else failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}

const BAND_IDS = ["yuki", "hana", "kaze", "tsuki", "sora"];

// a fully-assigned baseline: 5 distinct adults across the 5 bands, all 4
// roles filled with distinct adults. hana -> vice, tsuki -> nurse.
const baseAssign = { yuki: "homeroom", hana: "vice", kaze: "head", tsuki: "nurse", sora: "parent" };
// a correctly-linked baseline: medic == hana's own adult (vice), head (先頭) == tsuki's own adult (nurse).
const baseRoles = { head: "nurse", tail: "homeroom", medic: "vice", contact: "parent" };

function issuesFor(overrides = {}) {
  return computeIssues(BAND_IDS, {
    placed: baseAssign,
    head: baseRoles.head,
    tail: baseRoles.tail,
    medic: baseRoles.medic,
    contact: baseRoles.contact,
    openedDocs: [],
    ...overrides,
  });
}

const LITERAL_ANSWER_PHRASES = ["救急用品を持つように", "先頭を歩くように", "花組の担当の先生が", "月組の担当の先生が"];
function containsLiteralAnswer(issueList) {
  return issueList.some((i) => LITERAL_ANSWER_PHRASES.some((p) => i.includes(p)));
}

// ---- the core BLOCKER this round fixes: no issue message, at any point,
// ever states the literal band->role rule outright -- across every state
// this function can be reached in ----
{
  const scenarios = [
    issuesFor({ openedDocs: [] }),
    issuesFor({ openedDocs: ["hana"] }),
    issuesFor({ openedDocs: ["tsuki"] }),
    issuesFor({ openedDocs: ["hana", "tsuki"] }),
    issuesFor({ openedDocs: ["hana", "tsuki"], medic: "parent" }),
    issuesFor({ openedDocs: ["hana", "tsuki"], head: "homeroom", tail: "nurse" }),
    issuesFor({ openedDocs: ["hana", "tsuki"], medic: "parent", head: "homeroom", tail: "nurse" }),
  ];
  check(
    "no issue message, in any reachable state, ever states the literal band->role rule (Gate C: reading the card must still be required, not just reading the failure text)",
    scenarios.every((s) => !containsLiteralAnswer(s)),
    JSON.stringify(scenarios.filter(containsLiteralAnswer)),
  );
}

// ---- the not-yet-opened messages must not leak the risk TYPE either
// (a pre-open leak the original code already had, now removed) ----
{
  const neverOpened = issuesFor({ openedDocs: [] });
  check(
    "the hana not-opened message names the band but not the allergy risk itself",
    neverOpened.some((i) => i.includes("花組") && i.includes("資料")) && !neverOpened.some((i) => i.includes("アレルギー")),
    JSON.stringify(neverOpened),
  );
  check(
    "the tsuki not-opened message names the band but not the motion-sickness risk itself",
    neverOpened.some((i) => i.includes("月組") && i.includes("資料")) && !neverOpened.some((i) => i.includes("乗り物酔い")),
    JSON.stringify(neverOpened),
  );
}

// ---- content is load-bearing: breaking EACH link in isolation (holding
// the other one correct) must be independently detected ----
{
  // break ONLY the hana link; tsuki stays correctly linked (head=nurse).
  const brokenHanaOnly = issuesFor({ openedDocs: ["hana", "tsuki"], medic: "parent" });
  check(
    "breaking ONLY the hana/medic link (tsuki/head left correct) is flagged, and does not also spuriously flag tsuki",
    brokenHanaOnly.some((i) => i.includes("花組")) && !brokenHanaOnly.some((i) => i.includes("月組")),
    JSON.stringify(brokenHanaOnly),
  );
}
{
  // break ONLY the tsuki link; hana stays correctly linked (medic=vice).
  const brokenTsukiOnly = issuesFor({ openedDocs: ["hana", "tsuki"], head: "homeroom", tail: "nurse" });
  check(
    "breaking ONLY the tsuki/先頭 link (hana/medic left correct) is flagged, and does not also spuriously flag hana",
    brokenTsukiOnly.some((i) => i.includes("月組")) && !brokenTsukiOnly.some((i) => i.includes("花組")),
    JSON.stringify(brokenTsukiOnly),
  );
}

// ---- the specific-link hint stays gated behind actually opening the
// doc -- a player who never opened it only ever sees the generic
// "haven't checked it" message, never the (non-literal, but still
// content-aware) specific one ----
{
  const neverOpenedButWrong = issuesFor({ openedDocs: [], medic: "parent", head: "homeroom", tail: "nurse" });
  check(
    "without opening hana's doc, only the generic not-checked message appears for it -- never the specific comparison hint",
    neverOpenedButWrong.filter((i) => i.includes("花組")).length === 1 && neverOpenedButWrong.some((i) => i.includes("花組") && i.includes("資料を、まだ確認していない")),
    JSON.stringify(neverOpenedButWrong),
  );
  check(
    "without opening tsuki's doc, only the generic not-checked message appears for it -- never the specific comparison hint",
    neverOpenedButWrong.filter((i) => i.includes("月組")).length === 1 && neverOpenedButWrong.some((i) => i.includes("月組") && i.includes("資料を、まだ確認していない")),
    JSON.stringify(neverOpenedButWrong),
  );
}

// ---- a fixed fallback heuristic (put the SAME single adult in every
// role) must not trivially bypass the content requirement regardless of
// how bands were assigned -- since hana and tsuki always get two
// DIFFERENT adults (put() enforces a 1:1 mapping), one adult occupying
// every role can satisfy AT MOST one of the two links, never both ----
{
  const sameAdultEverywhere = computeIssues(BAND_IDS, {
    placed: baseAssign,
    head: "homeroom", tail: "homeroom", medic: "homeroom", contact: "homeroom",
    openedDocs: ["hana", "tsuki"],
  });
  check(
    "putting one single adult (not hana's or tsuki's own) in every role still leaves both links flagged as wrong",
    sameAdultEverywhere.some((i) => i.includes("花組")) && sameAdultEverywhere.some((i) => i.includes("月組")),
    JSON.stringify(sameAdultEverywhere),
  );
}
{
  // even if the single repeated adult happens to be hana's OWN adult
  // (vice), the tsuki link (a different adult, nurse) still can't be
  // satisfied by the same person -- so this fixed heuristic still fails
  // on at least one link, it can never silently pass both.
  const sameAdultIsHanas = computeIssues(BAND_IDS, {
    placed: baseAssign,
    head: "vice", tail: "vice", medic: "vice", contact: "vice",
    openedDocs: ["hana", "tsuki"],
  });
  check(
    "a repeated single adult can satisfy at most ONE of the two links (never both), so this heuristic can never fully pass",
    !sameAdultIsHanas.some((i) => i.includes("花組")) && sameAdultIsHanas.some((i) => i.includes("月組")),
    JSON.stringify(sameAdultIsHanas),
  );
}

// ---- structural completeness checks must still all function ----
check("missing a band assignment is flagged", issuesFor({ placed: { ...baseAssign, sora: undefined } }).some((i) => i.includes("引率の大人がいない班")));
check("missing 先頭 is flagged", issuesFor({ head: null }).some((i) => i.includes("先頭を歩く担当")));
check("missing 最後尾 is flagged", issuesFor({ tail: null }).some((i) => i.includes("最後尾を歩く担当")));
check("先頭 and 最後尾 being the same adult is flagged", issuesFor({ tail: baseRoles.head }).some((i) => i.includes("先頭と最後尾")));
check("missing 救急用品 is flagged", issuesFor({ medic: null }).some((i) => i.includes("救急用品の担当")));
check("missing 緊急連絡先 is flagged", issuesFor({ contact: null }).some((i) => i.includes("緊急連絡先の担当")));

// ---- a fully correct plan, with both docs opened and both links honored, has zero issues ----
{
  const correct = computeIssues(BAND_IDS, {
    placed: baseAssign,
    head: "nurse", // tsuki's own adult
    tail: "homeroom",
    medic: "vice", // hana's own adult
    contact: "parent",
    openedDocs: ["hana", "tsuki"],
  });
  check("a fully correct, fully-informed plan has zero issues", correct.length === 0, JSON.stringify(correct));
}

check("ADULTS still has exactly 5 entries (one per band)", ADULTS.length === 5);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
