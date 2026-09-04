#!/usr/bin/env node
// Recapture the exact screenshot set the Language In-Context QA prompt attaches,
// AFTER the 2026-09-04 fixes (raw-ruby-leak fixes, AreaScreen/Q1Screen/InfoCards
// withRuby wraps, WaterTraceGame furigana additions). Old screenshots predated
// these fixes and produced a stale FAIL verdict.
import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:5177/jibun-choice-town/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const D = "factory/state/language-audit";

const b = await puppeteer.launch({ executablePath: CHROME, headless: "new" });

async function withPage(viewport, fn) {
  const p = await b.newPage();
  await p.setViewport(viewport);
  await p.goto(BASE, { waitUntil: "networkidle2" });
  await p.evaluate(() => localStorage.clear());
  await p.reload({ waitUntil: "networkidle2" });
  await sleep(1000);
  await fn(p);
  await p.close();
}

const click = (p, t) => p.evaluate((x) => {
  const btn = [...document.querySelectorAll("button")].find((e) => e.textContent.includes(x));
  if (btn) { btn.click(); return true; }
  return false;
}, t);
const body = (p) => p.evaluate(() => document.body.innerText);

// ---- mobile: event intro (medical ER) ----
await withPage({ width: 375, height: 812 }, async (p) => {
  await click(p, "病院"); await sleep(900);
  await click(p, "救急外来"); await sleep(900);
  await p.screenshot({ path: `${D}/mobile-event-intro.png`, fullPage: true });
});

// ---- mobile: Q1 instruction + failure/retry (river water_trace) ----
await withPage({ width: 375, height: 812 }, async (p) => {
  await click(p, "森と川"); await sleep(900);
  await click(p, "川に魚が！"); await sleep(800);
  await click(p, "川ぞいへ"); await sleep(700);
  await click(p, "① 魚がもどった理由"); await sleep(500);
  await p.screenshot({ path: `${D}/mobile-q1-instruction.png`, fullPage: true });
  await click(p, "やってみる");
  for (let i = 0; i < 12; i++) { if ((await body(p)).includes("採水")) break; await sleep(300); }
  // open the C-info doc card
  await p.evaluate(() => {
    const btn = [...document.querySelectorAll("button.doc-head")].find((e) => e.textContent.includes("この川の"));
    if (btn) btn.click();
  });
  await sleep(400);
  await p.screenshot({ path: `${D}/mobile-q1-c-info.png`, fullPage: true });
  // deliberately pick a wrong conclusion twice to reach the failure/retry screen
  for (let i = 0; i < 2; i++) {
    await p.evaluate(() => {
      const btn = [...document.querySelectorAll("button.choice-card")].find((e) => e.textContent.includes("処理場"));
      if (btn) btn.click();
    });
    await sleep(500);
  }
  await sleep(500);
  await p.screenshot({ path: `${D}/mobile-failure-retry.png`, fullPage: true });
});

// ---- mobile + desktop: career path (doctor) ----
for (const [tag, viewport] of [["mobile", { width: 375, height: 812 }], ["desktop", { width: 1280, height: 900 }]]) {
  await withPage(viewport, async (p) => {
    await p.evaluate(() => {
      localStorage.setItem("jibun-choice-progress-v1", JSON.stringify({
        completed: [], discovered: ["doctor"], seeds: {}, visitedEvents: [], seenVersion: {},
      }));
    });
    await p.reload({ waitUntil: "networkidle2" });
    await sleep(600);
    await click(p, "しごと図鑑"); await sleep(400);
    await p.evaluate(() => { const e = document.querySelector(".zukan-entry"); if (e) e.click(); });
    await sleep(500);
    await p.screenshot({ path: `${D}/${tag}-career-doctor.png`, fullPage: true });
  });
}

// ---- mobile: career path with multiple routes (library-archivist) ----
await withPage({ width: 375, height: 812 }, async (p) => {
  await p.evaluate(() => {
    localStorage.setItem("jibun-choice-progress-v1", JSON.stringify({
      completed: [], discovered: ["library-archivist"], seeds: {}, visitedEvents: [], seenVersion: {},
    }));
  });
  await p.reload({ waitUntil: "networkidle2" });
  await sleep(600);
  await click(p, "しごと図鑑"); await sleep(400);
  await p.evaluate(() => { const e = document.querySelector(".zukan-entry"); if (e) e.click(); });
  await sleep(500);
  await p.screenshot({ path: `${D}/mobile-career-forest.png`, fullPage: true });
});

await b.close();
console.log("recaptured all language-audit screenshots");
