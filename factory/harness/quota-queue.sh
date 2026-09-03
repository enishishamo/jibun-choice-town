#!/bin/bash
# Waits for Codex (ChatGPT subscription) quota to recover, then runs the queued
# reviews + art chain sequentially. Probe = the library R4 review itself; a
# usage-limit failure sleeps 20 min and retries (max ~10h).
cd "$(dirname "$0")/../.."
probe_ok () {
  # succeeded if the out file has a real verdict (not CODEX_ERROR)
  python3 - "$1" <<'PY'
import json,sys
try:
    d=json.load(open(sys.argv[1]))
    ok = d.get('status')!='CODEX_ERROR' and (d.get('verdict') or (isinstance(d.get('verdict',{}),dict)))
    v = d if 'verdict' not in d or isinstance(d.get('verdict'),str) else d['verdict']
    sys.exit(0 if (isinstance(v,dict) and v.get('verdict')) or isinstance(d.get('verdict'),str) else 1)
except Exception:
    sys.exit(1)
PY
}
for i in $(seq 1 30); do
  node factory/harness/codex-review.mjs --prompt-file factory/projects/library-detective/impl-review-prompt.md --out factory/state/library-impl-review-4.json
  if probe_ok factory/state/library-impl-review-4.json; then echo "QUOTA RECOVERED (attempt $i)"; break; fi
  echo "quota still exhausted (attempt $i) — sleeping 20 min"
  sleep 1200
done
# home quality gate
node factory/harness/codex-review.mjs --prompt-file factory/state/home-quality-review-prompt.md --out factory/state/home-quality-review-1.json
# art chain (serial, correct output paths, guard active)
rm -f factory/state/art/.art-loop.lock
node factory/harness/art/art-loop.mjs run --request factory/projects/river-health/art-requests/scene-river.json
node factory/harness/art/art-loop.mjs run --request factory/projects/library-detective/art-requests/scene-library.json
node factory/harness/art/art-loop.mjs run-pair --before factory/projects/library-detective/art-requests/ba-before.json --after factory/projects/library-detective/art-requests/ba-after.json
node factory/harness/art/art-loop.mjs run --request factory/projects/game-studio/art-requests/scene-studio.json
node factory/harness/art/art-loop.mjs run-pair --before factory/projects/game-studio/art-requests/ba-before.json --after factory/projects/game-studio/art-requests/ba-after.json
echo "QUEUE COMPLETE"
