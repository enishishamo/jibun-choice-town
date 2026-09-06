#!/usr/bin/env node
// Interaction Blocker QA (2026-09-04 Experience Design Harness).
// Reproduces the specific Human Review failure mode: dragging to pan the
// World Map while the finger starts ON a district/world-marker hotspot must
// NOT fire that hotspot's tap navigation. Uses REAL touch events (CDP
// Input.dispatchTouchEvent via page.touchscreen), not mouse clicks, since
// the reported bug is touch-specific arbitration, not a plain functional
// click test (map-mobile-interaction-qa.mjs already covers clean taps and a
// pan over empty canvas — this file only adds the missing "drag starting on
// a hotspot" case).
import puppeteer from "puppeteer-core";

const BASE = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : "http://localhost:5177/jibun-choice-town/";
const CHROME = process.env.JC_CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = { cases: [], blockers: [] };

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
const page = await browser.newPage();
await page.emulate({
  viewport: { width: 375, height: 812, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
});
await page.goto(BASE, { waitUntil: "networkidle2" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle2" });
await sleep(1200);

// enter the World Map from True Home
await page.evaluate(() => {
  const btn = [...document.querySelectorAll("button, [role=button], *")].find((e) =>
    e.textContent && e.textContent.trim().startsWith("社会を冒険する") && e.children.length < 5,
  );
  const card = btn?.closest(".home-card-primary") || document.querySelector(".home-card-primary");
  (card ?? btn)?.click();
});
await sleep(900);
const onMap = await page.evaluate(() => !!document.querySelector(".region-viewport"));
results.cases.push({ case: "enter-world-map-from-true-home", pass: onMap });
if (!onMap) {
  console.log(JSON.stringify({ status: "SETUP_FAILED", results }, null, 2));
  await browser.close();
  process.exit(1);
}

// Only ever return a hotspot that is actually ON-SCREEN right now (0..375 x
// 0..812) — at the default region-overview zoom (2026-09-04 Mobile Map
// Simplification, Option A), the district-node SIGNPOST pill for all 4
// districts sits mostly/fully off-screen by design (districts only "peek"
// at the edges, inviting a pan first); picking an off-screen coordinate
// would make the touch land on nothing and silently pass every case for the
// wrong reason. world-marker "far" fire icons, by contrast, ARE on-screen
// at overview (there are ~13 of them scattered across the visible canvas)
// and are exactly what a real thumb trying to pan is most likely to start
// on — this is the literal Human Review complaint.
const rectOf = (sel, filter) => page.evaluate(({ sel, filter }) => {
  const els = [...document.querySelectorAll(sel)];
  const onScreen = (e) => {
    const r = e.getBoundingClientRect();
    return r.x >= 4 && r.y >= 4 && r.x + r.width <= 371 && r.y + r.height <= 808;
  };
  const pool = filter === "non-foggy" ? els.filter((e) => !e.classList.contains("foggy")) : els;
  const el = pool.find(onScreen);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height };
}, { sel, filter });

// A single-finger drag using REAL touch events (not mouse), matching the
// reported device class. `dx,dy` total displacement, delivered over `steps`
// intermediate touchmoves so per-frame movement resembles a real drag.
async function touchDrag(x0, y0, dx, dy, steps = 8) {
  const touch = await page.touchscreen.touchStart(x0, y0);
  for (let i = 1; i <= steps; i++) {
    await touch.move(x0 + (dx * i) / steps, y0 + (dy * i) / steps);
    await sleep(16);
  }
  await touch.end();
}

// IMPORTANT: this SPA does not push browser history entries for its
// in-app screen transitions (a discriminated-union `Screen` state, not a
// router) — an earlier version of this function called `page.goBack()` to
// leave an Area/game screen, which actually navigated the tab to
// about:blank (there was no real prior history entry to return to) and
// silently broke every case after it. Always return via the app's OWN
// back affordances instead of browser history.
async function resetToRegionOverview() {
  const stillFocused = await page.evaluate(() => !!document.querySelector(".region-back"));
  if (stillFocused) {
    await page.evaluate(() => document.querySelector(".region-back")?.click());
    await sleep(500);
  }
  const inArea = await page.evaluate(() => !document.querySelector(".region-viewport"));
  if (inArea) {
    // AreaScreen's "← 街" chip navigates back to the World Map ({name:"map"})
    const clicked = await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find((b) => b.textContent?.trim().startsWith("← 街"));
      if (btn) { btn.click(); return true; }
      return false;
    });
    await sleep(600);
    if (!clicked) {
      // fell through to some other screen (e.g. Job Reveal) — go all the way
      // back to True Home via a real navigation, then re-enter the map, so a
      // later case never runs against a dead page.
      await page.goto(BASE, { waitUntil: "networkidle2" });
      await sleep(900);
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll("button, [role=button], *")].find((e) =>
          e.textContent && e.textContent.trim().startsWith("社会を冒険する") && e.children.length < 5,
        );
        const card = btn?.closest(".home-card-primary") || document.querySelector(".home-card-primary");
        (card ?? btn)?.click();
      });
      await sleep(900);
    }
  }
}

// ---- Case 1: drag starting ON a non-foggy district's hotspot -------------
// The signpost pill sits off-screen at the default overview zoom (see
// rectOf's comment), so pan it into view first with one legitimate drag —
// this also incidentally re-confirms plain panning still works post-fix.
{
  await touchDrag(280, 400, -220, -80, 10);
  await sleep(400);
}
{
  const d = await rectOf(".district-node", "non-foggy");
  if (d) {
    const beforeFocus = await page.evaluate(() => document.querySelector(".region-back") ? true : false);
    await touchDrag(d.x, d.y, 60, 10); // clearly past the 8px slop, mostly horizontal — a real pan attempt
    await sleep(650); // longer than the district-focus enter delay so a false navigation would be visible
    const districtOpened = await page.evaluate(() => !!document.querySelector(".region-back"));
    const panMoved = await page.evaluate(() => {
      const canvas = document.querySelector(".region-canvas");
      return canvas ? canvas.getAttribute("style") : null;
    });
    const pass = !districtOpened; // dragging must NOT open the district
    results.cases.push({
      case: "drag-starting-on-district-hotspot",
      pass,
      beforeFocus,
      districtOpenedAfterDrag: districtOpened,
      canvasTransform: panMoved,
    });
    if (!pass) results.blockers.push("Dragging with the finger starting on a district hotspot opened the district — ACCIDENTAL_ACTIVATION_RATE != 0");
    await resetToRegionOverview();
  } else {
    results.cases.push({ case: "drag-starting-on-district-hotspot", pass: null, note: "no non-foggy district hotspot found in viewport" });
  }
}

// ---- Case 2: drag starting ON a world-marker (the more severe case — ----
// this one can navigate into an actual world/game, not just a district) ---
{
  const m = await rectOf(".world-marker");
  if (m) {
    await touchDrag(m.x, m.y, 8, 60); // vertical-biased drag, still > slop
    await sleep(900); // longer than the marker's own 680ms auto-enter timer
    const navigatedIntoWorld = await page.evaluate(() => !document.querySelector(".region-viewport"));
    const pass = !navigatedIntoWorld;
    results.cases.push({ case: "drag-starting-on-world-marker", pass, navigatedIntoWorld });
    if (!pass) results.blockers.push("Dragging with the finger starting on a world-marker navigated into the world — this is the exact Human Review failure mode (INTERACTION BLOCKER)");
    await resetToRegionOverview();
  } else {
    results.cases.push({ case: "drag-starting-on-world-marker", pass: null, note: "no world-marker found in viewport" });
  }
}

// ---- Case 3: a genuine short tap (no movement) still navigates -----------
// (regression guard: the fix must not make legitimate taps stop working).
// Uses a world-marker (reliably on-screen at overview, same element class
// as case 2) rather than the district-node signpost, which sits off-screen
// at default zoom (see rectOf's comment) and would make this test vacuous.
{
  const m = await rectOf(".world-marker");
  if (m) {
    await page.touchscreen.tap(m.x, m.y);
    await sleep(900); // the marker's own enter-then-navigate sequence
    const enteredFocusOrWorld = await page.evaluate(
      () => !!document.querySelector(".region-back") || !document.querySelector(".region-viewport"),
    );
    results.cases.push({ case: "genuine-tap-still-opens-world-marker", pass: enteredFocusOrWorld });
    if (!enteredFocusOrWorld) results.blockers.push("A genuine no-movement tap on a world-marker failed to navigate — the fix over-suppressed taps");
    await resetToRegionOverview();
  } else {
    results.cases.push({ case: "genuine-tap-still-opens-world-marker", pass: null, note: "no on-screen world-marker found" });
  }
}

// ---- Case 4: rapid repeated drags don't leave arbitration state stuck ----
// Re-enter fresh (earlier cases' pans can leave no marker on-screen at this
// point) rather than relying on whatever state cases 1-3 happened to leave.
await page.reload({ waitUntil: "networkidle2" });
await sleep(1200);
await page.evaluate(() => {
  const btn = [...document.querySelectorAll("button, [role=button], *")].find((e) =>
    e.textContent && e.textContent.trim().startsWith("社会を冒険する") && e.children.length < 5,
  );
  const card = btn?.closest(".home-card-primary") || document.querySelector(".home-card-primary");
  (card ?? btn)?.click();
});
await sleep(900);
{
  const m = await rectOf(".world-marker");
  if (m) {
    for (let i = 0; i < 4; i++) {
      await touchDrag(m.x, m.y, 30 * (i % 2 === 0 ? 1 : -1), 5, 3);
    }
    await sleep(400);
    const enteredFocusOrWorld = await page.evaluate(
      () => !!document.querySelector(".region-back") || !document.querySelector(".region-viewport"),
    );
    const stillPannable = await page.evaluate(() => !!document.querySelector(".region-viewport.is-region"));
    const pass = !enteredFocusOrWorld && stillPannable;
    results.cases.push({ case: "rapid-repeated-drags-no-stuck-state", pass, enteredFocusOrWorld, stillPannable });
    if (!pass) results.blockers.push("Rapid repeated drag gestures left the map in a broken/navigated state");
  } else {
    results.cases.push({ case: "rapid-repeated-drags-no-stuck-state", pass: null, note: "no on-screen world-marker found" });
  }
}

// ---- Case 5: pan must reverse immediately from either edge -----------------
// (2026-09-06, REAL_USER_OBSERVED: on a real phone, panning to the right
// edge of the Continuous World Map could leave horizontal pan "stuck" —
// dragging back left produced no visible movement. Root cause: `pan` (the
// raw drag accumulator in WorldMapScreen.tsx) was never clamped itself —
// only the DERIVED camera transform was — so a drag past the edge let `pan`
// keep drifting long after the rendered position had saturated; reversing
// direction then had to "walk back" that whole invisible overshoot, often
// more than one real swipe covers, before any movement resumed. Fixed by
// clamping `pan` itself (see regionBase()/onPointerMove in
// WorldMapScreen.tsx). This case reproduces the exact repro steps from the
// report — drive to an edge with SEVERAL large drags (a real finger can't
// cross the whole canvas in one gesture), then confirm the very FIRST
// reversal already moves the camera, from both the right and left edges.
await page.reload({ waitUntil: "networkidle2" });
await sleep(1200);
await page.evaluate(() => {
  const btn = [...document.querySelectorAll("button, [role=button], *")].find((e) =>
    e.textContent && e.textContent.trim().startsWith("社会を冒険する") && e.children.length < 5,
  );
  const card = btn?.closest(".home-card-primary") || document.querySelector(".home-card-primary");
  (card ?? btn)?.click();
});
await sleep(900);

async function canvasTx() {
  return page.evaluate(() => {
    const el = document.querySelector(".region-canvas");
    const m = el?.getAttribute("style")?.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/);
    return m ? { tx: parseFloat(m[1]), ty: parseFloat(m[2]) } : null;
  });
}
// drag over empty canvas only (a point unlikely to land on any hotspot at
// any scroll position) so this case measures pure pan, not tap arbitration
const EMPTY_X = 190, EMPTY_Y = 760;
async function driveToEdge(dx) {
  let last = null;
  for (let i = 0; i < 8; i++) {
    await touchDrag(EMPTY_X, EMPTY_Y, dx, 0, 5);
    await sleep(60);
    last = await canvasTx();
  }
  return last;
}
async function reverseMoves(dx) {
  const before = await canvasTx();
  await touchDrag(EMPTY_X, EMPTY_Y, dx, 0, 5);
  await sleep(150);
  const after = await canvasTx();
  return before && after && after.tx !== before.tx;
}

{
  const atRight = await driveToEdge(-260); // repeated leftward swipes -> pan east
  const reversedFromRight = await reverseMoves(120); // one swipe back west
  const backNearCenter = await driveToEdge(180); // walk back toward center/left edge
  const atLeft = await driveToEdge(260); // repeated rightward swipes -> pan west (left edge)
  const reversedFromLeft = await reverseMoves(-120); // one swipe back east
  const pass = !!(atRight && atLeft && reversedFromRight && reversedFromLeft);
  results.cases.push({
    case: "pan-reverses-immediately-from-either-edge",
    pass,
    atRightEdgeTx: atRight?.tx, reversedFromRightOnFirstSwipe: reversedFromRight,
    afterWalkBackTx: backNearCenter?.tx,
    atLeftEdgeTx: atLeft?.tx, reversedFromLeftOnFirstSwipe: reversedFromLeft,
  });
  if (!pass) results.blockers.push("Pan did not resume immediately on reversal from an edge — MAP_PAN_BOUNDARY_BLOCKER (2026-09-06 REAL_USER_OBSERVED)");
}

await browser.close();

const summary = {
  status: results.blockers.length === 0 ? "PASS" : "BLOCKER",
  ACCIDENTAL_ACTIVATION_RATE: results.blockers.some((b) => b.includes("ACCIDENTAL") || b.includes("navigated into the world")) ? "> 0" : 0,
  cases: results.cases,
  blockers: results.blockers,
};
console.log(JSON.stringify(summary, null, 2));
process.exit(summary.status === "PASS" ? 0 : 1);
