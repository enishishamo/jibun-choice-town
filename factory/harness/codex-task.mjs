#!/usr/bin/env node
// Generic Codex delegation runner (token-saving routing: bulk analysis,
// structured extraction, repo-wide scans go to Codex instead of burning the
// Claude context). Same subscription-only transport as codex-review.mjs but
// WITHOUT the verdict schema — returns the raw final message, optionally
// validated as JSON. Never falls back to a paid provider.
//
// Usage:
//   node factory/harness/codex-task.mjs --prompt-file <path> [--timeout-sec 900]
//     [--out <file>] [--expect-json] [--label <name>]
//
// stdout JSON: { ok, status, output?|json?, error?, elapsed_sec }
// status: OK | CODEX_UNAVAILABLE | CODEX_UNAUTHENTICATED | CODEX_TIMEOUT
//       | CODEX_MALFORMED | CODEX_ERROR
// Every invocation is appended to factory/state/routing-log.jsonl.

import { spawn, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, appendFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HARNESS = dirname(fileURLToPath(import.meta.url));
const ROUTING_LOG = join(HARNESS, "..", "state", "routing-log.jsonl");

const args = process.argv.slice(2);
function argOf(name, dflt) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : dflt;
}
const promptFile = argOf("--prompt-file");
const timeoutSec = Number(argOf("--timeout-sec", "900"));
const outFile = argOf("--out");
const expectJson = args.includes("--expect-json");
const label = argOf("--label", "task");
if (!promptFile) {
  console.error("Missing --prompt-file");
  process.exit(2);
}

const startedAt = new Date().toISOString();
function emit(result) {
  appendFileSync(
    ROUTING_LOG,
    JSON.stringify({
      at: startedAt,
      agent: "codex",
      kind: "delegated-task",
      label,
      promptFile,
      status: result.status,
      elapsed_sec: result.elapsed_sec,
    }) + "\n",
  );
  if (outFile) writeFileSync(outFile, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ ...result, output: result.output ? `(${result.output.length} chars, see --out)` : undefined, json: result.json ? "(parsed, see --out)" : undefined }));
  process.exit(result.ok ? 0 : 1);
}

// Cost safety: the subscription-only boundary is enforced mechanically in EVERY
// codex transport — strip provider API keys so no key-based path can be taken.
const SAFE_ENV = { ...process.env };
for (const k of Object.keys(SAFE_ENV)) if (/^(OPENAI|AZURE_OPENAI|ANTHROPIC)_/i.test(k)) delete SAFE_ENV[k];
const which = spawnSync("codex", ["--version"], { encoding: "utf8", env: SAFE_ENV });
if (which.error || which.status !== 0) emit({ ok: false, status: "CODEX_UNAVAILABLE", error: "codex CLI not found", elapsed_sec: 0 });
const auth = spawnSync("codex", ["login", "status"], { encoding: "utf8", env: SAFE_ENV });
if (auth.status !== 0) emit({ ok: false, status: "CODEX_UNAUTHENTICATED", error: "run `codex login` (ChatGPT OAuth)", elapsed_sec: 0 });

const prompt = readFileSync(promptFile, "utf8");

function runOnce(p) {
  return new Promise((resolve) => {
    const dir = mkdtempSync(join(tmpdir(), "jc-codex-task-"));
    const lastMsgFile = join(dir, "last.txt");
    const started = Date.now();
    const child = spawn(
      "codex",
      ["exec", "--sandbox", "read-only", "--cd", process.cwd(), "--skip-git-repo-check", "--output-last-message", lastMsgFile, "-"],
      { stdio: ["pipe", "pipe", "pipe"], detached: true, env: SAFE_ENV },
    );
    let stderr = "";
    let settled = false;
    const killGroup = (sig) => {
      try { process.kill(-child.pid, sig); } catch { try { child.kill(sig); } catch { /* gone */ } }
    };
    const timer = setTimeout(() => {
      killGroup("SIGTERM");
      setTimeout(() => killGroup("SIGKILL"), 5000);
      setTimeout(() => {
        if (!settled) { settled = true; resolve({ kind: "timeout", elapsed: (Date.now() - started) / 1000 }); }
      }, 10000);
    }, timeoutSec * 1000);
    child.stderr.on("data", (d) => (stderr += d));
    child.stdout.on("data", () => {});
    child.on("error", (err) => {
      clearTimeout(timer);
      if (!settled) { settled = true; resolve({ kind: "spawn_error", error: String(err), elapsed: (Date.now() - started) / 1000 }); }
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (settled) return;
      settled = true;
      let lastMsg = "";
      try { lastMsg = readFileSync(lastMsgFile, "utf8"); } catch { /* none */ }
      resolve({ kind: "done", code, lastMsg, stderr, elapsed: (Date.now() - started) / 1000 });
    });
    child.stdin.write(p);
    child.stdin.end();
  });
}

function extractJson(text) {
  // Start from the EARLIEST opener so an enclosing object wins over a nested array.
  const starts = ["[", "{"].map((o) => text.indexOf(o)).filter((i) => i >= 0);
  if (!starts.length) return null;
  const start = Math.min(...starts);
  for (let end = text.length; end > start; end--) {
    try { return JSON.parse(text.slice(start, end)); } catch { /* shrink */ }
  }
  return null;
}

let elapsedTotal = 0;
for (let attempt = 1; attempt <= 2; attempt++) {
  const p = attempt === 1 ? prompt : prompt + "\n\nIMPORTANT: previous reply was not valid JSON. Your ENTIRE final message must be valid JSON, no prose, no code fences.";
  const r = await runOnce(p);
  elapsedTotal += r.elapsed;
  if (r.kind === "spawn_error") emit({ ok: false, status: "CODEX_UNAVAILABLE", error: r.error, elapsed_sec: elapsedTotal });
  if (r.kind === "timeout") emit({ ok: false, status: "CODEX_TIMEOUT", error: `timed out after ${timeoutSec}s`, elapsed_sec: elapsedTotal });
  const out = (r.lastMsg || "").trim();
  if (r.code !== 0 && !out) emit({ ok: false, status: "CODEX_ERROR", error: `exit ${r.code}: ${r.stderr.slice(-600)}`, elapsed_sec: elapsedTotal });
  if (!expectJson) emit({ ok: true, status: "OK", output: out, elapsed_sec: elapsedTotal });
  const parsed = extractJson(out);
  if (parsed !== null) emit({ ok: true, status: "OK", json: parsed, output: out, elapsed_sec: elapsedTotal });
}
emit({ ok: false, status: "CODEX_MALFORMED", error: "no valid JSON after retry", elapsed_sec: elapsedTotal });
