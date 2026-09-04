// TRUE HOME (2026-09-04, Human Review "True Home + Mobile Map Simplification").
// This is the app's actual front door — "today what do you want to do?" —
// separate from the World Map (src/screens/WorldMapScreen.tsx), which used
// to render here and is now reached ONLY via the "社会を冒険する" card below.
// Game-title-screen feel, not a dashboard: a few big, visual, one-tap cards.
// No world list, no map, no long instructional paragraphs here.
import { useGame } from "../state/GameState";

const M = (n: string) => `${import.meta.env.BASE_URL}assets/map-thumb/${n}.png`;

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
            <span className="home-card-icon">📖</span>
            <span className="home-card-title">しごと図鑑</span>
            {progress.discovered.length > 0 && (
              <span className="home-card-badge">{progress.discovered.length}</span>
            )}
          </button>

          <button className="home-card home-card-secondary is-coming-soon" disabled>
            <span className="home-card-icon">🌱</span>
            <span className="home-card-title">毎日のチャレンジ</span>
            <span className="home-card-soon">近日公開</span>
          </button>
        </div>
      </div>
    </div>
  );
}
