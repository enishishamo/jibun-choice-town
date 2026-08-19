// Q1 game: 給食調理員 — a scheduling game, not a cooking game.
// The child juggles limited equipment (one kama, one oven), cooking
// durations and a hard 12:15 deadline on a process chart (工程表),
// with a safety check (core temperature) breaking the plan mid-way.
// Structure: B (mission) -> C (equipment/tools) -> D (plan on the chart)
// -> unexpected event -> C (thermometer) -> D (re-plan) -> E (delivered).
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";

const A = (n: string) => `${import.meta.env.BASE_URL}assets/${n}.png`;

// ---- time model: 6 slots x 10min, 11:15 -> 12:15 ----
const START_MIN = 11 * 60 + 15;
const N_SLOTS = 6;
const SLOT_MIN = 10;
const fmt = (min: number) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, "0")}`;
const slotLabel = (i: number) => fmt(START_MIN + i * SLOT_MIN);

type StationId = "kama" | "oven" | "dish";
type TaskId = "soup" | "fish" | "veg" | "serve" | "reheat";

interface Station { id: StationId; name: string; img: string }
const STATIONS: Station[] = [
  { id: "kama", name: "回転釜", img: A("tool-kama") },
  { id: "oven", name: "オーブン", img: A("tool-oven") },
  { id: "dish", name: "配膳台", img: A("tool-tray") },
];

interface KTask {
  id: TaskId;
  name: string;
  emoji: string;
  station: StationId;
  slots: number; // duration in 10-min slots
}
const BASE_TASKS: KTask[] = [
  { id: "soup", name: "スープ", emoji: "🥣", station: "kama", slots: 3 },
  { id: "veg", name: "野菜のおかず", emoji: "🥕", station: "kama", slots: 2 },
  { id: "fish", name: "焼き魚", emoji: "🐟", station: "oven", slots: 3 },
  { id: "serve", name: "配缶（クラス分け）", emoji: "🍱", station: "dish", slots: 1 },
];
const REHEAT: KTask = { id: "reheat", name: "追加加熱", emoji: "🔥", station: "oven", slots: 1 };

type Placements = Partial<Record<TaskId, number>>;
type Phase = "brief" | "plan" | "run" | "aim" | "result" | "replan" | "finish";

const stationName = (id: StationId) => STATIONS.find((s) => s.id === id)!.name;

function getIssues(tasks: KTask[], pl: Placements, requireAll: boolean): string[] {
  const issues: string[] = [];
  const placed = tasks.filter((t) => pl[t.id] !== undefined);
  if (requireAll) {
    for (const t of tasks) {
      if (pl[t.id] === undefined) issues.push(`「${t.name}」がまだ工程表にない`);
    }
  }
  // equipment double-booking
  for (const st of STATIONS) {
    const here = placed.filter((t) => t.station === st.id);
    for (let i = 0; i < here.length; i++) {
      for (let j = i + 1; j < here.length; j++) {
        const a = here[i], b = here[j];
        const aS = pl[a.id]!, bS = pl[b.id]!;
        if (aS < bS + b.slots && bS < aS + a.slots) {
          issues.push(`${st.name}が同じ時間に重なってる！1つずつしか使えない`);
        }
      }
    }
  }
  // past the deadline
  for (const t of placed) {
    if (pl[t.id]! + t.slots > N_SLOTS) issues.push(`「${t.name}」が12:15を過ぎちゃう！`);
  }
  // serve must come after every cooking task
  const serveStart = pl.serve;
  if (serveStart !== undefined) {
    const cookEnds = placed.filter((t) => t.id !== "serve").map((t) => pl[t.id]! + t.slots);
    if (cookEnds.some((e) => e > serveStart)) issues.push("配缶は、ぜんぶの料理ができてから！");
  }
  // reheat must follow the fish
  if (pl.reheat !== undefined && pl.fish !== undefined) {
    if (pl.reheat < pl.fish + 3) issues.push("追加加熱は、焼き魚が焼けたあとに！");
  }
  return [...new Set(issues)];
}

export default function CookGame({ experience, onComplete }: Q1GameProps) {
  const [phase, setPhase] = useState<Phase>("brief");
  const [openTool, setOpenTool] = useState<string | null>(null);
  const [pl, setPl] = useState<Placements>({});
  const [selected, setSelected] = useState<TaskId | null>("soup");
  const [note, setNote] = useState<string | null>(null);
  const [eventMin, setEventMin] = useState(START_MIN);

  const tasks = phase === "replan" || phase === "finish" ? [...BASE_TASKS, REHEAT] : BASE_TASKS;
  const issues = getIssues(tasks, pl, false);
  const clock =
    phase === "brief" || phase === "plan" ? START_MIN : phase === "finish" ? 12 * 60 + 13 : eventMin;

  // ---------- C: the kitchen and its tools ----------
  if (phase === "brief") {
    return (
      <div className="game board-game">
        <img className="game-scene" src={experience.place.image} alt="給食室" />
        <div className="intro-monologue">
          <img src={A("char-cook")} alt="" />
          <div>
            <p>500人分を、あと60分で…！</p>
            <p className="intro-q">この給食室の設備と道具、ぜんぶ使って段取りを組もう。</p>
          </div>
        </div>
        <div className="tool-grid three">
          {experience.tools.map((t) => (
            <button
              key={t.id}
              className={`tool-card ${openTool === t.id ? "open" : ""}`}
              onClick={() => setOpenTool(openTool === t.id ? null : t.id)}
            >
              {t.image ? <img src={t.image} alt="" /> : <span className="tool-emoji">{t.emoji}</span>}
              <span className="tool-name">{t.name}</span>
              {openTool === t.id && <span className="tool-desc">{t.desc}</span>}
            </button>
          ))}
        </div>
        <button className="btn primary big" onClick={() => { setOpenTool(null); setPhase("plan"); }}>
          📋 工程表をひらいて段取り開始！
        </button>
      </div>
    );
  }

  // ---------- shared: clock bar ----------
  const clockBar = (
    <div className="clock-bar">
      <span className="clock-emoji">🕐</span>
      <span className="clock-now">{fmt(clock)}</span>
      <span className="clock-goal">
        {phase === "finish" ? "12:15に間に合った！" : `給食まであと${12 * 60 + 15 - clock}分`}
      </span>
    </div>
  );

  // ---------- shared: kitchen strip ----------
  const kitchenStrip = (interactive: boolean) => (
    <div className="kitchen-strip">
      {STATIONS.map((st) => {
        const cookingHere = tasks.filter((t) => t.station === st.id && pl[t.id] !== undefined);
        const isFishStation = st.id === "oven";
        return (
          <button
            key={st.id}
            className={`kstation ${interactive ? "aim" : ""} ${
              selected && tasks.find((t) => t.id === selected)?.station === st.id ? "hint" : ""
            }`}
            disabled={!interactive}
            onClick={() => {
              if (!interactive) return;
              if (isFishStation) {
                setPhase("result");
                setNote(null);
              } else if (st.id === "kama") {
                setNote("スープは95℃でぐつぐつ。こっちは大丈夫そう！はかるのは…？");
              } else {
                setNote("配膳台はまだ空っぽ。はかるのは…？");
              }
            }}
          >
            <img src={st.img} alt="" />
            <small>{st.name}</small>
            {cookingHere.length > 0 && (
              <span className="kstation-load">{cookingHere.map((t) => t.emoji).join("")}</span>
            )}
          </button>
        );
      })}
      <div className="kstation static">
        <span className="kstation-emoji">🍚</span>
        <small>炊飯器</small>
        <span className="kstation-load">〜11:50</span>
      </div>
    </div>
  );

  // ---------- shared: the process chart (工程表) ----------
  const chart = (
    <div className="sched">
      <div className="sched-head">
        <span className="sched-corner">📋 工程表</span>
        <div className="sched-times">
          {Array.from({ length: N_SLOTS }, (_, i) => (
            <span key={i}>{i % 2 === 0 ? slotLabel(i) : ""}</span>
          ))}
        </div>
        <span className="sched-flag">🚩12:15</span>
      </div>
      {STATIONS.map((st) => (
        <div key={st.id} className="sched-row">
          <span className="sched-station">
            <img src={st.img} alt="" />
            {st.name}
          </span>
          <div className="sched-track">
            {Array.from({ length: N_SLOTS }, (_, i) => (
              <button
                key={i}
                className={`sched-cell ${
                  selected && tasks.find((t) => t.id === selected)?.station === st.id ? "ready" : ""
                }`}
                onClick={() => {
                  if (!selected) {
                    setNote("先に下から料理をえらんでね");
                    return;
                  }
                  const task = tasks.find((t) => t.id === selected)!;
                  if (task.station !== st.id) {
                    setNote(`「${task.name}」は${stationName(task.station)}でやる仕事だよ`);
                    return;
                  }
                  setPl((p) => ({ ...p, [task.id]: i }));
                  setSelected(null);
                  setNote(null);
                }}
              />
            ))}
            {tasks
              .filter((t) => t.station === st.id && pl[t.id] !== undefined)
              .map((t) => {
                const s = pl[t.id]!;
                const late = s + t.slots > N_SLOTS;
                const conflicted = issues.some((i) => i.includes(stationName(st.id)) && i.includes("重なってる"));
                return (
                  <button
                    key={t.id}
                    className={`sched-block task-${t.id} ${late ? "late" : ""} ${conflicted ? "conflict" : ""}`}
                    style={{ left: `${(s / N_SLOTS) * 100}%`, width: `${(Math.min(t.slots, N_SLOTS - s) / N_SLOTS) * 100}%` }}
                    onClick={() => {
                      setPl((p) => {
                        const n = { ...p };
                        delete n[t.id];
                        return n;
                      });
                      setSelected(t.id);
                      setNote(null);
                    }}
                  >
                    {t.emoji} {late && "⚠"}
                  </button>
                );
              })}
          </div>
        </div>
      ))}
      <div className="sched-row rice">
        <span className="sched-station">
          <span className="kstation-emoji">🍚</span>炊飯器
        </span>
        <div className="sched-track">
          <span className="sched-block task-rice" style={{ left: 0, width: "58%" }}>
            🍚 ごはん（おまかせ）
          </span>
        </div>
      </div>
    </div>
  );

  // ---------- shared: task queue ----------
  const queue = (
    <div className="task-queue">
      {tasks
        .filter((t) => pl[t.id] === undefined)
        .map((t) => (
          <button
            key={t.id}
            className={`task-chip task-${t.id} ${selected === t.id ? "selected" : ""}`}
            onClick={() => {
              setSelected(selected === t.id ? null : t.id);
              setNote(null);
            }}
          >
            <span className="task-chip-name">{t.emoji} {t.name}</span>
            <small>{t.slots * SLOT_MIN}分・{stationName(t.station)}</small>
          </button>
        ))}
      {tasks.every((t) => pl[t.id] !== undefined) && (
        <span className="task-queue-empty">ぜんぶ配置した！上の工程表をチェック</span>
      )}
    </div>
  );

  // ---------- D: plan / re-plan on the chart ----------
  if (phase === "plan" || phase === "replan") {
    const allPlaced = tasks.every((t) => pl[t.id] !== undefined);
    const startIssues = getIssues(tasks, pl, true);
    return (
      <div className="game board-game">
        {clockBar}
        {phase === "replan" && (
          <div className="alert-box slim">
            <span className="big-emoji">🌡</span>
            <p>62℃だった…！「追加加熱（10分・オーブン）」を工程に入れて組み直そう。</p>
          </div>
        )}
        {kitchenStrip(false)}
        {chart}
        {queue}
        {selected && (
          <p className="game-line soft">
            「{tasks.find((t) => t.id === selected)?.name}」— {stationName(tasks.find((t) => t.id === selected)!.station)}の列の、始めたい時間をタップ！
          </p>
        )}
        {note && <p className="game-note">{note}</p>}
        {issues.length > 0 && (
          <div className="sched-issues">
            {issues.slice(0, 2).map((i) => (
              <p key={i}>⚠ {i}</p>
            ))}
          </div>
        )}
        <button
          className="btn primary big"
          onClick={() => {
            if (startIssues.length > 0) {
              setNote(`工程表を見直そう：${startIssues[0]}`);
              return;
            }
            setNote(null);
            if (phase === "plan") {
              setEventMin(START_MIN + (pl.fish! + 3) * SLOT_MIN);
              setPhase("run");
            } else {
              setPhase("finish");
            }
          }}
        >
          {allPlaced ? (phase === "plan" ? "この段取りでスタート！" : "組み直した段取りで再開！") : "料理を工程表にならべよう"}
        </button>
      </div>
    );
  }

  // ---------- unexpected event: is the fish really done? ----------
  if (phase === "run" || phase === "aim") {
    return (
      <div className="game board-game">
        {clockBar}
        {kitchenStrip(phase === "aim")}
        <div className="alert-box">
          <span className="big-emoji">⚠️</span>
          <p>焼き魚、本当に中まで焼けてる？500人が食べるんだよ…！</p>
        </div>
        {note && <p className="game-note">{note}</p>}
        {phase === "run" ? (
          <div className="tool-dock">
            {experience.tools
              .filter((t) => ["thermo", "plan", "clock"].includes(t.id))
              .map((t) => (
                <button
                  key={t.id}
                  className={`dock-btn ${t.id === "thermo" ? "pulse" : ""}`}
                  onClick={() => {
                    if (t.id === "thermo") {
                      setPhase("aim");
                      setNote("🌡 温度計を持った！はかりたい設備をタップ！");
                    } else if (t.id === "clock") {
                      setNote(`いま${fmt(clock)}。給食まであと${12 * 60 + 15 - clock}分！`);
                    } else {
                      setNote("工程表はバッチリ組んである。…でも安全のたしかめは？");
                    }
                  }}
                >
                  {t.image ? <img src={t.image} alt="" /> : <span>{t.emoji}</span>}
                  <small>{t.name}</small>
                </button>
              ))}
          </div>
        ) : (
          <p className="game-line soft">どの設備をはかる？</p>
        )}
      </div>
    );
  }

  // ---------- measurement result ----------
  if (phase === "result") {
    return (
      <div className="game board-game">
        {clockBar}
        <div className="measure-box">
          <img src={A("tool-thermo")} alt="中心温度計" />
          <p className="temp bad">中心温度 62℃</p>
          <p className="game-line">
            給食のルールは中心75℃以上・1分間。まだ足りない！<br />
            オーブンでの「追加加熱」が10分必要。…工程表が崩れちゃう！
          </p>
        </div>
        <button
          className="btn primary big"
          onClick={() => {
            setSelected("reheat");
            setNote(null);
            setPhase("replan");
          }}
        >
          📋 工程表をひらいて組み直す
        </button>
      </div>
    );
  }

  // ---------- E: everything comes together ----------
  return (
    <div className="game board-game">
      {clockBar}
      <div className="finish-checks">
        <span className="mchip ok">✓ 安全確認（85℃）</span>
        <span className="mchip ok">✓ ぜんぶの料理</span>
        <span className="mchip ok">✓ 500人分</span>
      </div>
      <div className="serve-anim">
        <img className="serve-tray" src={A("tool-tray")} alt="食缶" />
        <span className="serve-road" />
        <img className="serve-school" src={A("bg-school")} alt="教室へ" />
      </div>
      <p className="game-line center-line">
        できた！追加加熱もして、12:13。<br />
        給食が教室へ運ばれていく…
      </p>
      <button className="btn primary big" onClick={onComplete}>
        🎉 500人分、12:15に間に合った！
      </button>
    </div>
  );
}
