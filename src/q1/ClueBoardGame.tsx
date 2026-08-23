// Q1: 医師（前半）— たんていメモ型 (gameType: clue_board)
// B: 息苦しい・熱がある人が来た。何が起きている？
// C: 問診・身体診察・バイタルの3つの調べ方。バイタルの数字は「これって
//    どういう意味？」で基準を開くまで、良し悪しが分からない。
// D: 自分で調べ方を選ぶ → 手がかりがメモにたまる → 集まると「からだの
//    中はまだ分からない」に行き当たり、検査を考える。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";

interface Clue { id: string; text: string; from: string }

const ASK: { id: string; q: string; a: string; clue?: Clue }[] = [
  { id: "when", q: "いつから？", a: "「3日くらい前から、熱っぽくてね」", clue: { id: "c1", text: "3日前から発熱", from: "話" } },
  { id: "how", q: "どんな感じ？", a: "「せきが出て、動くと息が苦しい」", clue: { id: "c2", text: "咳・動くと息苦しい", from: "話" } },
  { id: "eat", q: "ごはんは食べられてる？", a: "「あんまり食べられてないな…」", clue: { id: "c3", text: "食欲が落ちている", from: "話" } },
  { id: "usual", q: "いつもと違うことは？", a: "「ふだんは畑にも出てるんだけど、今日は起きるのもつらい」", clue: { id: "c4", text: "ふだんより動けない", from: "話" } },
  { id: "hurt", q: "どこか痛いところは？", a: "「痛みはとくにないよ」" },
];

const EXAM: { id: string; label: string; result: string; clue?: Clue }[] = [
  { id: "chest-r", label: "胸の右側を聴く", result: "ゼーゼー、プツプツという音が聞こえる", clue: { id: "c5", text: "右の胸で、いつもと違う音", from: "診察" } },
  { id: "chest-l", label: "胸の左側を聴く", result: "こちらは、はっきりした異常な音はない" },
  { id: "face", label: "顔・くちびるを見る", result: "顔が赤い。少し息が速い", clue: { id: "c6", text: "顔が赤い・呼吸が速い", from: "診察" } },
  { id: "throat", label: "のどを見る", result: "赤くはれてはいない" },
];

// ※数値はプロトタイプ用の設定。基準は子ども向けに簡略化している。
const VITALS = [
  { id: "temp", label: "体温", value: "38.6 ℃", normal: "だいたい 36〜37℃くらい", off: true, clue: { id: "c7", text: "体温 38.6℃（高い）", from: "バイタル" } },
  { id: "spo2", label: "SpO₂（血液に酸素がどれくらい入っているか）", value: "88 %", normal: "だいたい 96%以上", off: true, clue: { id: "c8", text: "SpO₂ 88%（低い）", from: "バイタル" } },
  { id: "rr", label: "呼吸数", value: "24 回/分", normal: "だいたい 12〜18回/分", off: true, clue: { id: "c9", text: "呼吸が速い 24回/分", from: "バイタル" } },
  { id: "bp", label: "血圧", value: "128 / 78", normal: "だいたい 120/80くらい", off: false },
];

type Tab = "ask" | "exam" | "vital";

export default function ClueBoardGame({ onComplete }: Q1GameProps) {
  const [tab, setTab] = useState<Tab | null>(null);
  const [clues, setClues] = useState<Clue[]>([]);
  const [said, setSaid] = useState<Record<string, string>>({});
  const [openNormal, setOpenNormal] = useState<string | null>(null);
  const [checkedVital, setCheckedVital] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);

  const add = (c?: Clue) => {
    if (!c) return;
    setClues((v) => (v.some((x) => x.id === c.id) ? v : [...v, c]));
  };

  const enough = clues.length >= 5;

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">
          {tab ? "気になるところを調べてみよう" : "この人に、何が起きているんだろう？"}
        </span>
        <span className="task-sub">下の3つから、自分で調べ方をえらぶ</span>
      </div>

      {/* たんていメモ */}
      <div className="clue-memo">
        <span className="memo-title">🔍 たんていメモ</span>
        {clues.length === 0 ? (
          <p className="memo-empty">まだ手がかりがない。調べると、ここにたまっていく。</p>
        ) : (
          <div className="memo-list">
            {clues.map((c) => (
              <span key={c.id} className="memo-item">
                <b>{c.from}</b>
                {c.text}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 3つの調べ方 */}
      <div className="tool-dock">
        {([["ask", "💬", "話を聞く"], ["exam", "🩺", "からだを診る"], ["vital", "🌡", "バイタルを見る"]] as [Tab, string, string][]).map(
          ([id, icon, label]) => (
            <button
              key={id}
              className={`dock-btn big-dock ${tab === id ? "active" : ""}`}
              onClick={() => { setTab(tab === id ? null : id); setNote(null); }}
            >
              <span>{icon}</span>
              <small>{label}</small>
            </button>
          ),
        )}
      </div>

      {tab === "ask" && (
        <div className="qa-list">
          {ASK.map((a) => (
            <div key={a.id} className="qa-item">
              <button className="qa-q" onClick={() => { setSaid((s) => ({ ...s, [a.id]: a.a })); add(a.clue); }}>
                {a.q}
              </button>
              {said[a.id] && <p className="qa-a">{said[a.id]}</p>}
            </div>
          ))}
        </div>
      )}

      {tab === "exam" && (
        <div className="qa-list">
          {EXAM.map((e) => (
            <div key={e.id} className="qa-item">
              <button className="qa-q" onClick={() => { setSaid((s) => ({ ...s, [e.id]: e.result })); add(e.clue); }}>
                🩺 {e.label}
              </button>
              {said[e.id] && <p className="qa-a">{said[e.id]}</p>}
            </div>
          ))}
        </div>
      )}

      {tab === "vital" && (
        <div className="vital-list">
          {VITALS.map((v) => (
            <div key={v.id} className={`vital-row ${checkedVital.includes(v.id) && v.off ? "off" : ""}`}>
              <span className="vital-label">{v.label}</span>
              <span className="vital-value">{v.value}</span>
              <button
                className="vital-more"
                onClick={() => {
                  setOpenNormal(openNormal === v.id ? null : v.id);
                  setCheckedVital((c) => (c.includes(v.id) ? c : [...c, v.id]));
                  add(v.clue);
                }}
              >
                {openNormal === v.id ? "とじる" : "これって？"}
              </button>
              {openNormal === v.id && (
                <span className="vital-normal">ふつうは {v.normal}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {note && <p className="game-note">{note}</p>}

      <button
        className="btn primary big"
        onClick={() => {
          if (!enough) {
            setNote(`手がかりがまだ ${clues.length}こ。3つの調べ方をつかって、もう少し集めてみよう。`);
            return;
          }
          onComplete();
        }}
      >
        {enough ? "▶ ここまでで考えてみる" : "手がかりを集めよう"}
      </button>
    </div>
  );
}
