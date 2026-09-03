#!/usr/bin/env node
// Browser QA flow for the library-detective world (3 games, correct-play bots).
// Usage: node factory/harness/flows/library-flow.mjs [--viewport desktop]
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
const shot = (n) => p.screenshot({ path: `factory/state/art/shots/${MOBILE ? "mobile" : "desktop"}-library-${n}.png`, fullPage: true });
const recoverHome = async () => {
  await click("おかのうえ"); await sleep(800);
  await click("写真のなぞ"); await sleep(800);
};

// enter world: district chip → world marker → opening
await click("おかのうえ"); await sleep(900);
await click("写真のなぞ"); await sleep(800);
await click("カウンターの奥へ"); await sleep(700);
await shot("area");

// ---- ① photo_clues ----------------------------------------------------------
await click("① この写真は"); await sleep(500);
await click("やってみる"); await sleep(700);
await shot("game-clues");
{
  // look up all 4 clues
  for (const clue of ["道の曲がり方", "山のかたち", "店の看板", "橋と電柱"]) {
    await clickCard(clue); await sleep(300);
  }
  // read verified match counts from the candidate cards (「一致 N」)
  const cands = await p.evaluate(() => {
    const btns = [...document.querySelectorAll("button.choice-card")].filter((e) => /一致 \d/.test(e.textContent));
    return btns.map((e) => ({
      label: e.textContent.includes("北町") ? "北町のつじ" : e.textContent.includes("仲見世") ? "仲見世どおり" : "みなと橋",
      v: Number((e.textContent.match(/一致 (\d)/) || [])[1]),
    }));
  });
  if (cands.length !== 3) failures.push(`clues: parsed ${cands.length} candidates`);
  const best = cands.sort((a, z) => z.v - a.v)[0];
  await clickCard(best.label); await sleep(300);
  await clickCard(best.v >= 3 ? "✅ 確定" : "🤔 推定"); await sleep(600);
  const t = await body();
  if (!t.includes("撮影地、確定！") && !t.includes("「推定」として、回答できた")) {
    failures.push("clues: bot did not complete: " + t.slice(0, 60).replace(/\n/g, "/"));
  } else { await shot("result-clues"); await click("回答をわたす"); await sleep(700); }
}

// back to area (Q2 flow etc.) then game 2
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
await advance("② こわさずに");

// ---- ② paper_rescue ---------------------------------------------------------
await click("② こわさずに"); await sleep(500);
await click("やってみる"); await sleep(700);
await shot("game-rescue");
{
  for (let i = 0; i < 5; i++) {
    const t = await body();
    let treat;
    if (t.includes("白いてんてん") || t.includes("しめったにおい")) treat = "隔離";
    else if (t.includes("うすくほこり")) treat = "刷毛";
    else if (t.includes("やぶれている")) treat = "包む";
    else treat = "そのまま記録"; // fine or old tape repairs
    await clickCard(treat); await sleep(400);
  }
  const t = await body();
  if (!t.includes("5点ぜんぶ、保存箱へ")) failures.push("rescue: bot did not complete: " + t.slice(0, 60).replace(/\n/g, "/"));
  else { await shot("result-rescue"); await click("状態調査票を書く"); await sleep(700); }
}
await advance("③ 100年後へ");

// ---- ③ digi_archive ---------------------------------------------------------
await click("③ 100年後へ"); await sleep(500);
await click("やってみる"); await sleep(700);
await shot("game-archive");
{
  for (let i = 0; i < 3; i++) {
    const t = await body();
    await clickCard(t.includes("保存用（100年") ? "TIFF" : "JPEG"); await sleep(250);
    if (t.includes("場所の根拠3つ")) await clickCard("確定");
    else if (t.includes("場所の根拠2つ")) await clickCard("推定");
    else await clickCard("ふめい");
    await sleep(250);
    await clickCard(t.includes("人の顔が大きく") ? "🔒 ほりゅう" : "🌐 公開"); await sleep(250);
    await click("✅ 登録する"); await sleep(500);
  }
  const t = await body();
  if (!t.includes("3点、アーカイブに登録できた")) failures.push("archive: bot did not complete: " + t.slice(0, 60).replace(/\n/g, "/"));
  else { await shot("result-archive"); await click("登録を終える"); await sleep(700); }
}

// wrapUp
for (let i = 0; i < 14; i++) {
  const t = await body();
  if (t.includes("まちの宝を1つふやした")) break;
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
  if (!t.includes("まちの宝を1つふやした")) failures.push("wrapUp not reached");
  else await shot("wrapup");
}

await b.close();
if (consoleErrors.length) { console.error("CONSOLE ERRORS:"); for (const e of [...new Set(consoleErrors)].slice(0, 8)) console.error("  " + e); }
if (failures.length) { console.error("FLOW FAILURES:"); for (const f of failures) console.error("  " + f); process.exit(1); }
console.log("library flow: all 3 games + wrapUp completed, no console errors");
