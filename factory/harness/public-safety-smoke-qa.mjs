#!/usr/bin/env node
// Public-Safety Smoke QA (Stable Prototype release, 2026-09-04).
// NOT an improvement pass — this hunts for externally-visible BLOCKERS only:
// broken images, 404s, console/page errors, and failed navigation, across
// EVERY registered world's area screen (not just recently-touched ones),
// plus Home pan/district-tap/world-entry/map-return at mobile+desktop.
//
// Usage: node public-safety-smoke-qa.mjs [--viewport mobile|desktop|both]
import puppeteer from "puppeteer-core";
import { mkdirSync, writeFileSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:5177/jibun-choice-town/";
const OUT = "factory/state/release/smoke-shots";
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// eventId -> { district, label } — mirrors src/data/districts.ts WORLD_DISTRICT
// + each content module's shortLabel. Kept in sync manually; a mismatch here
// only weakens smoke coverage, it cannot break the app itself.
const WORLDS = [
  { id: "lunch-late", district: "center", label: "給食が間に合わない！" },
  { id: "heat-wave", district: "center", label: "街が暑すぎる！" },
  { id: "ice-price", district: "center", label: "アイスが高くなってる！" },
  { id: "town-festival", district: "center", label: "イベントやるって！" },
  { id: "er-patient", district: "center", label: "病院に人が来た" },
  { id: "school-trip", district: "center", label: "修学旅行、どう運ぶ？" },
  { id: "waste-journey", district: "center", label: "ごみのゆくえ？" },
  { id: "shop-opening", district: "ekimae", label: "商店街に新しい店？" },
  { id: "zoo-baby", district: "mori-kawa", label: "赤ちゃん誕生！" },
  { id: "night-port", district: "minato", label: "夜のみなと" },
  { id: "forest-care", district: "mori-kawa", label: "森のなぞ" },
  { id: "river-health", district: "mori-kawa", label: "川に魚が！" },
  { id: "game-studio", district: "ekimae", label: "ゲームの3日間" },
  { id: "library-detective", district: "oka-bunka", label: "写真のなぞ" },
];
const DISTRICT_NAME = { minato: "港", "mori-kawa": "森と川", ekimae: "駅前", "oka-bunka": "丘の上" };

async function newPage(browser, viewport) {
  const p = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  p.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200)); });
  p.on("pageerror", (e) => pageErrors.push(String(e).slice(0, 200)));
  p.on("response", (res) => {
    const status = res.status();
    if (status >= 400) failedRequests.push(`${status} ${res.url().replace(BASE, "")}`);
  });
  await p.setViewport(viewport === "mobile" ? { width: 375, height: 812 } : { width: 1280, height: 900 });
  return { p, consoleErrors, pageErrors, failedRequests };
}

async function checkBrokenImages(p) {
  return p.evaluate(() =>
    [...document.querySelectorAll("img")]
      .filter((img) => img.src && (!img.complete || img.naturalWidth === 0))
      .map((img) => img.src.replace(location.origin, "")),
  );
}

async function clickText(p, text) {
  return p.evaluate((x) => {
    const btn = [...document.querySelectorAll("button")].find((e) => e.textContent.includes(x));
    if (btn) { btn.click(); return true; }
    return false;
  }, text);
}

async function runViewport(browser, viewport) {
  const results = { viewport, home: {}, worlds: [], brokenImages: [], failedRequests: [], consoleErrors: [], pageErrors: [] };
  const { p, consoleErrors, pageErrors, failedRequests } = await newPage(browser, viewport);

  // ---- Home: display, pan, district tap, map return ----
  await p.goto(BASE, { waitUntil: "networkidle2" });
  await p.evaluate(() => localStorage.clear());
  await p.reload({ waitUntil: "networkidle2" });
  await sleep(1500);
  await p.screenshot({ path: `${OUT}/${viewport}-home.png` });
  results.home.brokenImagesInitial = await checkBrokenImages(p);

  // pan
  const vp = await p.evaluate(() => {
    const el = document.querySelector(".region-viewport");
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  await p.mouse.move(vp.x + vp.w * 0.7, vp.y + vp.h * 0.5);
  await p.mouse.down();
  await p.mouse.move(vp.x + vp.w * 0.35, vp.y + vp.h * 0.5, { steps: 10 });
  await p.mouse.up();
  await sleep(400);
  results.home.panOk = await p.evaluate(() => !!document.querySelector(".region-canvas"));
  await p.screenshot({ path: `${OUT}/${viewport}-home-after-pan.png` });

  // district tap (港) + return to region
  await clickText(p, "港");
  await sleep(700);
  results.home.districtTapOk = await p.evaluate(() => !!document.querySelector(".region-back"));
  await clickText(p, "地域全体");
  await sleep(400);
  results.home.mapReturnOk = await p.evaluate(() => !document.querySelector(".region-back"));

  // ---- every registered world: entry via Home navigation ----
  for (const w of WORLDS) {
    const entry = { id: w.id, ok: false, error: null };
    try {
      await p.evaluate(() => localStorage.clear());
      await p.reload({ waitUntil: "networkidle2" });
      await sleep(1400);
      if (w.district === "center") {
        await p.evaluate(() => document.querySelector(".town-tile")?.click());
      } else {
        await clickText(p, DISTRICT_NAME[w.district]);
      }
      await sleep(700);
      const clicked = await clickText(p, w.label);
      if (!clicked) throw new Error("world marker not found: " + w.label);
      await sleep(900);
      const onArea = await p.evaluate(() => !!document.querySelector(".map-scroller, .scene-stage, .back-chip, .hotspot"));
      if (!onArea) throw new Error("did not land on an area screen");
      entry.ok = true;
      entry.brokenImages = await checkBrokenImages(p);
      await p.screenshot({ path: `${OUT}/${viewport}-world-${w.id}.png` });
    } catch (e) {
      entry.error = String(e).slice(0, 200);
      await p.screenshot({ path: `${OUT}/${viewport}-world-${w.id}-FAIL.png` }).catch(() => {});
    }
    results.worlds.push(entry);
  }

  results.consoleErrors = [...new Set(consoleErrors)];
  results.pageErrors = [...new Set(pageErrors)];
  results.failedRequests = [...new Set(failedRequests)];
  results.brokenImages = results.worlds.flatMap((w) => (w.brokenImages || []).map((img) => `${w.id}: ${img}`));
  await p.close();
  return results;
}

const which = process.argv.includes("--viewport") ? process.argv[process.argv.indexOf("--viewport") + 1] : "both";
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
const out = {};
if (which === "both" || which === "mobile") out.mobile = await runViewport(browser, "mobile");
if (which === "both" || which === "desktop") out.desktop = await runViewport(browser, "desktop");
await browser.close();

writeFileSync("factory/state/release/smoke-qa-result.json", JSON.stringify(out, null, 1));

let blockers = 0;
for (const [vp, r] of Object.entries(out)) {
  const failedWorlds = r.worlds.filter((w) => !w.ok);
  console.log(`\n=== ${vp} ===`);
  console.log(`home: display=OK pan=${r.home.panOk} districtTap=${r.home.districtTapOk} mapReturn=${r.home.mapReturnOk}`);
  console.log(`worlds: ${r.worlds.length - failedWorlds.length}/${r.worlds.length} entered successfully`);
  if (failedWorlds.length) { console.log("  FAILED:", failedWorlds.map((w) => `${w.id} (${w.error})`).join("; ")); blockers += failedWorlds.length; }
  if (r.consoleErrors.length) { console.log("  CONSOLE ERRORS:", r.consoleErrors); blockers += r.consoleErrors.length; }
  if (r.pageErrors.length) { console.log("  PAGE ERRORS (fatal JS):", r.pageErrors); blockers += r.pageErrors.length; }
  if (r.failedRequests.length) { console.log("  FAILED REQUESTS (404/5xx):", r.failedRequests); blockers += r.failedRequests.length; }
  if (r.brokenImages.length) { console.log("  BROKEN IMAGES:", r.brokenImages); blockers += r.brokenImages.length; }
  if (!r.home.panOk || !r.home.districtTapOk || !r.home.mapReturnOk) blockers += 1;
}
console.log(`\nTOTAL BLOCKER-CLASS FINDINGS: ${blockers}`);
process.exit(blockers > 0 ? 1 : 0);
