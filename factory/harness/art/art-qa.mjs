#!/usr/bin/env node
// Art QA (Stage 6): mechanical checks + Codex vision critic (subscription
// vision, REAL-probed). Emits a structured verdict; the regeneration loop
// consumes qa_issues to rewrite the next prompt (never retry the same prompt).
//
// Usage:
//   node art-qa.mjs asset --file <path> --purpose "<use/purpose>" [--expect-size WxH]
//   node art-qa.mjs pair --before <path> --after <path> --purpose "<what changes>"
//
// Output (stdout JSON): { ok, verdict: PASS|FAIL, scores{}, issues[], mechanical{} }

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";

const HARNESS = dirname(dirname(fileURLToPath(import.meta.url)));
const ROOT = join(HARNESS, "..", "..");
const CONTRACT = readFileSync(join(ROOT, "factory/harness/art/style-contract.md"), "utf8");

const args = process.argv.slice(2);
const mode = args.shift();
function argOf(name, dflt) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : dflt;
}
function die(msg) {
  console.log(JSON.stringify({ ok: false, error: msg }));
  process.exit(1);
}

function mechanical(file) {
  const abs = resolve(ROOT, file);
  if (!existsSync(abs)) die(`missing file: ${file}`);
  const st = statSync(abs);
  const out = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", "-g", "format", abs], { encoding: "utf8" });
  const w = Number(out.match(/pixelWidth: (\d+)/)?.[1]);
  const h = Number(out.match(/pixelHeight: (\d+)/)?.[1]);
  const issues = [];
  if (st.size > 2_000_000) issues.push(`file too large: ${(st.size / 1e6).toFixed(1)}MB (>2MB)`);
  if (w < 256 || h < 256) issues.push(`too small: ${w}x${h}`);
  if (![".png", ".jpg", ".jpeg", ".webp"].includes(extname(abs).toLowerCase())) issues.push("invalid format");
  return { width: w, height: h, bytes: st.size, issues };
}

function visionCritic(files, ask) {
  const prompt = `You are the JIBUN CHOICE visual art critic. Judge the attached image(s) against this
Art Style Contract (summary):
${CONTRACT.slice(0, 2600)}

${ask}

Score each 0-100 and list concrete issues. Your ENTIRE final message must be a single JSON
object, no prose, no code fences:
{"scores":{"STYLE_CONSISTENCY":0,"COMPOSITION":0,"CROP_SAFETY":0,"READABILITY":0,
"OBJECT_COMPLETENESS":0,"CHARACTER_ANATOMY":0,"SERIES_CONSISTENCY":0,
"BEFORE_AFTER_CONSISTENCY":0,"JOB_ACCURACY":0,"MOBILE_USABILITY":0},
"issues":["concrete problem — why it matters"],"verdict":"PASS|FAIL"}
Scoring: use 100 for categories that do not apply (e.g. CHARACTER_ANATOMY with no people,
BEFORE_AFTER_CONSISTENCY for a single image). verdict=FAIL if any applicable category < 70
or a contract MUST is violated (readable text/logos, photorealism, cut-off heads/hands,
old-fashioned or babyish style, wrong job tools).`;
  // fresh reply file per invocation — a stale reply from a previous run can
  // never be mistaken for this one's result, and a failed codex run is an error
  const replyFile = join(mkdtempSync(join(tmpdir(), "jc-artqa-")), "reply.txt");
  const cargs = ["exec", "--sandbox", "read-only", "--cd", ROOT, "--skip-git-repo-check", "--output-last-message", replyFile];
  for (const f of files) cargs.push("-i", resolve(ROOT, f));
  cargs.push("-");
  const r = spawnSync("codex", cargs, { input: prompt, encoding: "utf8", timeout: 600000 });
  if (r.status !== 0) return { error: `vision critic codex exec exited ${r.status}` };
  let raw = "";
  try { raw = readFileSync(replyFile, "utf8"); } catch { /* none */ }
  const start = raw.indexOf("{");
  if (start < 0) return { error: `vision critic produced no JSON (exit ${r.status})` };
  for (let end = raw.length; end > start; end--) {
    try { return JSON.parse(raw.slice(start, end)); } catch { /* shrink */ }
  }
  return { error: "vision critic JSON unparsable" };
}

const CATEGORIES = ["STYLE_CONSISTENCY","COMPOSITION","CROP_SAFETY","READABILITY","OBJECT_COMPLETENESS","CHARACTER_ANATOMY","SERIES_CONSISTENCY","BEFORE_AFTER_CONSISTENCY","JOB_ACCURACY","MOBILE_USABILITY"];
// Fail-closed: the harness computes the verdict from the scores itself.
// Missing or non-numeric scores are a FAIL, regardless of the critic's own verdict.
function enforceVerdict(vis, mechIssues) {
  const problems = [];
  if (!vis.scores || typeof vis.scores !== "object") return { verdict: "FAIL", problems: ["vision critic returned no scores"] };
  // Bidirectional fail-closed: a critic FAIL (e.g. a style-contract MUST
  // violation that numeric scores do not capture) can never be overridden.
  if (vis.verdict !== "PASS") problems.push(`vision critic verdict: ${vis.verdict} (MUST violation or unstated failure)`);
  for (const c of CATEGORIES) {
    const v = vis.scores[c];
    if (typeof v !== "number" || v < 0 || v > 100) problems.push(`invalid score for ${c}: ${v}`);
    else if (v < 70) problems.push(`${c} below threshold: ${v}`);
  }
  if (mechIssues.length) problems.push(...mechIssues);
  return { verdict: problems.length ? "FAIL" : "PASS", problems };
}

if (mode === "asset") {
  const file = argOf("--file") || die("--file required");
  const purpose = argOf("--purpose", "");
  const expect = argOf("--expect-size", null);
  const mech = mechanical(file);
  if (expect) {
    const [w, h] = expect.split("x").map(Number);
    const ar = mech.width / mech.height, ear = w / h;
    if (Math.abs(ar - ear) > 0.12) mech.issues.push(`aspect ratio ${ar.toFixed(2)} differs from expected ${ear.toFixed(2)}`);
  }
  const vis = visionCritic([file], `Purpose of this asset: ${purpose}. Judge it as a JIBUN CHOICE game asset.`);
  if (vis.error) {
    console.log(JSON.stringify({ ok: false, verdict: "FAIL", mechanical: mech, issues: [...mech.issues, `VISION_QA_UNAVAILABLE: ${vis.error}`] }));
    process.exit(1);
  }
  const gate = enforceVerdict(vis, mech.issues);
  const issues = [...new Set([...(vis.issues || []), ...gate.problems])];
  console.log(JSON.stringify({ ok: true, verdict: gate.verdict, critic_verdict: vis.verdict, scores: vis.scores, issues, mechanical: mech }, null, 1));
  process.exit(gate.verdict === "PASS" ? 0 : 1);
} else if (mode === "pair") {
  const before = argOf("--before") || die("--before required");
  const after = argOf("--after") || die("--after required");
  const purpose = argOf("--purpose", "");
  const mb = mechanical(before), ma = mechanical(after);
  const vis = visionCritic(
    [before, after],
    `These are a BEFORE (first image) / AFTER (second image) pair. Intended change: ${purpose}.
They MUST show the same building, same camera angle, same composition, same neighborhood and
the same visual identity — only the event's result may differ. Judge BEFORE_AFTER_CONSISTENCY
strictly, plus all other categories for both images.`,
  );
  if (vis.error) {
    console.log(JSON.stringify({ ok: false, verdict: "FAIL", issues: [`VISION_QA_UNAVAILABLE: ${vis.error}`] }));
    process.exit(1);
  }
  const gate = enforceVerdict(vis, [...mb.issues, ...ma.issues]);
  const issues = [...new Set([...(vis.issues || []), ...gate.problems])];
  console.log(JSON.stringify({ ok: true, verdict: gate.verdict, critic_verdict: vis.verdict, scores: vis.scores, issues, mechanical: { before: mb, after: ma } }, null, 1));
  process.exit(gate.verdict === "PASS" ? 0 : 1);
} else {
  die("modes: asset | pair");
}
