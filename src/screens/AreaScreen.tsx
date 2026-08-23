// Area screen: an exploration scene, not a card list. Incidents float
// inside the place as tappable spots — the child decides where to poke.
// Still shows WHAT IS HAPPENING, never profession names.
//
// Two layouts:
//  - default: icons floating on a coloured backdrop (給食編・猛暑編)
//  - sceneMap: ONE wide illustration with hotspots placed on it, optionally
//    preceded by a full opening image (物価高編のアイス売り場)
// Once 2+ incidents are done, an event may show its "lens summary".
import { useState } from "react";
import { getEvent } from "../data";
import { useGame } from "../state/GameState";

const A = (n: string) => `${import.meta.env.BASE_URL}assets/${n}.png`;

export default function AreaScreen({ eventId }: { eventId: string }) {
  const { navigate, hasCompleted } = useGame();
  const event = getEvent(eventId);
  const opening = event?.sceneMap?.opening;
  const doneAny = event?.incidents.some((i) => hasCompleted(i.experienceId));
  // The opening picture is shown the first time only.
  const [showOpening, setShowOpening] = useState(!!opening && !doneAny);
  if (!event) return null;

  const doneCount = event.incidents.filter((i) => hasCompleted(i.experienceId)).length;

  // ---- 章（前半／後半）----
  const chapters = event.chapters;
  const chapterDone = (idx: number) =>
    !!chapters &&
    chapters[idx].incidentIds.every((id) => {
      const inc = event.incidents.find((x) => x.id === id);
      return inc ? hasCompleted(inc.experienceId) : true;
    });
  const chapterOpen = (idx: number) => idx === 0 || chapterDone(idx - 1);
  // 最初はまだ終わっていない章を開く（全部おわっていれば最後の章）
  const defaultChapter = chapters
    ? Math.max(0, chapters.findIndex((_, i) => !chapterDone(i)))
    : 0;
  const [chapterPick, setChapterPick] = useState<number | null>(null);
  const chapterIdx = chapterPick ?? defaultChapter;
  const chapter = chapters?.[chapterIdx];
  const [lockNote, setLockNote] = useState<string | null>(null);
  const spots = chapter
    ? chapter.incidentIds
        .map((id) => event.incidents.find((x) => x.id === id))
        .filter((x): x is NonNullable<typeof x> => !!x)
    : event.incidents;
  const showLenses = !!event.lensSummary && doneCount >= 2;
  const allDone = doneCount === event.incidents.length;
  const wrapUp =
    allDone && event.wrapUp ? (
      <div className={`wrapup ${event.wrapUp.beforeAfter ? "wrapup-ba" : ""}`}>
        {event.wrapUp.beforeAfter && (
          <div className="ba-row">
            <figure className="ba-item">
              <img src={event.wrapUp.beforeAfter.before} alt="" />
              <figcaption>{event.wrapUp.beforeAfter.beforeLabel}</figcaption>
            </figure>
            <span className="ba-arrow">→</span>
            <figure className="ba-item">
              <img src={event.wrapUp.beforeAfter.after} alt="" />
              <figcaption>{event.wrapUp.beforeAfter.afterLabel}</figcaption>
            </figure>
          </div>
        )}
        {!event.wrapUp.beforeAfter && event.wrapUp.image && <img src={event.wrapUp.image} alt="" />}
        <div className="wrapup-body">
          <p className="wrapup-title">{event.wrapUp.title}</p>
          {event.wrapUp.lines.map((l) => (
            <p key={l} className="wrapup-line">{l}</p>
          ))}
        </div>
      </div>
    ) : null;

  // ---------- opening: the shop shelf ----------
  if (showOpening && opening) {
    return (
      <div className="screen world-screen">
        <div className={`scene ${event.mood ? `mood-${event.mood}` : ""}`}>
          <div className="scene-top">
            <button className="back-chip" onClick={() => navigate({ name: "home" })}>
              ← 街
            </button>
          </div>
          <div className="opening-stage">
            <img className="opening-img" src={opening.image} alt={event.areaName} />
          </div>
          <div className="opening-copy">
            <h2>
              {event.title.split("\n").map((l) => (
                <span key={l}>{l}<br /></span>
              ))}
            </h2>
            {opening.lines.map((l) => (
              <p key={l}>{l}</p>
            ))}
          </div>
          <div className="opening-action">
            <button className="btn primary big" onClick={() => setShowOpening(false)}>
              {opening.cta ?? "うら側を見てみる"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- scene map: one wide illustration with hotspots ----------
  if (event.sceneMap) {
    return (
      <div className="screen world-screen">
        <div className={`scene ${event.mood ? `mood-${event.mood}` : ""}`}>
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

          {chapters && (
            <div className="chapter-tabs">
              {chapters.map((c, i) => {
                const open = chapterOpen(i);
                return (
                  <button
                    key={c.id}
                    className={`chapter-tab ${i === chapterIdx ? "on" : ""} ${open ? "" : "locked"}`}
                    onClick={() => {
                      if (!open) { setLockNote(c.lockedHint ?? "まだ、ここまで進んでいない。"); return; }
                      setLockNote(null);
                      setChapterPick(i);
                    }}
                  >
                    {open ? "" : "🔒 "}{c.tab}
                    {chapterDone(i) && " ✓"}
                  </button>
                );
              })}
            </div>
          )}

          <p className="map-lead">
            {(chapter ? `${chapter.title}\n${chapter.lead}` : event.areaLead).split("\n").map((l) => (
              <span key={l}>{l}<br /></span>
            ))}
          </p>

          <div className="map-scroller">
            <div className="map-inner">
              <img className="map-img" src={chapter?.image ?? event.sceneMap.image} alt={event.areaName} />
              {spots.map((inc) => {
                const done = hasCompleted(inc.experienceId);
                const locked = !!inc.requires?.some((r) => !hasCompleted(r));
                return (
                  <button
                    key={inc.id}
                    className={`map-spot ${done ? "done" : ""} ${locked ? "locked" : ""}`}
                    style={inc.scenePos ? { left: inc.scenePos.left, top: inc.scenePos.top } : undefined}
                    onClick={() => {
                      if (locked) { setLockNote(inc.requiresHint ?? "これは、もう少しあとみたい。"); return; }
                      navigate({ name: "q1", experienceId: inc.experienceId });
                    }}
                  >
                    <span className="map-spot-ring">
                      <span className="map-spot-emoji">{locked ? "🔒" : inc.emoji}</span>
                      {done && <span className="hotspot-check">✓</span>}
                    </span>
                    <span className="map-spot-label">{inc.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <p className="scroll-hint">← 横にスワイプして見てみよう →</p>
          {lockNote && <p className="game-note map-note">{lockNote}</p>}

          {chapter?.clear && chapterDone(chapterIdx) && (
            <div className="chapter-clear">
              <p className="chapter-clear-title">{chapter.clear.title}</p>
              {chapter.clear.lines.map((l) => (
                <p key={l} className="chapter-clear-line">{l}</p>
              ))}
              {chapters && chapterIdx + 1 < chapters.length && (
                <button
                  className="btn primary big"
                  onClick={() => { setLockNote(null); setChapterPick(chapterIdx + 1); }}
                >
                  {chapter.clear.cta ?? "つづきへ"}
                </button>
              )}
            </div>
          )}

          {wrapUp}
          {showLenses && event.lensSummary && (
            <div className="lens-box">
              <p className="lens-intro">{event.lensSummary.intro}</p>
              <div className="lens-rows">
                {event.lensSummary.rows.map((r) => (
                  <span key={r.label} className="lens-row">
                    <span className="lens-icon">{r.icon}</span>
                    <span className="lens-label">{r.label}</span>
                    <span className="lens-arrow">→</span>
                    <span className="lens-view">{r.view}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="world-hint">
            {chapters
              ? "この人の時間の流れにそって、順番に追いかけてみよう。"
              : "気になるところに入ってみよう。ぜんぶやらなくてもOK！"}
          </p>
        </div>
      </div>
    );
  }

  // ---------- default layout ----------
  return (
    <div className="screen world-screen">
      <div className={`scene ${event.mood ? `mood-${event.mood}` : ""}`}>
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
          <img
            className="scene-school"
            src={event.sceneImage ?? A("bg-school")}
            alt={event.areaName}
          />
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
                  {inc.image ? (
                    <img className={inc.imageFit === "scene" ? "fit-scene" : ""} src={inc.image} alt="" />
                  ) : (
                    <span>{inc.emoji}</span>
                  )}
                  {done && <span className="hotspot-check">✓</span>}
                </span>
                <span className="hotspot-label">{inc.title}</span>
              </button>
            );
          })}
        </div>

        {wrapUp}
        {showLenses && event.lensSummary && (
          <div className="lens-box">
            <p className="lens-intro">{event.lensSummary.intro}</p>
            <div className="lens-rows">
              {event.lensSummary.rows.map((r) => (
                <span key={r.label} className="lens-row">
                  <span className="lens-icon">{r.icon}</span>
                  <span className="lens-label">{r.label}</span>
                  <span className="lens-arrow">→</span>
                  <span className="lens-view">{r.view}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="world-hint">気になるところをのぞいてみよう。ぜんぶ見なくてもOK！</p>
      </div>
    </div>
  );
}
