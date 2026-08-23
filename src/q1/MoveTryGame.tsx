// Q1: 理学療法士 (gameType: move_try)
// B: 病気は良くなった。でも家で生活できる？
// C: 動作ごとの様子（ふらつく・息切れ・疲れ）と、使える工夫（手すり・
//    杖・高さ・休憩・練習）。工夫カードを開かないと、どれが何に効くか
//    分からない。
// D: 動作を試す → うまくいかない理由を見る → 工夫を選ぶ → もう一度試す。
//    「鍛える」だけでなく、道具や方法でも「できる」がつくれる。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";

type FixId = "rail" | "cane" | "height" | "rest" | "train";

interface Move {
  id: string;
  name: string;
  icon: string;
  problem: string;
  fixes: FixId[]; // これで「できる」になる
  wrong: Partial<Record<FixId, string>>;
}

const MOVES: Move[] = [
  { id: "sit", name: "ベッドから起き上がる", icon: "🛏",
    problem: "起き上がるときに、ぐらっとする",
    fixes: ["rail"],
    wrong: { cane: "寝ている姿勢では、杖は使えない…", height: "ベッドの高さより、まず起き上がるときの支えが要りそう", rest: "休んでも、起き上がりのぐらつきは変わらない", train: "練習も大事。でも今すぐ安全に起きるには？" } },
  { id: "stand", name: "立ち上がる", icon: "🧍",
    problem: "立つときに、ひざに力が入りきらない",
    fixes: ["height", "rail"],
    wrong: { cane: "立ち上がる瞬間は、杖だけだと不安定…", rest: "休んでも、立ち上がりの力は変わらない", train: "練習も大事。でも今日できる工夫は？" } },
  { id: "walk", name: "トイレまで歩く", icon: "🚶",
    problem: "10歩ほどで息が切れて、ふらつく",
    fixes: ["cane", "rest"],
    wrong: { rail: "廊下ぜんぶに手すりはつけられない…", height: "歩くときの高さは関係なさそう", train: "練習も大事。でも今のからだで届く方法は？" } },
];

const FIXES: { id: FixId; name: string; icon: string; desc: string }[] = [
  { id: "rail", name: "手すり", icon: "🤝", desc: "つかまる場所があると、起きる・立つが安定する" },
  { id: "cane", name: "杖", icon: "🦯", desc: "歩くときの支えが増えて、ふらつきにくくなる" },
  { id: "height", name: "ベッド・いすの高さ", icon: "📏", desc: "少し高いほうが、立ち上がるときの力が少なくてすむ" },
  { id: "rest", name: "とちゅうで休む", icon: "🪑", desc: "途中に座れる場所があると、息が切れても続けられる" },
  { id: "train", name: "練習する", icon: "💪", desc: "くり返すと力がついてくる。ただし時間がかかる" },
];

export default function MoveTryGame({ onComplete }: Q1GameProps) {
  const [step, setStep] = useState(0);
  const [tried, setTried] = useState(false);
  const [applied, setApplied] = useState<Record<string, FixId>>({});
  const [note, setNote] = useState<string | null>(null);

  const move = MOVES[step];
  const cleared = move && applied[move.id];
  const allDone = step >= MOVES.length;

  const docs = [
    { id: "fixes", icon: "🧰", title: "使える工夫",
      body: <>{FIXES.map((f) => <p key={f.id}>{f.icon} <strong>{f.name}</strong>：{f.desc}</p>)}</> },
    { id: "goal", icon: "🏠", title: "めざすところ",
      body: <p>「歩けること」がゴールではなく、<strong>家でしたいことができること</strong>。トイレに自分で行けるか、が今日の目標。</p> },
  ];

  if (allDone) {
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">自分で、トイレまで行けた</span>
          <div className="result-rows">
            {MOVES.map((m) => (
              <span key={m.id} className="rrow">
                <b>{m.icon} {m.name}</b>
                <span className="good">{FIXES.find((f) => f.id === applied[m.id])?.name}でできた</span>
              </span>
            ))}
          </div>
        </div>
        <p className="game-line soft center-line">
          からだを鍛えるだけじゃない。道具や方法を変えても「できる」はつくれる。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          退院にむけて相談する
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">
          {!tried ? `${move.name} — まずやってみよう` : cleared ? "できた！つぎへ" : "うまくいかない理由を見て、工夫をえらぼう"}
        </span>
        <span className="task-sub">目標：自分でトイレまで行けるようになる（{step + 1}/{MOVES.length}）</span>
      </div>

      <div className="move-stage">
        <span className="move-icon">{move.icon}</span>
        <span className="move-name">{move.name}</span>
        {tried && !cleared && <p className="move-problem">⚠ {move.problem}</p>}
        {cleared && (
          <p className="move-ok">
            ✓ {FIXES.find((f) => f.id === applied[move.id])!.name}をつかって、できた
          </p>
        )}
      </div>

      {!tried && (
        <button className="btn primary big" onClick={() => setTried(true)}>
          ▶ やってみる
        </button>
      )}

      {tried && !cleared && (
        <>
          <div className="choice-row wrap">
            {FIXES.map((f) => (
              <button
                key={f.id}
                className="choice-card"
                onClick={() => {
                  if (move.fixes.includes(f.id)) {
                    setApplied((a) => ({ ...a, [move.id]: f.id }));
                    setNote(null);
                  } else {
                    setNote(move.wrong[f.id] ?? "これでは変わらなかった…");
                  }
                }}
              >
                <span className="choice-emoji">{f.icon}</span>
                <span className="choice-name">{f.name}</span>
              </button>
            ))}
          </div>
          {note && <p className="game-note">{note}</p>}
          <InfoCards cards={docs} label="こまったら見る資料" />
        </>
      )}

      {cleared && (
        <button
          className="btn primary big"
          onClick={() => { setStep(step + 1); setTried(false); setNote(null); }}
        >
          {step + 1 < MOVES.length ? "▶ つぎの動作へ" : "▶ トイレまで行ってみる"}
        </button>
      )}
    </div>
  );
}
