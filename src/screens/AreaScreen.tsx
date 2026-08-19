// Area screen: an exploration scene, not a card list. Incidents float
// inside the place as tappable spots — the child decides where to poke.
// Still shows WHAT IS HAPPENING, never profession names.
import { getEvent } from "../data";
import { useGame } from "../state/GameState";

const A = (n: string) => `${import.meta.env.BASE_URL}assets/${n}.png`;

export default function AreaScreen({ eventId }: { eventId: string }) {
  const { navigate, hasCompleted } = useGame();
  const event = getEvent(eventId);
  if (!event) return null;

  return (
    <div className="screen world-screen">
      <div className="scene">
        <div className="scene-top">
          <button className="back-chip" onClick={() => navigate({ name: "home" })}>
            ← 街
          </button>
          <div className="scene-banner">
            <img src={A("ui-fire")} alt="" />
            <span>
              {event.title.split("\n").map((l) => (
                <span key={l}>{l}<br /></span>
              ))}
            </span>
          </div>
        </div>

        <div className="scene-stage">
          <img className="scene-school" src={A("bg-school")} alt={event.areaName} />
          <p className="scene-lead">
            {event.areaLead.split("\n").map((l) => (
              <span key={l}>{l}<br /></span>
            ))}
          </p>

          {event.incidents.map((inc, i) => {
            const done = hasCompleted(inc.experienceId);
            return (
              <button
                key={inc.id}
                className={`hotspot ${done ? "done" : ""}`}
                style={inc.scenePos ? { left: inc.scenePos.left, top: inc.scenePos.top } : undefined}
                onClick={() => navigate({ name: "q1", experienceId: inc.experienceId })}
              >
                <span className="hotspot-icon" style={{ animationDelay: `${i * 0.35}s` }}>
                  {inc.image ? <img src={inc.image} alt="" /> : <span>{inc.emoji}</span>}
                  {done && <span className="hotspot-check">✓</span>}
                </span>
                <span className="hotspot-label">{inc.title}</span>
              </button>
            );
          })}
        </div>

        <p className="world-hint">気になるところをのぞいてみよう。ぜんぶ見なくてもOK！</p>
      </div>
    </div>
  );
}
