#!/usr/bin/env node
// Stage Manager: tracks harness build progress across stages 0-8 and decides
// what to work on next. State lives in factory/state/stages.json; runs are
// produced by loop.mjs. Principles: factory/harness/design-principles.md
//
// Commands:
//   status                          -> table of all stages
//   current                         -> the stage in progress (or next eligible)
//   next                            -> next actionable stage (deps satisfied), machine-readable
//   set <id> <status> [--reason ""] -> status: pending|in_progress|passed|failed|human_required
//   attach-run <id> <run_id>        -> link a loop run to a stage
//   bump-repair <id>                -> increment repair_count
//   note <id> "<text>"              -> append a note

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const STATE = join(dirname(fileURLToPath(import.meta.url)), "..", "state", "stages.json");
const VALID = ["pending", "in_progress", "passed", "failed", "human_required"];

const [cmd, ...rest] = process.argv.slice(2);
function fail(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(2);
}
function load() {
  return JSON.parse(readFileSync(STATE, "utf8"));
}
function save(data) {
  data.updated_at = new Date().toISOString();
  writeFileSync(STATE, JSON.stringify(data, null, 2));
}
function stageOf(data, id) {
  const s = data.stages.find((x) => x.id === Number(id));
  if (!s) fail(`unknown stage id: ${id}`);
  return s;
}
function depsSatisfied(data, s) {
  return s.depends_on.every((d) => stageOf(data, d).status === "passed");
}
// Next actionable: lowest-id non-passed stage whose dependencies all passed.
// A human_required stage blocks itself but not independent branches.
function nextActionable(data) {
  return (
    data.stages.find((s) => s.status === "in_progress") ||
    data.stages.find((s) => ["pending", "failed"].includes(s.status) && depsSatisfied(data, s)) ||
    null
  );
}

const data = load();
switch (cmd) {
  case "status": {
    for (const s of data.stages) {
      const dep = s.depends_on.length ? `deps:[${s.depends_on.join(",")}]` : "deps:[]";
      console.log(
        `Stage ${s.id}  ${s.status.padEnd(14)} repairs:${s.repair_count}  ${dep}  ${s.name}` +
          (s.stop_reason ? `  stop:${s.stop_reason}` : ""),
      );
    }
    const nx = nextActionable(data);
    console.log(nx ? `\nNEXT -> Stage ${nx.id}: ${nx.name}` : "\nNEXT -> none (all passed or blocked)");
    break;
  }
  case "current": {
    const cur = data.stages.find((s) => s.status === "in_progress") || nextActionable(data);
    console.log(cur ? JSON.stringify(cur, null, 2) : "null");
    break;
  }
  case "next": {
    const nx = nextActionable(data);
    console.log(nx ? JSON.stringify({ id: nx.id, name: nx.name, status: nx.status, acceptance_criteria: nx.acceptance_criteria }) : "null");
    break;
  }
  case "set": {
    const s = stageOf(data, rest[0]);
    const status = rest[1];
    if (!VALID.includes(status)) fail(`status must be one of ${VALID.join("|")}`);
    if (status === "in_progress" && !depsSatisfied(data, s)) {
      fail(`Stage ${s.id} dependencies not satisfied: [${s.depends_on.join(",")}] must all be passed`);
    }
    s.status = status;
    const ri = rest.indexOf("--reason");
    s.stop_reason = ri >= 0 ? rest[ri + 1] : status === "passed" ? null : s.stop_reason;
    save(data);
    console.log(`Stage ${s.id} -> ${status}${s.stop_reason ? ` (${s.stop_reason})` : ""}`);
    break;
  }
  case "attach-run": {
    const s = stageOf(data, rest[0]);
    if (!rest[1]) fail("run_id required");
    s.runs.push(rest[1]);
    save(data);
    console.log(`Stage ${s.id} runs: ${s.runs.join(", ")}`);
    break;
  }
  case "bump-repair": {
    const s = stageOf(data, rest[0]);
    s.repair_count += 1;
    save(data);
    console.log(`Stage ${s.id} repair_count: ${s.repair_count}`);
    break;
  }
  case "note": {
    const s = stageOf(data, rest[0]);
    if (!rest[1]) fail("note text required");
    s.notes.push({ at: new Date().toISOString(), text: rest[1] });
    save(data);
    console.log(`Stage ${s.id} notes: ${s.notes.length}`);
    break;
  }
  default:
    fail(`unknown command: ${cmd}. Commands: status, current, next, set, attach-run, bump-repair, note`);
}
