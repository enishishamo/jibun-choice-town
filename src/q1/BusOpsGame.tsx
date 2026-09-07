// Q1: 貸切バスの運行管理者 (gameType: bus_ops)
// B: 3台のバスで、100人を安全に走らせる計画を作る。
// C: 定員・道路情報の資料。開かないと「山道ルートは工事で通行止め中」
//    が分からず、出発してから気づく。
// D: 班をバスへ・運転者をバスへ割りあて、経路と出発時こくを選ぶ → 出発
//    してみて、通行止めに当たったら選びなおす。
//
// 2026-09-07 repair (Continuous Product Loop, factory/state/audits/
// audit-summary.md GQ43/CA55): see busOpsLogic.ts for why the mountain
// route no longer ALWAYS fails regardless of choice.
//
// 2026-09-07 repair round 2 (independent review BLOCKER: an all-coast
// fleet, at any departure time, produced the identical full-success
// screen as correctly using mountain -- so the road-info card and the
// departure-time picker were never actually needed). isOptimalPlan now
// distinguishes that outcome; see busOpsLogic.ts.
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import { useDragDrop } from "./useDragDrop";
import { BANDS } from "./tripBands";
import { DEPARTURE_TIMES, ROUTES, hitsClosure, isOptimalPlan } from "./busOpsLogic";
import type { RouteId } from "./busOpsLogic";

interface Bus { id: string; name: string; icon: string }
const BUSES: Bus[] = [
  { id: "bus1", name: "1号車", icon: "🚌" },
  { id: "bus2", name: "2号車", icon: "🚐" },
  { id: "bus3", name: "3号車", icon: "🚍" },
];
const CAPACITY = 2; // 1台あたり最大2つの班

interface Driver { id: string; name: string; icon: string }
const DRIVERS: Driver[] = [
  { id: "d1", name: "運転士・田中さん", icon: "🧑‍✈️" },
  { id: "d2", name: "運転士・佐藤さん", icon: "👩‍✈️" },
  { id: "d3", name: "運転士・鈴木さん", icon: "🧑‍✈️" },
];

type Phase = "assign" | "route" | "run";

export default function BusOpsGame({ onComplete, onPartialComplete, hasCompleted }: Q1GameProps) {
  const [phase, setPhase] = useState<Phase>("assign");
  const [bandBus, setBandBus] = useState<Record<string, string>>({}); // bandId -> busId
  const [driverBus, setDriverBus] = useState<Record<string, string>>({}); // driverId -> busId
  const [selected, setSelected] = useState<string | null>(null);
  const [route, setRoute] = useState<Record<string, RouteId>>({});
  const [rest, setRest] = useState<Record<string, boolean>>({});
  const [departureId, setDepartureId] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  // 2026-09-07 repair round 2: staged hint on the closure failure, matching
  // TimetableGame's overAttempts pattern -- the first failure shows only
  // the consequence, later failures nudge toward (but don't name outright)
  // the road-info card's two solution dimensions.
  const [blockAttempts, setBlockAttempts] = useState(0);

  const putBand = (bandId: string, busId: string) => {
    setBandBus((p) => ({ ...p, [bandId]: busId }));
    setSelected(null);
    setNote(null);
  };
  const { drag, startDrag, surfaceProps } = useDragDrop(putBand, (id) =>
    setSelected(selected === id ? null : id),
  );

  const busOf = (busId: string) => BANDS.filter((b) => bandBus[b.id] === busId);
  const overCap = BUSES.some((bus) => busOf(bus.id).length > CAPACITY);
  const allBandsPlaced = BANDS.every((b) => bandBus[b.id]);
  const allDriversPlaced = BUSES.every((bus) => Object.entries(driverBus).some(([, b]) => b === bus.id));

  const docs = [
    { id: "cap", icon: "🪑", title: "定員の資料",
      body: <p>1台につき、乗れるのは<strong>2つの班まで</strong>。それ以上は乗り切れない。</p> },
    { id: "road", icon: "🚧", title: "道路情報",
      body: (
        <p>
          今日は山道ルートで工事が入り、<strong>9:00〜13:00の間は通行止め</strong>になる。
          それ以外の時こくなら山道ルートも通れる。海沿いルートはいつでも通行できる。
        </p>
      ) },
    { id: "rest", icon: "☕", title: "休憩の資料",
      body: <p>運転時間が長くなるときは、運転士の<strong>休憩</strong>をルートに入れる。</p> },
  ];

  if (phase === "run") {
    const hitClosed = blocked ? BUSES.find((bus) => route[bus.id] === "mountain") : undefined;
    if (hitClosed) {
      return (
        <div className="game board-game">
          <div className="alert-box">
            <span className="big-emoji">🚧</span>
            <p>{hitClosed.name}が山道ルートへ向かうと、「本日、通行止め」の看板が…！</p>
          </div>
          <p className="game-line soft">
            {blockAttempts === 0
              ? "予定どおりには走れなかった。組みなおしてみよう。"
              : "🚧道路情報の資料をもう一度見てみよう。手がかりがあるはず。"}
          </p>
          <button
            className="btn primary big"
            onClick={() => {
              setBlockAttempts((n) => n + 1);
              setBlocked(false);
              setPhase("route");
            }}
          >
            🗺 選びなおす
          </button>
        </div>
      );
    }
    const optimal = isOptimalPlan(departureId, route);
    return (
      <div className="game board-game">
        <div className={`result-card ${optimal ? "good" : ""}`}>
          <span className="result-title">
            {optimal ? "3台とも、無事に走らせられた！" : "3台とも走らせられたけど、ちょっと遠回りだった"}
          </span>
          {hasCompleted("safety-trip") && (
            <p className="game-line soft">さっき決めた5つの班が、そのままバスに乗りこんでいく。</p>
          )}
          <div className="result-rows">
            {BUSES.map((bus) => {
              const r = ROUTES.find((x) => x.id === route[bus.id])!;
              const drv = DRIVERS.find((d) => driverBus[d.id] === bus.id);
              return (
                <span key={bus.id} className="rrow">
                  <b>{bus.icon} {bus.name}</b>
                  <span>{drv?.name}・{r.name}</span>
                </span>
              );
            })}
          </div>
        </div>
        <p className="game-line soft center-line">
          {optimal
            ? "運ぶだけじゃない。定員・運転士・経路・休憩、すべてがそろって「安全に走る」になる。"
            : "この時こくなら山道も安全だった。海沿いルートは、こういうときは遠回りになる。"}
        </p>
        <button className="btn primary big" onClick={() => (optimal ? onComplete : (onPartialComplete ?? onComplete))()}>
          出発進行！
        </button>
      </div>
    );
  }

  if (phase === "route") {
    const allRouted = BUSES.every((bus) => route[bus.id]);
    const restMissing = BUSES.filter((bus) => {
      const r = ROUTES.find((x) => x.id === route[bus.id]);
      return r?.needsRest && !rest[bus.id];
    });
    return (
      <div className="game board-game">
        <div className="task-bar">
          <span className="task-now">バスごとに、走る経路を決めよう</span>
          <span className="task-sub">運転時間が長いときは、休憩も入れよう</span>
        </div>
        <div className="stack">
          {BUSES.map((bus) => {
            const r = ROUTES.find((x) => x.id === route[bus.id]);
            return (
              <div key={bus.id} className="trip-role-row">
                <span className="trip-role-label">{bus.icon} {bus.name}</span>
                <div className="choice-row wrap">
                  {ROUTES.map((opt) => (
                    <button
                      key={opt.id}
                      className={`btn choice ${route[bus.id] === opt.id ? "on" : ""}`}
                      onClick={() => setRoute((p) => ({ ...p, [bus.id]: opt.id }))}
                    >
                      <span className="tweak-check">{route[bus.id] === opt.id ? "✓" : "＋"}</span>
                      <span className="tweak-body"><b>{opt.name}</b></span>
                    </button>
                  ))}
                </div>
                {r?.needsRest && (
                  <button
                    className={`btn choice ${rest[bus.id] ? "on" : ""}`}
                    onClick={() => setRest((p) => ({ ...p, [bus.id]: !p[bus.id] }))}
                  >
                    <span className="tweak-check">{rest[bus.id] ? "✓" : "＋"}</span>
                    <span className="tweak-body"><b>☕ 休憩ポイントを入れる</b></span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* 2026-09-07 repair: departure time now genuinely determines
           whether the mountain route is safe (see busOpsLogic.ts) -- this
           is the single, shared time all 3 buses leave at. */}
        <p className="doc-label">出発する時こく</p>
        <div className="choice-row wrap">
          {DEPARTURE_TIMES.map((t) => (
            <button
              key={t.id}
              className={`btn choice ${departureId === t.id ? "on" : ""}`}
              onClick={() => setDepartureId(t.id)}
            >
              <span className="tweak-check">{departureId === t.id ? "✓" : "＋"}</span>
              <span className="tweak-body"><b>{t.label}</b></span>
            </button>
          ))}
        </div>

        {restMissing.length > 0 && (
          <div className="sched-issues">
            {restMissing.map((bus) => <p key={bus.id}>{bus.name}は運転時間が長いのに、休憩がまだないよ。</p>)}
          </div>
        )}
        <InfoCards cards={docs} label="こまったら見る資料" />
        <button
          className="btn primary big"
          disabled={!allRouted || !departureId}
          onClick={() => {
            if (restMissing.length > 0) return;
            setBlocked(hitsClosure(departureId, route));
            setPhase("run");
          }}
        >
          {!allRouted ? "3台とも経路を決めよう" : !departureId ? "出発する時こくを決めよう" : "🚌 出発する！"}
        </button>
      </div>
    );
  }

  // ---------- assign: 班をバスへ、運転士をバスへ ----------
  return (
    <div className="game board-game" {...surfaceProps}>
      <div className="task-bar">
        <span className="task-now">班をバスへ、運転士をバスへ割りあてよう</span>
        <span className="task-sub">1台につき、班は2つまで</span>
      </div>

      <div className="trip-board">
        <div className="venue-grid">
          {BUSES.map((bus) => {
            const bands = busOf(bus.id);
            const drv = DRIVERS.find((d) => driverBus[d.id] === bus.id);
            return (
              <button
                key={bus.id}
                className={`venue-cell ${bands.length > 0 ? "filled" : ""} ${bands.length > CAPACITY ? "over" : ""} ${drag || selected ? "ready" : ""}`}
                data-drop={bus.id}
                onClick={() => {
                  if (selected && BANDS.some((b) => b.id === selected)) { putBand(selected, bus.id); return; }
                  if (selected && DRIVERS.some((d) => d.id === selected)) {
                    setDriverBus((p) => ({ ...p, [selected]: bus.id }));
                    setSelected(null);
                  }
                }}
              >
                <span>{bus.icon}</span>
                <small>{bus.name}{bands.length ? `・${bands.map((b) => b.name).join("／")}` : ""}</small>
                <small>{drv ? drv.name : "運転士 未定"}</small>
              </button>
            );
          })}
        </div>
      </div>

      <p className="doc-label">班</p>
      <div className="choice-row wrap">
        {BANDS.filter((b) => !bandBus[b.id]).map((b) => (
          <button
            key={b.id}
            className={`venue-item drag-item ${selected === b.id ? "selected" : ""}`}
            onPointerDown={startDrag(b.id)}
          >
            <span className="choice-emoji">{b.icon}</span>
            <span className="choice-name">{b.name}</span>
          </button>
        ))}
        {BANDS.every((b) => bandBus[b.id]) && <span className="task-queue-empty">班は全部乗せた</span>}
      </div>

      <p className="doc-label">運転士</p>
      <div className="choice-row wrap">
        {DRIVERS.filter((d) => !driverBus[d.id]).map((d) => (
          <button
            key={d.id}
            className={`venue-item drag-item ${selected === d.id ? "selected" : ""}`}
            onPointerDown={startDrag(d.id)}
          >
            <span className="choice-emoji">{d.icon}</span>
            <span className="choice-name">{d.name}</span>
          </button>
        ))}
        {allDriversPlaced && <span className="task-queue-empty">運転士は全員決まった</span>}
      </div>

      {overCap && <p className="game-note">1台に班を乗せすぎているバスがあるよ。定員は2つの班まで。</p>}
      {note && <p className="game-note">{note}</p>}
      <InfoCards cards={docs} label="こまったら見る資料" />

      <button
        className="btn primary big"
        disabled={!allBandsPlaced || !allDriversPlaced || overCap}
        onClick={() => setPhase("route")}
      >
        {!allBandsPlaced ? "班をバスへ乗せよう" : !allDriversPlaced ? "運転士を割りあてよう" : overCap ? "定員をたしかめよう" : "つぎへ：経路を決める"}
      </button>

      {drag && (
        <div className="drag-ghost" style={{ left: drag.x, top: drag.y }}>
          {BANDS.find((b) => b.id === drag.id)?.icon ?? DRIVERS.find((d) => d.id === drag.id)?.icon}
        </div>
      )}
    </div>
  );
}
