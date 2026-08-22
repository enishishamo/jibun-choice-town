// Q1: 給食の食材を届ける仕事
// B: 朝6:30。調理開始（9:00）前の8:30までに食材を学校へ。
// C: 注文書／保存温度の資料／トラック（冷蔵室・常温室）／納品時刻。
// D: 食材を正しい温度帯の荷室へ積み分ける。じゃがいも（冷やしすぎ
//    NG）や乾物など、資料を見ないと分からない品目を含む。
// E: 到着→学校側の検収（温度チェック）→給食室へ。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";

interface Cargo {
  id: string;
  name: string;
  emoji: string;
  room: "cold" | "ambient";
  why: string; // shown when misplaced (grounded in the C document)
}

const CARGO: Cargo[] = [
  { id: "fish", name: "生のさば", emoji: "🐟", room: "cold", why: "生の魚は10℃以下で運ぶ決まり。常温だといたんでしまう。" },
  { id: "milk", name: "牛乳", emoji: "🥛", room: "cold", why: "牛乳は10℃以下で運ぶ決まり。" },
  { id: "tofu", name: "とうふ", emoji: "🍲", room: "cold", why: "とうふは10℃以下。水といっしょに冷やして運ぶ。" },
  { id: "potato", name: "じゃがいも", emoji: "🥔", room: "ambient", why: "じゃがいもは冷やしすぎると味や質が落ちる（低温障害）。常温で運ぶ。" },
  { id: "wakame", name: "乾燥わかめ", emoji: "🌿", room: "ambient", why: "乾物は常温・乾燥した場所でOK。冷やす必要はない。" },
];

type Phase = "brief" | "load" | "arrive";

export default function LogisticsGame({ onComplete }: Q1GameProps) {
  const [phase, setPhase] = useState<Phase>("brief");
  const [placed, setPlaced] = useState<Record<string, "cold" | "ambient">>({});
  const [selected, setSelected] = useState<Cargo | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const docs = [
    {
      id: "order",
      icon: "📄",
      title: "学校からの注文書",
      body: (
        <>
          <p>本日納品：生のさば（切り身）／牛乳／とうふ／じゃがいも／乾燥わかめ</p>
          <p className="soft-note">納品先：ひまわり小学校 給食室</p>
        </>
      ),
    },
    {
      id: "temp",
      icon: "🌡",
      title: "保存温度の資料",
      body: (
        <>
          <p>🐟 生の魚・肉：<strong>10℃以下</strong>で運ぶ</p>
          <p>🥛 牛乳・とうふ：<strong>10℃以下</strong>で運ぶ</p>
          <p>🥔 じゃがいも：<strong>常温</strong>。冷やしすぎると味や質が落ちる（低温障害）</p>
          <p>🌿 乾物（わかめ・かんぴょう等）：<strong>常温</strong>・乾燥した場所</p>
        </>
      ),
    },
    {
      id: "truck",
      icon: "🚚",
      title: "トラックの情報",
      body: (
        <>
          <p>今日の車は2室タイプ。</p>
          <p>❄️ 冷蔵室（約5℃）／ 📦 常温室</p>
        </>
      ),
    },
    {
      id: "time",
      icon: "⏰",
      title: "納品時刻",
      body: (
        <>
          <p>学校の調理開始は9:00。</p>
          <p>その前の<strong>8:30まで</strong>に納品する約束。今は朝6:30。</p>
        </>
      ),
    },
  ];

  const allPlaced = CARGO.every((c) => placed[c.id]);
  const wrong = CARGO.filter((c) => placed[c.id] && placed[c.id] !== c.room);

  const place = (room: "cold" | "ambient") => {
    if (!selected) {
      setNote("先に下から食材をえらんでね");
      return;
    }
    setPlaced((p) => ({ ...p, [selected.id]: room }));
    setSelected(null);
    setNote(null);
  };

  if (phase === "brief") {
    return (
      <div className="game board-game">
        <div className="clock-bar">
          <span className="clock-emoji">🕐</span>
          <span className="clock-now">6:30</span>
          <span className="clock-goal">8:30までに学校へ納品！</span>
        </div>
        <p className="game-line">
          朝の物流センター。今日の食材を、トラックの<strong>❄️冷蔵室</strong>と<strong>📦常温室</strong>に積み分けよう。
          どっちに積むかは、資料に書いてある。
        </p>
        <button className="btn primary big" onClick={() => setPhase("load")}>
          資料を見て積みこみ開始！
        </button>
      </div>
    );
  }

  if (phase === "arrive") {
    return (
      <div className="game board-game">
        <div className="clock-bar">
          <span className="clock-emoji">🕐</span>
          <span className="clock-now">8:25</span>
          <span className="clock-goal">まにあった！</span>
        </div>
        <div className="measure-box">
          <p className="game-line">
            学校に到着。<strong>学校の検収担当の人</strong>が、届いた食材の温度をチェックする。
          </p>
          <p className="temp good">さば 4℃ ✓　牛乳 5℃ ✓</p>
          <p className="soft-note">
            ※受け取りの確認（検収）は学校側の仕事。届ける側は、渡すまでの温度と時間に責任を持つ。
          </p>
        </div>
        <button className="btn primary big" onClick={onComplete}>
          食材を給食室へ！
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="mission-bar">
        <span className="mission-bar-title">食材を正しい荷室へ積み分けよう</span>
        <div className="mission-chips">
          {CARGO.map((c) => (
            <span key={c.id} className={`mchip ${placed[c.id] ? "ok" : ""}`}>
              {placed[c.id] ? "✓" : "・"} {c.emoji}
            </span>
          ))}
        </div>
      </div>

      <InfoCards cards={docs} label="配送の資料" />

      <div className="truck-rooms">
        {(
          [
            { room: "cold" as const, label: "❄️ 冷蔵室（約5℃）" },
            { room: "ambient" as const, label: "📦 常温室" },
          ]
        ).map((r) => (
          <button
            key={r.room}
            className={`truck-room ${selected ? "ready" : ""}`}
            onClick={() => place(r.room)}
          >
            <span className="truck-room-label">{r.label}</span>
            <span className="truck-room-items">
              {CARGO.filter((c) => placed[c.id] === r.room).map((c) => (
                <button
                  key={c.id}
                  className="cargo-chip placed"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPlaced((p) => {
                      const n = { ...p };
                      delete n[c.id];
                      return n;
                    });
                    setSelected(c);
                  }}
                >
                  {c.emoji} {c.name}
                </button>
              ))}
            </span>
          </button>
        ))}
      </div>

      <div className="choice-row wrap">
        {CARGO.filter((c) => !placed[c.id]).map((c) => (
          <button
            key={c.id}
            className={`choice-card ${selected?.id === c.id ? "selected" : ""}`}
            onClick={() => {
              setSelected(selected?.id === c.id ? null : c);
              setNote(null);
            }}
          >
            <span className="choice-name">{c.emoji} {c.name}</span>
          </button>
        ))}
        {allPlaced && <span className="task-queue-empty">ぜんぶ積んだ！</span>}
      </div>

      {selected && (
        <p className="game-line soft">「{selected.name}」— どっちの荷室に積む？上をタップ！</p>
      )}
      {note && <p className="game-note">{note}</p>}

      <button
        className="btn primary big"
        disabled={!allPlaced}
        onClick={() => {
          if (wrong.length > 0) {
            const w = wrong[0];
            setNote(`待って、「${w.name}」は大丈夫？ 🌡保存温度の資料を見てみよう。${w.why}`);
            return;
          }
          setNote(null);
          setPhase("arrive");
        }}
      >
        {allPlaced ? "出発する！" : "ぜんぶの食材を積もう"}
      </button>
    </div>
  );
}
