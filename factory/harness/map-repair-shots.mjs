// Screenshot QA for the Home/World Map Human Visual Review repair (2026-09-04).
// Captures the states required by §12 of the directive:
//   initial map, after pan, district selected/discovered, event appeared,
//   visited state, undiscovered state — each at mobile 375px and desktop.
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = "factory/state/art/map-repair-shots";
mkdirSync(OUT, { recursive: true });
const BASE = "http://localhost:5177/jibun-choice-town/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const b = await puppeteer.launch({ executablePath: CHROME, headless: "new" });

async function run(viewport, tag) {
  const p = await b.newPage();
  await p.setViewport(viewport);
  await p.goto(BASE, { waitUntil: "networkidle2" });
  await p.evaluate(() => localStorage.clear());
  await p.reload({ waitUntil: "networkidle2" });
  await sleep(1500); // let the intro pan-sweep settle

  // 1. initial map
  await p.screenshot({ path: `${OUT}/${tag}-01-initial.png` });

  // 2. after pan (drag on the region viewport)
  const vp = await p.evaluate(() => {
    const el = document.querySelector(".region-viewport");
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  await p.mouse.move(vp.x + vp.w * 0.75, vp.y + vp.h * 0.5);
  await p.mouse.down();
  await p.mouse.move(vp.x + vp.w * 0.3, vp.y + vp.h * 0.5, { steps: 12 });
  await p.mouse.up();
  await sleep(500);
  await p.screenshot({ path: `${OUT}/${tag}-02-after-pan.png` });

  // reset pan by reloading (cleanest state for the next captures)
  await p.evaluate(() => localStorage.clear());
  await p.reload({ waitUntil: "networkidle2" });
  await sleep(1500);

  // 3. undiscovered state (fog district) — tap it, capture the teaser toast
  const fogClicked = await p.evaluate(() => {
    const btn = [...document.querySelectorAll(".district-node.foggy")][0];
    if (btn) { btn.click(); return true; }
    return false;
  });
  await sleep(400);
  await p.screenshot({ path: `${OUT}/${tag}-03-undiscovered-fog.png` });

  // 4. district selected/discovered (zoom into a real district)
  await p.evaluate(() => {
    const btn = [...document.querySelectorAll(".district-node")].find((b) => !b.className.includes("foggy"));
    if (btn) btn.click();
  });
  await sleep(700); // camera zoom transition
  await p.screenshot({ path: `${OUT}/${tag}-04-district-selected.png` });

  // 5. event appeared (world marker visible inside the focused district)
  // (same shot context — markers are visible once focused; capture close-up)
  await p.screenshot({ path: `${OUT}/${tag}-05-event-markers.png` });

  // 6. visited state — enter one world's area screen then return home
  const entered = await p.evaluate(() => {
    const btn = [...document.querySelectorAll(".world-marker")][0];
    if (btn) { btn.click(); return true; }
    return false;
  });
  await sleep(1200); // enter-timer navigates after 680ms
  await p.screenshot({ path: `${OUT}/${tag}-06-entered-world-area.png` });
  // go back home via browser history is not wired; use the in-app back if present
  await p.evaluate(() => {
    const back = [...document.querySelectorAll("button")].find((b) => /もどる|地域全体|ホーム/.test(b.textContent));
    if (back) back.click();
  });
  await sleep(700);
  await p.screenshot({ path: `${OUT}/${tag}-07-return-to-map-visited-state.png` });

  await p.close();
  return { fogClicked, entered };
}

const mobile = await run({ width: 375, height: 812 }, "mobile");
const desktop = await run({ width: 1280, height: 900 }, "desktop");
console.log(JSON.stringify({ mobile, desktop }, null, 1));
await b.close();
