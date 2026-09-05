#!/usr/bin/env node
// Interaction/scalability QA for Prototype A2 (Continuous World + Semantic
// Zoom) — public/dev-prototypes/prototype-a2-semantic-zoom.html. NOT a
// production test (the prototype is not wired into the app); this verifies
// the architecture's own claims before any human decision to build it for
// real: gesture arbitration (reusing the exact real-app fix validated in
// factory/harness/gesture-arbitration-qa.mjs), and that the "never mount
// more than one tier's markers" design actually holds at a ~50-world-scale
// dummy registry.
import puppeteer from "puppeteer-core";

const BASE = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : "http://localhost:5177/jibun-choice-town/dev-prototypes/prototype-a2-semantic-zoom.html";
const CHROME = process.env.JC_CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = { cases: [], blockers: [] };

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
const page = await browser.newPage();
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e)));
await page.emulate({
  viewport: { width: 375, height: 812, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
});
await page.goto(BASE, { waitUntil: "networkidle2" });
await sleep(700);

const hud = () => page.evaluate(() => document.getElementById("hud").textContent);
const domCount = () => page.evaluate(() => document.querySelectorAll("#world > *").length);
const rectOf = (sel) => page.evaluate((s) => {
  const el = document.querySelector(s);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}, sel);
async function touchDrag(x0, y0, dx, dy, steps = 8) {
  const t = await page.touchscreen.touchStart(x0, y0);
  for (let i = 1; i <= steps; i++) { await t.move(x0 + (dx * i) / steps, y0 + (dy * i) / steps); await sleep(16); }
  await t.end();
}

// ---- Case 1: DOM node count never exceeds current tier's own items -------
{
  const l1 = await domCount();
  const h1 = await hud();
  const r = await rectOf("[data-area=center]");
  await page.touchscreen.tap(r.x, r.y);
  await sleep(700);
  const l2 = await domCount();
  const h2 = await hud();
  const sr = await rectOf("[data-subloc]");
  await page.touchscreen.tap(sr.x, sr.y);
  await sleep(600);
  const l3 = await domCount();
  const h3 = await hud();
  // registry totals are named in the HUD text ("N of TOTAL mounted") — pull
  // TOTAL and assert what's actually mounted stays far below it.
  const totalMatch = h3.match(/of (\d+) events mounted/);
  const total = totalMatch ? parseInt(totalMatch[1], 10) : 0;
  const pass = l1 <= 15 && l2 <= 15 && l3 <= 15 && total >= 50;
  results.cases.push({ case: "dom-node-count-scales-with-tier-not-registry-size", pass, l1_dom: l1, l1_hud: h1, l2_dom: l2, l2_hud: h2, l3_dom: l3, l3_hud: h3, dummy_registry_total_events: total });
  if (!pass) results.blockers.push("DOM node count grew with registry size instead of staying tier-scoped, or dummy registry was not actually ~50+ scale");
}

// ---- Case 2: drag starting ON an area pin must pan, not zoom in -----------
{
  await page.reload({ waitUntil: "networkidle2" }); await sleep(700);
  const r = await rectOf("[data-area=center]");
  await touchDrag(r.x, r.y, 70, 15);
  await sleep(700);
  const h = await hud();
  const pass = h.startsWith("LEVEL 1");
  results.cases.push({ case: "drag-starting-on-area-pin-pans-not-zooms", pass, hud_after: h });
  if (!pass) results.blockers.push("Dragging with the finger starting on an area pin triggered a zoom-in instead of panning — ACCIDENTAL_ACTIVATION");
}

// ---- Case 3: genuine tap on an area pin still zooms in (regression guard) -
{
  await page.reload({ waitUntil: "networkidle2" }); await sleep(700);
  const r = await rectOf("[data-area=center]");
  await page.touchscreen.tap(r.x, r.y);
  await sleep(700);
  const h = await hud();
  const pass = h.startsWith("LEVEL 2");
  results.cases.push({ case: "genuine-tap-on-area-still-zooms-in", pass, hud_after: h });
  if (!pass) results.blockers.push("A genuine no-movement tap on an area pin failed to zoom in — over-suppressed");
}

// ---- Case 4: drag starting on a Level-2 sub-location doesn't accidentally
// jump to Level 3 -----------------------------------------------------------
{
  const r = await rectOf("[data-subloc]");
  await touchDrag(r.x, r.y, 40, 40);
  await sleep(600);
  const h = await hud();
  const pass = h.startsWith("LEVEL 2");
  results.cases.push({ case: "drag-starting-on-subloc-does-not-jump-to-level3", pass, hud_after: h });
  if (!pass) results.blockers.push("Dragging with the finger starting on a Level-2 sub-location jumped to Level 3 — ACCIDENTAL_ACTIVATION");
}

// ---- Case 5: tap on empty canvas zooms out one level (not a hard reset) ---
{
  const r = await rectOf("[data-subloc]");
  await page.touchscreen.tap(r.x, r.y);
  await sleep(600);
  const before = await hud();
  await page.touchscreen.tap(20, 700); // empty stage area, away from any marker
  await sleep(600);
  const after = await hud();
  const pass = before.startsWith("LEVEL 3") && after.startsWith("LEVEL 2");
  results.cases.push({ case: "tap-empty-space-zooms-out-one-level", pass, before, after });
  if (!pass) results.blockers.push("Tapping empty space at Level 3 did not step back to Level 2 as expected");
}

// ---- Case 6: rapid repeated gestures don't leave the camera/level stuck ---
{
  await page.reload({ waitUntil: "networkidle2" }); await sleep(700);
  const r = await rectOf("[data-area=center]");
  for (let i = 0; i < 4; i++) await touchDrag(r.x, r.y, 25 * (i % 2 === 0 ? 1 : -1), 10, 3);
  await sleep(400);
  const h = await hud();
  const pass = h.startsWith("LEVEL 1"); // rapid short drags must never have been read as taps
  results.cases.push({ case: "rapid-repeated-drags-no-stuck-state", pass, hud_after: h });
  if (!pass) results.blockers.push("Rapid repeated drag gestures left the prototype in an unexpected level/state");
}

results.pageErrors = pageErrors;
if (pageErrors.length) results.blockers.push(`Page errors: ${pageErrors.join("; ")}`);

await browser.close();
const summary = { status: results.blockers.length === 0 ? "PASS" : "BLOCKER", ACCIDENTAL_ACTIVATION_RATE: results.blockers.some((b) => b.includes("ACCIDENTAL_ACTIVATION")) ? "> 0" : 0, cases: results.cases, pageErrors: results.pageErrors, blockers: results.blockers };
console.log(JSON.stringify(summary, null, 2));
process.exit(summary.status === "PASS" ? 0 : 1);
