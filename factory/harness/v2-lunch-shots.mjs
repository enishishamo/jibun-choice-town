#!/usr/bin/env node
// Real-device-shaped playthrough of the Ver.2 栄養教諭 Job Vertical Slice at
// 375x812 (real Chrome via puppeteer-core), driven by REAL taps and gestures.
// Captures the 16 states the Visual Review asks for, and fails on any console
// error, page error, 4xx/5xx or horizontal overflow.
//
// The play path is not arbitrary: it is the sequence the pure-logic harness
// proves exists — a menu that is one axis off, a single swap that fixes it, a
// delivery trouble with several ways back, and a different menu to recover.
// Usage: npm run shots:v2-lunch [-- --base <url>] [-- --out <dir>]
import puppeteer from "puppeteer-core";
import { mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { tmpdir } from "node:os";

// The allow-list of everything a child may ever read comes from copy.ts itself,
// so a string invented in a component cannot slip past: anything rendered that
// is not in here fails the run.
const vite = await createServer({ configFile: false, plugins: [react()], server: { middlewareMode: true }, appType: "custom", logLevel: "error", cacheDir: `${tmpdir()}/jc-vite-cache-v2-lunch` });
const { COPY } = await vite.ssrLoadModule("/src/v2/lunch/copy.ts");
await vite.close();
const ALLOWED = new Set();
const collect = (v) => {
  if (typeof v === "string") ALLOWED.add(v.trim());
  else if (typeof v === "function") {
    for (const n of ["さけのしおやき", "とりのからあげ", "ごはん", "パン", "やさいのごまあえ", "ポテトサラダ", "とうふのみそしる", "コーンスープ", "コロッケ", "ぎゅうにゅう", "りょうり"]) collect(v(n));
    for (let i = 1; i <= 6; i++) collect(v(i));
  }
  else if (v && typeof v === "object") for (const x of Object.values(v)) collect(x);
};
collect(COPY);
// multi-line copy is rendered as one node; index each line too
for (const s of [...ALLOWED]) for (const line of s.split("\n")) ALLOWED.add(line.trim());

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
page.on("pageerror", (e) => errors.push(`pageerror: ${String(e)}`));
page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
page.on("response", (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
page.on("requestfailed", (r) => errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText ?? ""}`));

await page.goto(`${BASE}v2.html`, { waitUntil: "networkidle0" });
await page.evaluate(() => localStorage.removeItem("jibun-choice:v2:progress"));
await page.reload({ waitUntil: "networkidle0" });

const shots = [];
const violations = [];
let revealed = false; // the job name may not appear anywhere before CLEAR
/** Every capture is also an assertion: no developer marker, no job name before
 * the reveal, no digit on the board, and no string that is not in copy.ts. */
const shot = async (name) => {
  const p = `${OUT}/${name}.png`;
  await page.screenshot({ path: p });
  shots.push(p);
  const seen = await page.evaluate(() => {
    const texts = [];
    const walk = (root) => {
      const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let n = it.nextNode(); n; n = it.nextNode()) { const t = n.textContent.trim(); if (t) texts.push(t); }
    };
    walk(document.body);
    const board = document.querySelector(".lmp");
    const boardText = board ? board.innerText : "";
    const aria = [...document.querySelectorAll("[aria-label]")].map((e) => e.getAttribute("aria-label"));
    return { texts, boardText, aria, body: document.body.innerText };
  });
  if (/TEMP_IMPLEMENTATION_ONLY|DESIGN_NEEDED|DN-\d+/.test(seen.body)) violations.push(`${name}: developer marker on screen`);
  if (!revealed && /栄養教諭|栄養士|学校栄養職員/.test(seen.body)) violations.push(`${name}: the job is named before CLEAR`);
  if (/[0-9０-９]/.test(seen.boardText)) violations.push(`${name}: a number is shown on the board — "${seen.boardText.replace(/\s+/g, " ").slice(0, 80)}"`);
  for (const t of seen.texts) if (!ALLOWED.has(t)) violations.push(`${name}: text not in copy.ts — "${t}"`);
  for (const a of seen.aria) {
    const bare = a.replace(/（.*?）|：.*$/g, "").trim();
    if (!ALLOWED.has(a) && !ALLOWED.has(bare)) violations.push(`${name}: aria-label not in copy.ts — "${a}"`);
  }
  console.log("shot", p);
};
/** tap by accessible name (exact, then prefix) — the flow must be reachable by an AT user too */
const tap = async (label, settle = 260) => {
  let h = await page.$(`button[aria-label="${label}"]`);
  if (!h) {
    for (const b of await page.$$("button")) {
      const [al, txt] = await b.evaluate((e) => [e.getAttribute("aria-label") ?? "", e.textContent.trim()]);
      if (al === label || al.startsWith(label) || txt === label || txt.startsWith(label)) { h = b; break; }
    }
  }
  if (!h) throw new Error(`no button for "${label}"`);
  await h.tap();
  await sleep(settle);
};
/** swipe the tray upward — the in-world way to send the lunch off */
const swipeTrayUp = async () => {
  const box = await (await page.$(".lmp-tray")).boundingBox();
  const cx = Math.round(box.x + box.width / 2), cy = Math.round(box.y + box.height / 2);
  await page.touchscreen.touchStart(cx, cy);
  await page.touchscreen.touchMove(cx, cy - 40);
  await page.touchscreen.touchMove(cx, cy - 90);
  await page.touchscreen.touchEnd();
};
const beads = () => page.$$eval(".lmp-bead", (bs) => bs.map((b) => ({ axis: b.getAttribute("data-bead"), band: [...b.classList].find((c) => c.startsWith("band-")) })));

// ── 01 START ─────────────────────────────────────────────────────────────
await shot("01-world-map");
await tap("こんだてを考える", 700);
await shot("02-play-start");

// ── 02 one or two dishes placed ──────────────────────────────────────────
await tap("パン", 700);
await shot("03-one-placed");
await tap("さけのしおやき", 700);
await shot("04-two-placed");

// ── 03 four dishes, one axis still off ───────────────────────────────────
await tap("やさいのごまあえ");
await tap("ごはん", 1400);
await shot("05-four-placed");
const before = await beads();

// ── 04 swapping one dish while watching the beads ────────────────────────
// two staples is too much energy: take the rice back off the tray and put a
// side dish in instead (tapping a dish on the tray returns it to the counter)
await tap("ごはん（おぼんから もどす）", 600);
await shot("06-swapping");
await tap("ポテトサラダ", 1600);
await shot("07-after-swap");
const after = await beads();

// ── 05 the first "it came together" ──────────────────────────────────────
await shot("08-settled");

// ── 06 EVENT: the first send is intercepted ──────────────────────────────
await swipeTrayUp();
await sleep(900);
await shot("09-event-truck");
await sleep(1200);
await shot("10-event-after");

// ── 07 the dish that did not arrive ──────────────────────────────────────
await tap("さけのしおやき（とどかなかった）", 140);
await shot("11-unavailable-shake");

// ── 08/09 rebuild: try the fried chicken, see it push two beads out, take it
//    back off and try the soup instead ─────────────────────────────────────
await tap("とりのからあげ", 1500);
await shot("12-rebuilding");
await tap("とりのからあげ（おぼんから もどす）", 600); // on the tray: tapping it sends it back
await tap("とうふのみそしる", 1600);
await shot("13-rebuilt");

// ── 10 the lunch reaches the school ──────────────────────────────────────
await swipeTrayUp();
await sleep(800);
await shot("14-delivering");
await sleep(1400);

// ── 11 JOB REVEAL ────────────────────────────────────────────────────────
revealed = true; // from here on the job may be named
await shot("15-job-reveal-lead");
await sleep(2400);
await shot("16-job-reveal");

// ── 12/13 KNOW THE JOB ───────────────────────────────────────────────────
await tap("この仕事を のぞいてみる", 700);
await shot("17-know-the-job");
await tap("給食をつくる", 500);
await shot("18-know-scene-open");

// ── 14 CAREER PATH ───────────────────────────────────────────────────────
await tap("どうやって なる？", 700);
await shot("19-career-path");
await tap("もどる", 600);

// ── 15 好きの種 ───────────────────────────────────────────────────────────
await tap("つぎへ", 700);
await shot("20-seed");
await tap("予定が変わって考え直す", 400);
await shot("21-seed-picked");

// ── 16 WORLD RETURN ──────────────────────────────────────────────────────
await tap("ちずへ", 1200);
await shot("22-world-return");
await sleep(1200);
await shot("23-next-trouble");

// ── the one structural rule besides the four axes: a lunch needs a 主食.
//    Played on a fresh visit so the state is unambiguous.
await tap("こんだてを考える", 700);
for (const d of ["さけのしおやき", "やさいのごまあえ", "ポテトサラダ", "とうふのみそしる"]) await tap(d);
await sleep(1500);
await shot("24-no-staple");
const noStaple = await page.evaluate(() => ({
  stapleShelfAsks: !!document.querySelector(".lmp-shelf.wanted"),
  schoolOffered: !!document.querySelector(".lmp-school.ready"),
}));
if (!noStaple.stapleShelfAsks || noStaple.schoolOffered) {
  violations.push(`24-no-staple: a tray with no 主食 must not be sendable and the 主食 pan must ask — got ${JSON.stringify(noStaple)}`);
}

// every <img> the flow rendered must be a real, loaded picture — a CSS fallback
// carries no text and returns no 4xx, so the marker grep alone cannot see it
const brokenImages = await page.evaluate(() =>
  [...document.querySelectorAll("img")].filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.currentSrc || i.src),
);
const info = await page.evaluate(() => ({
  scrollW: document.documentElement.scrollWidth,
  innerW: window.innerWidth,
  progress: localStorage.getItem("jibun-choice:v2:progress"),
  // no developer marker may be visible anywhere in the finished flow
  markers: /TEMP_IMPLEMENTATION_ONLY|DESIGN_NEEDED|DN-\d+/.test(document.body.innerText),
}));
const beadsMoved = JSON.stringify(before) !== JSON.stringify(after);
const solved = (() => { try { return JSON.parse(info.progress)?.solved?.[0]?.spot === "menu"; } catch { return false; } })();
const seed = (() => { try { return JSON.parse(info.progress)?.seeds?.["lunch:menu"]; } catch { return null; } })();
const ok = errors.length === 0 && info.scrollW <= info.innerW && !info.markers && beadsMoved && solved && seed === "rebuild" && brokenImages.length === 0 && violations.length === 0;
writeFileSync(`${OUT}/run.json`, JSON.stringify({ at: new Date().toISOString(), ok, shots, errors, violations, brokenImages, beadsBefore: before, beadsAfter: after, ...info }, null, 1));
console.log(JSON.stringify({ ok, errors, violations: violations.slice(0, 12), brokenImages, scrollW: info.scrollW, innerW: info.innerW, visibleDevMarkers: info.markers, beadsMoved, solved, seed }));
await browser.close();
process.exit(ok ? 0 : 1);
