#!/usr/bin/env node
// Automated gameplay QA for Q1 place_and_test (ParkHeatGame.tsx / parkHeatLogic.ts).
// 2026-09-13: this is the mechanical-verification follow-up to a REAL bug
// already found and fixed earlier this session -- GOAL used to be 3 of 4
// spots, and "tree" alone happened to be a correct countermeasure for
// play/bench/path (exactly 3 of the 4 spots), so a child could win by
// dropping the same part everywhere without ever reasoning about the one
// spot (plaza) that needs different treatment. This harness turns that
// hand-reasoned finding into an executable regression guard: GOAL really
// is 4 (not silently re-lowered to 3), and no single repeated part can
// ever satisfy all 4 spots.
import { SPOTS, PARTS, GOAL, cooledSpot, computeResult, countOk, isGoalReached } from "../../src/q1/parkHeatLogic.ts";

let passed = 0, failed = 0;
function check(name, ok, detail = "") {
  if (ok) passed++; else failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}

// ---- 1. the core regression guard: GOAL is really 4, not 3 ----
check("GOAL is exactly 4 (the audit fix -- was 3, allowing a single-part shortcut)", GOAL === 4);
check("there are exactly 4 spots and 4 parts", SPOTS.length === 4 && PARTS.length === 4);

// ---- 2. the exact bug this fix closed: no single repeated part can cool
// all 4 spots (previously "tree" alone cooled 3 of 4, one below GOAL=3) ----
for (const part of PARTS) {
  const placed = {};
  for (const s of SPOTS) placed[s.id] = part.id;
  const result = computeResult(placed);
  const ok = countOk(result);
  check(
    `placing '${part.name}' (${part.id}) at every spot cools fewer than GOAL (${GOAL}) spots`,
    ok < GOAL,
    `cooled ${ok}/4 spots`,
  );
  check(`... and therefore does not reach the goal`, !isGoalReached(result));
}

// ---- 3. at least one full success path exists: one correct part per spot ----
{
  const winningPlaced = {};
  for (const s of SPOTS) winningPlaced[s.id] = s.good[0]; // any listed correct part
  const result = computeResult(winningPlaced);
  check("a hand-built assignment (each spot's own listed correct part) cools all 4 spots", countOk(result) === 4, JSON.stringify(winningPlaced));
  check("...and reaches the goal", isGoalReached(result));
}

// ---- 4. enumerate the full search space (4 spots ^ 4 parts = 256) to
// confirm at least one winning combo exists via brute force too, and that
// every spot individually has >=1 correct part (no spot is an impossible dead end) ----
{
  function* allPlacements() {
    const ids = SPOTS.map((s) => s.id);
    const partIds = PARTS.map((p) => p.id);
    function* rec(i, acc) {
      if (i === ids.length) { yield { ...acc }; return; }
      for (const p of partIds) { acc[ids[i]] = p; yield* rec(i + 1, acc); }
    }
    yield* rec(0, {});
  }
  const all = [...allPlacements()];
  check("full search space has 4^4 = 256 placements", all.length === 256);
  const winners = all.filter((p) => isGoalReached(computeResult(p)));
  check("at least one winning placement exists in the full search space", winners.length > 0, `${winners.length}/256 winning placements`);

  for (const s of SPOTS) {
    check(`spot '${s.name}' has at least one correct part listed (not an impossible dead end)`, s.good.length > 0);
  }
}

// ---- 5. false-positive check: a spot with an unlisted (wrong) part is
// never counted as cooled, even though something was placed there ----
{
  const plaza = SPOTS.find((s) => s.id === "plaza");
  const wrongPart = PARTS.find((p) => !plaza.good.includes(p.id));
  check(
    `plaza with a wrong-but-placed part ('${wrongPart.id}') is NOT cooled`,
    !cooledSpot(plaza, wrongPart.id),
  );
  check("plaza has a 'weak' explanation for that wrong part (never silently just fails)", !!plaza.weak[wrongPart.id]);
}

// ---- 6. an empty placement (nothing placed anywhere) cools zero spots ----
check("an empty placement cools 0 spots and does not reach the goal", countOk(computeResult({})) === 0 && !isGoalReached(computeResult({})));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
