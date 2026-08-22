// Q1: 会場をつくる (gameType: venue_layout)
// B: からっぽの広場に、ステージもお店も休憩場所も置きたい。
// C: 会場の決まり（入口から見える／通路をふさがない／搬入口）を開いて
//    確認できる。見ないと「入口の正面に置くと通路がふさがる」が分からない。
// D: 会場マップの9マスに設備をドラッグ（またはタップ）で置く。置き方で
//    「見やすさ」「通りやすさ」が変わり、置き直せる。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import { useDragDrop } from "./useDragDrop";

const E = (n: string) => `${import.meta.env.BASE_URL}assets/event/${n}.jpg`;
const P = (n: string) => `${import.meta.env.BASE_URL}assets/event/${n}.png`;

interface Item { id: string; name: string; img: string; hint: string }
const ITEMS: Item[] = [
  { id: "stage", name: "ステージ", img: P("p_stage"), hint: "大きい。見える場所に。" },
  { id: "food", name: "飲食ブース", img: P("p_booth_food"), hint: "においと行列が出る。" },
  { id: "goods", name: "物販ブース", img: P("p_booth_goods"), hint: "立ち止まって見る人が多い。" },
  { id: "rest", name: "休けいスペース", img: P("p_rest_table"), hint: "すわって休む場所。" },
];

// 3x3 grid. row0 = 奥（ステージ向き）, row2 = 手前（入口側）
const CELLS = [
  { id: "c0", row: 0, col: 0 }, { id: "c1", row: 0, col: 1 }, { id: "c2", row: 0, col: 2 },
  { id: "c3", row: 1, col: 0 }, { id: "c4", row: 1, col: 1 }, { id: "c5", row: 1, col: 2 },
  { id: "c6", row: 2, col: 0 }, { id: "c7", row: 2, col: 1 }, { id: "c8", row: 2, col: 2 },
];
const ENTRANCE_COL = 1; // 入口は手前の中央

export default function VenueLayoutGame({ onComplete }: Q1GameProps) {
  const [placed, setPlaced] = useState<Record<string, string>>({}); // cellId -> itemId
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const put = (itemId: string, cellId: string) => {
    setPlaced((p) => {
      const n: Record<string, string> = {};
      // one of each item, one item per cell
      for (const [c, i] of Object.entries(p)) if (i !== itemId && c !== cellId) n[c] = i;
      n[cellId] = itemId;
      return n;
    });
    setSelected(null);
    setChecked(false);
    setNote(null);
  };
  const { drag, startDrag, surfaceProps } = useDragDrop(put, (id) =>
    setSelected(selected === id ? null : id),
  );

  const cellOf = (itemId: string) => Object.entries(placed).find(([, i]) => i === itemId)?.[0];
  const cell = (id?: string) => CELLS.find((c) => c.id === id);
  const allPlaced = ITEMS.every((i) => cellOf(i.id));

  // --- evaluation (all derived from the rules in the docs) ---
  const stage = cell(cellOf("stage"));
  const food = cell(cellOf("food"));
  const goods = cell(cellOf("goods"));
  const rest = cell(cellOf("rest"));

  const stageVisible = !!stage && stage.row === 0; // 奥に置くと客席から見える
  const pathClear = ![food, goods].some((c) => c && c.row === 2 && c.col === ENTRANCE_COL);
  const restQuiet = !!rest && !(rest.row === 0); // ステージ真横だとうるさい
  const issues: string[] = [];
  if (!stageVisible) issues.push("ステージが手前にあって、うしろの人から見えにくい…");
  if (!pathClear) issues.push("入口の正面にお店があって、入ってきた人がすぐ止まってしまう…");
  if (!restQuiet) issues.push("休けいスペースがステージのすぐ横。ゆっくり休めない…");
  const ok = allPlaced && issues.length === 0;

  const docs = [
    {
      id: "rule",
      icon: "📐",
      title: "会場のきまり",
      body: (
        <>
          <p><strong>入口の正面はあけておく</strong>。入ってきた人がすぐ止まると、うしろがつかえる。</p>
          <p>ステージは<strong>いちばん奥</strong>に置くと、うしろの人からも見えやすい。</p>
          <p>休けいスペースは、ステージから少しはなす。</p>
        </>
      ),
    },
    {
      id: "flow",
      icon: "🚶",
      title: "人の動き",
      body: (
        <>
          <p>お客さんは<strong>手前の入口</strong>から入ってくる。</p>
          <p>お店の前は、立ち止まる人が増える。</p>
        </>
      ),
    },
  ];

  if (done) {
    return (
      <div className="game board-game">
        <div className="scene-shot">
          <img src={E("venue_map")} alt="できあがった会場" />
          <span className="scene-shot-cap">会場ができあがった！</span>
        </div>
        <p className="game-line soft center-line">
          置き方はひとつじゃない。でも、通り道をふさがないことは共通の約束。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          この会場でいく！
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game" {...surfaceProps}>
      <div className="task-bar">
        <span className="task-now">会場に置いて、「ためす」でたしかめよう</span>
        <span className="task-sub">置いたものは、もう一度タップすると持ち上げられる</span>
      </div>

      <div
        className="venue-board"
        style={{ backgroundImage: `url(${E("venue_empty")})` }}
      >
        <span className="venue-back-label">▲ おく</span>
        <div className="venue-grid">
          {CELLS.map((c) => {
            const itemId = placed[c.id];
            const item = ITEMS.find((i) => i.id === itemId);
            return (
              <button
                key={c.id}
                className={`venue-cell ${item ? "filled" : ""} ${drag || selected ? "ready" : ""}`}
                data-drop={c.id}
                onClick={() => {
                  if (selected) { put(selected, c.id); return; }
                  // tap a placed item to pick it up again
                  if (itemId) {
                    setPlaced((p) => {
                      const n = { ...p };
                      delete n[c.id];
                      return n;
                    });
                    setSelected(itemId);
                    setChecked(false);
                    setNote(null);
                  }
                }}
              >
                {item ? (
                  <>
                    <img src={item.img} alt="" />
                    <small>{item.name}</small>
                  </>
                ) : (
                  <span className="venue-dot" />
                )}
              </button>
            );
          })}
        </div>
        <span className="venue-entrance">🚶 入口</span>
      </div>

      <div className="choice-row wrap">
        {ITEMS.filter((i) => !cellOf(i.id)).map((i) => (
          <button
            key={i.id}
            className={`venue-item drag-item ${selected === i.id ? "selected" : ""}`}
            onPointerDown={startDrag(i.id)}
          >
            <img src={i.img} alt="" />
            <span className="choice-name">{i.name}</span>
          </button>
        ))}
        {allPlaced && <span className="task-queue-empty">ぜんぶ置いた！「ためす」を押そう</span>}
      </div>

      {checked && issues.length > 0 && (
        <div className="sched-issues">
          {issues.map((i) => <p key={i}>{i}</p>)}
        </div>
      )}
      {checked && ok && (
        <div className="result-card good">
          <span className="result-title">いい配置！</span>
          <div className="result-rows">
            <span className="rrow"><b>ステージの見やすさ</b><span className="good">◎</span></span>
            <span className="rrow"><b>通りやすさ</b><span className="good">◎</span></span>
            <span className="rrow"><b>休けいのしやすさ</b><span className="good">◎</span></span>
          </div>
        </div>
      )}
      {note && <p className="game-note">{note}</p>}

      <InfoCards cards={docs} label="こまったら見る資料" />

      {!ok ? (
        <button
          className="btn primary big"
          disabled={!allPlaced}
          onClick={() => {
            setChecked(true);
            if (issues.length > 0) setNote("置き直して、もう一度ためしてみよう。📐会場のきまりも見られるよ。");
          }}
        >
          {allPlaced ? "▶ ためす" : "4つとも置いてみよう"}
        </button>
      ) : (
        <button className="btn primary big" onClick={() => setDone(true)}>
          設営する！
        </button>
      )}

      {drag && (
        <img
          className="drag-ghost-img"
          src={ITEMS.find((i) => i.id === drag.id)?.img}
          alt=""
          style={{ left: drag.x, top: drag.y }}
        />
      )}
    </div>
  );
}
