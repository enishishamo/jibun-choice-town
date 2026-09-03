#!/usr/bin/env node
// §12 contact sheet for the Home/World Map Human Visual Review repair
// (2026-09-04, final state). Thumbnails via macOS `sips`.
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";

const DIR = "factory/state/art/map-repair-shots";
const THUMBS = `${DIR}/.thumbs`;
mkdirSync(THUMBS, { recursive: true });

const files = readdirSync(DIR)
  .filter((f) => f.endsWith(".png") && !f.includes("-v2"))
  .sort();

for (const f of files) {
  execFileSync("sips", ["-Z", "260", `${DIR}/${f}`, "--out", `${THUMBS}/${f}`], { stdio: "ignore" });
}

const groups = {
  "Final state — full state sequence (§12)": files.filter((f) => /^(mobile|desktop)-0[1-7]-/.test(f)),
  "Mobile interaction bot (pan/tap/discover/enter/return/discover-another, §11)": files.filter((f) => f.startsWith("mobile-qa-")),
};

let html = `<!doctype html><html><head><meta charset="utf-8"><title>Map Repair Contact Sheet</title>
<style>body{font-family:sans-serif;background:#f6f1e3;margin:0;padding:20px;}
h2{margin-top:32px;border-bottom:2px solid #d8c9a8;padding-bottom:6px;}
.grid{display:flex;flex-wrap:wrap;gap:10px;}
.item{width:270px;background:#fff;border:1px solid #ddd;border-radius:8px;padding:6px;}
.item img{width:100%;border-radius:4px;}
.item p{font-size:11px;margin:4px 0 0;word-break:break-all;color:#555;}
</style></head><body>
<h1>Home/World Map Human Visual Review — Repair Contact Sheet (2026-09-04)</h1>
`;
for (const [title, list] of Object.entries(groups)) {
  html += `<h2>${title} (${list.length})</h2><div class="grid">`;
  for (const f of list) {
    html += `<div class="item"><img src=".thumbs/${f}"><p>${f}</p></div>`;
  }
  html += `</div>`;
}
html += `</body></html>`;
writeFileSync(`${DIR}/contact-sheet.html`, html);
console.log(JSON.stringify({ total: files.length, groups: Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.length])) }, null, 1));
