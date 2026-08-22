// Q1: 給食の食材を届ける仕事 (gameType: load_and_route)
// B: 朝7:30出発。2つの学校に、調理開始前の締切までに食材を届ける。
// D: ①食材を冷凍/冷蔵/常温の荷室へドラッグ ②地図で回る順番を決める。
//    まちがった積み方は学校の検収で「受け取れない」という“結果”で返り、
//    ルートミスは「間に合わない」で返る → 戻ってやり直す。
// E: 「運べた」ではなく「安全な状態で、時間までに届いた」。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import { useDragDrop } from "./useDragDrop";

type ZoneId = "frozen" | "cold" | "ambient";

interface Cargo {
  id: string;
  name: string;
  emoji: string;
  zone: ZoneId;
  school: "himawari" | "minami";
  failText: string;
}

const CARGO: Cargo[] = [
  { id: "fish", name: "生のさば", emoji: "🐟", zone: "cold", school: "himawari", failText: "さばの温度が上がっています。これでは受け取れません…" },
  { id: "potato", name: "じゃがいも", emoji: "🥔", zone: "ambient", school: "himawari", failText: "じゃがいもが冷えすぎ！味や質が落ちてしまいます（低温障害）…" },
  { id: "meat", name: "とり肉", emoji: "🍗", zone: "cold", school: "minami", failText: "とり肉の温度が上がっています。これでは受け取れません…" },
  { id: "croquette", name: "冷凍コロッケ", emoji: "🧊", zone: "frozen", school: "minami", failText: "冷凍コロッケがとけかけています。これでは受け取れません…" },
];

const ZONES: { id: ZoneId; label: string }[] = [
  { id: "frozen", label: "🧊 冷凍室（-18℃）" },
  { id: "cold", label: "❄️ 冷蔵室（5℃）" },
  { id: "ambient", label: "📦 常温室" },
];

const SCHOOLS = [
  { id: "himawari", name: "ひまわり小", note: "近い（20分）", deadline: "8:00まで" },
  { id: "minami", name: "みなみ小", note: "遠い（40分）", deadline: "8:30まで" },
] as const;

type Phase = "load" | "route" | "run";

export default function LogisticsGame({ onComplete }: Q1GameProps) {
  const [phase, setPhase] = useState<Phase>("load");
  const [placed, setPlaced] = useState<Record<string, ZoneId>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [order, setOrder] = useState<string[]>([]);
  const [runStep, setRunStep] = useState(0);
  const [note, setNote] = useState<string | null>(null);

  const put = (itemId: string, zoneId: string) => {
    setPlaced((p) => ({ ...p, [itemId]: zoneId as ZoneId }));
    setSelected(null);
    setNote(null);
  };
  const { drag, startDrag, surfaceProps } = useDragDrop(put, (id) =>
    setSelected(selected === id ? null : id),
  );

  const docs = [
    {
      id: "order",
      icon: "📄",
      title: "注文書",
      body: (
        <>
          <p>ひまわり小：生のさば・じゃがいも</p>
          <p>みなみ小：とり肉・冷凍コロッケ</p>
        </>
      ),
    },
    {
      id: "temp",
      icon: "🌡",
      title: "保存温度の資料",
      body: (
        <>
          <p>🧊 冷凍食品：<strong>-18℃以下</strong>のまま運ぶ</p>
          <p>🐟🍗 生の魚・肉：<strong>10℃以下</strong>で運ぶ</p>
          <p>🥔 じゃがいも：<strong>常温</strong>。冷やしすぎると味や質が落ちる（低温障害）</p>
        </>
      ),
    },
    {
      id: "map",
      icon: "🗺",
      title: "配送メモ",
      body: (
        <>
          <p>出発は7:30。ひまわり小まで20分・みなみ小まで40分（2校の間は30分）。</p>
          <p>納品しめきり：ひまわり小 <strong>8:00</strong>／みなみ小 <strong>8:30</strong>（どちらも調理開始前）。</p>
        </>
      ),
    },
  ];

  const allPlaced = CARGO.every((c) => placed[c.id]);

  // ---------- run: arrivals + 検収 ----------
  if (phase === "run") {
    const first = SCHOOLS.find((s) => s.id === order[0])!;
    const second = SCHOOLS.find((s) => s.id === order[1])!;
    const firstTime = first.id === "himawari" ? "7:50" : "8:10";
    const secondTime = first.id === "himawari" ? "8:20" : "8:40";
    const secondLate = first.id === "minami"; // ひまわり8:00に間に合わない

    const schools = [
      { s: first, time: firstTime, late: false },
      { s: second, time: secondTime, late: secondLate },
    ];
    const cur = schools[runStep];
    const wrongHere = CARGO.filter(
      (c) => c.school === cur.s.id && placed[c.id] !== c.zone,
    );

    return (
      <div className="game board-game">
        <div className="clock-bar">
          <span className="clock-emoji">🕐</span>
          <span className="clock-now">{cur.time}</span>
          <span className="clock-goal">{cur.s.name}に到着</span>
        </div>

        {cur.late ? (
          <>
            <div className="alert-box">
              <span className="big-emoji">😰</span>
              <p>{cur.s.name}のしめきりは8:00。{cur.time}では調理が始まってしまう…！</p>
            </div>
            <button
              className="btn primary big"
              onClick={() => {
                setOrder([]);
                setRunStep(0);
                setPhase("route");
              }}
            >
              🗺 回る順番を考え直す
            </button>
          </>
        ) : wrongHere.length > 0 ? (
          <>
            <div className="alert-box">
              <span className="big-emoji">🌡</span>
              <p>検収の人が温度をチェック…「{wrongHere[0].failText}」</p>
            </div>
            <p className="game-line soft">
              安全でないものは受け取ってもらえない。🌡保存温度の資料も見てみよう。
            </p>
            <button
              className="btn primary big"
              onClick={() => {
                setRunStep(0);
                setPhase("load");
              }}
            >
              🚚 センターへ戻って積み直す
            </button>
          </>
        ) : runStep === 0 ? (
          <>
            <div className="measure-box">
              <p className="game-line">検収の人が温度をチェック。</p>
              <p className="temp good">
                {CARGO.filter((c) => c.school === cur.s.id).map((c) => `${c.emoji} OK`).join("　")}
              </p>
              <p className="soft-note">「たしかに受け取りました！」</p>
            </div>
            <button className="btn primary big" onClick={() => setRunStep(1)}>
              つぎの学校へ出発！
            </button>
          </>
        ) : (
          <>
            <div className="measure-box">
              <p className="game-line">検収の人が温度をチェック。</p>
              <p className="temp good">
                {CARGO.filter((c) => c.school === cur.s.id).map((c) => `${c.emoji} OK`).join("　")}
              </p>
              <p className="soft-note">「たしかに受け取りました！」</p>
            </div>
            <p className="game-line center-line">
              2校とも、<strong>安全な状態で・時間までに</strong>届いた！
            </p>
            <button className="btn primary big" onClick={onComplete}>
              食材が給食室へ運ばれていく
            </button>
          </>
        )}
      </div>
    );
  }

  // ---------- route planning ----------
  if (phase === "route") {
    return (
      <div className="game board-game">
        <div className="clock-bar">
          <span className="clock-emoji">🕐</span>
          <span className="clock-now">7:30</span>
          <span className="clock-goal">どの順番で回る？</span>
        </div>
        <p className="game-line">
          学校をタップした順に回るよ。しめきりに間に合うかは🗺配送メモで確認！
        </p>
        <div className="choice-row">
          {SCHOOLS.map((s) => {
            const idx = order.indexOf(s.id);
            return (
              <button
                key={s.id}
                className={`school-card ${idx >= 0 ? "picked" : ""}`}
                onClick={() => {
                  setOrder((o) =>
                    o.includes(s.id) ? o.filter((x) => x !== s.id) : [...o, s.id],
                  );
                }}
              >
                {idx >= 0 && <span className="order-badge">{idx + 1}</span>}
                <span className="choice-name">🏫 {s.name}</span>
                <small>{s.note}</small>
                <small>納品 {s.deadline}</small>
              </button>
            );
          })}
        </div>
        <InfoCards cards={docs} label="こまったら見る資料" />
        <button
          className="btn primary big"
          disabled={order.length < 2}
          onClick={() => {
            setRunStep(0);
            setPhase("run");
          }}
        >
          {order.length < 2 ? "回る順番を決めよう" : "🚚 出発する！"}
        </button>
      </div>
    );
  }

  // ---------- load ----------
  return (
    <div className="game board-game" {...surfaceProps}>
      <div className="clock-bar">
        <span className="clock-emoji">🕐</span>
        <span className="clock-now">7:00</span>
        <span className="clock-goal">7:30に出発！</span>
      </div>
      <div className="mission-bar">
        <span className="mission-bar-title">食材を、正しい温度の荷室へ積みこもう</span>
        <div className="mission-chips">
          {CARGO.map((c) => (
            <span key={c.id} className={`mchip ${placed[c.id] ? "ok" : ""}`}>
              {placed[c.id] ? "✓" : "・"} {c.emoji}
            </span>
          ))}
        </div>
      </div>

      <div className="zone3">
        {ZONES.map((z) => (
          <button
            key={z.id}
            className={`truck-room ${drag || selected ? "ready" : ""}`}
            data-drop={z.id}
            onClick={() => {
              if (selected) put(selected, z.id);
            }}
          >
            <span className="truck-room-label">{z.label}</span>
            <span className="truck-room-items">
              {CARGO.filter((c) => placed[c.id] === z.id).map((c) => (
                <span
                  key={c.id}
                  className="cargo-chip placed drag-item"
                  onPointerDown={startDrag(c.id)}
                >
                  {c.emoji} {c.name}
                </span>
              ))}
            </span>
          </button>
        ))}
      </div>

      <div className="choice-row wrap">
        {CARGO.filter((c) => !placed[c.id]).map((c) => (
          <button
            key={c.id}
            className={`choice-card drag-item ${selected === c.id ? "selected" : ""}`}
            onPointerDown={startDrag(c.id)}
          >
            <span className="choice-emoji">{c.emoji}</span>
            <span className="choice-name">{c.name}</span>
          </button>
        ))}
        {allPlaced && <span className="task-queue-empty">ぜんぶ積んだ！</span>}
      </div>

      {note && <p className="game-note">{note}</p>}
      <InfoCards cards={docs} label="こまったら見る資料" />

      <button
        className="btn primary big"
        disabled={!allPlaced}
        onClick={() => setPhase("route")}
      >
        {allPlaced ? "つぎへ：回る順番を決める" : "食材を荷室へ積もう"}
      </button>

      {drag && (
        <div className="drag-ghost" style={{ left: drag.x, top: drag.y }}>
          {CARGO.find((c) => c.id === drag.id)?.emoji}
        </div>
      )}
    </div>
  );
}
