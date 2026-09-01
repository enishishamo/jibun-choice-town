#!/usr/bin/env node
// Deterministic failure-mode tests for codex-review.mjs using a fake `codex`
// shim on PATH (no real Codex call, no cost). Proves the harness never hangs
// and never fail-opens when the reviewer is broken.
//
// Cases: CODEX_UNAVAILABLE / CODEX_TIMEOUT / CODEX_MALFORMED / OK(valid JSON)
//        + downgrade rule (PASS with blockers -> FAIL)
// Usage: node factory/harness/test-failure-modes.mjs

import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, chmodSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HARNESS = dirname(fileURLToPath(import.meta.url));
const ADAPTER = join(HARNESS, "codex-review.mjs");
const results = [];

function makeShimDir(script) {
  const dir = mkdtempSync(join(tmpdir(), "jc-shim-"));
  const bin = join(dir, "codex");
  writeFileSync(bin, script);
  chmodSync(bin, 0o755);
  return dir;
}

function runAdapter({ shimScript, timeoutSec = 8, emptyPath = false }) {
  const promptFile = join(mkdtempSync(join(tmpdir(), "jc-prompt-")), "p.txt");
  writeFileSync(promptFile, "test prompt");
  const shimDir = shimScript ? makeShimDir(shimScript) : null;
  const path = emptyPath
    ? "/usr/bin:/bin" // codex not reachable
    : `${shimDir}:/usr/bin:/bin`;
  const r = spawnSync(
    process.execPath,
    [ADAPTER, "--prompt-file", promptFile, "--timeout-sec", String(timeoutSec)],
    { encoding: "utf8", env: { ...process.env, PATH: path }, timeout: 120000 },
  );
  if (shimDir) rmSync(shimDir, { recursive: true, force: true });
  try {
    return JSON.parse(r.stdout);
  } catch {
    return { parse_error: true, stdout: r.stdout, stderr: r.stderr };
  }
}

function check(name, got, wantStatus, extra = () => true) {
  const ok = got.status === wantStatus && extra(got);
  results.push({ name, ok, wantStatus, got: got.status, detail: got.error || got.verdict?.verdict || "" });
}

// Shim helpers: `codex --version` and `codex login status` must succeed; the
// behavior under test is `codex exec`. --output-last-message path is the arg
// after that flag.
const shimHeader = `#!/bin/bash
if [ "$1" = "--version" ]; then echo codex-fake 0.0.0; exit 0; fi
if [ "$1" = "login" ]; then echo "Logged in (fake)"; exit 0; fi
# find --output-last-message value
OUT=""
prev=""
for a in "$@"; do
  if [ "$prev" = "--output-last-message" ]; then OUT="$a"; fi
  prev="$a"
done
cat > /dev/null  # drain stdin prompt
`;

// 1) unavailable: no codex on PATH at all
check("unavailable", runAdapter({ emptyPath: true }), "CODEX_UNAVAILABLE");

// 2) timeout: exec sleeps past --timeout-sec
check(
  "timeout",
  runAdapter({ shimScript: shimHeader + "sleep 60\n", timeoutSec: 5 }),
  "CODEX_TIMEOUT",
);

// 3) malformed: exec returns junk twice (retry also fails)
check(
  "malformed",
  runAdapter({ shimScript: shimHeader + `echo "I think it looks fine!" > "$OUT"\nexit 0\n` }),
  "CODEX_MALFORMED",
);

// 4) valid verdict passes through
const validJson = JSON.stringify({
  verdict: "FAIL", score: 42, blockers: ["b1"], high: [], medium: [], low: [],
  evidence: ["src/x.tsx:1"], recommended_actions: ["fix b1"],
});
check(
  "valid",
  runAdapter({ shimScript: shimHeader + `cat > /dev/null <<'EOF'\nEOF\necho '${validJson}' > "$OUT"\nexit 0\n` }),
  "OK",
  (g) => g.verdict.verdict === "FAIL" && g.verdict.score === 42,
);

// 5) downgrade rule: PASS with non-empty blockers -> FAIL
const badPass = JSON.stringify({
  verdict: "PASS", score: 90, blockers: ["left blocker"], high: [], medium: [], low: [],
  evidence: [], recommended_actions: [],
});
check(
  "downgrade",
  runAdapter({ shimScript: shimHeader + `echo '${badPass}' > "$OUT"\nexit 0\n` }),
  "OK",
  (g) => g.verdict.verdict === "FAIL" && g.verdict._downgraded,
);

let failed = 0;
for (const r of results) {
  if (!r.ok) failed++;
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name.padEnd(12)} want:${r.wantStatus} got:${r.got}  ${r.detail}`);
}
process.exit(failed ? 1 : 0);
