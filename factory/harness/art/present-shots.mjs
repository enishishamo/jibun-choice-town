#!/usr/bin/env node
// In-context presentation screenshots (Asset Presentation Gate).
// Drives the running dev server with system Chrome (puppeteer-core, headless)
// and saves real screenshots for art-qa.mjs `presentation` mode.
// Usage: node present-shots.mjs [--base http://localhost:5177/jibun-choice-town/]
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const ART = dirname(fileURLToPath(import.meta.url));
const ROOT = join(ART, "..", "..", "..");
const OUT = join(ROOT, "factory", "state", "art", "shots");
mkdirSync(OUT, { recursive: true });

const BASE = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : "http://localhost:5177/jibun-choice-town/";
const CHROME = process.env.JC_CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function clickText(page, text) {
  return page.evaluate((t) => {
    const b = [...document.querySelectorAll("button")].find((e) => e.textContent.includes(t));
    if (b) { b.click(); return true; }
    return false;
  }, text);
}

async function shot(page, name) {
  await sleep(500);
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: true });
  console.log(`shot: ${name}`);
}

// ---- correct-play bots (mirror the pane QA bots; rules from zooLogic) ------
async function playBaby(page) {
  let prev = null;
  for (let d = 0; d < 8; d++) {
    const body = await page.evaluate(() => document.body.innerText);
    if (body.includes("おつかれさま")) return true;
    if (body.includes("先輩と一緒に")) return false;
    const m = body.match(/体重 (\d+)g（([+-]?\d+)g）/);
    if (!m) return false;
    const delta = Number(m[2]);
    const leftover = body.includes("飲み残しあり");
    const bad = body.includes("うんちがゆるい");
    const low = body.includes("動きが少ない");
    let call;
    if (delta < 0 && (bad || low)) call = "獣医さんに相談";
    else if (delta <= 0 && prev !== null && prev <= 0 && leftover) call = "ミルクの量を調整";
    else call = "順調";
    prev = delta;
    await clickText(page, call);
    await sleep(350);
  }
  return false;
}

async function playCheckup(page) {
  await clickText(page, "飼育日誌を読む"); await sleep(350);
  await clickText(page, "カメラ映像を見る"); await sleep(350);
  let body = await page.evaluate(() => document.body.innerText);
  let plan;
  if (body.includes("かばうような歩き方")) {
    await clickText(page, "柵ごしの視診"); await sleep(350);
    plan = "安静と痛みのケア";
  } else {
    await clickText(page, "うんちの検査"); await sleep(350);
    body = await page.evaluate(() => document.body.innerText);
    plan = body.includes("卵が見つかった") ? "寄生虫のお薬" : "おやつと食事の見直し";
  }
  await clickText(page, plan); await sleep(500);
  return (await page.evaluate(() => document.body.innerText)).includes("たどりついた");
}

async function playFeed(page) {
  const body = await page.evaluate(() => document.body.innerText);
  const weigh = Number((body.match(/体重 (\d+)g/) || [])[1]);
  const strong = body.includes("よく飲ませている");
  const vegStock = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("野菜 S"));
    return b ? Number((b.textContent.match(/在庫のこり (\d+)/) || [])[1]) : null;
  });
  const short = vegStock < (strong ? 2 : 1) + 1;
  const fill = async (row, slot, item) => {
    await page.evaluate((r, sIdx) => {
      const rows = [...document.querySelectorAll("div")].filter((d) => d.textContent.startsWith(r) && d.querySelector("button"));
      const el = rows[rows.length - 1];
      [...el.querySelectorAll("button")][sIdx].click();
    }, row, slot);
    await sleep(200);
    await page.evaluate((it) => {
      const b = [...document.querySelectorAll("button.choice-card")].find((x) => x.textContent.includes(it));
      if (b) b.click();
    }, item);
    await sleep(200);
  };
  await fill("🐼", 0, "竹 M");
  await fill("🐼", 1, strong ? "野菜 M" : "野菜 S");
  await fill("🍼", 0, weigh >= 500 ? "特別ミルク M" : "特別ミルク S");
  await fill("🐐", 0, "干し草 M");
  await fill("🐐", 1, short ? "ペレット S" : "野菜 S");
  await clickText(page, "自分で見直して、提供する"); await sleep(500);
  return (await page.evaluate(() => document.body.innerText)).includes("提供完了");
}

async function playDebut(page) {
  const body = await page.evaluate(() => document.body.innerText);
  const calm = body.includes("自分からすぐ出てきた");
  await clickText(page, calm ? "2時間" : "1時間"); await sleep(150);
  await clickText(page, "ふつう"); await sleep(150);
  await clickText(page, "しぼる"); await sleep(150);
  await clickText(page, "この計画で、初日をむかえる"); await sleep(450);
  for (let g = 0; g < 12; g++) {
    const b = await page.evaluate(() => document.body.innerText);
    if (b.includes("ぶじ終了") || b.includes("それが正解")) return true;
    if (b.includes("今日は、ここまで")) return false;
    const mS = b.match(/サイン (\d)\/2まで ・ 縮小ずみ (\d)/);
    const mK = b.match(/初日 (\d)\/4 時間帯/);
    if (!mS || !mK) return false;
    const signs = Number(mS[1]), shrinks = Number(mS[2]), slot = Number(mK[1]);
    const crowd = b.includes("こみはじめた");
    if (signs >= 2 && slot >= 3 && shrinks > 0) await clickText(page, "今日はここまで");
    else if (signs >= 1 && shrinks < 3) {
      const order = crowd ? ["人数をしぼる", "観覧の距離を広げる", "時間を切り上げる"] : ["観覧の距離を広げる", "人数をしぼる", "時間を切り上げる"];
      let done = false;
      for (const L of order) {
        done = await page.evaluate((t) => {
          const x = [...document.querySelectorAll("button")].find((e) => e.textContent.includes(t) && !e.disabled);
          if (x) { x.click(); return true; }
          return false;
        }, L);
        if (done) break;
      }
      if (!done) await clickText(page, "このまま続行");
    } else await clickText(page, "このまま続行");
    await sleep(350);
  }
  return false;
}

async function advanceUntil(page, needle, max = 10) {
  for (let i = 0; i < max; i++) {
    const b = await page.evaluate(() => document.body.innerText);
    if (b.includes(needle)) return true;
    const clicked = await page.evaluate(() => {
      const btns = [...document.querySelectorAll("button")].filter((x) => !x.disabled);
      const b2 = btns.reverse().find((x) => /引き継ぐ|えらんだ|街にもどる|すすむ|つぎへ|共有|決める|方針|照合|台車|カルテ|日誌|ふり返り/.test(x.textContent)) || btns[0];
      if (!b2) return null;
      const t = b2.textContent.slice(0, 12);
      b2.click();
      return t;
    });
    if (clicked === null) return false;
    await sleep(550);
  }
  return false;
}

const failures = [];
const consoleErrors = [];

async function runViewport(browser, label, width, height) {
  const page = await browser.newPage();
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(`${label}: ${m.text().slice(0, 200)}`); });
  page.on("pageerror", (e) => consoleErrors.push(`${label}: pageerror ${String(e).slice(0, 200)}`));
  await page.setViewport({ width, height });
  await page.goto(BASE, { waitUntil: "networkidle2" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle2" });
  await sleep(700);
  await shot(page, `${label}-town-map`);

  // ---- zoo full flow -------------------------------------------------------
  await clickText(page, "赤ちゃん誕生"); await sleep(600);
  await shot(page, `${label}-zoo-opening`);
  await clickText(page, "のぞいてみる"); await sleep(600);
  await shot(page, `${label}-zoo-area`);
  await clickText(page, "今朝の体重"); await sleep(500);
  await shot(page, `${label}-zoo-q1-intro`);
  await clickText(page, "やってみる"); await sleep(600);
  await shot(page, `${label}-zoo-game-babycare`);
  const okBaby = await playBaby(page);
  if (!okBaby) failures.push(`${label}: baby_care bot did not complete`);
  await shot(page, `${label}-zoo-result`);
  if (okBaby) {
    await clickText(page, "日誌を書いて引き継ぐ"); await sleep(700);
    await shot(page, `${label}-zoo-jobreveal`);
  }
  // through discovery back to area, then the remaining three games
  await advanceUntil(page, "② 触らずに", 8);
  const games = [
    { open: "② 触らずに", play: playCheckup, done: "カルテに記録する", tag: "checkup" },
    { open: "③ 3にんぶん", play: playFeed, done: "台車で配りに行く", tag: "feed" },
    { open: "④ デビューの日", play: playDebut, done: "ふり返りを書いて共有する", tag: "debut" },
  ];
  for (const g of games) {
    await clickText(page, g.open); await sleep(500);
    await clickText(page, "やってみる"); await sleep(600);
    await shot(page, `${label}-zoo-game-${g.tag}`);
    let ok = false;
    for (let attempt = 0; attempt < 3 && !ok; attempt++) {
      ok = await g.play(page);
      if (!ok) {
        const retried = await page.evaluate(() => {
          const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("もう一度") || x.textContent.includes("挑戦") || x.textContent.includes("計画する"));
          if (b) { b.click(); return true; }
          return false;
        });
        if (!retried) break;
        await sleep(600);
      }
    }
    if (!ok) failures.push(`${label}: ${g.tag} bot did not complete`);
    if (ok) { await clickText(page, g.done); await sleep(600); }
    const nextNeedle = g.tag === "checkup" ? "③ 3にんぶん" : g.tag === "feed" ? "④ デビューの日" : "しずかな展示場";
    const reached = await advanceUntil(page, nextNeedle, 12);
    if (!reached) failures.push(`${label}: did not reach "${nextNeedle}" after ${g.tag}`);
  }
  // the wrapup shot is only valid if the wrapup marker is actually on screen —
  // a mislabeled screenshot must fail the run, not silently mislead the critic
  const wrapVisible = await page.evaluate(() => document.body.innerText.includes("しずかな展示場"));
  if (!wrapVisible) failures.push(`${label}: wrapUp not reached — zoo-wrapup shot skipped`);
  else await shot(page, `${label}-zoo-wrapup`);

  // ---- generic world walker (world-agnostic; no per-world hardcoding) ------
  // Enumerates every event balloon on the town map and shoots opening / area /
  // first-Q1 intro / first game screen for each world it finds.
  await page.goto(BASE, { waitUntil: "networkidle2" }); await sleep(700);
  const balloonLabels = await page.evaluate(() =>
    [...document.querySelectorAll("button.event-balloon")].map((b) => b.textContent.trim().slice(0, 14)),
  );
  for (let bi = 0; bi < balloonLabels.length; bi++) {
    const lbl = balloonLabels[bi];
    const tag = `w${bi}`;
    await page.goto(BASE, { waitUntil: "networkidle2" }); await sleep(600);
    const entered = await page.evaluate((i) => {
      const bs = [...document.querySelectorAll("button.event-balloon")];
      if (bs[i]) { bs[i].click(); return true; }
      return false;
    }, bi);
    if (!entered) { failures.push(`${label}: balloon ${bi} (${lbl}) not clickable`); continue; }
    await sleep(700);
    await shot(page, `${label}-world-${tag}-opening`);
    await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((e) => /のぞ|追いかけ|見てみる|入って|うらがわ|のぞいて/.test(e.textContent));
      if (b) b.click();
    });
    await sleep(700);
    await shot(page, `${label}-world-${tag}-area`);
    const first = await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((e) => e.textContent.includes("①"));
      if (b) { b.click(); return true; }
      return false;
    });
    if (first) {
      await sleep(600); await shot(page, `${label}-world-${tag}-q1-intro`);
      const started = await clickText(page, "やってみる");
      if (started) { await sleep(700); await shot(page, `${label}-world-${tag}-game`); }
    }
  }

  await page.close();
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
try {
  await runViewport(browser, "mobile", 375, 812);
  await runViewport(browser, "desktop", 1280, 900);
} finally {
  await browser.close();
}
if (consoleErrors.length) {
  console.error("CONSOLE ERRORS:");
  for (const e of [...new Set(consoleErrors)].slice(0, 20)) console.error("  " + e);
}
if (failures.length) {
  console.error("FLOW FAILURES:");
  for (const f of failures) console.error("  " + f);
  process.exit(1);
}
if (consoleErrors.length) process.exit(1);
console.log("done — all flows completed, no console errors");
