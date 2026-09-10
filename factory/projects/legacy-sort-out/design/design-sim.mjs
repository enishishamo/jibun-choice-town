#!/usr/bin/env node
// Design-stage exploit simulation for Q1 legacy-sort-out (食品残渣を選別し肥料化する
// リサイクル工場作業員, gameType sort_out).
//
// research.md summary driving this design (factory/projects/legacy-sort-out/research.md):
//
// - The reverse audit's exploit is "brute force": the old implementation
//   (src/q1/RecycleGame.tsx) let the child re-try any of 3 tools on any contaminant
//   indefinitely at zero cost, with no penalty for a wrong guess -- persistence alone
//   guarantees a win regardless of judgment.
// - research.md confirms the 3-tool structure (magnet separator / wind separator /
//   hand-sort) matches real food-waste recycling/composting facility practice, with one
//   correction from the OLD implementation: the old "net/sieve (ふるい)" tool for large
//   floppy bags is replaced with "wind separator (風力選別)" -- which the research found
//   better-grounded for light film material (a sieve is mainly used, in the sources
//   found, to size-screen FINISHED compost, not to catch bags on the incoming line) AND
//   which schoolLunch.ts's own content data already lists as a tool (id "wind", 💨) even
//   though the old game code never actually implemented it (a pre-existing content/code
//   mismatch this rebuild also fixes).
// - research.md §6 explicitly flags the same overclaim family found in legacy-crowd-flow:
//   real practice does NOT treat a single tool/pass as fully, certainly resolving
//   contamination (magnet separators can miss items without proper feed tuning; hand-sort
//   exists specifically as a supplementary final check after machine sorting). This
//   design's win/loss narrative therefore makes NO claim about complete real-world
//   resolution, professional-judgment quality, or a tool pairing being "the" documented
//   source example -- only a plain, factual claim about whether the chosen tool matches
//   the item's actual observed property, mirroring the successful, modest tone already
//   used in legacy-hotel-receive/legacy-delay-recover (neither of which ever hit this
//   overclaim family, unlike legacy-crowd-flow's 6-round saga -- see blocked-queue.md).
//
// v2 (design review r1 FAIL 42 repair): r1 found a genuine oversight -- v1's JSON design
// chain described each of the 3 item SLOTS as a fixed visible identity (a metal spoon /
// a large plastic bag / a plastic spoon) that then independently received one of the 3
// properties, which can produce physically incoherent sessions (a plastic bag assigned
// magnetic_metal, a metal spoon assigned light_film). Unlike crowd-flow's LOCATIONS
// (entrance/food court/stage), which have no inherent physical nature constraining which
// cause they can host, sort_out's items DO have a visible material identity that
// constrains which property is physically possible -- copying the location-independence
// pattern without checking this disanalogy was the bug. v2's fix is entirely in the JSON
// chain (game_translations_v2.json, ae_v3.json): each item slot's DESCRIBED APPEARANCE is
// now generated to be causally coherent with whichever property is independently sampled
// for it that session (the observation IS the honestly-described property, not a fixed
// named object that could receive an incompatible one). This file's ITEMS/PROPERTIES/
// sessionWin below are UNCHANGED -- independent per-slot sampling was already correct for
// closing ANSWER_LEAK_PERMUTATION_ELIMINATION; only what a "slot" is understood to
// represent changed.
//
// D (the one real judgment this game asks for): read each item's OBSERVED property
// (independently, randomly assigned per session -- can repeat across items, and each
// item's visible description is written to honestly match whatever property it has this
// session) and select the ONE tool whose real physical principle matches that property
// (magnetic reaction -> magnet separator; very light / floats in a breeze -> wind
// separator; neither, and close enough in size/weight to food to be missed by both
// machines -> hand-sort). No item's property is deducible from any other item's property
// (independent sampling). The current chain (v2+) makes no claim that an unmatched tool
// has zero real-world effect, and no claim that the facility's contamination is fully
// resolved -- only that the chosen tool's principle did or didn't match what was
// observed, in this attempt.

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 3 grounded material-property categories (research.md §2/§5) and the tool whose
// physical principle directly matches each.
export const PROPERTIES = ["magnetic_metal", "light_film", "dense_small_nonmagnetic"]; // 磁石に反応する金属／軽くて風に舞う／磁石に反応せず風にも飛ばない小さくて重い物
export const TOOLS = ["magnet", "wind", "hand"]; // 磁選機／風力選別／手選別
export const CORRECT_TOOL = { magnetic_metal: "magnet", light_film: "wind", dense_small_nonmagnetic: "hand" };

// 3 physical item slots on the line, independent of which property they happen to host
// this session.
export const ITEMS = ["item_a", "item_b", "item_c"];

function newSession(rand) {
  // Independent uniform sampling per item (with replacement) -- properties can repeat
  // across items this session. Mirrors legacy-crowd-flow's ANSWER_LEAK_PERMUTATION_
  // ELIMINATION fix from the start: a permutation (each property exactly once) would let
  // 2 observed items determine the 3rd by elimination.
  const assignment = {};
  for (const item of ITEMS) assignment[item] = PROPERTIES[Math.floor(rand() * PROPERTIES.length)];
  return { assignment };
}

// picks: { [item]: toolId }
export function sessionWin(session, picks) {
  return ITEMS.every((item) => picks[item] === CORRECT_TOOL[session.assignment[item]]);
}

function legitimatePicks(session) {
  const picks = {};
  for (const item of ITEMS) picks[item] = CORRECT_TOOL[session.assignment[item]];
  return picks;
}

// ---------------- verification ----------------
if (import.meta.url === `file://${process.argv[1]}`) {
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

  const results = {};

  results.legitimate_full_reasoning = rate((s) => sessionWin(s, legitimatePicks(s)));

  // Content-blind random: pick a uniformly random tool per item, ignoring the observed property.
  results.random_pick = rate((s, rand) => {
    const picks = {};
    for (const item of ITEMS) picks[item] = TOOLS[Math.floor(rand() * TOOLS.length)];
    return sessionWin(s, picks);
  });

  // Fixed-slot heuristics: always assume a specific slot hosts a specific property (e.g.
  // "item_a is always the metal one"), ignoring this session's actual randomized assignment.
  results.always_assume_fixed_mapping = rate((s) =>
    sessionWin(s, { item_a: "magnet", item_b: "wind", item_c: "hand" })
  );

  // Always pick the same single tool for every item (a truly content-blind fixed strategy).
  for (const tool of TOOLS) {
    results[`always_${tool}_everywhere`] = rate((s) => sessionWin(s, { item_a: tool, item_b: tool, item_c: tool }));
  }

  // A strategy that reads only 2 of the 3 items, then infers the 3rd by elimination
  // (assuming all 3 properties are distinct, which independent sampling does NOT
  // guarantee -- properties can repeat).
  results.two_observed_plus_elimination_guess_third = rate((s, rand) => {
    const [itemA, itemB, itemC] = ITEMS;
    const seenProps = new Set([s.assignment[itemA], s.assignment[itemB]]);
    const remaining = PROPERTIES.filter((p) => !seenProps.has(p));
    const guessedPropForC = remaining.length === 1 ? remaining[0] : PROPERTIES[Math.floor(rand() * PROPERTIES.length)];
    const picks = {
      [itemA]: CORRECT_TOOL[s.assignment[itemA]],
      [itemB]: CORRECT_TOOL[s.assignment[itemB]],
      [itemC]: CORRECT_TOOL[guessedPropForC],
    };
    return sessionWin(s, picks);
  });

  let passed = 0, failed = 0;
  function check(name, ok, detail = "") {
    if (ok) passed++; else failed++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  }

  check("legitimate reasoning (read each item's actual property, pick the matching tool) always wins", results.legitimate_full_reasoning === 1, `${results.legitimate_full_reasoning}`);
  check("content-blind random tool-per-item stays well below full reasoning", results.random_pick < 0.1, `${results.random_pick}`);
  check("assuming a fixed slot->property mapping (ignoring this session's randomized assignment) fails most of the time", results.always_assume_fixed_mapping < 0.3, `${results.always_assume_fixed_mapping}`);
  for (const tool of TOOLS) {
    check(`always using "${tool}" for every item (ignoring property entirely) fails most of the time`, results[`always_${tool}_everywhere`] < 0.2, `${results[`always_${tool}_everywhere`]}`);
  }
  check("reading only 2 of 3 items and guessing the 3rd by elimination does not succeed reliably -- closes ANSWER_LEAK_PERMUTATION_ELIMINATION from the start", results.two_observed_plus_elimination_guess_third < 0.5, `${results.two_observed_plus_elimination_guess_third}`);

  console.log("\nfull results:", JSON.stringify(results, null, 2));
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
