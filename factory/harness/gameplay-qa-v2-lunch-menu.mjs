#!/usr/bin/env node
// Gameplay QA for the Ver.2 こんだて PLAY (src/v2/lunch/play/lunchMenuLogic.ts).
// Pure-logic, no browser. Proves the design contract mechanically — and, per
// the r1 independent review, does so against the whole state space rather
// than one hand-picked path:
//   1. no hidden answer: every attribute a rule reads is in VISIBLE_ATTRIBUTES
//   2. many valid high solutions; the top solutions are not one dish set
//   3. from EVERY mediocre full tray (score < 90) a single swap improves it
//   4. genuine trade-off: there exist swaps where one rule axis improves while
//      a DIFFERENT axis worsens (not just "some swap lowers the score")
//   5. EVENT recovery, exhaustively: for EVERY full tray of the default
//      candidates, firing the event leaves ≥1 way to re-complete the tray
//      with available dishes (child can never get stuck); report how often a
//      recovery to ≥ pre-event score exists
//   6. commit gating: never before the event; never with an unavailable dish;
//      fireEvent refuses ingredients not on the tray; cleared session is inert
//   7. scores within 0..100; every rule carries a fact reference
// Usage: node factory/harness/gameplay-qa-v2-lunch-menu.mjs
import { createServer } from "vite";

const vite = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
const L = await vite.ssrLoadModule("/src/v2/lunch/play/lunchMenuLogic.ts");
await vite.close();

const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok }); console.log(`${ok ? "PASS" : "FAIL"}: ${name}${detail ? " — " + detail : ""}`); };
const cands = L.DEFAULT_CANDIDATES;
const all = L.enumerateTrays(cands);

// 1. visible attributes — three independent angles
// (a) declarations
const hiddenUse = Object.values(L.RULES).flatMap((r) => r.uses.filter((u) => !L.VISIBLE_ATTRIBUTES.includes(u)).map((u) => `${r.id}:${u}`));
check("every rule declares only VISIBLE_ATTRIBUTES", hiddenUse.length === 0, hiddenUse.join(", "));
const missingAttr = L.DISHES.flatMap((d) => L.VISIBLE_ATTRIBUTES.filter((a) => d[a] === undefined).map((a) => `${d.id}.${a}`));
check("every dish defines every visible attribute", missingAttr.length === 0, missingAttr.join(", "));
// (b) what evaluate() ACTUALLY reads: wrap every dish in a recording Proxy and
// run the whole enumeration — any property outside VISIBLE ∪ {id} is a hidden read
const touched = new Set();
const originals = { ...L.DISH_BY_ID };
for (const [id, d] of Object.entries(originals)) {
  L.DISH_BY_ID[id] = new Proxy(d, { get(t, k) { if (typeof k === "string") touched.add(k); return t[k]; } });
}
L.enumerateTrays(cands);
for (const [id, d] of Object.entries(originals)) L.DISH_BY_ID[id] = d;
const hiddenReads = [...touched].filter((k) => k !== "id" && !L.VISIBLE_ATTRIBUTES.includes(k));
check("evaluate() reads no attribute outside VISIBLE_ATTRIBUTES (recorded)", hiddenReads.length === 0, `read: ${[...touched].join(", ")}`);
// (c) the UI layer shows a consequence cue for EVERY rule (spec 2026-09-21: attributes are
//     not baked into dish art; the child sees each rule's effect in the status layer)
const React = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const P = await (async () => { const v2 = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" }); const m = await v2.ssrLoadModule("/src/v2/lunch/play/LunchMenuPlay.tsx"); await v2.close(); return m; })();
// a tray that trips every rule at once: two staples (dup role + missing main/side/soup…), etc.
const worst = { score: 0, complete: true, filled: 4, hits: Object.keys(L.RULES).map((r) => ({ rule: r, dishIds: [], detail: r === "group_low" ? "red" : r === "group_high" ? "yellow" : r, points: 1 })) };
const html = renderToStaticMarkup(React.createElement(P.StatusLayer, { ev: worst, tray: ["rice", "bread", "rice", "bread"], changed: {} }));
const noCue = Object.keys(L.RULES).filter((r) => !html.includes(`data-cue="${r}"`));
check("StatusLayer renders a cue for every rule when hit", noCue.length === 0, noCue.join(", "));
const clean = all.find((t) => t.score === 100)?.tray ?? [];
const okEval = L.evaluate(clean);
const htmlOk = renderToStaticMarkup(React.createElement(P.StatusLayer, { ev: okEval, tray: clean, changed: {} }));
check("StatusLayer shows the three colour marks on a clean tray, no rule marks", ["red", "yellow", "green"].every((g) => htmlOk.includes(`data-cue="group:${g}"`)) && !/lmp-mark /.test(htmlOk));
// (d) no total score reaches the child (spec 2026-09-21 §1): the board never renders ev.score
const src = (await import("node:fs")).readFileSync("src/v2/lunch/play/LunchMenuPlay.tsx", "utf8");
check("board never renders the total score", !/\{\s*(ev|shown)\.score|<output/.test(src) && !/\{shown/.test(src));
// (e) dish art carries no game attribute (pure visual asset)
const dishHtml = renderToStaticMarkup(React.createElement(P.DishFace, { dish: L.DISHES[0] }));
check("DishFace is a pure visual (no attribute data)", !/data-(attr|ingredient|method|role)=/.test(dishHtml));

// 2. solutions
const high = all.filter((t) => t.score >= 95);
check("≥3 trays score 95+", high.length >= 3, `${high.length}/${all.length} (max ${Math.max(...all.map((t) => t.score))})`);
const sorted = [...all].sort((a, b) => b.score - a.score);
const diff = (a, b) => a.filter((x) => !b.includes(x)).length;
check("top solutions are not one set", sorted.slice(0, 8).some((t) => t.score >= 95 && diff(t.tray, sorted[0].tray) >= 2));

// 3. improvement from every mediocre tray
const swapsOf = (tray) => {
  const out = [];
  for (let i = 0; i < tray.length; i++) for (const c of cands) { if (tray.includes(c)) continue; const t = [...tray]; t[i] = c; out.push(t); }
  return out;
};
const mediocre = all.filter((t) => t.score < 90);
const stuck = mediocre.filter((t) => !swapsOf(t.tray).some((s) => L.evaluate(s).score > t.score));
check("every mediocre tray (<90) improves with one swap", mediocre.length > 0 && stuck.length === 0, `${mediocre.length} mediocre trays, ${stuck.length} dead ends`);

// 4. cross-axis trade-off
const axes = (tray) => { const m = {}; for (const h of L.evaluate(tray).hits) m[h.rule] = (m[h.rule] ?? 0) + h.points; return m; };
let tradeoff = null;
outer: for (const t of all) {
  const a = axes(t.tray);
  for (const s of swapsOf(t.tray)) {
    const b = axes(s);
    const better = Object.keys(a).filter((k) => (b[k] ?? 0) < a[k]);
    const worse = Object.keys(b).filter((k) => (a[k] ?? 0) < b[k]);
    if (better.length && worse.length && !better.some((k) => worse.includes(k))) { tradeoff = { from: t.tray, to: s, better, worse }; break outer; }
  }
}
check("a swap exists that fixes one axis and breaks another", !!tradeoff, tradeoff ? `${tradeoff.better.join("/")} ↑ vs ${tradeoff.worse.join("/")} ↓` : "");

// 5. exhaustive EVENT recovery
let noRecovery = 0, geqPre = 0, evented = 0;
for (const t of all) {
  // reach an event-ready session legitimately: build, remove one, put it back
  let s = L.newSession();
  for (const d of t.tray) { const r = L.place(s, d); if (r.ok) s = r.session; }
  s = L.remove(s, t.tray[0]);
  const back = L.place(s, t.tray[0]); s = back.ok ? back.session : s;
  if (!L.eventReady(s)) { noRecovery++; continue; }
  const pre = L.evaluate(s.tray).score;
  const e = L.fireEvent(s);
  if (e.phase !== "rebuild") { noRecovery++; continue; }
  evented++;
  const empties = e.tray.filter((d) => d === null).length;
  const free = cands.filter((c) => e.available[c] && !e.tray.includes(c));
  // fill the empty slots with every combination of free dishes
  let best = -1;
  const fill = (start, tray, k) => {
    if (k === 0) { best = Math.max(best, L.evaluate(tray).score); return; }
    for (let i = start; i < free.length; i++) { const idx = tray.indexOf(null); const nt = [...tray]; nt[idx] = free[i]; fill(i + 1, nt, k - 1); }
  };
  if (free.length >= empties) fill(0, e.tray, empties);
  if (best < 0) noRecovery++; else if (best >= pre) geqPre++;
}
check("after the EVENT every tray can be re-completed (never stuck)", noRecovery === 0, `${evented} evented trays, ${noRecovery} stuck`);
console.log(`INFO: recovery to ≥ pre-event score exists in ${geqPre}/${evented} trays`);

// 6. gating
let s = L.newSession();
for (const d of ["rice", "karaage", "gomaae", "corn_soup"]) { const r = L.place(s, d); if (r.ok) s = r.session; }
check("commit blocked before the event", !L.canCommit(s));
check("event not ready before a re-arrangement", !L.eventReady(s));
check("fireEvent refuses an ingredient not on the tray", L.fireEvent(s, "seaweed") === s);
s = L.remove(s, "corn_soup"); const p = L.place(s, "miso_soup"); s = p.ok ? p.session : s;
check("event ready after first result + one swap", L.eventReady(s));
const pre = L.evaluate(s.tray).score;
s = L.fireEvent(s);
check("event removed a used ingredient", s.eventIngredient === "chicken" && !s.tray.includes("karaage") && s.available.karaage === false, `ingredient ${s.eventIngredient}`);
check("unavailable dish cannot be placed", !L.place(s, "karaage").ok);
check("commit blocked while tray incomplete", !L.canCommit(s));
const rec = L.place(s, "salmon"); s = rec.ok ? rec.session : s;
check("commit allowed after rebuild", L.canCommit(s), `pre ${pre} → ${L.evaluate(s.tray).score}`);
const done = L.commit(s);
check("commit records score and phase", done.phase === "cleared" && typeof done.committedScore === "number");
check("cleared session is inert", !L.place(done, "bread").ok && L.remove(done, "rice") === done && L.commit(done) === done);

// 7. bounds + facts
check("all scores within 0..100", all.every((t) => t.score >= 0 && t.score <= 100));
check("every rule has a fact reference", Object.values(L.RULES).every((r) => /^V-A\d$/.test(r.fact)));

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
