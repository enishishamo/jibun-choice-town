// Q1: 工事現場の安全と工程を守る仕事 (gameType: schedule_and_protect)
// B: 39℃の日。工事も進めたいが、働く人を守らなければならない。
// C: 時間ごとのWBGT（暑さ指数）／作業ごとの負荷／休憩設備。
//    WBGTを見ないと「どの時間が危険か」が分からない。
// D: 作業カードを朝〜夕のタイムラインへドラッグ →「この工程でやる」で
//    時間帯ごとの暑熱リスクと工事の進み具合が同時に変化。
//    全部休憩＝安全だが進まない／重作業を昼＝進むが危険。単一正解にしない。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import { useDragDrop } from "./useDragDrop";
import {
  SLOTS,
  TASKS,
  RISK_MARK,
  type TaskId,
  type Plan,
  taskOf as taskOfPlan,
  isFilled,
  totalProgress,
  risksFor,
  maxRiskFor,
  isSuccess,
} from "./siteHeatLogic";

export default function SiteHeatGame({ onComplete }: Q1GameProps) {
  const [plan, setPlan] = useState<Plan>({});
  const [ran, setRan] = useState(false);
  const [openWbgt, setOpenWbgt] = useState(false);
  const [selected, setSelected] = useState<TaskId | null>(null);

  const put = (itemId: string, zoneId: string) => {
    setPlan((p) => ({ ...p, [zoneId]: itemId as TaskId }));
    setSelected(null);
    setRan(false);
  };
  const { drag, startDrag, surfaceProps } = useDragDrop(put, (id) =>
    setSelected(selected === (id as TaskId) ? null : (id as TaskId)),
  );

  const taskOf = (h: string) => taskOfPlan(plan, h);
  const filled = isFilled(plan);
  const progress = totalProgress(plan);
  const risks = risksFor(plan);
  const maxRisk = maxRiskFor(plan);
  const heavyPlaced = SLOTS.filter((s) => (taskOf(s.h)?.load ?? 0) >= 2).length;

  const good = ran && isSuccess(plan);

  if (good) {
    return (
      <div className="game board-game">
        <p className="game-line center-line">
          夕方。工事は必要なところまで進み、作業員も全員ぶじに帰った。
        </p>
        <div className="mission-chips center-line">
          <span className="mchip ok">工事の進み {progress}%</span>
          <span className="mchip ok">暑熱リスク 低いまま</span>
        </div>
        <p className="game-line soft center-line">
          働く人を守りながら、街に必要な工事を進めた。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          現場をあとにする
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game" {...surfaceProps}>
      <div className="mission-bar">
        <span className="mission-bar-title">今日の工程を組もう（39℃の日）</span>
        <div className="mission-chips">
          <span className={`mchip ${ran ? (progress >= 75 ? "ok" : "soft") : ""}`}>
            工事の進み {ran ? `${progress}%` : "―"}
          </span>
          <span className={`mchip ${ran ? (maxRisk >= 2 ? "bad" : "ok") : ""}`}>
            作業員 {ran ? (maxRisk >= 2 ? "🔴 危険" : maxRisk === 1 ? "🟡 注意" : "🟢 安全") : "―"}
          </span>
        </div>
      </div>

      <button className={`layer-btn wide ${openWbgt ? "active" : ""}`} onClick={() => setOpenWbgt(!openWbgt)}>
        🌡 時間ごとのWBGT（暑さ指数）を見る
      </button>
      {openWbgt && (
        <div className="tool-panel">
          {SLOTS.map((s) => (
            <p key={s.h} className={s.wbgt >= 31 ? "bad" : ""}>
              {s.h}　WBGT {s.wbgt}
              {s.wbgt >= 31 && "　← 激しい作業は危険とされる目安"}
            </p>
          ))}
          <p className="soft-note">WBGTは気温だけでなく、湿度や日射も合わせた「暑さ指数」。</p>
        </div>
      )}

      {/* timeline */}
      <div className="timeline">
        {SLOTS.map((s, i) => {
          const t = taskOf(s.h);
          return (
            <button
              key={s.h}
              className={`tl-slot ${drag || selected ? "ready" : ""} ${ran && t ? `risk${risks[i]}` : ""}`}
              data-drop={s.h}
              onClick={() => {
                if (selected) put(selected, s.h);
              }}
            >
              <span className="tl-time">{s.h}</span>
              <span className="tl-wbgt">{openWbgt ? `WBGT ${s.wbgt}` : ""}</span>
              <span className="tl-task">
                {t ? `${t.emoji} ${t.name}` : "＋"}
              </span>
              {ran && t && <span className="tl-risk">{RISK_MARK[risks[i]]}</span>}
            </button>
          );
        })}
      </div>

      {ran && (
        <div className="sched-issues">
          {maxRisk >= 2 && (
            <p>🔴 {SLOTS[risks.indexOf(2)].h}：作業員がふらついている…（WBGT {SLOTS[risks.indexOf(2)].wbgt}）</p>
          )}
          {progress < 75 && <p>🟡 工事があまり進んでいない（{progress}%）。今日中に進めたい分がある。</p>}
        </div>
      )}

      {/* task cards */}
      <div className="choice-row wrap">
        {TASKS.map((t) => (
          <button
            key={t.id}
            className={`choice-card drag-item ${selected === t.id ? "selected" : ""}`}
            onPointerDown={startDrag(t.id)}
          >
            <span className="choice-emoji">{t.emoji}</span>
            <span className="choice-name">{t.name}</span>
            <small>{t.load >= 2 ? "負荷：重い" : t.load === 1 ? "負荷：軽い" : t.load === 0 ? "休む" : "負荷：とても軽い"}</small>
          </button>
        ))}
      </div>
      <p className="game-line soft">
        同じカードは何回でも置けるよ（重い作業は{heavyPlaced}か所配置ずみ）。
      </p>

      <div className="stack">
        <button className="btn primary big" disabled={!filled} onClick={() => setRan(true)}>
          {filled ? "▶ この工程でやる" : "5つの時間ぜんぶに置こう"}
        </button>
        {ran && (
          <button className="btn ghost" onClick={() => { setPlan({}); setRan(false); }}>
            工程表を組み直す
          </button>
        )}
      </div>

      {drag && (
        <div className="drag-ghost" style={{ left: drag.x, top: drag.y }}>
          {TASKS.find((t) => t.id === drag.id)?.emoji}
        </div>
      )}
    </div>
  );
}
