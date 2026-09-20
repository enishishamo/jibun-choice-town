#!/usr/bin/env node
// Gameplay QA for the Ver.2 こんだて PLAY (src/v2/lunch/play/lunchMenuLogic.ts).
// Pure-logic checks, no browser. Proves the design contract mechanically:
//   1. many valid high solutions (no single hidden answer)
//   2. solutions differ substantially (no dominant dish set)
//   3. from a mediocre first tray, a single swap can improve (試行錯誤が報われる)
//   4. improvement is not monotone: some swaps lower the score (trade-off exists)
//   5. the EVENT removes a used dish and a recovery to >= pre-event score exists
//   6. commit gating: never before the event, never with an unavailable dish
//   7. scores stay within 0..100 and every rule carries a fact reference
// Usage: node factory/harness/gameplay-qa-v2-lunch-menu.mjs
import { createServer } from "vite";

const vite = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
const L = await vite.ssrLoadModule("/src/v2/lunch/play/lunchMenuLogic.ts");
await vite.close();

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}: ${name}${detail ? " — " + detail : ""}`);
};

const cands = L.DEFAULT_CANDIDATES;
const all = L.enumerateTrays(cands);
const high = all.filter((t) => t.score >= 95);
check("≥3 trays score 95+", high.length >= 3, `${high.length}/${all.length} trays (max ${Math.max(...all.map((t) => t.score))})`);

// 2. dominant-set check: the two best trays must differ in at least 2 dishes
const sorted = [...all].sort((a, b) => b.score - a.score);
const diff = (a, b) => a.filter((x) => !b.includes(x)).length;
const spread = sorted.slice(0, 6).some((t) => diff(t.tray, sorted[0].tray) >= 2 && t.score >= 95);
check("top solutions are not one set", spread);

// 3/4. improvement + non-monotone from a mediocre start
const mediocre = ["rice", "karaage", "potato_salad", "corn_soup", "bread"];
const base = L.evaluate(mediocre).score;
let up = 0, down = 0, best = base;
for (let i = 0; i < mediocre.length; i++) {
  for (const c of cands) {
    if (mediocre.includes(c)) continue;
    const t = [...mediocre]; t[i] = c;
    const s = L.evaluate(t).score;
    if (s > base) up++; else if (s < base) down++;
    best = Math.max(best, s);
  }
}
check("a single swap can improve a mediocre tray", up > 0 && best - base >= 5, `base ${base} → best single swap ${best} (${up} up / ${down} down)`);
check("some swaps make it worse (trade-off)", down > 0);

// 5/6. event + recovery + commit gating
let s = L.newSession();
for (const d of ["rice", "karaage", "gomaae", "corn_soup", "potato_salad"]) s = L.place(s, d).ok ? L.place(s, d).session : s;
check("commit is blocked before the event", !L.canCommit(s));
check("event not ready before a re-arrangement", !L.eventReady(s));
s = L.remove(s, "corn_soup");
const placed = L.place(s, "miso_soup");
s = placed.ok ? placed.session : s;
check("event ready after first result + one swap", L.eventReady(s), `phase=${s.phase} swaps=${s.swapsAfterResult}`);
const pre = L.evaluate(s.tray).score;
s = L.fireEvent(s);
check("event removed a dish that was on the tray", s.eventDish && !s.tray.includes(s.eventDish) && s.available[s.eventDish] === false, `removed ${s.eventDish}`);
check("unavailable dish cannot be placed", !L.place(s, s.eventDish).ok);
check("commit blocked while tray incomplete", !L.canCommit(s));
// recovery: try every available candidate in the empty slot
let recovered = null;
for (const c of cands) {
  const r = L.place(s, c);
  if (r.ok && L.evaluate(r.session.tray).score >= pre) { recovered = r.session; break; }
}
check("a recovery to ≥ pre-event score exists", !!recovered, `pre-event ${pre}`);
if (recovered) {
  check("commit allowed after rebuild", L.canCommit(recovered));
  const done = L.commit(recovered);
  check("commit records score and phase", done.phase === "cleared" && typeof done.committedScore === "number", `score ${done.committedScore}`);
}

// 7. bounds + fact refs
check("all scores within 0..100", all.every((t) => t.score >= 0 && t.score <= 100));
check("every rule has a fact reference", Object.values(L.RULES).every((r) => /^V-A\d$/.test(r.fact) && r.status === "PROVISIONAL"));

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
