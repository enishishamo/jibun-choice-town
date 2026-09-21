#!/usr/bin/env node
// In-context screenshots of the Ver.2 こんだてPLAY vertical slice at 375×812 (real
// Chrome via puppeteer-core, same pattern as map-repair-shots.mjs). Drives the
// flow with REAL taps and saves one PNG per key state so the Art QA
// presentation mode (art-qa.mjs presentation) and a human can judge how the
// generated assets look INSIDE the app (crop, scale, background remnants).
// Usage: node factory/harness/v2-lunch-shots.mjs [--base http://localhost:5177/jibun-choice-town/] [--out factory/state/art/shots/v2-lunch]
import puppeteer from "puppeteer-core";
import { mkdirSync, writeFileSync } from "node:fs";

const argOf = (n, d) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : d; };
const BASE = argOf("--base", "http://localhost:5177/jibun-choice-town/");
const OUT = argOf("--out", "factory/state/art/shots/v2-lunch");
const CHROME = process.env.JC_CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("response", (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
await page.goto(`${BASE}v2.html#lunch`, { waitUntil: "networkidle0" });
await page.evaluate(() => localStorage.removeItem("jibun-choice:v2:progress"));
await page.reload({ waitUntil: "networkidle0" });
const shots = [];
const shot = async (name) => { const p = `${OUT}/${name}.png`; await page.screenshot({ path: p }); shots.push(p); console.log("shot", p); };
const tap = async (label) => {
  let h = await page.$(`button[aria-label="${label}"]`);
  if (!h) {
    // buttons whose accessible name is their text (JOB REVEAL / 好きの種)
    const hs = await page.$$("button");
    for (const b of hs) { if ((await b.evaluate((e) => e.textContent.trim())).includes(label)) { h = b; break; } }
  }
  if (!h) throw new Error(`no button ${label}`);
  await h.tap();
  await sleep(220);
};

await shot("01-world-map");
await tap("こんだてを考える"); await sleep(600);
await shot("02-play-empty");
for (const d of ["ごはん", "とりのからあげ", "ポテトサラダ", "コーンスープ"]) await tap(d);
await sleep(350);
await shot("03-first-complete-grains");
await sleep(1200);
await shot("04-first-complete-status");
await tap("コーンスープ"); await tap("とうふのみそしる"); await sleep(400);
await shot("05-after-swap");
await sleep(2200);
await shot("06-event-truck");
await tap("とりのからあげ（とどかなかった）"); await sleep(250);
await shot("07-unavailable-shake");
await tap("さけのしおやき"); await sleep(600);
await shot("08-deliver-ready");
await tap("がっこうへ とどける"); await sleep(900);
await shot("09-delivering");
await sleep(1200);
await shot("10-job-reveal");
await tap("つぎへ"); await sleep(500);
await tap("なおしてみる"); await tap("ちずへ"); await sleep(900);
await shot("11-world-return");
await sleep(1200);
await shot("12-next-trouble");
const info = await page.evaluate(() => ({ scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth }));
writeFileSync(`${OUT}/run.json`, JSON.stringify({ at: new Date().toISOString(), shots, errors, ...info }, null, 1));
console.log(JSON.stringify({ ok: errors.length === 0 && info.scrollW <= info.innerW, errors, ...info }));
await browser.close();
