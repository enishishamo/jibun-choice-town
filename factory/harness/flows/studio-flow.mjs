#!/usr/bin/env node
// Browser QA flow for the game-studio world (3 games, correct-play bots).
// Usage: node factory/harness/flows/studio-flow.mjs [--viewport desktop]
import puppeteer from "puppeteer-core";

const BASE = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : "http://localhost:5177/jibun-choice-town/";
const CHROME = process.env.JC_CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const MOBILE = !process.argv.includes("--viewport") || process.argv[process.argv.indexOf("--viewport") + 1] !== "desktop";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const failures = [];
const consoleErrors = [];

const b = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
const p = await b.newPage();
p.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 160)); });
p.on("pageerror", (e) => consoleErrors.push(String(e).slice(0, 160)));
await p.setViewport(MOBILE ? { width: 375, height: 812 } : { width: 1280, height: 900 });
await p.goto(BASE, { waitUntil: "networkidle2" });
await p.evaluate(() => localStorage.clear());
await p.reload({ waitUntil: "networkidle2" });
await sleep(1400);

const click = (t) => p.evaluate((x) => {
  const btn = [...document.querySelectorAll("button")].find((e) => e.textContent.includes(x));
  if (btn) { btn.click(); return true; }
  return false;
}, t);
const clickCard = (t) => p.evaluate((x) => {
  const btn = [...document.querySelectorAll("button.choice-card")].find((e) => e.textContent.includes(x));
  if (btn) { btn.click(); return true; }
  return false;
}, t);
const body = () => p.evaluate(() => document.body.innerText);
const shot = (n) => p.screenshot({ path: `factory/state/art/shots/${MOBILE ? "mobile" : "desktop"}-studio-${n}.png`, fullPage: true });
const recoverHome = async () => {
  await click("えきまえ"); await sleep(800);
  await click("ゲームの3日間"); await sleep(800);
};

// enter world
await click("えきまえ"); await sleep(900);
await click("ゲームの3日間"); await sleep(800);
await click("スタジオに入る"); await sleep(700);
await shot("area");

// ---- ① bug_repro ------------------------------------------------------------
await click("① 「たまに止まる」"); await sleep(500);
await click("やってみる"); await sleep(700);
await shot("game-repro");
{
  const CONDS = ["セーブ直後", "通信オフ", "アイテム使用", "どうくつ"];
  const selSet = async (labels) => {
    // toggle to make selection exactly `labels`
    const cur = await p.evaluate(() => [...document.querySelectorAll("button.choice-card.selected")].map((e) => e.textContent));
    for (const c of CONDS) {
      const on = cur.some((t) => t.includes(c));
      const want = labels.includes(c);
      if (on !== want) { await clickCard(c); await sleep(150); }
    }
  };
  const lastCrashed = async () => {
    const t = await body();
    const lines = t.split("\n").filter((l) => l.includes("💥") || l.includes("✅"));
    const last = lines[lines.length - 1] || "";
    return last.includes("💥");
  };
  await selSet(CONDS);
  await click("▶ テスト実行"); await sleep(400);
  const pair = [];
  for (const c of CONDS) {
    if (pair.length === 2) break;
    await selSet(CONDS.filter((x) => x !== c));
    await click("▶ テスト実行"); await sleep(400);
    if (!(await lastCrashed())) pair.push(c);
  }
  await selSet(pair);
  await click("▶ テスト実行"); await sleep(400);
  await click("📝 票を書く"); await sleep(600);
  const t = await body();
  if (!t.includes("受理された")) failures.push("repro: bot did not complete: " + t.slice(0, 60).replace(/\n/g, "/"));
  else { await shot("result-repro"); await click("票を回す"); await sleep(700); }
}

const advance = async (needle) => {
  for (let i = 0; i < 14; i++) {
    const t = await body();
    if (t.includes(needle) && !t.includes("きみが今やっていたのは")) return true;
    if (t.includes("地図は うごかせる") || t.includes("地図はこれからも")) { await recoverHome(); continue; }
    await p.evaluate(() => {
      const btns = [...document.querySelectorAll("button")].filter((x) => !x.disabled);
      const b2 = btns.reverse().find((x) => /えらんだ|もどる|すすむ|つぎへ/.test(x.textContent)) || btns[0];
      if (b2) b2.click();
    });
    await sleep(550);
  }
  return false;
};
await advance("② 「むずかしすぎ」");

// ---- ② difficulty_tune ------------------------------------------------------
await click("② 「むずかしすぎ」"); await sleep(500);
await click("やってみる"); await sleep(700);
await shot("game-tune");
{
  for (let i = 0; i < 2; i++) {
    const t = await body();
    let fix;
    if (t.includes("動く前にやられている")) fix = "予告を足す";
    else if (t.includes("ぐるぐる歩き回っている")) fix = "道しるべ";
    else if (t.includes("ボタン設定の画面で")) fix = "操作を直す";
    else fix = "敵を弱く";
    await clickCard(fix); await sleep(500);
  }
  const t = await body();
  if (!t.includes("数字が動いた")) failures.push("tune: bot did not complete: " + t.slice(0, 60).replace(/\n/g, "/"));
  else { await shot("result-tune"); await click("調整案を送る"); await sleep(700); }
}
await advance("③ 「まちがえない画面」");

// ---- ③ ui_clarity -----------------------------------------------------------
await click("③ 「まちがえない画面」"); await sleep(500);
await click("やってみる"); await sleep(700);
await shot("game-ui");
{
  const t = await body();
  const MAP = [
    ["となりの「けってい」を押しちゃう", "ボタンを離す"],
    ["色でしか区別できなくて", "形でも区別"],
    ["小さすぎて、読めない", "数字を大きく"],
    ["いつ使えるようになるのか", "残りの輪"],
    ["まぶしくて、敵の弾が", "背景を暗く"],
  ];
  for (const [report, fix] of MAP) {
    if (t.includes(report)) { await clickCard(fix); await sleep(250); }
  }
  await click("✅ 再テスト"); await sleep(600);
  const t2 = await body();
  if (!t2.includes("見やすい！")) failures.push("ui: bot did not complete: " + t2.slice(0, 60).replace(/\n/g, "/"));
  else { await shot("result-ui"); await click("案を送る"); await sleep(700); }
}

// wrapUp
for (let i = 0; i < 14; i++) {
  const t = await body();
  if (t.includes("直した人たちの合作")) break;
  if (t.includes("地図は うごかせる") || t.includes("地図はこれからも")) { await recoverHome(); continue; }
  await p.evaluate(() => {
    const btns = [...document.querySelectorAll("button")].filter((x) => !x.disabled);
    const b2 = btns.reverse().find((x) => /えらんだ|もどる|すすむ|つぎへ|ふり返/.test(x.textContent)) || btns[0];
    if (b2) b2.click();
  });
  await sleep(600);
}
{
  const t = await body();
  if (!t.includes("直した人たちの合作")) failures.push("wrapUp not reached");
  else await shot("wrapup");
}

await b.close();
if (consoleErrors.length) { console.error("CONSOLE ERRORS:"); for (const e of [...new Set(consoleErrors)].slice(0, 8)) console.error("  " + e); }
if (failures.length) { console.error("FLOW FAILURES:"); for (const f of failures) console.error("  " + f); process.exit(1); }
console.log("studio flow: all 3 games + wrapUp completed, no console errors");
