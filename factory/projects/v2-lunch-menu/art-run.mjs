#!/usr/bin/env node
// Sequential driver for the こんだてPLAY asset batch: art-loop (generate→QA→retry) then
// asset-postprocess (alpha/trim/master size). One run per request; art-loop holds a lock,
// so this must stay sequential. Log: factory/projects/v2-lunch-menu/art-run.log
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, appendFileSync, writeFileSync } from "node:fs";
const ROOT = new URL("../../../", import.meta.url).pathname;
const DIR = "factory/projects/v2-lunch-menu/art-requests";
const LOG = "factory/projects/v2-lunch-menu/art-run.log";
const RAW = "factory/state/art/generated/v2-lunch";
mkdirSync(`${ROOT}${RAW}`, { recursive: true });
const log = (m) => { const line = `[${new Date().toISOString()}] ${m}\n`; appendFileSync(`${ROOT}${LOG}`, line); process.stdout.write(line); };
const only = process.argv.slice(2);
const MASTER = { dish: [256, 256], tray: [768, 576], truck: [384, 256], school: [384, 256] };
const reqs = (only.length ? only : ["dish-rice", "dish-bread", "dish-salmon", "dish-karaage", "dish-croquette", "dish-gomaae", "dish-potato_salad", "dish-miso_soup", "dish-corn_soup", "dish-milk", "tray", "truck", "school"]);
const summary = [];
for (const name of reqs) {
  const req = JSON.parse(readFileSync(`${ROOT}${DIR}/${name}.json`, "utf8"));
  const kind = name.startsWith("dish-") ? "dish" : name;
  log(`=== ${name} (${req.asset_id}) ===`);
  const r = spawnSync("node", ["factory/harness/art/art-loop.mjs", "run", "--request", `${DIR}/${name}.json`], { cwd: ROOT, encoding: "utf8", timeout: 40 * 60 * 1000 });
  log(`art-loop exit=${r.status}\n${(r.stdout || "").slice(-1500)}\n${(r.stderr || "").slice(-600)}`);
  const out = req.output_path;
  if (!existsSync(`${ROOT}${out}`)) { log(`NO FILE for ${name}`); summary.push({ name, ok: false, reason: "no file" }); continue; }
  const [w, h] = MASTER[kind];
  const raw = `${RAW}/${req.filename.replace(/\.png$/, "")}.raw.png`;
  const p = spawnSync("python3", ["factory/harness/art/asset-postprocess.py", out, out, raw, String(w), String(h)], { cwd: ROOT, encoding: "utf8" });
  log(`postprocess exit=${p.status} ${(p.stdout || "").trim()} ${(p.stderr || "").slice(-300)}`);
  let pp = null; try { pp = JSON.parse((p.stdout || "").trim().split("\n").pop()); } catch {}
  summary.push({ name, ok: p.status === 0, loop_exit: r.status, post: pp });
  writeFileSync(`${ROOT}factory/projects/v2-lunch-menu/art-run.summary.json`, JSON.stringify(summary, null, 1));
}
log(`DONE ${summary.filter((s) => s.ok).length}/${summary.length}`);
