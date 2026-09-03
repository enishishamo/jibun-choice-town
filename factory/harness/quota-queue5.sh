#!/bin/bash
# Round 5: re-run the in-context presentation audits after the lifted-badge +
# auto-center + edge-fade presentation fixes. Probe = the first audit itself.
cd "$(dirname "$0")/../.."
AUD=factory/state/art/presentation-audit
S=factory/state/art/shots
probe_ok () {
  python3 - "$1" <<'PY'
import json,sys
try:
    d=json.load(open(sys.argv[1])); sys.exit(0 if d.get('verdict') in ('PASS','FAIL') else 1)
except Exception: sys.exit(1)
PY
}
for i in $(seq 1 30); do
  node factory/harness/art/art-qa.mjs presentation --mobile "$S/mobile-port-area.png" --desktop "$S/desktop-port-area.png" \
    --context "area screen of the port world AFTER presentation fixes: badges lifted above subjects with pointer stems, active spot auto-centered, edge fades added; judge hotspot presentation in context" \
    > "$AUD/port-area.json" 2>/dev/null
  if probe_ok "$AUD/port-area.json"; then echo "QUOTA OK (attempt $i)"; break; fi
  echo "quota exhausted (attempt $i) — sleeping 20 min"; sleep 1200
done
echo "port area: $(python3 -c "import json;print(json.load(open('$AUD/port-area.json')).get('verdict'))")"
for w in forest river library studio; do
  node factory/harness/art/art-qa.mjs presentation --mobile "$S/mobile-$w-area.png" --desktop "$S/desktop-$w-area.png" \
    --context "area screen of the $w world AFTER presentation fixes: badges lifted above subjects with pointer stems, active spot auto-centered in the scroller, edge fades; judge hotspot presentation in context" \
    > "$AUD/$w-area.json" 2>/dev/null
  echo "$w area: $(python3 -c "import json;print(json.load(open('$AUD/$w-area.json')).get('verdict'))" 2>/dev/null)"
done
for w in library studio; do
  node factory/harness/art/art-qa.mjs presentation --mobile "$S/mobile-$w-wrapup.png" \
    --context "wrapUp screen of the $w world AFTER presentation fixes (lifted badges, auto-centered scroller). ARBITRATION per style-contract 2026-09-04: do the before/after cards read as the SAME PLACE with ONE clear story change? judge in context" \
    > "$AUD/$w-wrapup.json" 2>/dev/null
  echo "$w wrapup: $(python3 -c "import json;print(json.load(open('$AUD/$w-wrapup.json')).get('verdict'))" 2>/dev/null)"
done
echo "QUEUE5 COMPLETE"
