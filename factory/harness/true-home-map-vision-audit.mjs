#!/usr/bin/env node
// Independent Codex adversarial review of the 2026-09-04 True Home + Mobile
// Map Simplification (screenshot-based, since codex-review.mjs has no image
// attachment support).
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, copyFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ROOT = process.cwd();
const SAFE_ENV = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/OPENAI|AZURE_OPENAI|ANTHROPIC/i.test(k)));
const prompt = readFileSync("factory/harness/true-home-map-review-prompt.md", "utf8");
// IMPORTANT (factory/state/backlog/factory-harness-backlog.md:
// codex-vision-review-path-caching-bug): re-running this against the SAME
// screenshot file paths with genuinely different image content has been
// observed to return a byte-identical response to the previous run. Copy
// fresh screenshots to a NEW directory name each round rather than
// overwriting the same paths in place.
const D = "factory/state/expansion/mobile-map-shots-final";
const shots = [
  `${D}/mobile-01-true-home.png`,
  `${D}/mobile-02-map-overview.png`,
  `${D}/mobile-03-map-district-focus.png`,
  `${D}/desktop-01-true-home.png`,
  `${D}/desktop-02-map-overview.png`,
  `${D}/desktop-03-map-district-focus.png`,
];
const replyFile = join(mkdtempSync(join(tmpdir(), "jc-homemap-")), "reply.txt");
const cargs = ["exec", "--sandbox", "read-only", "--cd", ROOT, "--skip-git-repo-check", "--output-last-message", replyFile];
for (const f of shots) cargs.push("-i", resolve(ROOT, f));
cargs.push("-");
const r = spawnSync("codex", cargs, { input: prompt, encoding: "utf8", timeout: 600000, env: SAFE_ENV });
let result;
// always preserve the full raw reply on disk — a fixed-size slice previously
// lost data when the reply was long but still not valid JSON (factory/state/
// backlog/factory-harness-backlog.md: codex-review-malformed-truncation)
let fullReplyPath = null;
try {
  fullReplyPath = "factory/state/expansion/true-home-map-codex-raw-reply.txt";
  copyFileSync(replyFile, fullReplyPath);
} catch { /* best-effort */ }
if (r.status !== 0) {
  result = { ok: false, status: "CODEX_ERROR", error: `exit ${r.status}: ${(r.stderr || "").slice(-600)}`, fullReplyPath };
} else {
  let raw = "";
  try { raw = readFileSync(replyFile, "utf8"); } catch {}
  const start = raw.indexOf("{");
  let parsed = null;
  if (start >= 0) for (let end = raw.length; end > start; end--) { try { parsed = JSON.parse(raw.slice(start, end)); break; } catch {} }
  result = parsed ? { ok: true, verdict: parsed } : { ok: false, status: "CODEX_MALFORMED", raw: raw.slice(0, 20000), fullReplyPath };
}
writeFileSync("factory/state/expansion/true-home-map-codex-review-final.json", JSON.stringify(result, null, 1));
console.log(JSON.stringify({ status: result.status || "OK" }));
process.exit(result.ok ? 0 : 1);
