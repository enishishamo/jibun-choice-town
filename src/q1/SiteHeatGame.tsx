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

interface Slot {
  h: string;
  wbgt: number;
}
// WBGT（暑さ指数）は昼〜午後に高くなる
const SLOTS: Slot[] = [
  { h: "8時", wbgt: 25 },
  { h: "10時", wbgt: 29 },
  { h: "12時", wbgt: 33 },
  { h: "14時", wbgt: 32 },
  { h: "16時", wbgt: 28 },
];

type TaskId = "heavy1" | "heavy2" | "light" | "indoor" | "rest";
interface Task {
  id: TaskId;
  name: string;
  emoji: string;
  load: number; // 2=重い 1=軽い 0=休憩
  progress: number;
}
const TASKS: Task[] = [
  { id: "heavy1", name: "重い屋外作業", emoji: "🏗", load: 2, progress: 30 },
  { id: "heavy2", name: "重い屋外作業", emoji: "🧱", load: 2, progress: 30 },
  { id: "light", name: "軽い作業", emoji: "🔧", load: 1, progress: 15 },
  { id: "indoor", name: "屋内作業", emoji: "🏠", load: 0.5, progress: 15 },
  { id: "rest", name: "休憩", emoji: "🧊", load: 0, progress: 0 },
];

// 危険度：WBGTが高い時間に重い作業を置くほど上がる
const risk = (wbgt: number, load: number) => {
  if (load === 0) return 0;
  const score = (wbgt - 25) * load;
  return score >= 12 ? 2 : score >= 6 ? 1 : 0;
};
const RISK_MARK = ["🟢", "🟡", "🔴"];

export default function SiteHeatGame({ onComplete }: Q1GameProps) {
  const [plan, setPlan] = useState<Partial<Record<string, TaskId>>>({});
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

  const taskOf = (h: string) => TASKS.find((t) => t.id === plan[h]);
  const filled = SLOTS.every((s) => plan[s.h]);
  const progress = SLOTS.reduce((a, s) => a + (taskOf(s.h)?.progress ?? 0), 0);
  const risks = SLOTS.map((s) => {
    const t = taskOf(s.h);
    return t ? risk(s.wbgt, t.load) : 0;
  });
  const maxRisk = Math.max(...risks, 0);
  const heavyPlaced = SLOTS.filter((s) => (taskOf(s.h)?.load ?? 0) >= 2).length;

  const good = ran && maxRisk < 2 && progress >= 75;

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
