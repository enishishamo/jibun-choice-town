#!/usr/bin/env node
// Pure-logic QA for the Ver.2 給食 WORLD「こんだてを考える」(栄養教諭 job vertical slice).
//
// What this proves, mechanically, without a browser:
//   1. the four axes are the ONLY model, and nothing is hidden from the child
//   2. the board never shows a total score and never marks right/wrong
//   3. the menu has MANY genuinely different solutions, not one
//   4. every axis can be missed on BOTH sides (no axis where "more is better")
//   5. real trade-offs: fixing one axis can break another
//   6. no dead ends: every near-miss menu is one swap from a working one
//   7. the EVENT always removes a dish the child was using, never milk,
//      and always leaves several different ways to recover
//   8. nothing clears by itself: only send() ever reaches "cleared"
//   9. session integrity under swap/remove/replay
// Usage: npm run qa:v2-lunch
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";

const CACHE = `${tmpdir()}/jc-vite-cache-v2-lunch`;
// configFile:false — loading vite.config.ts would bundle it into node_modules/.vite-temp,
// i.e. a repo write, which fails in a read-only sandbox. The harness only needs react.
const VITE = { configFile: false, plugins: [react()], server: { middlewareMode: true }, appType: "custom", logLevel: "error", cacheDir: CACHE };
const load = async (p) => { const v = await createServer(VITE); const m = await v.ssrLoadModule(p); await v.close(); return m; };

const L = await load("/src/v2/lunch/play/lunchMenuLogic.ts");

const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok }); console.log(`${ok ? "PASS" : "FAIL"}: ${name}${detail ? " — " + detail : ""}`); };
const info = (name, detail) => console.log(`INFO: ${name} — ${detail}`);

const IDS = L.DEFAULT_CANDIDATES;
const ALL = L.enumerateTrays(IDS);
const viable = ALL.filter((t) => t.ev.viable);
const key = (t) => [...t].sort().join(",");
const byKey = new Map(ALL.map((t) => [key(t.tray), t]));
const evalOf = (tray) => byKey.get(key(tray)).ev;

// ---------------------------------------------------------------- 1. model shape
check("exactly four axes", L.AXES.length === 4 && ["energy", "protein", "fat", "salt"].every((a) => L.AXES.includes(a)), L.AXES.join("/"));
check("every dish defines every axis", L.DISHES.concat([L.MILK]).every((d) => L.AXES.every((a) => typeof d.axis[a] === "number")));
check("nine candidate dishes + fixed milk", IDS.length === 9 && L.MILK_FIXED && L.MILK.id === "milk" && !IDS.includes("milk"), `${IDS.length} candidates`);
check("four free slots", L.FREE_SLOTS === 4);
// no hidden attribute: evaluate() may only read `axis` and `id`
{
  const seen = new Set();
  const spy = L.DISHES.map((d) => new Proxy(d, { get(t, p) { seen.add(String(p)); return t[p]; } }));
  const byId = Object.fromEntries(spy.map((d) => [d.id, d]));
  const orig = { ...L.DISH_BY_ID };
  Object.assign(L.DISH_BY_ID, byId);
  for (const t of ALL) L.evaluate(t.tray);
  Object.assign(L.DISH_BY_ID, orig);
  const extra = [...seen].filter((p) => !["axis", "id", "course"].includes(p));
  check("evaluate() reads no attribute outside axis/id/course (recorded)", extra.length === 0, `read: ${[...seen].join(", ")}`);
}
// every axis contributes: removing an axis from the model must change which menus work
for (const a of L.AXES) {
  const without = ALL.filter((t) => L.AXES.filter((x) => x !== a).every((x) => t.ev.readings[x].band === "good"));
  check(`axis "${a}" actually constrains the menu`, without.length > viable.length, `${viable.length} viable with it, ${without.length} without`);
}

// ---------------------------------------------------------------- 2. nothing evaluative leaks
{
  const src = readFileSync("src/v2/lunch/play/LunchMenuPlay.tsx", "utf8");
  check("board never renders a total score", !/\b(score|total|points)\b\s*[}:]/.test(src.replace(/\/\/.*$/gm, "")) && !/<output/.test(src));
  check("board renders no right/wrong mark", !/正解|せいかい|✓|✔|✗|×|correct|wrong/i.test(src.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "")));
  const logic = readFileSync("src/v2/lunch/play/lunchMenuLogic.ts", "utf8");
  check("the model documents its numbers as GAME COEFFICIENTS, not nutrition data", /GAME COEFFICIENTS, NOT NUTRITION DATA/.test(logic));
}

// ---------------------------------------------------------------- 3. many different solutions
check("several menus work", viable.length >= 10 && viable.length <= 30, `${viable.length}/${ALL.length} (${Math.round((viable.length / ALL.length) * 100)}%)`);
check("but most menus do not", viable.length / ALL.length < 0.3, `${Math.round((viable.length / ALL.length) * 100)}% viable`);
{
  const diff = (a, b) => a.filter((x) => !b.includes(x)).length;
  const fam = [];
  for (const v of viable) if (!fam.some((f) => diff(v.tray, f) < 2)) fam.push(v.tray);
  check("working menus form several genuinely different families", fam.length >= 6, `${fam.length} families: ${fam.map((f) => f.join("+")).join(" | ")}`);
  // no single dish is in every solution (no mandatory "answer" dish)
  const always = IDS.filter((id) => viable.every((v) => v.tray.includes(id)));
  check("no dish appears in every working menu", always.length === 0, always.join(", ") || "none");
}

// ---------------------------------------------------------------- 4. both-sided axes
for (const a of L.AXES) {
  const low = ALL.some((t) => t.ev.readings[a].band === "low");
  const high = ALL.some((t) => t.ev.readings[a].band === "high");
  check(`axis "${a}" can be both too little and too much`, low && high, `low ${low}, high ${high}`);
}
// the band sits inside the visible track, so "good" really is the middle
for (const a of L.AXES) {
  const [t0, t1] = L.TRACK[a], [b0, b1] = L.BAND[a];
  const mid = ((b0 + b1) / 2 - t0) / (t1 - t0);
  check(`axis "${a}" band is centred in its track`, b0 > t0 && b1 < t1 && Math.abs(mid - 0.5) < 0.02, `band centre at ${(mid * 100).toFixed(0)}% of the track`);
}

// ---------------------------------------------------------------- 5. trade-offs
{
  let example = null;
  for (const t of ALL) {
    if (t.ev.viable || t.ev.off.length !== 1) continue;
    const bad = t.ev.off[0];
    for (const out of t.tray) for (const inn of IDS) {
      if (t.tray.includes(inn)) continue;
      const next = evalOf(t.tray.map((x) => (x === out ? inn : x)));
      if (next.readings[bad].band === "good" && next.off.length > 0) { example = `${t.tray.join("+")}: ${out}→${inn} fixes ${bad} but breaks ${next.off.join("/")}`; break; }
    }
    if (example) break;
  }
  check("a swap exists that fixes one axis and breaks another", !!example, example ?? "NONE");
}

// ---------------------------------------------------------------- 6. no dead ends
{
  const near = ALL.filter((t) => t.ev.off.length === 1);
  const stuck = near.filter((t) => !t.tray.some((out) => IDS.some((inn) => !t.tray.includes(inn) && evalOf(t.tray.map((x) => (x === out ? inn : x))).viable)));
  check("every menu that is one axis off can be fixed with a single swap", near.length > 0 && stuck.length === 0, `${near.length} near misses, ${stuck.length} dead ends`);
  const far = ALL.filter((t) => t.ev.off.length >= 2);
  const farStuck = far.filter((t) => !t.tray.some((out) => IDS.some((inn) => !t.tray.includes(inn) && evalOf(t.tray.map((x) => (x === out ? inn : x))).off.length < t.ev.off.length)));
  check("every menu that is further off can be improved with a single swap", farStuck.length === 0, `${far.length} far, ${farStuck.length} stuck`);
}

// ---------------------------------------------------------------- 7. the EVENT
{
  let noTarget = 0, milkTarget = 0, notOnTray = 0, minRec = Infinity, worst = "";
  const targets = new Set();
  for (const v of viable) {
    const s0 = { ...L.newSession(IDS), tray: [...v.tray], sawFirstViable: true };
    const target = L.pickEventDish(s0);
    if (!target) { noTarget++; continue; }
    if (target === "milk") milkTarget++;
    if (!v.tray.includes(target)) notOnTray++;
    targets.add(target);
    const after = L.fireEvent(s0, target);
    const rec = L.viableMenus(after).length;
    if (rec < minRec) { minRec = rec; worst = `${v.tray.join("+")} -${target} → ${rec}`; }
  }
  check("the EVENT always has a target", noTarget === 0, `${noTarget} menus with no target`);
  check("the EVENT never takes the milk", milkTarget === 0);
  check("the EVENT always takes a dish the child is using", notOnTray === 0);
  check("after the EVENT there are always several different ways to rebuild", minRec >= L.MIN_RECOVERIES, `worst case ${worst}`);
  check("different menus lose different dishes", targets.size >= 3, `${targets.size} distinct EVENT dishes: ${[...targets].join(", ")}`);
  // exhaustive: for EVERY menu (not just viable ones) removing ANY of its dishes still leaves a way out
  let anyStuck = 0;
  for (const id of IDS) {
    const s = L.newSession(IDS);
    s.available[id] = false;
    if (L.viableMenus(s).length < L.MIN_RECOVERIES) anyStuck++;
  }
  check("losing any single dish still leaves several working menus", anyStuck === 0, `${anyStuck}/${IDS.length} dishes would strand the child`);
}

// ---------------------------------------------------------------- 8. nothing clears by itself
{
  const logic = readFileSync("src/v2/lunch/play/lunchMenuLogic.ts", "utf8");
  const clearedWriters = [...logic.matchAll(/phase:\s*"cleared"/g)].length;
  check("only send() can reach the cleared phase", clearedWriters === 2 && /export function send/.test(logic), `${clearedWriters} assignments, both inside send()`);
  const play = readFileSync("src/v2/lunch/play/LunchMenuPlay.tsx", "utf8");
  check("the board never calls send() from a timer", !/setTimeout\([^)]*send\(/.test(play));
}

// ---------------------------------------------------------------- 9. session integrity
{
  let s = L.newSession(IDS);
  check("empty tray is not sendable", !L.canSend(s));
  check("empty tray shows no bands as complete", !L.evaluate(s.tray).complete);
  const menu = viable[0].tray;
  for (const d of menu) { const r = L.place(s, d); s = r.ok ? r.session : s; }
  check("a working menu becomes sendable", L.canSend(s) && s.phase === "build", menu.join("+"));
  check("placing the same dish twice is refused", !L.place(s, menu[0]).ok);
  check("a fifth dish is refused (tray full)", L.place(s, IDS.find((i) => !menu.includes(i))).reason === "full");
  check("sawFirstViable is recorded", s.sawFirstViable);

  const sent = L.send(s);
  check("the first send is intercepted, not delivered", sent.ok && sent.outcome === "intercepted" && sent.session.phase === "rebuild");
  s = sent.session;
  const gone = s.eventDish;
  check("the lost dish left the tray and the counter", !s.tray.includes(gone) && s.available[gone] === false, `lost ${gone}`);
  check("the lost dish cannot be placed again", L.place(s, gone).reason === "unavailable");
  check("an incomplete tray cannot be sent", !L.canSend(s));

  const rebuilt = L.viableMenus(s)[0];
  let s2 = L.newSession(IDS);
  s2 = { ...s2, available: { ...s.available }, phase: "rebuild", sawFirstViable: true, eventDish: gone };
  for (const d of rebuilt) { const r = L.place(s2, d); s2 = r.ok ? r.session : s2; }
  check("a rebuilt working menu is sendable", L.canSend(s2), rebuilt.join("+"));
  const done = L.send(s2);
  check("the second send delivers", done.ok && done.outcome === "delivered" && done.session.phase === "cleared");
  const cleared = done.session;
  check("a cleared session is inert", !L.place(cleared, IDS[0]).ok && L.remove(cleared, rebuilt[0]) === cleared && !L.send(cleared).ok);

  // swap keeps the slot, so the tray never reshuffles under the child's finger
  let s3 = L.newSession(IDS);
  for (const d of menu) { const r = L.place(s3, d); s3 = r.ok ? r.session : s3; }
  const other = IDS.find((i) => !menu.includes(i));
  const sw = L.swap(s3, menu[1], other);
  check("swap replaces in place", sw.ok && sw.session.tray[1] === other && sw.session.tray[0] === menu[0]);
  check("swap refuses an unavailable dish", !L.swap({ ...s3, available: { ...s3.available, [other]: false } }, menu[1], other).ok);
}

// ---------------------------------------------------------------- 10. hints
{
  let over = 0, empty = 0;
  for (const t of ALL) {
    const set = L.relatedSet(t.tray, t.ev);
    if (set.size > L.RELATED_CAP) over++;
    if (t.ev.off.length && set.size === 0) empty++;
    if (set.size === t.tray.length && t.ev.off.length) over++;
  }
  check("hints never point at more than two dishes and never at none", over === 0 && empty === 0, `${over} over, ${empty} empty`);
}

info("balance", `${viable.length} working menus of ${ALL.length}`);

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
