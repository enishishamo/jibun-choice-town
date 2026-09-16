// HOME main-visual rotation (2026-09-13 Home redesign — §4 of the request).
//
// 2026-09-14 (official art landed): the 4 conceptually-distinct visuals the
// brief asked for are all real, final assets —
//   A. home-town.png            — 小さなクレイの町だけ（reference mockup ①アイコン型）
//   B. home-child-watching.png  — クレイの子どもが町を見ている（②キャラ型）
//   C. home-incident.png        — 町で何かが起きている「気配」（④出来事型）
//   D. home-adventure.png       — 子どもが町へ向かって冒険している場面（⑤冒険シーン型）
// These replace the earlier TEMPORARY FALLBACK (4 extra crops of the plain
// continuous-world.png — town-center/harbor/forest-river/station), which
// were only ever type-A stand-ins and are no longer part of the rotation
// (see git history if those crops are ever needed again elsewhere; the
// files themselves were left in public/assets/world/, just unreferenced).
//
// The ROTATION MECHANISM (pickHomeVisual: never repeat the last shown
// visual, session-persisted, trivially extensible) is unchanged from the
// original design — only the entries in HOME_VISUALS changed.
//
// 2026-09-14 (Human Visual Review, reference mockup adopted): HomeScreen.tsx
// now renders concept A at a smaller "icon" size (reference option ①) and
// B/C/D at a larger "scene" size close to their own native portrait aspect
// ratio (reference options ②④⑤) — see `.home-visual--icon` / `--scene` in
// index.css. That change alone drastically reduced how much of each image
// needs to be cropped at all (the scene aspect ratio is now almost
// identical to the source photos' own ~0.84 aspect ratio), so the
// objectPosition values below were re-measured for the NEW aspect ratios,
// not carried over from the old 4:3 landscape crop.
export interface HomeVisual {
  id: string;
  src: string;
  /** kept empty/decorative — the surrounding UI already says what this
      screen is; per Visual Design System iconography guidance, alt text
      here would just repeat the button's own aria-label. */
  alt: string;
  /** which of the Human's 4 conceptual types this asset fulfills — drives
   *  HomeScreen.tsx's choice of `.home-visual--icon` (A) vs `--scene`
   *  (B/C/D), and is otherwise kept for documentation/traceability. */
  conceptType: "A" | "B" | "C" | "D";
  /** Passed straight through to the rendered <img>'s inline
   *  `object-position` style — tuned per image at 375px against its ACTUAL
   *  rendered crop (see each entry's comment), not guessed. */
  objectPosition: string;
}

const A = (path: string) => `${import.meta.env.BASE_URL}assets/world/${path}`;

export const HOME_VISUALS: HomeVisual[] = [
  // A: "icon" sizing (~1:1.05, most of the image's top third is empty
  // sky/background above the island) — bias down to frame the island
  // itself rather than showing mostly blank space above it.
  { id: "town", src: A("home-town.png"), alt: "", conceptType: "A", objectPosition: "center 66%" },
  // B: 2026-09-16 (Human Visual Review round 3) — swapped for a NEW asset
  // generated at a phone-native aspect ratio (711x1536, ~0.463) instead of
  // the original generic-photo crop (1149x1368, ~0.84). 0.463 is almost
  // exactly a 375x812 viewport's own ratio (~0.462), so object-fit:cover
  // now trims only a sliver off the edges — the sky-to-town-to-kids
  // composition renders essentially uncropped, at any phone width. The
  // OLD home-child-watching.png is left in public/assets/world/, just
  // unreferenced (see git history if ever needed again).
  { id: "child-watching", src: A("home-child-watching-v2.png"), alt: "", conceptType: "B", objectPosition: "center center" },
  { id: "incident", src: A("home-incident.png"), alt: "", conceptType: "C", objectPosition: "center center" },
  { id: "adventure", src: A("home-adventure.png"), alt: "", conceptType: "D", objectPosition: "center center" },
];

const LAST_KEY = "jc_home_visual_last";

/** Picks the visual to show THIS time Home is opened — never the same one
 * shown last time (§4 "直前と同じvisualは連続表示しない"), remembered across
 * navigation via sessionStorage (per the brief, "session/localStorage等で
 * last visualを保持してよい") so Home -> Map -> Home doesn't repeat one.
 * Falls back to a plain random pick if storage is unavailable (private
 * browsing, etc.) — never throws, worst case it can repeat once. */
export function pickHomeVisual(): HomeVisual {
  let lastId: string | null = null;
  try {
    lastId = window.sessionStorage.getItem(LAST_KEY);
  } catch {
    // storage blocked — fall through, just pick from the full list
  }
  const pool = HOME_VISUALS.length > 1 ? HOME_VISUALS.filter((v) => v.id !== lastId) : HOME_VISUALS;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  try {
    window.sessionStorage.setItem(LAST_KEY, pick.id);
  } catch {
    // ignore — not having persistence just means a repeat is possible
  }
  return pick;
}
