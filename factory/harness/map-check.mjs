import puppeteer from "puppeteer-core";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const b = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
const p = await b.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(String(e).slice(0,120)));
for (const [w,h,name] of [[375,812,"mobile"],[1280,900,"desktop"]]) {
  await p.setViewport({ width: w, height: h });
  await p.goto("http://localhost:5177/jibun-choice-town/", { waitUntil: "networkidle2" });
  await p.evaluate(() => localStorage.clear());
  await p.reload({ waitUntil: "networkidle2" });
  await new Promise(r=>setTimeout(r,1800));
  const info = await p.evaluate(() => {
    const markers = [...document.querySelectorAll(".world-marker")];
    const canvas = document.querySelector(".region-canvas");
    const rects = markers.map((m) => { const r = m.getBoundingClientRect(); return { t: m.textContent.slice(0,10), x: r.x, y: r.y, w: r.width, h: r.height }; });
    // overlap check
    let overlaps = 0;
    for (let i=0;i<rects.length;i++) for (let j=i+1;j<rects.length;j++) {
      const a=rects[i], c=rects[j];
      const ox = Math.max(0, Math.min(a.x+a.w,c.x+c.w)-Math.max(a.x,c.x));
      const oy = Math.max(0, Math.min(a.y+a.h,c.y+c.h)-Math.max(a.y,c.y));
      if (ox>8 && oy>8) overlaps++;
    }
    const pairs=[];
    for (let i=0;i<rects.length;i++) for (let j=i+1;j<rects.length;j++) {
      const a=rects[i], c=rects[j];
      const ox = Math.max(0, Math.min(a.x+a.w,c.x+c.w)-Math.max(a.x,c.x));
      const oy = Math.max(0, Math.min(a.y+a.h,c.y+c.h)-Math.max(a.y,c.y));
      if (ox>8 && oy>8) pairs.push(a.t+"|"+c.t+" ox"+Math.round(ox)+" oy"+Math.round(oy));
    }
    return { count: markers.length, overlaps, pairs, chips: document.querySelectorAll(".district-chips button").length };
  });
  console.log(name, JSON.stringify(info));
  await p.screenshot({ path: `factory/state/art/shots/${name}-region-14worlds.png` });
}
console.log("pageerrors:", errs.length);
await b.close();
