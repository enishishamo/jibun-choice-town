#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ROOT = process.cwd();
const SAFE_ENV = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/OPENAI|AZURE_OPENAI|ANTHROPIC/i.test(k)));
const prompt = readFileSync("factory/harness/language-in-context-qa-prompt.md", "utf8");
const D = "factory/state/language-audit";
const shots = [
  `${D}/mobile-01-initial.png`.replace(D, "factory/state/art/map-repair-shots"),
  `${D}/desktop-01-initial.png`.replace(D, "factory/state/art/map-repair-shots"),
  `${D}/mobile-event-intro.png`,
  `${D}/mobile-q1-instruction.png`,
  `${D}/mobile-q1-c-info.png`,
  `${D}/mobile-failure-retry.png`,
  `${D}/mobile-career-doctor.png`,
  `${D}/desktop-career-doctor.png`,
  `${D}/mobile-career-forest.png`,
];
const replyFile = join(mkdtempSync(join(tmpdir(), "jc-langqa-")), "reply.txt");
const cargs = ["exec", "--sandbox", "read-only", "--cd", ROOT, "--skip-git-repo-check", "--output-last-message", replyFile];
for (const f of shots) cargs.push("-i", resolve(ROOT, f));
cargs.push("-");
const r = spawnSync("codex", cargs, { input: prompt, encoding: "utf8", timeout: 600000, env: SAFE_ENV });
let result;
if (r.status !== 0) {
  result = { ok: false, status: "CODEX_ERROR", error: `exit ${r.status}: ${(r.stderr || "").slice(-600)}` };
} else {
  let raw = "";
  try { raw = readFileSync(replyFile, "utf8"); } catch {}
  const start = raw.indexOf("{");
  let parsed = null;
  if (start >= 0) for (let end = raw.length; end > start; end--) { try { parsed = JSON.parse(raw.slice(start, end)); break; } catch {} }
  result = parsed ? { ok: true, verdict: parsed } : { ok: false, status: "CODEX_MALFORMED", raw: raw.slice(0, 3000) };
}
writeFileSync("factory/state/language-audit/language-in-context-qa-result.json", JSON.stringify(result, null, 1));
console.log(JSON.stringify({ status: result.status || "OK" }));
process.exit(result.ok ? 0 : 1);
