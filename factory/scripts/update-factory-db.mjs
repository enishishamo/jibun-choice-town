// One-shot refresh: re-scan the app code, then validate the resulting DB.
// Run whenever a content module or registry.ts changed:
//   node factory/scripts/update-factory-db.mjs

import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
for (const script of ["scan-existing-games.mjs", "validate-factory-data.mjs"]) {
  execFileSync(process.execPath, [path.join(HERE, script)], { stdio: "inherit" });
}
