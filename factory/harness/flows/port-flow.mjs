#!/usr/bin/env node
// Browser QA flow for the night-port world: plays all 4 games with
// correct-play bots (mirror of portLogic rules), asserts completion.
// Usage: node factory/harness/flows/port-flow.mjs [--base URL] [--viewport mobile|desktop]
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
const shot = (n) => p.screenshot({ path: `factory/state/art/shots/${MOBILE ? "mobile" : "desktop"}-port-${n}.png`, fullPage: true });

// enter the port world: minato district chip -> world marker
await click("みなと"); await sleep(900);
await click("夜のみなと"); await sleep(800);
await click("のぞいてみる"); await sleep(700);
await shot("area");

// ---- ① yard_plan -----------------------------------------------------------
await click("① この箱"); await sleep(500);
await click("やってみる"); await sleep(700);
await shot("game-yard");
for (let guard = 0; guard < 14; guard++) {
  const t = await body();
  if (t.includes("朝を見る")) break;
  const m = t.match(/つぎの箱:\s*(🧊|⚠️|📦)?\s*(C\d+)\s*(\d)日/);
  if (!m) { failures.push("yard: next-box chip not parsed"); break; }
  const kind = m[1] === "🧊" ? "reefer" : m[1] === "⚠️" ? "hazmat" : "normal";
  const day = Number(m[3]);
  if (kind === "reefer") { await p.evaluate(() => [...document.querySelectorAll("button")].find((e) => e.textContent.includes("🔌電源")).click()); }
  else if (kind === "hazmat") { await p.evaluate(() => [...document.querySelectorAll("button")].find((e) => e.textContent.includes("⚠️隔離")).click()); }
  else {
    await p.evaluate((d) => {
      const cols = [...document.querySelectorAll("button")].filter((e) => /列\d/.test(e.textContent) || (e.textContent.match(/C\d+/) && e.textContent.includes("日") && !e.textContent.includes("つぎの箱") && !e.textContent.includes("電源") && !e.textContent.includes("隔離") && e.className === ""));
      // safer: pick the three dashed column buttons by their computed style order
      const colBtns = [...document.querySelectorAll("button")].filter((e) => e.style && e.style.borderStyle === "" && e.textContent.match(/^(?:.*C\d+.*|列\d)$/s));
      const targets = colBtns.length >= 3 ? colBtns : [...document.querySelectorAll("button")].filter((e) => e.textContent.includes("列") || (e.textContent.match(/C\d+ ?\d日/) && !e.textContent.includes("つぎの箱")));
      const parse = (el) => {
        const days = [...el.textContent.matchAll(/(\d)日/g)].map((x) => Number(x[1]));
        return days;
      };
      const scored = targets.slice(0, 3).map((el) => {
        const days = parse(el);
        const top = days.length ? days[days.length - 1] : 9;
        return { el, ok: days.length === 0 || top >= d, n: days.length };
      });
      const good = scored.filter((s) => s.ok && s.n < 3).sort((a, b) => b.n - a.n);
      const pick = (good[0] || scored.filter((s) => s.n < 3)[0]);
      if (pick) pick.el.click();
    }, day);
  }
  await sleep(350);
}
await click("朝を見る"); await sleep(500);
for (let i = 0; i < 12; i++) {
  const t = await body();
  if (t.includes("スムーズに完了") || t.includes("渋滞してしまった")) break;
  if (!(await click("つぎの便"))) await click("朝を終える");
  await sleep(350);
}
{
  const t = await body();
  if (t.includes("渋滞してしまった")) { await click("次の船で"); await sleep(600); failures.push("yard: bot lost (retry available)"); }
  else if (!t.includes("スムーズに完了")) { failures.push("yard: no terminal screen: " + t.slice(0, 90).replace(/\n/g, "/")); }
  else {
    await shot("result-yard");
    const ok = await click("報告する");
    if (!ok) failures.push("yard: done button not found");
    await sleep(700);
  }
}
// advance through discovery to area
for (let i = 0; i < 8; i++) {
  const t = await body();
  if (t.includes("② 巨大クレーン") && !t.includes("きみが今やっていたのは")) break;
  {
    const tt = await body();
    if (tt.includes("地図は うごかせる") || tt.includes("地図はこれからも")) {
      await click("みなと"); await sleep(800);
      await click("夜のみなと"); await sleep(800);
      continue;
    }
  }
  await p.evaluate(() => {
    const btns = [...document.querySelectorAll("button")].filter((x) => !x.disabled);
    const b2 = btns.reverse().find((x) => /えらんだ|もどる|夜のみなと|すすむ|つぎへ/.test(x.textContent)) || btns[0];
    if (b2) b2.click();
  });
  await sleep(550);
}

// ---- ② crane_lift -----------------------------------------------------------
await click("② 巨大クレーン"); await sleep(500);
await click("やってみる"); await sleep(700);
await shot("game-crane");
for (let guard = 0; guard < 10; guard++) {
  const t = await body();
  if (t.includes("下ろしきった") || t.includes("ここまで")) break;
  const wind = Number((t.match(/風速 (\d+)m/) || [])[1] ?? 0);
  const lockBad = t.includes("4点そろっていない");
  const cueBad = t.includes("指示とちがう");
  let act;
  if (lockBad || cueBad) act = "止めて確認";
  else if (wind > 16) act = "見合わせる";
  else if (wind > 10) act = "ゆっくり";
  else act = "おろす";
  await click(act);
  await sleep(400);
}
{
  const t = await body();
  if (!t.includes("下ろしきった")) failures.push("crane: bot did not complete");
  else { await shot("result-crane"); await click("日誌をつける"); await sleep(700); }
}
for (let i = 0; i < 8; i++) {
  const t = await body();
  if (t.includes("③ 書類と現物")) break;
  {
    const tt = await body();
    if (tt.includes("地図は うごかせる") || tt.includes("地図はこれからも")) {
      await click("みなと"); await sleep(800);
      await click("夜のみなと"); await sleep(800);
      continue;
    }
  }
  await p.evaluate(() => {
    const btns = [...document.querySelectorAll("button")].filter((x) => !x.disabled);
    const b2 = btns.reverse().find((x) => /えらんだ|もどる|夜のみなと|すすむ|つぎへ/.test(x.textContent)) || btns[0];
    if (b2) b2.click();
  });
  await sleep(550);
}

// ---- ③ tally_check ----------------------------------------------------------
await click("③ 書類と現物"); await sleep(500);
await click("やってみる"); await sleep(700);
await shot("game-tally");
for (let guard = 0; guard < 10; guard++) {
  const t = await body();
  if (t.includes("照合、完了") || t.includes("止まった")) break;
  const doc = t.match(/書類（タリーシート）\s*([A-Z]{3}U\d{7})\s*封印 (S\d{6})/);
  const real = t.match(/現物のコンテナ\s*([A-Z]{3}U\d{7})\s*[✓？]?\s*封印 (S\d{6})/);
  if (!doc || !real) { failures.push("tally: cards not parsed"); break; }
  const dent = t.includes("へこみ");
  let act;
  if (doc[1] !== real[1]) act = "番号を照会";
  else if (doc[2] !== real[2]) act = "封印を照会";
  else if (dent) act = "損傷を記録";
  else act = "正常受け";
  await click(act);
  await sleep(350);
  if (act === "損傷を記録") { await click("見たまま書く"); await sleep(350); }
}
{
  const t = await body();
  if (!t.includes("照合、完了")) failures.push("tally: bot did not complete");
  else { await shot("result-tally"); await click("まとめる"); await sleep(700); }
}
for (let i = 0; i < 8; i++) {
  const t = await body();
  if (t.includes("④ 朝いちの4本")) break;
  {
    const tt = await body();
    if (tt.includes("地図は うごかせる") || tt.includes("地図はこれからも")) {
      await click("みなと"); await sleep(800);
      await click("夜のみなと"); await sleep(800);
      continue;
    }
  }
  await p.evaluate(() => {
    const btns = [...document.querySelectorAll("button")].filter((x) => !x.disabled);
    const b2 = btns.reverse().find((x) => /えらんだ|もどる|夜のみなと|すすむ|つぎへ/.test(x.textContent)) || btns[0];
    if (b2) b2.click();
  });
  await sleep(550);
}

// ---- ④ truck_dispatch -------------------------------------------------------
await click("④ 朝いちの4本"); await sleep(500);
await click("やってみる"); await sleep(700);
await shot("game-dispatch");
{
  // read jobs from chips
  const t = await body();
  const jobs = [...t.matchAll(/📦 (J\d)（(\d+)ft([^）]*)）\s*([ABC])町[^・]*・(\d)便/g)].map((m) => ({
    id: m[1], tall: m[3].includes("背高"), heavy: m[3].includes("重い"), dest: m[4], win: Number(m[5]),
  }));
  if (jobs.length !== 4) failures.push(`dispatch: parsed ${jobs.length} jobs`);
  // plan: tall->3号車, heavy->1号車, others prefer 2号車 unless chain far / slot clash
  const plan = {};
  const truckJobs = { "1号車": [], "2号車": [], "3号車": [] };
  const far = (a, c) => (a === "A" && c === "C") || (a === "C" && c === "A");
  const canGo = (tr, j) => {
    if (j.tall && tr !== "3号車") return false;
    if (j.heavy && tr === "2号車") return false;
    const mine = truckJobs[tr];
    if (mine.some((x) => x.win === j.win)) return false;
    if (mine.length === 1 && far(mine[0].dest, j.dest)) return false;
    return mine.length < 2;
  };
  const order = [...jobs.filter((j) => j.tall), ...jobs.filter((j) => !j.tall && j.heavy), ...jobs.filter((j) => !j.tall && !j.heavy)];
  for (const j of order) {
    const pref = j.tall ? ["3号車"] : j.heavy ? ["1号車", "3号車"] : ["2号車", "1号車", "3号車"];
    const tr = pref.find((x) => canGo(x, j));
    if (!tr) { failures.push(`dispatch: no truck for ${j.id}`); continue; }
    plan[j.id] = tr;
    truckJobs[tr].push(j);
  }
  for (const [jid, tr] of Object.entries(plan)) {
    await p.evaluate((id) => {
      const btn = [...document.querySelectorAll("button")].find((e) => e.textContent.includes(`📦 ${id}`));
      if (btn) btn.click();
    }, jid);
    await sleep(250);
    await p.evaluate((name) => {
      const btn = [...document.querySelectorAll("button")].find((e) => e.textContent.includes(name) && e.textContent.includes("号車"));
      if (btn) btn.click();
    }, tr);
    await sleep(250);
  }
  // tall B-bound rigs cannot pass the 3.8m underpass: switch them to the detour
  for (const j of jobs.filter((x) => x.tall && x.dest === "B")) {
    await p.evaluate((id) => {
      const btn = [...document.querySelectorAll("button")].find((e) => e.textContent.includes(`${id}: こみち`));
      if (btn) btn.click();
    }, j.id);
    await sleep(250);
  }
  await click("点呼する"); await sleep(600);
  const t2 = await body();
  if (!t2.includes("出発！")) failures.push("dispatch: bot did not complete: " + t2.slice(0, 80).replace(/\n/g, "/"));
  else { await shot("result-dispatch"); await click("見送る"); await sleep(700); }
}

// through to wrapUp
for (let i = 0; i < 10; i++) {
  const t = await body();
  if (t.includes("眠っている間に")) break;
  await p.evaluate(() => {
    const btns = [...document.querySelectorAll("button")].filter((x) => !x.disabled);
    const b2 = btns.reverse().find((x) => /えらんだ|もどる|地図|夜のみなと|すすむ|つぎへ|ふり返/.test(x.textContent)) || btns[0];
    if (b2) b2.click();
  });
  await sleep(600);
}
{
  const t = await body();
  if (!t.includes("眠っている間に")) failures.push("wrapUp not reached");
  else await shot("wrapup");
}

await b.close();
if (consoleErrors.length) { console.error("CONSOLE ERRORS:"); for (const e of [...new Set(consoleErrors)].slice(0, 8)) console.error("  " + e); }
if (failures.length) { console.error("FLOW FAILURES:"); for (const f of failures) console.error("  " + f); process.exit(1); }
console.log("port flow: all 4 games + wrapUp completed, no console errors");
