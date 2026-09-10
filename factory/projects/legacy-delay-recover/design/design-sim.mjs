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
//   (食事提供不可・キャンセル扱い) -- documented across multiple hospitality-industry sources. No
//   comparable urgency data was found for 見学先 (venue) or バス (bus). Per the hotel-receive lesson
//   (use only the axis that is actually backed by research, do not force invented symmetry across all
//   items), this design makes ONLY the hotel time-sensitive; venue/bus are simple required contacts
//   with no ordering claim between themselves.
//
// D (the one real judgment this game asks for): given 3 affected parties to contact, recognize which
// one is time-critical (the hotel, because of its dinner cutoff) and contact it BEFORE the other two --
// not because of an invented "official rule", but because earlier contact preserves more of the
// hotel's real ability to adjust (research.md §4-1/§4-3). Everything else in the 5-stage flow (check
// first, report to school, get school approval before finalizing, share only after approval) is
// enforced as a fixed structural sequence in the implementation -- not a judgment with multiple
// legitimate answers, so it is not modeled as a probabilistic axis here.

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
export const CONTACTS = ["venue", "bus", "hotel"]; // 見学先・バス・宿

// A session is just "which of the 3 contacts did the child do first" -- the only real judgment axis.
// (There is deliberately no randomized world state: research.md grounds a fixed 30-minute-delay
// scenario, matching the original reverse-audited B; what's randomized below is STRATEGY sampling for
// verification, not the scenario itself.)
export function contactOrderWins(order) {
  // order: a permutation of CONTACTS, e.g. ["hotel","venue","bus"].
  // Win iff hotel is contacted before both venue and bus (the only time-critical relationship
  // research.md actually supports).
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

  // Legitimate reasoning: recognize the hotel's real time-criticality, contact it first.
  results.legitimate_full_reasoning = rate((rand) => contactOrderWins(legitimateOrder(rand)));

  // Content-blind random: uniformly random permutation of the 3 contacts (no understanding of which
  // one is urgent). Probability hotel lands first in a random permutation of 3 = 1/3.
  results.random_order = rate((rand) => contactOrderWins(shuffle(CONTACTS, rand)));

  // Naive fixed-order heuristics a child might default to without reading anything: the order the
  // contacts happen to be listed in the UI (venue, bus, hotel -- CONTACTS array order, i.e. hotel
  // always last), and the reverse of that.
  results.ui_list_order_always = contactOrderWins([...CONTACTS]) ? 1 : 0; // ["venue","bus","hotel"]
  results.reverse_ui_list_order_always = contactOrderWins([...CONTACTS].reverse()) ? 1 : 0; // ["hotel","bus","venue"]

  // "Select-all, submit, and if it fails just try the next arrangement" exhaustive strategy: since a
  // real session only allows ONE commit (no in-session retry -- see the "no_retry" note in
  // game_translations), this old exploit path does not exist structurally. We still confirm here
  // that of the 6 possible orderings, only the 2 with hotel first win -- i.e. exhaustively trying
  // "just resubmit a different order" would need real information (which one is time-critical), not
  // brute luck, to reliably land on a winning order on the first (only) attempt.
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

  check("legitimate reasoning (prioritize the time-critical hotel contact) always wins", results.legitimate_full_reasoning === 1, `${results.legitimate_full_reasoning}`);
  check("content-blind random contact order stays well below full reasoning", results.random_order < 0.5, `${results.random_order}`);
  check("random contact order is close to the true 1/3 combinatorial base rate (sanity check on the simulation itself)", Math.abs(results.random_order - 1 / 3) < 0.02, `${results.random_order}`);
  check("defaulting to the UI's listed order (hotel last) fails", results.ui_list_order_always === 0, `${results.ui_list_order_always}`);
  check("exactly 1/3 of the 6 possible orderings actually win (only the 2 with hotel first) -- confirms the win condition is neither trivial (always true) nor impossible (always false)", Math.abs(results.fraction_of_all_orderings_that_win - 1 / 3) < 0.001, `${results.fraction_of_all_orderings_that_win}`);

  console.log("\nfull results:", JSON.stringify(results, null, 2));
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
