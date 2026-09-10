#!/usr/bin/env node
// Design-stage exploit simulation for Q1 legacy-delay-recover
// (添乗員・旅程管理担当 — 列車30分遅延への対応、gameType delay_recover).
//
// research.md summary driving this design (factory/projects/legacy-delay-recover/research.md):
//
// - The reverse audit's exploit is "select-all": the old implementation let the child add/remove/
//   reorder action cards with zero progression cost and resubmit freely until a passing order was
//   found by trial and error -- no real judgment was required to eventually pass.
// - research.md confirms the existing 5-stage SHAPE (状況確認 -> 学校へ報告 -> 関係先への連絡・変更案
//   -> 学校の承認 -> 共有) is not invented: each stage individually is grounded (事故対応マニュアルの
//   状況把握が先という一般原則、修学旅行実施規則第11条の管理職への報告義務、旅行業法第12条の10の
//   代替サービス手配義務、学校が最終判断権を持つという権限構造、確定情報と未確定情報を混同させない
//   一般原則の共有タイミング）。What research did NOT find grounding for: the OLD implementation's
//   strict index-position checks ("承認は最後の変更案カードより後", "共有は配列の最後尾"), and the
//   "2 of 3 relevant parties" threshold (the IMPACTS data itself says all 3 -- 見学先/バス/宿 -- are
//   affected, so requiring all 3 is more faithful to the confirmed facts than requiring only 2).
// - research.md §4 found ONE genuinely time-critical relationship among the 3 affected parties: the
//   宿 (hotel)'s dinner service has a real cutoff, and contacting it late risks an irreversible result
//   (食事提供不可・キャンセル扱い) -- documented across multiple hospitality-industry sources (but
//   those sources are about INDIVIDUAL-GUEST bookings, not school-trip/group bookings specifically --
//   research.md §4-1 flags this generalization explicitly). No comparable urgency data was found for
//   見学先 (venue) or バス (bus).
//
// v2 (design review r1 FAIL 58, BLOCKER CORE_CAUSAL_MODEL_DISTORTED repair):
//
// v1 stated the hotel-priority rule as an absolute real-world certainty ("hotel is THE ONLY party
// with a real time constraint", "contacting it anything but first ALWAYS irreversibly loses dinner").
// The reviewer correctly identified that research.md only supports a QUALIFIED, gradual pattern
// ("earlier notice generally preserves more of the hotel's adjustment room", individual-guest
// sources, no confirmed school-trip-specific numeric threshold) -- not a deterministic first-of-three
// cutoff. v2 does not change the underlying game rule (contactOrderWins is unchanged: this is a
// legitimate, disclosed GAME-DESIGN OPERATIONALIZATION of "prioritize the time-critical one", not a
// claim that missing-hotel-first always causes real-world catastrophic failure) -- what changes is
// that every design artifact referencing this rule must now explicitly label it as a simplified game
// rule, not a cited real threshold (see fact_sheet_v2.json/ae_v2.json/c_compression_v2.json/
// game_translations_v2.json's revision notes). This file's job is purely the combinatorial
// verification, which does not itself assert real-world truth, so its only content change is this
// comment and the position-leak fix below.
//
// Also fixes MEDIUM POSITION_LEAK_ANALYSIS_INCOMPLETE: v1 measured reverse_ui_list_order_always=1
// (always tapping the reverse of the FIXED display order [venue,bus,hotel] -> [hotel,bus,venue] wins
// 100%) but the design text incorrectly claimed fixed strategies broadly underperform. v2 closes this
// properly at the mechanic level (not just by acknowledging it): the 3 contact cards' VISUAL display
// order is now randomized per session, independent of the underlying win condition (which depends on
// TAP order, never display position). A positional heuristic ("always tap whichever card is shown
// last/first") can no longer track which one is actually the hotel once display order is decorrelated
// from card identity -- verified below (any_fixed_display_position_heuristic converges to the same
// ~1/3 base rate as content-blind random guessing, not the 100%/0% v1 had for a static display order).
//
// D (the one real judgment this game asks for): given 3 affected parties to contact, recognize which
// one is time-critical (the hotel, per its dinner cutoff) and contact it BEFORE the other two --
// via the CONTENT of the hotel card, not its on-screen position (which is randomized). Everything else
// in the 5-stage flow (check first, report to school, get school approval before finalizing, share
// only after approval) is enforced as a fixed structural sequence in the implementation -- not a
// judgment with multiple legitimate answers, so it is not modeled as a probabilistic axis here.

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The 3 affected parties (matches the old implementation's IMPACTS display -- all 3 are impacted by
// the 30-minute delay, per research.md §5's recommendation to require all 3 rather than the old "2 of
// 3" threshold that had no grounding).
export const CONTACTS = ["venue", "bus", "hotel"]; // 見学先・バス・宿 (identity order, NOT display order)

// A session is "which of the 3 contacts did the child TAP first" -- the only real judgment axis.
// (There is deliberately no randomized world state beyond display order: research.md grounds a fixed
// 30-minute-delay scenario, matching the original reverse-audited B; what's randomized below is
// STRATEGY sampling and visual display order for verification, not the scenario's facts.)
export function contactOrderWins(order) {
  // order: a permutation of CONTACTS by TAP sequence, e.g. ["hotel","venue","bus"].
  // Win iff hotel is contacted before both venue and bus (the only time-critical relationship
  // research.md actually supports -- see the v2 revision note above: this is a disclosed game-design
  // operationalization of a qualified real pattern, not an assertion of a confirmed real threshold).
  return order[0] === "hotel";
}

function legitimateOrder(rand) {
  // Genuine reasoning: hotel first (time-critical), the other two in either order (no research
  // distinguishes venue-vs-bus ordering, so a randomized tie for the non-critical pair is fine and
  // does not affect the win condition).
  const rest = rand() < 0.5 ? ["venue", "bus"] : ["bus", "venue"];
  return ["hotel", ...rest];
}

function shuffle(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// The card's on-screen DISPLAY order, randomized per session, independent of CONTACTS identity order.
// This is what closes the position-leak: a strategy that taps by screen position (e.g. "always tap
// whichever card is shown last") can no longer reliably land on the hotel, because the hotel's screen
// position varies session to session.
function displayOrder(rand) {
  return shuffle(CONTACTS, rand);
}

// ---------------- verification ----------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const N = 20000;
  function rate(fn) {
    let w = 0;
    for (let i = 0; i < N; i++) {
      const rand = mulberry32(i * 7919 + 13);
      if (fn(rand)) w++;
    }
    return Number((w / N).toFixed(4));
  }

  const results = {};

  // Legitimate reasoning: recognize the hotel's real time-criticality (by reading its card's
  // content), contact it first regardless of where it happens to be displayed.
  results.legitimate_full_reasoning = rate((rand) => contactOrderWins(legitimateOrder(rand)));

  // Content-blind random: uniformly random TAP order of the 3 contacts (no understanding of which
  // one is urgent, and not even using display position as a heuristic). Probability hotel lands first
  // in a random permutation of 3 = 1/3.
  results.random_order = rate((rand) => contactOrderWins(shuffle(CONTACTS, rand)));

  // Positional heuristics that ignore card CONTENT and tap purely by screen POSITION each session
  // (e.g. "always tap the card shown in slot 1 first", "always tap the card shown in slot 3 first").
  // Since displayOrder() is independently randomized each session, these can only succeed at the same
  // ~1/3 base rate as random_order -- v1's static display order let "always reverse the list" reach
  // 100% (reverse_ui_list_order_always); v2's randomized display closes that.
  results.always_tap_display_slot_1_first = rate((rand) => contactOrderWins(displayOrder(rand)));
  results.always_tap_display_slot_3_first = rate((rand) => contactOrderWins([...displayOrder(rand)].reverse()));

  // Exhaustive-submit is structurally impossible (a real session only allows ONE commit -- see
  // game_translations_v2.json's t1 primary_action, one-shot taps with no undo/redo). We still confirm
  // here that of the 6 possible TAP orderings, only the 2 with hotel first win -- i.e. even a lucky
  // single guess needs real information (which card is the hotel, from content not position) to
  // reliably land on a winning order.
  const allOrders = [
    ["venue", "bus", "hotel"], ["venue", "hotel", "bus"],
    ["bus", "venue", "hotel"], ["bus", "hotel", "venue"],
    ["hotel", "venue", "bus"], ["hotel", "bus", "venue"],
  ];
  results.fraction_of_all_orderings_that_win = Number((allOrders.filter(contactOrderWins).length / allOrders.length).toFixed(4));

  let passed = 0, failed = 0;
  function check(name, ok, detail = "") {
    if (ok) passed++; else failed++;
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  }

  check("legitimate reasoning (read the hotel card's content, tap it first regardless of its on-screen position) always wins", results.legitimate_full_reasoning === 1, `${results.legitimate_full_reasoning}`);
  check("content-blind random tap order stays well below full reasoning", results.random_order < 0.5, `${results.random_order}`);
  check("random tap order is close to the true 1/3 combinatorial base rate (sanity check on the simulation itself)", Math.abs(results.random_order - 1 / 3) < 0.02, `${results.random_order}`);
  check("tapping by screen position (slot 1 first) is no better than random chance now that display order is randomized per session -- closes POSITION_LEAK_ANALYSIS_INCOMPLETE (v1's static hotel-last display let a fixed 'always reverse the list' shortcut reach 100%)", Math.abs(results.always_tap_display_slot_1_first - 1 / 3) < 0.02, `${results.always_tap_display_slot_1_first}`);
  check("tapping by screen position (slot 3 first, i.e. 'reverse the displayed list') is likewise no better than random chance", Math.abs(results.always_tap_display_slot_3_first - 1 / 3) < 0.02, `${results.always_tap_display_slot_3_first}`);
  check("exactly 1/3 of the 6 possible tap orderings actually win (only the 2 with hotel first) -- confirms the win condition is neither trivial (always true) nor impossible (always false)", Math.abs(results.fraction_of_all_orderings_that_win - 1 / 3) < 0.001, `${results.fraction_of_all_orderings_that_win}`);

  console.log("\nfull results:", JSON.stringify(results, null, 2));
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
