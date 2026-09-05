#!/usr/bin/env node
// Interaction/scalability QA for Prototype A3 (Cohesive Continuous World) —
// public/dev-prototypes/prototype-a3-cohesive-world.html. NOT a production
// test. Two tiers only (L1 world overview, L2 zoomed-into-one-place with
// event hotspots directly on the illustration) — simpler than A2's 3-tier
// model per Human Correction (semantic zoom is for density control, not
// for building a navigation hierarchy).
import puppeteer from "puppeteer-core";

const BASE = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : "http://localhost:5177/jibun-choice-town/dev-prototypes/prototype-a3-cohesive-world.html";
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
await sleep(800);

const hud = () => page.evaluate(() => document.getElementById("hud").textContent);
const domCount = () => page.evaluate(() => document.querySelectorAll("#world > *").length);
// Returns the first element matching `sel` that is actually on-screen (event
// hotspots are scattered in a ring around a zoomed-in place and several can
// legitimately fall outside the 375x812 viewport at any given angle).
const rectOf = (sel) => page.evaluate((s) => {
  const els = [...document.querySelectorAll(s)];
  const onScreen = (e) => { const r = e.getBoundingClientRect(); return r.x >= 0 && r.y >= 0 && r.x + r.width <= 375 && r.y + r.height <= 812; };
  const el = els.find(onScreen) || els[0];
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}, sel);
async function touchDrag(x0, y0, dx, dy, steps = 8) {
  const t = await page.touchscreen.touchStart(x0, y0);
  for (let i = 1; i <= steps; i++) { await t.move(x0 + (dx * i) / steps, y0 + (dy * i) / steps); await sleep(16); }
  await t.end();
}

// ---- Case 1: DOM node count stays tier-scoped even with a 27-event dummy
// registry across 8 places ----------------------------------------------
{
  const l1 = await domCount();
  const h1 = await hud();
  const r = await rectOf("[data-place=center]");
  await page.touchscreen.tap(r.x, r.y);
  await sleep(700);
  const l2 = await domCount();
  const h2 = await hud();
  const totalMatch = h2.match(/\/(\d+) events mounted/);
  const total = totalMatch ? parseInt(totalMatch[1], 10) : 0;
  const pass = l1 <= 15 && l2 <= 15 && total >= 20;
  results.cases.push({ case: "dom-node-count-tier-scoped", pass, l1_dom: l1, l1_hud: h1, l2_dom: l2, l2_hud: h2, dummy_total_events: total });
  if (!pass) results.blockers.push("DOM node count did not stay tier-scoped, or dummy registry was not large enough to be a meaningful stress test");
}

// ---- Case 2: drag starting ON a place illustration pans, not zooms -------
{
  await page.reload({ waitUntil: "networkidle2" }); await sleep(800);
  const r = await rectOf("[data-place=center]");
  await touchDrag(r.x, r.y, 70, 15);
  await sleep(700);
  const h = await hud();
  const pass = h.startsWith("L1");
  results.cases.push({ case: "drag-starting-on-place-pans-not-zooms", pass, hud_after: h });
  if (!pass) results.blockers.push("Dragging with the finger starting on a place illustration zoomed in instead of panning — ACCIDENTAL_ACTIVATION");
}

// ---- Case 3: genuine tap on a place still zooms in (regression guard) ----
{
  await page.reload({ waitUntil: "networkidle2" }); await sleep(800);
  const r = await rectOf("[data-place=center]");
  await page.touchscreen.tap(r.x, r.y);
  await sleep(700);
  const h = await hud();
  const pass = h.startsWith("L2");
  results.cases.push({ case: "genuine-tap-on-place-still-zooms-in", pass, hud_after: h });
  if (!pass) results.blockers.push("A genuine no-movement tap on a place failed to zoom in — over-suppressed");
}

// ---- Case 4: drag starting on an event hotspot doesn't fire it, doesn't
// zoom out either ------------------------------------------------------
{
  const r = await rectOf("[data-event]");
  await touchDrag(r.x, r.y, 30, 30);
  await sleep(500);
  const h = await hud();
  const pass = h.startsWith("L2"); // still in the same place, not kicked back to L1 nor errored
  results.cases.push({ case: "drag-starting-on-event-hotspot-no-accidental-fire", pass, hud_after: h });
  if (!pass) results.blockers.push("Dragging with the finger starting on an event hotspot caused an unexpected state change — ACCIDENTAL_ACTIVATION");
}

// ---- Case 5: tap on empty terrain (not on a marker) zooms back to L1 -----
{
  const before = await hud();
  await page.touchscreen.tap(30, 120); // near the top, away from the centered illustration
  await sleep(600);
  const after = await hud();
  const pass = before.startsWith("L2") && after.startsWith("L1");
  results.cases.push({ case: "tap-empty-terrain-returns-to-world", pass, before, after });
  if (!pass) results.blockers.push("Tapping empty terrain at L2 did not return to L1 as expected");
}

// ---- Case 6: genuine tap on an event hotspot actually fires (regression) -
{
  await page.reload({ waitUntil: "networkidle2" }); await sleep(800);
  const r0 = await rectOf("[data-place=center]");
  await page.touchscreen.tap(r0.x, r0.y); await sleep(700);
  const r = await rectOf("[data-event]");
  await page.touchscreen.tap(r.x, r.y);
  await sleep(400);
  const toastVisible = await page.evaluate(() => document.getElementById("toast").classList.contains("show"));
  results.cases.push({ case: "genuine-tap-on-event-hotspot-fires", pass: toastVisible });
  if (!toastVisible) results.blockers.push("A genuine tap on an event hotspot did not fire (toast did not show)");
}

// ---- Case 7: rapid repeated drags don't leave a stuck state --------------
{
  await page.reload({ waitUntil: "networkidle2" }); await sleep(800);
  const r = await rectOf("[data-place=center]");
  for (let i = 0; i < 4; i++) await touchDrag(r.x, r.y, 25 * (i % 2 === 0 ? 1 : -1), 10, 3);
  await sleep(400);
  const h = await hud();
  const pass = h.startsWith("L1");
  results.cases.push({ case: "rapid-repeated-drags-no-stuck-state", pass, hud_after: h });
  if (!pass) results.blockers.push("Rapid repeated drag gestures left the prototype in an unexpected state");
}

results.pageErrors = pageErrors;
if (pageErrors.length) results.blockers.push(`Page errors: ${pageErrors.join("; ")}`);

await browser.close();
const summary = { status: results.blockers.length === 0 ? "PASS" : "BLOCKER", ACCIDENTAL_ACTIVATION_RATE: results.blockers.some((b) => b.includes("ACCIDENTAL_ACTIVATION")) ? "> 0" : 0, cases: results.cases, pageErrors: results.pageErrors, blockers: results.blockers };
console.log(JSON.stringify(summary, null, 2));
process.exit(summary.status === "PASS" ? 0 : 1);
