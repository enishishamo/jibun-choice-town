// HOME: the world itself is the screen. The town illustration is the
// hero; the event lives inside it. No profession lists, no button rows.
import { useState } from "react";
import { events, places } from "../data";
import { useGame } from "../state/GameState";

const A = (n: string) => `${import.meta.env.BASE_URL}assets/${n}.png`;

export default function HomeScreen() {
  const { navigate, progress } = useGame();
  const [peek, setPeek] = useState<string | null>(null);
  const activePlaces = places.filter((p) => p.eventId);
  const quietPlaces = places.filter((p) => !p.eventId && p.mapPos);

  return (
    <div className="screen world-screen">
      <div className="world">
        <header className="world-header">
          <div className="world-header-text">
            <h1 className="logo">JIBUN CHOICE</h1>
            <p className="tagline">知らない社会を、ちょっとのぞいてみよう。</p>
          </div>
          <button className="zukan-btn" onClick={() => navigate({ name: "zukan" })}>
            📖 しごと図鑑
            {progress.discovered.length > 0 && (
              <span className="zukan-count">{progress.discovered.length}</span>
            )}
          </button>
        </header>

        <p className="world-lead">
          いま、どこかで何かが起きてる！
          <br />
          気になる場所をタップしてみよう
        </p>

        <div className="town-stage">
          {/* quiet places: clearly marked as not-yet-open, but not dead */}
          {quietPlaces.map((p) => (
            <button
              key={p.id}
              className="quiet-pin"
              style={{ left: p.mapPos!.left, top: p.mapPos!.top }}
              onClick={() => setPeek(peek === p.id ? null : p.id)}
            >
              <span className="quiet-name">{p.name}</span>
              <small>じゅんびちゅう</small>
              {peek === p.id && <small className="quiet-peek">もうすぐ遊べるよ！</small>}
            </button>
          ))}

          <img className="town-img" src={A("town-hero")} alt="バーチャル社会の街" />

          {activePlaces.map((p) => {
            const ev = events.find((e) => e.id === p.eventId);
            if (!ev) return null;
            return (
              <button
                key={p.id}
                className="event-balloon"
                style={p.mapPos ? { left: p.mapPos.left, top: p.mapPos.top } : undefined}
                onClick={() => navigate({ name: "area", eventId: ev.id })}
              >
                {/* Manual flag for the newest event only — not a general
                    "isNew" data field yet, on purpose (see PR notes). */}
                {ev.id === "school-trip" && (
                  <img className="balloon-new-badge" src={A("ui-new")} alt="NEW" />
                )}
                <img src={A("ui-fire")} alt="" />
                <span className="balloon-text">
                  {ev.shortLabel ?? ev.title.split("\n").join("")}
                </span>
              </button>
            );
          })}
        </div>

        <div className="world-ground" />
      </div>
    </div>
  );
}
