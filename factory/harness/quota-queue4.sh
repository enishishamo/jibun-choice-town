#!/bin/bash
# Round 4: home gate R4 (probe) -> in-context presentation audits for the 5 new
# worlds (area screens + wrapUp pair arbitration per the 2026-09-04 ruling).
cd "$(dirname "$0")/../.."
AUD=factory/state/art/presentation-audit
mkdir -p "$AUD"
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
  node factory/harness/codex-review.mjs --prompt-file factory/state/home-quality-review-prompt.md --out factory/state/home-quality-review-4.json
  if probe_ok factory/state/home-quality-review-4.json; then echo "QUOTA OK (attempt $i)"; break; fi
  echo "quota exhausted (attempt $i) — sleeping 20 min"
  sleep 1200
done
S=factory/state/art/shots
for w in port forest river library studio; do
  node factory/harness/art/art-qa.mjs presentation --mobile "$S/mobile-$w-area.png" --desktop "$S/desktop-$w-area.png" \
    --context "area screen of the $w world; subject-first single-label hotspots; judge scene readability + hotspot presentation in context" \
    > "$AUD/$w-area.json" 2>/dev/null
  echo "audited $w area: $(python3 -c "import json;print(json.load(open('$AUD/$w-area.json')).get('verdict'))" 2>/dev/null)"
  node factory/harness/art/art-qa.mjs presentation --mobile "$S/mobile-$w-wrapup.png" \
    --context "wrapUp screen of the $w world showing the before/after pair side by side; ARBITRATION per style-contract 2026-09-04 ruling: do the two cards read as the SAME PLACE with ONE clear story change? judge the pair in context, not unit-level geometry" \
    > "$AUD/$w-wrapup.json" 2>/dev/null
  echo "audited $w wrapup: $(python3 -c "import json;print(json.load(open('$AUD/$w-wrapup.json')).get('verdict'))" 2>/dev/null)"
done
echo "QUEUE4 COMPLETE"
