// TRUE HOME (2026-09-04, Human Review "True Home + Mobile Map Simplification").
// This is the app's actual front door — "today what do you want to do?" —
// separate from the World Map (src/screens/WorldMapScreen.tsx), which used
// to render here and is now reached ONLY via the "社会を冒険する" card below.
// Game-title-screen feel, not a dashboard: a few big, visual, one-tap cards.
// No world list, no map, no long instructional paragraphs here.
import { useGame } from "../state/GameState";

const M = (n: string) => `${import.meta.env.BASE_URL}assets/map-thumb/${n}.png`;

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
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 5.5c2.2-1 4.6-1 7 0v13c-2.4-1-4.8-1-7 0v-13Z M20 5.5c-2.2-1-4.6-1-7 0v13c2.4-1 4.8-1 7 0v-13Z"
        stroke="currentColor" strokeWidth={ICON_STROKE} strokeLinejoin="round" strokeLinecap="round"
      />
    </svg>
  );
}
function SproutIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 20V11" stroke="currentColor" strokeWidth={ICON_STROKE} strokeLinecap="round" />
      <path
        d="M12 12c0-3.6-2.7-6-6.5-6C5.5 9.8 8 12 12 12Z M12 10c0-3 2.2-5 5.5-5C17.5 8.3 15.5 10 12 10Z"
        stroke="currentColor" strokeWidth={ICON_STROKE} strokeLinejoin="round" strokeLinecap="round"
      />
    </svg>
  );
}

export default function HomeScreen() {
  const { navigate, progress } = useGame();

  return (
    <div className="screen true-home">
      <div className="true-home-inner">
        <div className="true-home-brand">
          <h1 className="logo">JIBUN CHOICE</h1>
          <p className="tagline">
            {progress.discovered.length > 0
              ? `これまでに ${progress.discovered.length}この仕事に出会った。つづきから遊ぼう。`
              : "知らない社会を、ちょっとのぞいてみよう。"}
          </p>
        </div>

        <button
          className="home-card home-card-primary"
          onClick={() => navigate({ name: "map" })}
          style={{ backgroundImage: `url(${M("town-hero")})` }}
        >
          <span className="home-card-sparkle" aria-hidden="true">✨</span>
          <span className="home-card-scrim" />
          <span className="home-card-play" aria-hidden="true">▶</span>
          <span className="home-card-label">
            <span className="home-card-title">社会を冒険する</span>
            <span className="home-card-sub">まちへ出て、ゲームをする</span>
          </span>
        </button>

        <div className="home-card-row">
          <button className="home-card home-card-secondary" onClick={() => navigate({ name: "zukan" })}>
            <span className="home-card-icon"><BookIcon /></span>
            <span className="home-card-title">しごと図鑑</span>
            {progress.discovered.length > 0 && (
              <span className="home-card-badge">{progress.discovered.length}</span>
            )}
          </button>

          <button className="home-card home-card-secondary is-coming-soon" disabled>
            <span className="home-card-icon"><SproutIcon /></span>
            <span className="home-card-title">毎日のチャレンジ</span>
            <span className="home-card-soon">近日公開</span>
          </button>
        </div>
      </div>
    </div>
  );
}
