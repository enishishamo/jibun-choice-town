#!/bin/bash
# Round 3: home gate R3 (probe) -> ba_after generation for library & studio.
cd "$(dirname "$0")/../.."
probe_ok () {
  python3 - "$1" <<'PY'
import json,sys
try:
    d=json.load(open(sys.argv[1]))
    v=d.get('verdict')
    ok=(isinstance(v,dict) and v.get('verdict')) or isinstance(v,str)
    sys.exit(0 if ok or (d.get('status')=='CODEX_MALFORMED' and 'verdict' in str(d.get('raw',''))) else 1)
except Exception:
    sys.exit(1)
PY
}
for i in $(seq 1 30); do
  node factory/harness/codex-review.mjs --prompt-file factory/state/home-quality-review-prompt.md --out factory/state/home-quality-review-3.json
  if probe_ok factory/state/home-quality-review-3.json; then echo "QUOTA OK (attempt $i)"; break; fi
  echo "quota exhausted (attempt $i) — sleeping 20 min"
  sleep 1200
done
rm -f factory/state/art/.art-loop.lock
node factory/harness/art/art-loop.mjs run-after --before factory/projects/library-detective/art-requests/ba-before.json --after factory/projects/library-detective/art-requests/ba-after.json
node factory/harness/art/art-loop.mjs run-after --before factory/projects/game-studio/art-requests/ba-before.json --after factory/projects/game-studio/art-requests/ba-after.json
echo "QUEUE3 COMPLETE"
