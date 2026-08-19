// Q1 game: 食品リサイクル — leftovers are not the end of the story.
// C: sorting/processing knowledge in the dock. Mid-game a contaminated
// batch (spoon mixed in) forces re-sorting before processing.
// If the child already did the farm experience, the ending connects back
// to "that field" (社会のつながり演出).
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoDock from "./InfoDock";

const A = (n: string) => `${import.meta.env.BASE_URL}assets/${n}.png`;

interface Item { id: string; name: string; image?: string; emoji?: string; answer: string }

const ITEMS: Item[] = [
  { id: "veg", name: "野菜の食べ残し", image: A("item-leftover"), answer: "compost" },
  { id: "bread", name: "パンの残り", emoji: "🍞", answer: "feed" },
  { id: "oil", name: "使い終わった油", emoji: "🫗", answer: "energy" },
];

const BINS = [
  { id: "compost", name: "肥料にする", image: A("item-compost") },
  { id: "feed", name: "動物のえさにする", emoji: "🐖" },
  { id: "energy", name: "燃料にする", emoji: "⚡" },
];

type Step = "sort" | "contaminated" | "finale";

export default function RecycleGame({ experience, onComplete, hasCompleted }: Q1GameProps) {
  const [step, setStep] = useState<Step>("sort");
  const [current, setCurrent] = useState(0);
  const [note, setNote] = useState<string | null>(null);

  const item = ITEMS[current];
  const farmDone = hasCompleted("farmer-lunch");

  const dockExtra = (toolId: string) => {
    if (toolId === "sort") {
      return <p className="soft-note">スプーンやビニールがまざると、肥料にできなくなってしまう。</p>;
    }
    if (toolId === "compost") {
      return <p className="soft-note">野菜くずは発酵させて約2か月で肥料に。畑で次の野菜を育てる。</p>;
    }
    if (toolId === "feed") {
      return <p className="soft-note">パンやごはんは加熱・乾燥させて、豚などのえさになることも。</p>;
    }
    return null;
  };

  const pick = (binId: string) => {
    if (binId !== item.answer) {
      setNote("それもいいアイデア！でも、これはもっとぴったりの変身先がありそう…🗂分別の情報を見てみよう。");
      return;
    }
    setNote(null);
    if (current + 1 < ITEMS.length) {
      // A real-world hiccup: something un-processable is mixed in.
      if (current === 0) {
        setStep("contaminated");
        return;
      }
      setCurrent((c) => c + 1);
    } else {
      setStep("finale");
    }
  };

  if (step === "contaminated") {
    return (
      <div className="game board-game">
        <div className="alert-box">
          <span className="big-emoji">🥄</span>
          <p>待って！食べ残しの中にスプーンがまざってる！</p>
        </div>
        <p className="game-line">このままだと肥料にできない。どうする？</p>
        {note && <p className="game-note">{note}</p>}
        <div className="stack">
          <button
            className="btn ghost"
            onClick={() => setNote("🗂分別の情報を見てみよう。まざりものがあると、資源に変えられなくなってしまう！")}
          >
            気にせずそのまま処理する
          </button>
          <button
            className="btn primary"
            onClick={() => {
              setNote(null);
              setCurrent(1);
              setStep("sort");
            }}
          >
            取りのぞいて、分別からやり直す
          </button>
        </div>
        <InfoDock tools={experience.tools} extra={dockExtra} />
      </div>
    );
  }

  if (step === "finale") {
    return (
      <div className="game board-game">
        <div className="recycle-flow">
          <img src={A("item-leftover")} alt="食べ残し" />
          <span className="flow-arrow">→</span>
          <img src={A("item-compost")} alt="肥料" />
          <span className="flow-arrow">→</span>
          <img src={A("bg-farm")} alt="畑" />
        </div>
        <p className="game-line">
          食べ残しが肥料になって、畑へ運ばれていく…
          {farmDone && (
            <>
              <br />
              <strong>あ！さっきのにんじん畑につながった！</strong>
            </>
          )}
        </p>
        <button className="btn primary" onClick={onComplete}>
          つながりを見届ける
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="mission-bar">
        <span className="mission-bar-title">これ、全部ごみになるの…？</span>
        <div className="mission-chips">
          {ITEMS.map((it, i) => (
            <span key={it.id} className={`mchip ${i < current ? "ok" : ""}`}>
              {i < current ? "✓" : "・"} {it.name}
            </span>
          ))}
        </div>
      </div>
      <p className="game-line">
        分別と処理の知識を使って考えよう。これ、どう変身できる？
      </p>
      <div className="recycle-item">
        {item.image ? <img src={item.image} alt="" /> : <span className="big-emoji">{item.emoji}</span>}
        <span>{item.name}</span>
      </div>
      {note && <p className="game-note">{note}</p>}
      <div className="stack">
        {BINS.map((b) => (
          <button key={b.id} className="btn choice" onClick={() => pick(b.id)}>
            {b.image ? <img className="btn-icon" src={b.image} alt="" /> : <span className="btn-icon-emoji">{b.emoji}</span>}
            {b.name}
          </button>
        ))}
      </div>
      <InfoDock tools={experience.tools} extra={dockExtra} />
    </div>
  );
}
