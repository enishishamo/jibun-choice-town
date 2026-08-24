// Q1: 旅行会社の教育旅行担当 (gameType: trip_plan)
// B: 学校からの依頼を、実現できる2泊3日の旅程にする。
// C: 各予定カードの時間・費用・学び・疲れやすさ。資料を見ないと
//    「乗換に何分いるか」「見学時間で足りるか」が分からない。
// D: 予定カードを1〜3日目のどこかへドラッグ（またはタップ）で入れる。
//    正解は1通りではなく、学び重視／ゆとり重視／費用重視など複数成立する。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import { useDragDrop } from "./useDragDrop";

interface Card {
  id: string;
  name: string;
  icon: string;
  time: number; // 分
  cost: number; // 予算ポイント
  learn?: boolean;
  tired: number; // 増える(+)か、休むと減る(-)
  cat: "move" | "visit" | "meal" | "rest" | "hotel" | "free";
}

const CARDS: Card[] = [
  { id: "shinkansen_go", name: "新幹線で京都へ", icon: "🚄", time: 210, cost: 40, tired: 2, cat: "move" },
  { id: "bus1", name: "バスにのりかえる", icon: "🚌", time: 30, cost: 5, tired: 1, cat: "move" },
  { id: "kiyomizu", name: "清水寺を見学する", icon: "⛩️", time: 90, cost: 10, learn: true, tired: 2, cat: "visit" },
  { id: "kinkaku", name: "金閣寺を見学する", icon: "🏯", time: 80, cost: 10, learn: true, tired: 2, cat: "visit" },
  { id: "nara", name: "奈良公園でシカとふれあう", icon: "🦌", time: 100, cost: 10, learn: true, tired: 1, cat: "visit" },
  { id: "todaiji", name: "東大寺の大仏を見学する", icon: "🗿", time: 70, cost: 10, learn: true, tired: 2, cat: "visit" },
  { id: "craft", name: "清水焼の絵付け体験をする", icon: "🎨", time: 100, cost: 15, learn: true, tired: 2, cat: "visit" },
  { id: "lunch1", name: "昼食をとる", icon: "🍱", time: 50, cost: 8, tired: -2, cat: "meal" },
  { id: "lunch2", name: "昼食をとる", icon: "🍱", time: 50, cost: 8, tired: -2, cat: "meal" },
  { id: "rest1", name: "休憩をとる", icon: "🪑", time: 20, cost: 0, tired: -2, cat: "rest" },
  { id: "free1", name: "自由時間・おみやげ", icon: "🎁", time: 60, cost: 10, tired: 1, cat: "free" },
  { id: "hotel_in", name: "旅館にチェックインする", icon: "🏮", time: 20, cost: 0, tired: -1, cat: "hotel" },
  { id: "bus2", name: "バスで学校へもどる準備", icon: "🚌", time: 20, cost: 5, tired: 1, cat: "move" },
  { id: "shinkansen_back", name: "新幹線で東京へ帰る", icon: "🚄", time: 150, cost: 40, tired: 2, cat: "move" },
];

const DAYS = [
  { id: "d1", label: "1日目", window: 600, note: "8:00 学校を出発 → 18:00までに宿へ" },
  { id: "d2", label: "2日目", window: 660, note: "8:00〜19:00 京都・奈良をまわる" },
  { id: "d3", label: "3日目", window: 480, note: "8:00 宿を出発 → 16:00までに学校へ" },
] as const;

const BUDGET = 220;
const TIRED_CAP = 16;

export default function TripPlanGame({ onComplete }: Q1GameProps) {
  const [days, setDays] = useState<Record<string, string[]>>({ d1: [], d2: [], d3: [] });
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const used = new Set(Object.values(days).flat());
  const pool = CARDS.filter((c) => !used.has(c.id));

  const place = (cardId: string, dayId: string) => {
    setDays((d) => {
      const n: Record<string, string[]> = { d1: [], d2: [], d3: [] };
      for (const [id, list] of Object.entries(d)) n[id] = list.filter((x) => x !== cardId);
      n[dayId] = [...n[dayId], cardId];
      return n;
    });
    setSelected(null);
    setChecked(false);
    setNote(null);
  };
  const { drag, startDrag, surfaceProps } = useDragDrop(place, (id) =>
    setSelected(selected === id ? null : id),
  );

  const dayCards = (id: string) => days[id].map((cid) => CARDS.find((c) => c.id === cid)!);
  const dayStats = (id: string) => {
    const list = dayCards(id);
    return {
      time: list.reduce((a, c) => a + c.time, 0),
      hasHotel: list.some((c) => c.cat === "hotel"),
      hasReturn: list.some((c) => c.id === "shinkansen_back"),
      hasRestOrMeal: list.some((c) => c.cat === "meal" || c.cat === "rest"),
    };
  };

  const learnTotal = CARDS.filter((c) => used.has(c.id) && c.learn).length;
  const costTotal = CARDS.filter((c) => used.has(c.id)).reduce((a, c) => a + c.cost, 0);
  const tiredTotal = CARDS.filter((c) => used.has(c.id)).reduce((a, c) => a + c.tired, 0);

  const issues: string[] = [];
  DAYS.forEach((d) => {
    const s = dayStats(d.id);
    if (s.time > d.window) issues.push(`${d.label}の予定が詰め込みすぎ。乗換や移動の時間が足りないかも。`);
  });
  if (learnTotal < 2) issues.push("学びになる見学・体験が、まだ少ないかも。もう1つ増やしてみよう。");
  if (!dayStats("d1").hasHotel) issues.push("1日目のうちに、宿に着けるようにしよう。");
  if (!dayStats("d2").hasRestOrMeal) issues.push("2日目に休憩や昼食がないと、100人が動きにくいよ。");
  if (!dayStats("d3").hasReturn) issues.push("3日目、学校へ帰る新幹線を入れよう。");
  if (costTotal > BUDGET) issues.push(`予算オーバー（${costTotal} / ${BUDGET}）。安く済む予定に変えてみよう。`);
  if (tiredTotal > TIRED_CAP) issues.push("このままだと、みんな疲れすぎてしまうかも。休憩を増やそう。");

  const enoughPlaced = used.size >= 8;
  const ok = issues.length === 0 && enoughPlaced;

  const tags: string[] = [];
  if (ok) {
    if (learnTotal >= 3) tags.push("学びが多い旅程");
    if (costTotal <= 180) tags.push("費用をおさえた旅程");
    if (tiredTotal <= 10) tags.push("ゆとりのある旅程");
    if (tags.length === 0) tags.push("バランスの取れた旅程");
  }

  const docs = [
    { id: "rule", icon: "📋", title: "旅程を組むときの決まり",
      body: (<>
        <p>2つ以上の<strong>学び</strong>になる見学・体験を入れる。</p>
        <p>1日目のうちに<strong>宿へ到着</strong>する。3日目は<strong>学校へ帰る新幹線</strong>を入れる。</p>
        <p>予算は<strong>{BUDGET}ポイント</strong>まで。休憩や昼食がないと、みんな疲れすぎてしまう。</p>
      </>) },
    { id: "time", icon: "🕐", title: "1日に使える時間",
      body: (<>{DAYS.map((d) => <p key={d.id}><strong>{d.label}</strong>：{d.note}（約{d.window}分）</p>)}</>) },
  ];

  if (done) {
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">2泊3日の旅程が組めた！</span>
          {tags.length > 0 && (
            <div className="choice-row wrap">
              {tags.map((t) => <span key={t} className="tstat ok">{t}</span>)}
            </div>
          )}
          <div className="result-rows">
            <span className="rrow"><b>学びになる体験</b><span className="good">{learnTotal}こ</span></span>
            <span className="rrow"><b>予算</b><span>{costTotal} / {BUDGET}</span></span>
          </div>
        </div>
        <p className="game-line soft center-line">
          学び・ゆとり・費用。どれを大事にするかで、正解は1つじゃない。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          この旅程で提案する
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game" {...surfaceProps}>
      <div className="task-bar">
        <span className="task-now">予定カードを、1〜3日目のどこかへ入れよう</span>
        <span className="task-sub">えらんでからカードをタップでも入れられる</span>
      </div>

      <div className="trip-daycols">
        {DAYS.map((d) => {
          const s = dayStats(d.id);
          return (
            <div
              key={d.id}
              className={`trip-daycol ${s.time > d.window ? "over" : ""} ${drag || selected ? "ready" : ""}`}
              data-drop={d.id}
              onClick={() => { if (selected) place(selected, d.id); }}
            >
              <span className="trip-day-label">{d.label}</span>
              <span className="trip-day-time">{s.time}分 / {d.window}分</span>
              <div className="trip-day-cards">
                {dayCards(d.id).map((c) => (
                  <button
                    key={c.id}
                    className={`trip-card placed drag-item ${selected === c.id ? "selected" : ""}`}
                    onPointerDown={startDrag(c.id)}
                  >
                    <span>{c.icon}</span>
                    <small>{c.name}</small>
                  </button>
                ))}
                {dayCards(d.id).length === 0 && <span className="trip-day-empty">ここへ入れる</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="choice-row wrap">
        {pool.map((c) => (
          <button
            key={c.id}
            className={`choice-card drag-item ${selected === c.id ? "selected" : ""}`}
            onPointerDown={startDrag(c.id)}
          >
            <span className="choice-emoji">{c.icon}</span>
            <span className="choice-name">{c.name}</span>
            <small>{c.time}分・{c.cost}pt{c.learn ? "・学び" : ""}</small>
          </button>
        ))}
        {pool.length === 0 && <span className="task-queue-empty">カードは全部使った</span>}
      </div>

      {checked && issues.length > 0 && (
        <div className="sched-issues">{issues.map((i) => <p key={i}>{i}</p>)}</div>
      )}
      {note && <p className="game-note">{note}</p>}
      <InfoCards cards={docs} label="こまったら見る資料" />

      {!ok ? (
        <button
          className="btn primary big"
          onClick={() => {
            setChecked(true);
            if (!enoughPlaced) { setNote("まだ予定が少ないかも。もう少しカードを入れてみよう。"); return; }
            if (issues.length > 0) setNote(null);
          }}
        >
          ▶ この旅程をたしかめる
        </button>
      ) : (
        <button className="btn primary big" onClick={() => setDone(true)}>
          この旅程で決める！
        </button>
      )}

      {drag && (
        <div className="drag-ghost" style={{ left: drag.x, top: drag.y }}>
          {CARDS.find((c) => c.id === drag.id)?.icon}
        </div>
      )}
    </div>
  );
}
