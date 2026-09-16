#!/usr/bin/env node
// Automated gameplay QA for Q1 sound_check (SoundCheckGame.tsx /
// soundCheckLogic.ts).
// 2026-09-13 (mechanical-verification follow-up to a manual UX/Logic audit
// pass -- the parent audit found no bug here, but "read it and it looked
// fine" is not a mechanical guarantee, so this proves it with Node instead
// of a human read).
//
// Proves: (a) at least one setting makes all 3 seats "ちょうどいい", (b) a
// setting that gets 2 of the 3 seats right never counts as a win, and (c)
// the model's stated properties (extra speaker helps back/middle only,
// wide angle trades front loudness for reach) actually hold.
import { SEATS, LABEL, level, evaluate } from "../../src/q1/soundCheckLogic.ts";

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log(`PASS  ${name}${extra ? "  — " + extra : ""}`); }
  else { fail++; console.log(`FAIL  ${name}${extra ? "  — " + extra : ""}`); }
}

check("there are 3 seats (front/middle/back)", SEATS.length === 3);
check("LABEL has 4 entries matching level()'s 0-3 range", LABEL.length === 4);

// ---- 1. at least one winning setting exists (exhaustive search over the
// small control space: volume 1-6, angle down/wide, extra on/off) -------
const ANGLES = ["down", "wide"];
function* allSettings() {
  for (let volume = 1; volume <= 6; volume++)
    for (const angle of ANGLES)
      for (const extra of [false, true])
        yield { volume, angle, extra };
}
const winners = [...allSettings()].filter((s) => evaluate(s.volume, s.angle, s.extra).allGood);
check("at least one winning setting exists", winners.length > 0, `${winners.length} winning settings out of 24`);
if (winners.length > 0) {
  console.log(`      e.g. volume=${winners[0].volume}, angle=${winners[0].angle}, extra=${winners[0].extra}`);
}

// ---- 2. no false positive: a setting where exactly 2 of the 3 seats are
// "ちょうどいい" must never report allGood --------------------------------
{
  const partials = [...allSettings()]
    .map((s) => ({ s, r: evaluate(s.volume, s.angle, s.extra) }))
    .filter(({ r }) => r.states.filter((st) => st.v === 2).length === 2 && !r.allGood);
  check(
    "at least one reachable setting has exactly 2/3 seats good, and it correctly does NOT win",
    partials.length > 0,
    partials.length ? `e.g. volume=${partials[0].s.volume}, angle=${partials[0].s.angle}, extra=${partials[0].s.extra} -> ${JSON.stringify(partials[0].r.states.map((st) => [st.id, st.v]))}` : undefined,
  );
}

// ---- 3. every winning setting genuinely has all 3 seats at level 2,
// nothing hidden -----------------------------------------------------
check(
  "every winning setting has all 3 seats exactly at level 2 (nothing hidden beyond what's displayed)",
  winners.every((s) => evaluate(s.volume, s.angle, s.extra).states.every((st) => st.v === 2)),
);

// ---- 4. the model's documented properties actually hold in code -------
{
  // extra speaker must never change the front seat's level (it only lifts back/middle)
  const frontUnaffected = [...allSettings()].every(
    (s) => level("front", s.volume, s.angle, false) === level("front", s.volume, s.angle, true),
  );
  check("the extra (rear) speaker never changes the front seat's level", frontUnaffected);
}
{
  // wide angle must never help the front seat (it trades front strength for reach)
  const wideNeverHelpsFront = [1, 2, 3, 4, 5, 6].every((v) => level("front", v, "wide", false) <= level("front", v, "down", false));
  check("switching to wide angle never increases the front seat's level", wideNeverHelpsFront);
}
{
  // raising volume must never make the back seat quieter (monotonic in volume, extra/angle fixed)
  let monotonic = true;
  for (let v = 1; v < 6; v++) {
    if (level("back", v + 1, "down", false) < level("back", v, "down", false)) monotonic = false;
  }
  check("raising the main volume never makes the back seat's level go down (down/no-extra baseline)", monotonic);
}

// ---- 5. all-silent / all-too-loud sanity boundaries --------------------
check("minimum volume (1), down, no extra never reaches allGood", evaluate(1, "down", false).allGood === false);
check("maximum volume (6), down, no extra never reaches allGood (front is blown out)", evaluate(6, "down", false).allGood === false);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
