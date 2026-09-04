#!/usr/bin/env node
// Full sweep: render ProfessionScreen (with its new CareerPathSection) for
// ALL 62 professions, at mobile 375px, checking for console/page errors and
// any obviously broken layout (career-path-track present when careerPath
// exists, no React error boundary text). Not a visual QA — a crash-hunt
// across the entire dataset the hand-picked screenshots didn't individually
// cover.
import puppeteer from "puppeteer-core";
import { readFileSync, writeFileSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:5177/jibun-choice-town/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const research = JSON.parse(readFileSync("factory/state/career-path/career-path-research-merged.json", "utf8"));
const ids = research.map((e) => e.profession_id);

const b = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
const p = await b.newPage();
const consoleErrors = [];
const pageErrors = [];
p.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 150)); });
p.on("pageerror", (e) => pageErrors.push(String(e).slice(0, 150)));
await p.setViewport({ width: 375, height: 900 });
await p.goto(BASE, { waitUntil: "networkidle2" });

const results = [];
for (const id of ids) {
  await p.evaluate((pid) => {
    localStorage.setItem("jibun-choice-progress-v1", JSON.stringify({
      completed: [], discovered: [pid], seeds: {}, visitedEvents: [], seenVersion: {},
    }));
  }, id);
  await p.reload({ waitUntil: "networkidle2" });
  await sleep(400);
  await p.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((e) => e.textContent.includes("しごと図鑑"));
    if (btn) btn.click();
  });
  await sleep(300);
  const clicked = await p.evaluate(() => {
    const entry = document.querySelector(".zukan-entry");
    if (entry) { entry.click(); return true; }
    return false;
  });
  await sleep(400);
  const state = await p.evaluate(() => ({
    hasCareerPath: !!document.querySelector(".career-path"),
    hasTrack: !!document.querySelector(".career-path-track"),
    rawRubyLeak: document.body.innerText.includes("｜") && document.body.innerText.includes("《"),
    bodyLen: document.body.innerText.length,
  }));
  results.push({ id, clicked, ...state });
}
await b.close();

const errs = [...new Set(consoleErrors)];
const perrs = [...new Set(pageErrors)];
const missing = results.filter((r) => !r.hasCareerPath);
const leaks = results.filter((r) => r.rawRubyLeak);
writeFileSync("factory/state/career-path/full-sweep-result.json", JSON.stringify({ results, consoleErrors: errs, pageErrors: perrs }, null, 1));
console.log(JSON.stringify({
  total: results.length,
  withCareerPath: results.length - missing.length,
  missingCareerPath: missing.map((m) => m.id),
  rawRubyLeaks: leaks.map((l) => l.id),
  consoleErrorCount: errs.length,
  pageErrorCount: perrs.length,
  sampleErrors: errs.slice(0, 5),
}, null, 1));
