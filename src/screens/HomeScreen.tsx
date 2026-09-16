// TRUE HOME (2026-09-04, Human Review "True Home + Mobile Map Simplification").
// This is the app's actual front door — "today what do you want to do?" —
// separate from the World Map (src/screens/WorldMapScreen.tsx), which used
// to render here and is now reached ONLY via the ▶ CTA below.
//
// 2026-09-15 (Human Visual Review — "VISUAL SOURCE OF TRUTH" mockup pass):
// this is a from-scratch rebuild of the composition, not a variation on the
// 2026-09-13/14 passes. The Human supplied a finished mockup screenshot as
// the exact visual target and an explicit instruction: reproduce it with
// REAL DOM (logo/headline/CTA/secondary are actual elements, not baked into
// an image) using ONLY the plain photo asset (home-child-watching.png, no
// text/UI baked in) as a background layer — never render the mockup itself
// as a picture, and never wrap the photo in a bordered/shadowed "card".
// The whole screen is ONE continuous composition: logo and headline sit
// directly over the photo's own sky, the CTA sits directly over its own
// grass — not "text block, then image block, then button block" stacked as
// three separate visual units.
//
// Per the Human's explicit instruction this pass: the 4-visual rotation is
// PAUSED (not removed — pickHomeVisual()/HOME_VISUALS in ../lib/homeVisual
// are untouched) until this one composition (home-child-watching.png, the
// "child watching" concept) passes visual review; the other 3 visuals will
// reuse the same DOM structure once approved.
import { useGame } from "../state/GameState";
import { HOME_VISUALS } from "../lib/homeVisual";

/** 2026-09-04 (Experience Design Harness — Visual Design System §ICONOGRAPHY):
 * OS emoji (📖🌱) render as photorealistic/platform-dependent glyphs that
 * clash with the clay-diorama illustration style (Codex whole-screen review:
 * ICON_CONSISTENCY=29/100, "incompatible rendering, scale, and visual
 * weight"). Per the icon priority order in factory/rules/visual-design-
 * system.md — reuse existing JC asset, then a Claude-authored functional SVG
 * in one shared line style, GPT request only if neither suffices — these are
 * simple functional glyphs (not world illustration), so drawing them as
 * single-stroke-width line icons is Claude's own domain, not GPT's. */
const ICON_STROKE = 1.8;
function BookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 5.5c2.2-1 4.6-1 7 0v13c-2.4-1-4.8-1-7 0v-13Z M20 5.5c-2.2-1-4.6-1-7 0v13c2.4-1 4.8-1 7 0v-13Z"
        stroke="currentColor" strokeWidth={ICON_STROKE} strokeLinejoin="round" strokeLinecap="round"
      />
    </svg>
  );
}

// 2026-09-15: rotation paused per Human instruction (see file header) —
// pinned to the "child-watching" entry of the untouched HOME_VISUALS list
// rather than duplicating its path/alt here, so re-enabling rotation later
// is a one-line change back to `pickHomeVisual()`. 2026-09-16: the entry's
// `src` now points at a NEW phone-native-aspect-ratio asset (see
// ../lib/homeVisual.ts) — this line itself didn't need to change.
const PINNED_VISUAL = HOME_VISUALS.find((v) => v.id === "child-watching")!;

export default function HomeScreen() {
  const { navigate, progress } = useGame();

  return (
    <div className="screen true-home">
      {/* the ONLY image — a plain photo layer behind everything else, never
         a bordered/shadowed "card". object-position is tuned so the two
         kids stay in frame at 375px (see index.css .true-home-bg). */}
      <img className="true-home-bg" src={PINNED_VISUAL.src} alt="" aria-hidden="true" />

      <div className="true-home-inner">
        <div className="true-home-brand">
          {/* 2026-09-15: a real wordmark, not a single-color label — "JIBUN"
             dark navy, "CHOICE" cycling the app's OWN existing accent
             tokens (--orange/--blue/--green/--red, index.css :root) rather
             than inventing new brand colors, per the Human's "既存ブランドに
             合わせて". */}
          <h1 className="true-home-logo">
            <span className="logo-jibun">
              <span className="spark-mark" aria-hidden="true" />
              JIBUN
              <span className="spark-mark" aria-hidden="true" />
            </span>
            <span className="logo-choice">
              <span>C</span><span>H</span><span>O</span><span>I</span><span>C</span><span>E</span>
            </span>
          </h1>
        </div>

        {/* 2026-09-15/16: the screen's single most important copy — dark
           navy, bold, sitting directly on the photo's sky, no card behind
           it. One small yellow CSS "spark" mark (not an emoji) accents the
           second line, per the mockup. */}
        <p className="true-home-lead">
          今日は、<br />なにが起きてる？
          <span className="spark-mark lead-spark" aria-hidden="true" />
        </p>

        {/* pushes the CTA block down to the photo's grass/flowers zone near
           the bottom of the screen, however tall the header block is. */}
        <div className="true-home-spacer" aria-hidden="true" />

        <div className="true-home-cta">
          {/* the Primary Action — a real <button>, not a pseudo-button
             baked into the photo. Always goes to the World Map, never a
             specific event directly. */}
          <button
            className="home-play"
            onClick={() => navigate({ name: "map" })}
          >
            <span className="play-tri" aria-hidden="true">▶</span>
            <span className="play-label">まちへ行く</span>
            <span className="play-arrow" aria-hidden="true">→</span>
          </button>

          {/* Secondary action — deliberately smaller/quieter than the CTA. */}
          <button className="home-secondary-bar" onClick={() => navigate({ name: "zukan" })}>
            <span className="home-card-icon"><BookIcon /></span>
            <span className="home-secondary-title">しごと図鑑</span>
            {progress.discovered.length > 0 && (
              <span className="home-card-badge">{progress.discovered.length}</span>
            )}
            <span className="home-secondary-arrow" aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
