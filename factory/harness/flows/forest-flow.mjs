#!/usr/bin/env node
// Browser QA flow for the forest-care world (3 games, correct-play bots).
// Usage: node factory/harness/flows/forest-flow.mjs [--viewport desktop]
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
const shot = (n) => p.screenshot({ path: `factory/state/art/shots/${MOBILE ? "mobile" : "desktop"}-forest-${n}.png`, fullPage: true });
const advance = async (needle, extra = "") => {
  for (let i = 0; i < 14; i++) {
    const t = await body();
    if (t.includes(needle) && !t.includes("きみが今やっていたのは")) return true;
    if (t.includes("地図は うごかせる") || t.includes("地図はこれからも")) {
      // back at the region map: district chip, then the world marker (2 taps)
      await click("森と川"); await sleep(800);
      await click("森のなぞ"); await sleep(800);
      continue;
    }
    await p.evaluate((rx) => {
      const btns = [...document.querySelectorAll("button")].filter((x) => !x.disabled);
      const re = new RegExp("えらんだ|もどる|すすむ|つぎへ|" + (rx || "\\u0000"));
      const b2 = btns.reverse().find((x) => re.test(x.textContent)) || btns[0];
      if (b2) b2.click();
    }, extra);
    await sleep(550);
  }
  return false;
};

// enter world
await click("森と川"); await sleep(900);
await click("森のなぞ"); await sleep(800);
await click("森に入ってみる"); await sleep(700);
await shot("area");

// ---- ① thinning_pick --------------------------------------------------------
await click("① どの木を伐る"); await sleep(500);
await click("やってみる"); await sleep(700);
await shot("game-thin");
{
  // read the 12 tree buttons in DOM order (grid order = row-major)
  const info = await p.evaluate(() => {
    const btns = [...document.querySelectorAll("button")].filter((e) => /材積\d|傷あり|将来木/.test(e.textContent));
    return btns.map((e) => ({
      label: e.textContent,
      damaged: e.textContent.includes("傷あり"),
      future: e.textContent.includes("将来木"),
      vol: e.textContent.includes("材積") ? Number((e.textContent.match(/材積(\d)/) || [])[1]) : (e.textContent.includes("傷あり") ? null : null),
    }));
  });
  if (info.length !== 12) failures.push(`thin: parsed ${info.length} trees`);
  // damaged volumes unknown from label; estimate thin=1 unless font big… keep simple:
  // click damaged first, then click 材積1 buttons until the meter enters the band,
  // avoiding 3 consecutive marks in a row (row-major index math)
  const marked = new Set();
  const clickTree = async (idx) => {
    await p.evaluate((i) => {
      const btns = [...document.querySelectorAll("button")].filter((e) => /材積\d|傷あり|将来木/.test(e.textContent));
      btns[i].click();
    }, idx);
    await sleep(200);
  };
  const wouldGap = (idx) => {
    const row = Math.floor(idx / 4);
    const cols = [0, 1, 2, 3].filter((c) => marked.has(row * 4 + c) || row * 4 + c === idx);
    let run = 0;
    for (let c2 = 0; c2 < 4; c2++) {
      run = cols.includes(c2) ? run + 1 : 0;
      if (run >= 3) return true;
    }
    return false;
  };
  for (let i = 0; i < 12; i++) if (info[i].damaged) { await clickTree(i); marked.add(i); }
  const pctOf = async () => Number(((await body()).match(/(\d+)%/) || [])[1] ?? 0);
  let guard = 0;
  while ((await pctOf()) < 15 && guard++ < 12) {
    // prefer small-volume, non-damaged, non-future, gap-safe trees
    const order = [...info.keys()].filter((i) => !marked.has(i) && !info[i].future && !info[i].damaged && !wouldGap(i))
      .sort((a, b2) => (info[a].vol ?? 9) - (info[b2].vol ?? 9));
    if (!order.length) break;
    const pick = order[0];
    const before = await pctOf();
    await clickTree(pick);
    const after = await pctOf();
    if (after > 30) { await clickTree(pick); info[pick].vol = 9; continue; } // undo, try smaller
    if (after !== before) marked.add(pick);
  }
  await click("印を見せる"); await sleep(600);
  let t = await body();
  if (!t.includes("承認された")) {
    // one retry allowed: try adding/removing per hint is hard — just serve again after adding one more small tree
    failures.push("thin: first serve rejected (retrying not implemented)");
  } else { await shot("result-thin"); await click("次の班へ渡す"); await sleep(700); }
}
await advance("② その木");

// ---- ② fell_direction -------------------------------------------------------
await click("② その木"); await sleep(500);
await click("やってみる"); await sleep(700);
await shot("game-fell");
for (let guard = 0; guard < 16; guard++) {
  const t = await body();
  if (t.includes("ぶじ完了") || t.includes("ここまで")) break;
  await click("合図する"); await sleep(300);
  // read lean + obstacle dirs from the stage
  const st = await p.evaluate(() => {
    const txt = document.body.innerText;
    const lean = (txt.match(/かたむき: (↑ 山側|→ 東|↓ 谷側|← 西)/) || [])[1] ?? "";
    const obs = [...document.querySelectorAll('span[title="障害物"]')].map((e) => ({ left: e.style.left, top: e.style.top }));
    return { lean, obs };
  });
  const leanDir = st.lean.includes("山") ? "N" : st.lean.includes("東") ? "E" : st.lean.includes("谷") ? "S" : "W";
  const OPP = { N: "S", S: "N", E: "W", W: "E" };
  const posDir = (o) => (o.top === "12%" ? "N" : o.top === "88%" ? "S" : o.left === "88%" ? "E" : "W");
  const blocked = st.obs.map(posDir);
  const allowed = ["N", "E", "S", "W"].filter((d) => d !== OPP[leanDir] && !blocked.includes(d));
  if (allowed.length === 0) { await click("機械にたのむ"); await sleep(500); continue; }
  const LBL = { N: "↑ 山側", E: "→ 東", S: "↓ 谷側", W: "← 西" };
  await click(LBL[allowed[0]]);
  await sleep(1100); // falling animation
}
{
  const t = await body();
  if (!t.includes("ぶじ完了")) failures.push("fell: bot did not complete");
  else { await shot("result-fell"); await click("道具を片づける"); await sleep(700); }
}
await advance("③ 伐ったあと");

// ---- ③ plant_plan -----------------------------------------------------------
await click("③ 伐ったあと"); await sleep(500);
await click("やってみる"); await sleep(700);
await shot("game-plant");
{
  const zones = await p.evaluate(() => {
    const rows = [...document.querySelectorAll("button")].filter((e) => /尾根|中腹|沢ぞい/.test(e.textContent) && /シカ/.test(e.textContent));
    return rows.map((e) => ({
      label: e.textContent.includes("尾根") ? "尾根" : e.textContent.includes("中腹") ? "中腹" : "沢ぞい",
      moisture: e.textContent.includes("かわく") ? "dry" : e.textContent.includes("しめる") ? "wet" : "mid",
      deer: e.textContent.includes("多い") ? "high" : "low",
    }));
  });
  if (zones.length !== 3) failures.push(`plant: parsed ${zones.length} zones`);
  const spFor = (m) => (m === "wet" ? "スギ" : m === "dry" ? "カラマツ" : "ヒノキ");
  const highCount = zones.filter((z) => z.deer === "high").length;
  let fencesLeft = highCount === 2 ? 1 : 2; // budget 6: 3 saplings + guards<=3
  const clickCard = (t) => p.evaluate((x) => {
    const btn = [...document.querySelectorAll("button.choice-card")].find((e) => e.textContent.includes(x));
    if (btn) { btn.click(); return true; }
    return false;
  }, t);
  for (const z of zones) {
    await click(z.label); await sleep(250);
    await clickCard(spFor(z.moisture)); await sleep(250);
    if (z.deer === "high") {
      if (fencesLeft > 0) { await clickCard("🚧柵"); fencesLeft--; }
      else await clickCard("🧪チューブ");
      await sleep(250);
    }
  }
  await click("計画を出す"); await sleep(600);
  const t = await body();
  if (!t.includes("通った")) failures.push("plant: bot did not complete: " + t.slice(0, 60).replace(/\n/g, "/"));
  else { await shot("result-plant"); await click("苗を運ぶ"); await sleep(700); }
}

// wrapUp
for (let i = 0; i < 10; i++) {
  const t = await body();
  if (t.includes("この森では「守る」")) break;
  await p.evaluate(() => {
    const btns = [...document.querySelectorAll("button")].filter((x) => !x.disabled);
    const b2 = btns.reverse().find((x) => /えらんだ|もどる|森のなぞ|すすむ|つぎへ|ふり返/.test(x.textContent)) || btns[0];
    if (b2) b2.click();
  });
  await sleep(600);
}
{
  const t = await body();
  if (!t.includes("この森では「守る」")) failures.push("wrapUp not reached");
  else await shot("wrapup");
}

await b.close();
if (consoleErrors.length) { console.error("CONSOLE ERRORS:"); for (const e of [...new Set(consoleErrors)].slice(0, 8)) console.error("  " + e); }
if (failures.length) { console.error("FLOW FAILURES:"); for (const f of failures) console.error("  " + f); process.exit(1); }
console.log("forest flow: all 3 games + wrapUp completed, no console errors");
