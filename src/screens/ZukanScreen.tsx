// しごと図鑑: the people you happened to meet on your adventure.
// Shows WHERE and through WHICH event each profession was met.
// Not a completion game — no counters, no "collect them all".
import { experiences, getEvent, places, professions } from "../data";
import { useGame } from "../state/GameState";

export default function ZukanScreen() {
  const { navigate, hasDiscovered, hasCompleted } = useGame();
  const discovered = professions.filter((p) => hasDiscovered(p.id));
  const unknownCount = professions.length - discovered.length;

  // Where did we meet this profession? (via the completed experience)
  const meeting = (professionId: string) => {
    const exp =
      experiences.find((x) => x.professionId === professionId && hasCompleted(x.id)) ??
      experiences.find((x) => x.professionId === professionId);
    const ev = exp && getEvent(exp.eventId);
    const place = ev && places.find((pl) => pl.id === ev.placeId);
    return { eventTitle: ev?.title.replace("\n", ""), placeName: place?.name };
  };

  return (
    <div className="screen zukan">
      <button className="back-link" onClick={() => navigate({ name: "home" })}>
        ← 街にもどる
      </button>
      <h2 className="zukan-title">📖 しごと図鑑</h2>
      <p className="zukan-lead">きみが冒険の中で出会った人たち。</p>

      {discovered.length === 0 ? (
        <div className="zukan-empty">
          <p>まだ出会った仕事はないみたい。</p>
          <p>街で気になることを見つけたら、のぞいてみよう！</p>
        </div>
      ) : (
        <div className="zukan-list">
          {discovered.map((p) => {
            const m = meeting(p.id);
            return (
              <button
                key={p.id}
                className="zukan-entry"
                onClick={() =>
                  navigate({ name: "profession", professionId: p.id, back: { name: "zukan" } })
                }
              >
                <img className="zukan-char" src={p.image} alt="" />
                <span className="zukan-info">
                  <span className="zukan-name">{p.name}</span>
                  <span className="zukan-catch">{p.catch}</span>
                  {m.placeName && (
                    <span className="zukan-meet">
                      🔥 {m.placeName}「{m.eventTitle}」で出会った
                    </span>
                  )}
                </span>
                <span className="zukan-arrow">▶</span>
              </button>
            );
          })}
        </div>
      )}

      {unknownCount > 0 && (
        <p className="zukan-more">この街には、まだ出会っていない仕事もいるみたい…</p>
      )}
    </div>
  );
}
