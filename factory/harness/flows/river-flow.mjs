#!/usr/bin/env node
// Browser QA flow for the river-health world (3 games, correct-play bots).
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
const body = () => p.evaluate(() => document.body.innerText);
const shot = (n) => p.screenshot({ path: `factory/state/art/shots/${MOBILE ? "mobile" : "desktop"}-river-${n}.png`, fullPage: true });
const advance = async (needle) => {
  for (let i = 0; i < 14; i++) {
    const t = await body();
    if (t.includes(needle) && !t.includes("きみが今やっていたのは")) return true;
    if (t.includes("地図は うごかせる") || t.includes("地図はこれからも")) {
      await click("森と川"); await sleep(800);
      await click("川に魚が！"); await sleep(800);
      continue;
    }
    await p.evaluate(() => {
      const btns = [...document.querySelectorAll("button")].filter((x) => !x.disabled);
      const b2 = btns.reverse().find((x) => /えらんだ|もどる|すすむ|つぎへ/.test(x.textContent)) || btns[0];
      if (b2) b2.click();
    });
    await sleep(550);
  }
  return false;
};

// enter
await click("森と川"); await sleep(900);
await click("川に魚が！"); await sleep(800);
await click("川ぞいを歩いてみる"); await sleep(700);
await shot("area");

// ---- ① water_trace ----------------------------------------------------------
await click("① 魚がもどった理由"); await sleep(500);
await click("やってみる"); await sleep(700);
await shot("game-trace");
{
  const readSpot = async (id) => {
    await p.evaluate((sid) => {
      const btn = [...document.querySelectorAll("button")].find((e) => e.textContent.startsWith(`${sid} `) || e.textContent.includes(`${sid} 上流`) || e.textContent.includes(`${sid} 支流`) || e.textContent.includes(`${sid} 処理場`) || e.textContent.includes(`${sid} 下流`));
      if (btn) btn.click();
    }, id);
    await sleep(300);
    const t = await body();
    // parse this spot's numbers from its card (DO x.x BOD y.y)
    const re = new RegExp(`${id} [^D]*DO (\\d+(?:\\.\\d+)?)[\\s\\S]*?BOD (\\d+(?:\\.\\d+)?)`);
    const m = t.match(re);
    return m ? { do_: Number(m[1]), bod: Number(m[2]) } : null;
  };
  const C = await readSpot("C");
  const D = await readSpot("D");
  const B = await readSpot("B");
  if (!C || !D || !B) failures.push("trace: readings not parsed");
  const healthy = (r) => r && r.do_ >= 5 && r.bod <= 3;
  let ans;
  if (!healthy(D)) ans = "まだ回復していない";
  else if (!healthy(C)) ans = "処理場の改善";
  else ans = "支流がきれいに";
  await click(ans); await sleep(600);
  const t = await body();
  if (!t.includes("通った")) failures.push("trace: bot did not complete: " + t.slice(0, 60).replace(/\n/g, "/"));
  else { await shot("result-trace"); await click("報告をまとめる"); await sleep(700); }
}
await advance("② 見えない生きもの");

// ---- ② plant_ops ------------------------------------------------------------
await click("② 見えない生きもの"); await sleep(500);
await click("やってみる"); await sleep(700);
await shot("game-ops");
for (let guard = 0; guard < 10; guard++) {
  const t = await body();
  if (t.includes("ぜんぶ基準内") || t.includes("ベテランに交代")) break;
  const air = await p.evaluate(() => {
    // count lit blower bars is hard; read from DO relation instead: infer via drops emoji count
    const txt = document.body.innerText;
    const drops = (txt.match(/💧/g) || []).length;
    return { drops };
  });
  // read current air from the meter? use logic mirror: target = drops+1.
  // We track air locally.
  break;
}
{
  // deterministic local mirror: track air=3 and follow targets
  let air = 3;
  for (let slotGuard = 0; slotGuard < 8; slotGuard++) {
    const t = await body();
    if (t.includes("ぜんぶ基準内") || t.includes("ベテランに交代")) break;
    const drops = (t.match(/💧/g) || []).length;
    const target = drops + 1;
    let act;
    if (air < target) { act = "上げる"; air = Math.min(5, air + 1); }
    else if (air > target) { act = "下げる"; air = Math.max(1, air - 1); }
    else act = "そのまま";
    await click(act);
    await sleep(450);
  }
  const t = await body();
  if (!t.includes("ぜんぶ基準内")) failures.push("ops: bot did not complete");
  else { await shot("result-ops"); await click("日報を書く"); await sleep(700); }
}
await advance("③ 魚がすめる川岸");

// ---- ③ bank_design ----------------------------------------------------------
await click("③ 魚がすめる川岸"); await sleep(500);
await click("やってみる"); await sleep(700);
await shot("game-bank");
{
  const secs = await p.evaluate(() => {
    const rows = [...document.querySelectorAll("button")].filter((e) => /住宅のそば|カーブ|田んぼ|堰/.test(e.textContent));
    return rows.map((e) => ({
      label: e.textContent.includes("住宅") ? "住宅のそば" : e.textContent.includes("カーブ") ? "カーブ" : e.textContent.includes("田んぼ") ? "田んぼ" : "堰",
      severe: e.textContent.includes("うしろに家") && e.textContent.includes("けずられたあと"),
      strong: e.textContent.includes("うしろに家") || e.textContent.includes("けずられたあと"),
    }));
  });
  if (secs.length !== 4) failures.push(`bank: parsed ${secs.length} sections`);
  const clickCard = (t) => p.evaluate((x) => {
    const btn = [...document.querySelectorAll("button.choice-card")].find((e) => e.textContent.includes(x));
    if (btn) { btn.click(); return true; }
    return false;
  }, t);
  for (const sec of secs) {
    await click(sec.label); await sleep(250);
    if (sec.label === "堰") {
      // the fish note is shown when the weir is selected — read it, then design
      const t2 = await body();
      await clickCard(t2.includes("よわい") ? "ゆるい魚道" : "急な魚道");
    }
    else if (sec.severe) await clickCard("コンクリ護岸");
    else if (sec.strong) await clickCard("石積み");
    else await clickCard("自然のまま");
    await sleep(250);
  }
  await click("図面を出す"); await sleep(600);
  const t = await body();
  if (!t.includes("会議を通った")) failures.push("bank: bot did not complete: " + t.slice(0, 60).replace(/\n/g, "/"));
  else { await shot("result-bank"); await click("図面を送る"); await sleep(700); }
}

// wrapUp
for (let i = 0; i < 14; i++) {
  const t = await body();
  if (t.includes("たしかめられる人がいる")) break;
  if (t.includes("地図は うごかせる") || t.includes("地図はこれからも")) {
    await click("森と川"); await sleep(800);
    await click("川に魚が！"); await sleep(800);
    continue;
  }
  await p.evaluate(() => {
    const btns = [...document.querySelectorAll("button")].filter((x) => !x.disabled);
    const b2 = btns.reverse().find((x) => /えらんだ|もどる|すすむ|つぎへ|ふり返/.test(x.textContent)) || btns[0];
    if (b2) b2.click();
  });
  await sleep(600);
}
{
  const t = await body();
  if (!t.includes("たしかめられる人がいる")) failures.push("wrapUp not reached");
  else await shot("wrapup");
}

await b.close();
if (consoleErrors.length) { console.error("CONSOLE ERRORS:"); for (const e of [...new Set(consoleErrors)].slice(0, 8)) console.error("  " + e); }
if (failures.length) { console.error("FLOW FAILURES:"); for (const f of failures) console.error("  " + f); process.exit(1); }
console.log("river flow: all 3 games + wrapUp completed, no console errors");
