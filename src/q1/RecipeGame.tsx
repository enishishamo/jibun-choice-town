// Q1: 食品メーカーの「商品開発」 (gameType: recipe_balance)
// B: 材料費が上がった。いつものおいしさを守りながらコストを下げたい。
// C: 原料ごとのコストと、味4指標（なめらかさ・甘さ・ミルク感・いちご感）
//    への効き方。動かすとリアルタイムに変わるので、読むのではなく試して知る。
// D: 5つの原料を +/- で調整 →「試作する」で判定。単一の正解ではなく、
//    コストを下げつつ味を保つ組み合わせは複数ある。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import { ING, START, TARGET_COST, MIN, calc, isTasteOk, isCostOk } from "./recipeLogic";

export default function RecipeGame({ onComplete }: Q1GameProps) {
  const [amt, setAmt] = useState<Record<string, number>>({ ...START });
  const [tried, setTried] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const now = calc(amt);
  const base = calc(START);

  const change = (id: string, d: number) => {
    const ing = ING.find((i) => i.id === id)!;
    setAmt((a) => ({ ...a, [id]: Math.max(0, Math.min(ing.max, a[id] + d)) }));
    setNote(null);
    setTried(false);
  };

  const stars = (v: number, min: number) => {
    const n = v >= min + 8 ? 3 : v >= min ? 2 : v >= min - 8 ? 1 : 0;
    return "●".repeat(n) + "○".repeat(3 - n);
  };

  const tasteOk = isTasteOk(now);
  const costOk = isCostOk(now);

  const test = () => {
    setTried(true);
    if (costOk && tasteOk) return;
    if (!costOk && tasteOk) setNote(`おいしさは守れてる。でもコストが ${now.cost}円…もう少し下げたい。`);
    else if (costOk && !tasteOk) setNote("コストは下がった！でも、味がいつもより落ちてしまった…。");
    else setNote("コストも味も、まだ目標にとどいていない…。");
  };

  if (tried && costOk && tasteOk) {
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">新しい配合、できた！</span>
          <div className="result-rows">
            <span className="rrow">
              <b>原料コスト</b>
              <span className="good">
                {base.cost}円 → {now.cost}円
              </span>
            </span>
            <span className="rrow"><b>なめらかさ</b><span>{stars(now.smooth, MIN.smooth)}</span></span>
            <span className="rrow"><b>甘さ</b><span>{stars(now.sweet, MIN.sweet)}</span></span>
            <span className="rrow"><b>ミルク感</b><span>{stars(now.milk, MIN.milk)}</span></span>
            <span className="rrow"><b>いちご感</b><span>{stars(now.berry, MIN.berry)}</span></span>
          </div>
        </div>
        <p className="game-line soft center-line">
          配合の正解はひとつじゃない。何を大事にするかで変わる。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          この配合でいく！
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">材料を変えて、試作してみよう</span>
        <span className="task-sub">
          目標：コスト {TARGET_COST}円以下（今 {base.cost}円）／おいしさは落とさない
        </span>
      </div>

      {/* live taste + cost */}
      <div className="taste-panel">
        <div className="taste-cost">
          <span>原料コスト（目安）</span>
          <strong className={costOk ? "good" : "bad"}>{now.cost}円</strong>
        </div>
        <div className="taste-rows">
          {([
            ["なめらかさ", now.smooth, MIN.smooth],
            ["甘さ", now.sweet, MIN.sweet],
            ["ミルク感", now.milk, MIN.milk],
            ["いちご感", now.berry, MIN.berry],
          ] as [string, number, number][]).map(([label, v, min]) => (
            <span key={label} className={`taste-row ${v >= min ? "ok" : "low"}`}>
              <b>{label}</b>
              <span className="dots">{stars(v, min)}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ingredients */}
      <div className="ing-list">
        {ING.map((i) => (
          <div key={i.id} className="ing-row">
            <span className="ing-name">
              <span className="ing-emoji">{i.emoji}</span>
              {i.name}
              <small>{i.yen}円/1</small>
            </span>
            <span className="ing-ctrl">
              <button className="kg-btn" onClick={() => change(i.id, -1)} disabled={amt[i.id] === 0}>
                −
              </button>
              <span className="ing-bar">
                {[...Array(i.max)].map((_, n) => (
                  <span key={n} className={`ing-cell ${n < amt[i.id] ? "on" : ""}`} />
                ))}
              </span>
              <button className="kg-btn" onClick={() => change(i.id, 1)} disabled={amt[i.id] >= i.max}>
                ＋
              </button>
            </span>
          </div>
        ))}
      </div>

      {note && <p className="game-note">{note}</p>}

      <button className="btn primary big" onClick={test}>
        ▶ 試作する
      </button>
      <button className="btn ghost" onClick={() => { setAmt({ ...START }); setNote(null); setTried(false); }}>
        いつもの配合にもどす
      </button>
    </div>
  );
}
