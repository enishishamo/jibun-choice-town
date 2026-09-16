#!/usr/bin/env node
// Automated gameplay QA for the redesigned FactoryLineGame (Continuous
// Product Loop, 2026-09-07 — factory/state/audits/audit-summary.md flagged
// line_debug GQ39/CA57: a red bottleneck highlight leaked the answer, and
// any single tweak always produced the identical fixed result).
// Round 2 (this version) adds checks for defects an independent review
// found in round 1's fix: select-all still won, diagnosis was
// content-independent brute-forceable, one field alone was sufficient, and
// a tweak's own description restated the diagnosis.
// Drives the pure rules in src/q1/factoryLineLogic.ts directly.
//
// Usage: node factory/harness/gameplay-qa-line-debug.mjs

import { BASE, BOTTLENECK, FIXED, MAX_DIAGNOSIS_ATTEMPTS, MIN_STEPS_SEEN, PARTIAL, TWEAKS, isFullFix } from "../../src/q1/factoryLineLogic.ts";

let passed = 0, failed = 0;
function check(name, ok, detail = "") {
  if (ok) passed++; else failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
}

// ---- the bottleneck must actually be findable by comparing data, and be a genuine outlier ----
const bottleneck = BASE.find((s) => s.id === BOTTLENECK);
const others = BASE.filter((s) => s.id !== BOTTLENECK);
check("the bottleneck step exists in BASE", !!bottleneck);
// Rate alone doesn't uniquely identify the bottleneck: a step downstream of
// it (s6) is naturally starved and also shows a low rate, without being the
// actual cause. Round 2: s6 also carries a small non-zero loss (a review
// HIGH found that "loss > 0" alone, checked on a SINGLE step, used to
// uniquely identify the bottleneck without any real comparison) — the
// genuine signal now requires comparing MAGNITUDE: the bottleneck's own
// stop+loss must be clearly worse than every other step's, not merely
// present vs. absent.
check(
  "no other step's loss is anywhere close to the bottleneck's (checking magnitude, not just presence, is required)",
  others.every((s) => s.loss <= bottleneck.loss * 0.3),
  `bottleneck loss=${bottleneck.loss}; others=${others.map((s) => `${s.id}:${s.loss}`).join(",")}`,
);
check(
  "no other step's stop time is anywhere close to the bottleneck's either",
  others.every((s) => s.stop <= bottleneck.stop * 0.75),
  `bottleneck stop=${bottleneck.stop}; others=${others.map((s) => `${s.id}:${s.stop}`).join(",")}`,
);
check(
  "at least one other step has SOME non-zero loss (so 'which one has any loss at all' is not a free single-field shortcut)",
  others.some((s) => s.loss > 0),
);
check(
  "rate alone is NOT sufficient to identify the bottleneck (a downstream step is starved and reads even slower, without being the actual cause)",
  others.some((s) => s.rate < bottleneck.rate),
);
check("must open at least 2 steps before diagnosing (forces real comparison, not a single lucky tap)", MIN_STEPS_SEEN >= 2);
check("but not so many that every step must be opened (some genuine judgment before full disclosure)", MIN_STEPS_SEEN < BASE.length);

// ---- round 2 fix: diagnosis must not be a free, unlimited brute force ----
check(
  "wrong station guesses are capped well below the number of stations (can't just click through all of them for free)",
  MAX_DIAGNOSIS_ATTEMPTS >= 1 && MAX_DIAGNOSIS_ATTEMPTS < BASE.length - 1,
  `MAX_DIAGNOSIS_ATTEMPTS=${MAX_DIAGNOSIS_ATTEMPTS}, stations=${BASE.length}`,
);

// ---- the core defect this task fixes: the player's actual tweak choice must change the outcome ----
check("choosing the tweak the data points to (guide) reaches the full fix", isFullFix("guide"));
check("choosing tweaks WITHOUT guide does NOT reach the full fix", !isFullFix("speed") && !isFullFix("switch"));
check("choosing nothing (null) does not reach the full fix", !isFullFix(null));
// round 2 fix: isFullFix takes a single id, not a set/array — there is no
// calling convention that lets a caller pass "everything" and win, unlike
// round 1 where tweaks.includes("guide") stayed true regardless of what
// else was also selected.
check(
  "isFullFix's signature only accepts one tweak at a time (no way to represent 'select all' as an input)",
  isFullFix.length === 1,
);

// ---- the partial outcome must be honestly weaker, not a disguised success ----
const fullS5 = FIXED.find((s) => s.id === BOTTLENECK);
const partialS5 = PARTIAL.find((s) => s.id === BOTTLENECK);
const baseS5 = BASE.find((s) => s.id === BOTTLENECK);
check("PARTIAL's loss stays much closer to the original problem than FIXED's (guide wasn't touched)", partialS5.loss > fullS5.loss + 10, `partial loss=${partialS5.loss}, full loss=${fullS5.loss}, base loss=${baseS5.loss}`);
check("PARTIAL is still some genuine improvement over BASE, not a punishment with zero feedback", partialS5.stop < baseS5.stop || partialS5.queue < baseS5.queue);
check("FIXED and PARTIAL are not the same outcome (the choice must matter)", JSON.stringify(FIXED) !== JSON.stringify(PARTIAL));

// ---- every tweak must be a real, distinct, non-generic option, and must
// not restate the diagnosis in its own description (round 2 fix: "ひっかか
// りを減らす" directly told the player guide addresses jamming, handing
// over the reasoning a comparison of stop/loss was supposed to require) ----
check("there are at least 2 tweak options besides the correct one (a real choice, not a single obvious button)", TWEAKS.length >= 3);
check("every tweak has a distinct id", new Set(TWEAKS.map((t) => t.id)).size === TWEAKS.length);
{
  const diagnosisWords = ["ひっかか", "詰ま", "ジャム", "つまり", "止まる回数を減らす"];
  const leaky = TWEAKS.filter((t) => diagnosisWords.some((w) => t.desc.includes(w)));
  check(
    "no tweak's description restates why it would fix the case (only the literal action, no diagnosis-matching justification)",
    leaky.length === 0,
    leaky.map((t) => t.id).join(","),
  );
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
