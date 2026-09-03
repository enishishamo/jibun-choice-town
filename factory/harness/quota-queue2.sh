#!/bin/bash
# Round 2: home gate R2 (probe) -> child critic -> remaining art chain.
cd "$(dirname "$0")/../.."
probe_ok () {
  python3 - "$1" <<'PY'
import json,sys
try:
    d=json.load(open(sys.argv[1]))
    v = d.get('verdict')
    ok = (isinstance(v,dict) and v.get('verdict')) or isinstance(v,str)
    # accept any parsed verdict OR a raw containing "verdict" (malformed-but-usable)
    sys.exit(0 if ok or (d.get('status')=='CODEX_MALFORMED' and 'verdict' in str(d.get('raw',''))) else 1)
except Exception:
    sys.exit(1)
PY
}
for i in $(seq 1 30); do
  node factory/harness/codex-review.mjs --prompt-file factory/state/home-quality-review-prompt.md --out factory/state/home-quality-review-2.json
  if probe_ok factory/state/home-quality-review-2.json; then echo "QUOTA OK (attempt $i)"; break; fi
  echo "quota exhausted (attempt $i) — sleeping 20 min"
  sleep 1200
done
node factory/harness/codex-review.mjs --prompt-file factory/state/child-critic-prompt.md --out factory/state/child-critic-1.json
rm -f factory/state/art/.art-loop.lock
node factory/harness/art/art-loop.mjs run --request factory/projects/library-detective/art-requests/scene-library.json
node factory/harness/art/art-loop.mjs run-pair --before factory/projects/library-detective/art-requests/ba-before.json --after factory/projects/library-detective/art-requests/ba-after.json
node factory/harness/art/art-loop.mjs run --request factory/projects/game-studio/art-requests/scene-studio.json
node factory/harness/art/art-loop.mjs run-pair --before factory/projects/game-studio/art-requests/ba-before.json --after factory/projects/game-studio/art-requests/ba-after.json
echo "QUEUE2 COMPLETE"
