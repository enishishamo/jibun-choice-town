// Q1: ホテル・旅館の団体受入担当 (gameType: hotel_receive)
// B: 学校から届いた班の情報を、宿の部屋・食事・入浴へ受け入れる。
// C: 学校から届いた班情報。開かないと、どの班に配慮が必要かが
//    分からない。班そのものは、宿がゼロから決めるものではない。
// D: 部屋 → 食事 → 入浴の3段階で、学校からの班情報を宿の設備へ
//    組み合わせる。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import { useDragDrop } from "./useDragDrop";
import { BANDS } from "./tripBands";

const ROOM_CELLS = [
  { id: "r0", row: 0, col: 0 }, { id: "r1", row: 0, col: 1 }, { id: "r2", row: 0, col: 2 },
  { id: "r3", row: 1, col: 0 }, { id: "r4", row: 1, col: 1 }, { id: "r5", row: 1, col: 2 },
  { id: "r6", row: 2, col: 0 }, { id: "r7", row: 2, col: 1 }, { id: "r8", row: 2, col: 2 },
];
const STAFF_ID = "staff"; // 引率者部屋
const SLOTS = [
  { id: "s1", label: "1回目（17:00〜）" },
  { id: "s2", label: "2回目（17:40〜）" },
  { id: "s3", label: "3回目（18:20〜）" },
];
const BATH_CAP = 2;

type Stage = "room" | "meal" | "bath";

export default function HotelReceiveGame({ onComplete }: Q1GameProps) {
  const [stage, setStage] = useState<Stage>("room");
  const [roomOf, setRoomOf] = useState<Record<string, string>>({}); // itemId -> cellId
  const [selected, setSelected] = useState<string | null>(null);
  const [roomChecked, setRoomChecked] = useState(false);
  const [openedDocs, setOpenedDocs] = useState<string[]>([]);
  const [meal, setMeal] = useState<Record<string, "normal" | "allergy">>({});
  const [mealChecked, setMealChecked] = useState(false);
  const [bathOf, setBathOf] = useState<Record<string, string>>({});
  const [bathChecked, setBathChecked] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const items = [...BANDS.map((b) => b.id), STAFF_ID];
  const put = (itemId: string, cellId: string) => {
    setRoomOf((p) => {
      const n: Record<string, string> = {};
      for (const [c, i] of Object.entries(p)) if (i !== itemId && c !== cellId) n[c] = i;
      n[cellId] = itemId;
      return n;
    });
    setSelected(null);
    setRoomChecked(false);
    setNote(null);
  };
  const { drag, startDrag, surfaceProps } = useDragDrop(put, (id) =>
    setSelected(selected === id ? null : id),
  );
  const cellOf = (itemId: string) => Object.entries(roomOf).find(([, i]) => i === itemId)?.[0];
  const cell = (id?: string) => ROOM_CELLS.find((c) => c.id === id);

  const allRoomed = items.every((i) => cellOf(i));
  const hanaCell = cell(cellOf("hana"));
  const staffCell = cell(cellOf(STAFF_ID));
  const staffNear =
    !!hanaCell && !!staffCell &&
    Math.abs(hanaCell.row - staffCell.row) <= 1 && Math.abs(hanaCell.col - staffCell.col) <= 1;

  const roomIssues: string[] = [];
  if (!allRoomed) roomIssues.push("まだ部屋が決まっていない班があるよ。");
  if (allRoomed && !staffNear) roomIssues.push("引率者の部屋が、花組の部屋から離れすぎているよ。近くにしよう。");
  if (!openedDocs.includes("info")) roomIssues.push("学校から届いた班の情報を、まだ確認していないよ。");
  const roomOk = roomIssues.length === 0;

  const mealOk = meal["hana"] === "allergy" && BANDS.filter((b) => b.id !== "hana").every((b) => meal[b.id] !== "allergy");

  const bathCountOf = (slotId: string) => Object.values(bathOf).filter((s) => s === slotId).length;
  const allBathed = BANDS.every((b) => bathOf[b.id]);
  const overBath = SLOTS.some((s) => bathCountOf(s.id) > BATH_CAP);
  const bathOk = allBathed && !overBath;

  const infoDocs = [
    { id: "info", icon: "📋", title: "学校から届いた班の情報",
      body: (<>
        <p>花組：卵・乳製品のアレルギーがある子が1人。食事は<strong>別トレー</strong>で。</p>
        <p>月組：バスに酔いやすい子が1人。到着後、少し休ませたい。</p>
      </>) },
    { id: "rooms", icon: "🚪", title: "この宿の部屋",
      body: <p>9部屋のうち、6部屋を使う。引率者の部屋は、班の部屋のそばに置く。</p> },
  ];

  if (done) {
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">100人を、受け入れる準備ができた！</span>
          <div className="result-rows">
            <span className="rrow"><b>🚪 部屋</b><span className="good">花組の近くに引率者の部屋</span></span>
            <span className="rrow"><b>🍱 食事</b><span className="good">花組はアレルギー対応食</span></span>
            <span className="rrow"><b>🛁 入浴</b><span className="good">3回に分けて、混みすぎない</span></span>
          </div>
        </div>
        <p className="game-line soft center-line">
          班は学校が作ったもの。宿の仕事は、その班を部屋・食事・入浴へ、うまく受け止めること。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          お出むかえする！
        </button>
      </div>
    );
  }

  if (stage === "room") {
    return (
      <div className="game board-game" {...surfaceProps}>
        <div className="task-bar">
          <span className="task-now">班と引率者の部屋を決めよう</span>
          <span className="task-sub">置いたものは、もう一度タップすると持ち上げられる</span>
        </div>
        <div className="trip-board">
          <div className="venue-grid">
            {ROOM_CELLS.map((c) => {
              const itemId = roomOf[c.id];
              const band = BANDS.find((b) => b.id === itemId);
              return (
                <button
                  key={c.id}
                  className={`venue-cell ${itemId ? "filled" : ""} ${drag || selected ? "ready" : ""}`}
                  data-drop={c.id}
                  onClick={() => {
                    if (selected) { put(selected, c.id); return; }
                    if (itemId) {
                      setRoomOf((p) => { const n = { ...p }; delete n[c.id]; return n; });
                      setSelected(itemId);
                      setRoomChecked(false);
                    }
                  }}
                >
                  <span>{band ? band.icon : itemId === STAFF_ID ? "🧑‍🏫" : "🚪"}</span>
                  <small>{band ? band.name : itemId === STAFF_ID ? "引率者" : ""}</small>
                </button>
              );
            })}
          </div>
        </div>
        <div className="choice-row wrap">
          {BANDS.filter((b) => !cellOf(b.id)).map((b) => (
            <button key={b.id} className={`venue-item drag-item ${selected === b.id ? "selected" : ""}`} onPointerDown={startDrag(b.id)}>
              <span className="choice-emoji">{b.icon}</span>
              <span className="choice-name">{b.name}</span>
            </button>
          ))}
          {!cellOf(STAFF_ID) && (
            <button className={`venue-item drag-item ${selected === STAFF_ID ? "selected" : ""}`} onPointerDown={startDrag(STAFF_ID)}>
              <span className="choice-emoji">🧑‍🏫</span>
              <span className="choice-name">引率者</span>
            </button>
          )}
        </div>
        {roomChecked && roomIssues.length > 0 && (
          <div className="sched-issues">{roomIssues.map((i) => <p key={i}>{i}</p>)}</div>
        )}
        <InfoCards cards={infoDocs} label="こまったら見る資料" onOpen={(id) => setOpenedDocs((o) => (o.includes(id) ? o : [...o, id]))} />
        {!roomOk ? (
          <button className="btn primary big" onClick={() => setRoomChecked(true)}>▶ 部屋割りをたしかめる</button>
        ) : (
          <button className="btn primary big" onClick={() => setStage("meal")}>つぎへ：食事を準備する</button>
        )}
        {drag && (
          <div className="drag-ghost" style={{ left: drag.x, top: drag.y }}>
            {BANDS.find((b) => b.id === drag.id)?.icon ?? "🧑‍🏫"}
          </div>
        )}
      </div>
    );
  }

  if (stage === "meal") {
    return (
      <div className="game board-game">
        <div className="task-bar">
          <span className="task-now">それぞれの班に、正しい食事を用意しよう</span>
          <span className="task-sub">花組には、別トレーの対応食が必要</span>
        </div>
        <div className="stack">
          {BANDS.map((b) => (
            <div key={b.id} className="trip-role-row">
              <span className="trip-role-label">{b.icon} {b.name}</span>
              <div className="choice-row wrap">
                {(["normal", "allergy"] as const).map((t) => (
                  <button
                    key={t}
                    className={`btn choice ${meal[b.id] === t ? "on" : ""}`}
                    onClick={() => { setMeal((p) => ({ ...p, [b.id]: t })); setMealChecked(false); }}
                  >
                    <span className="tweak-check">{meal[b.id] === t ? "✓" : "＋"}</span>
                    <span className="tweak-body"><b>{t === "normal" ? "🍚 通常食" : "🥚🥛 アレルギー対応食（別トレー）"}</b></span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {mealChecked && !mealOk && (
          <div className="sched-issues">
            <p>花組には、アレルギー対応食を用意しよう。ほかの班は通常食でいいよ。</p>
          </div>
        )}
        <InfoCards cards={infoDocs} label="こまったら見る資料" />
        {!mealOk ? (
          <button className="btn primary big" onClick={() => setMealChecked(true)}>▶ 食事をたしかめる</button>
        ) : (
          <button className="btn primary big" onClick={() => setStage("bath")}>つぎへ：入浴の時間を決める</button>
        )}
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">お風呂の時間を、班ごとに分けよう</span>
        <span className="task-sub">1回につき、2つの班まで</span>
      </div>
      <div className="stack">
        {BANDS.map((b) => (
          <div key={b.id} className="trip-role-row">
            <span className="trip-role-label">{b.icon} {b.name}</span>
            <div className="choice-row wrap">
              {SLOTS.map((s) => (
                <button
                  key={s.id}
                  className={`btn choice ${bathOf[b.id] === s.id ? "on" : ""}`}
                  onClick={() => { setBathOf((p) => ({ ...p, [b.id]: s.id })); setBathChecked(false); }}
                >
                  <span className="tweak-check">{bathOf[b.id] === s.id ? "✓" : "＋"}</span>
                  <span className="tweak-body"><b>🛁 {s.label}</b></span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {bathChecked && !bathOk && (
        <div className="sched-issues">
          {!allBathed && <p>まだ時間が決まっていない班があるよ。</p>}
          {overBath && <p>1回に2つの班をこえて入れているよ。すこし分けよう。</p>}
        </div>
      )}
      {note && <p className="game-note">{note}</p>}
      {!bathOk ? (
        <button className="btn primary big" onClick={() => setBathChecked(true)}>▶ 入浴の時間をたしかめる</button>
      ) : (
        <button className="btn primary big" onClick={() => setDone(true)}>受け入れ計画をまとめる</button>
      )}
    </div>
  );
}
