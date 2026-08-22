// Q1: 食品メーカーの「調達」 (gameType: sourcing_mix)
// B: いちご原料120kgを、来週の生産までにそろえたい。値段は上がっている。
// C: 仕入先カード（価格・品質・納期・供給できる量・安定性）。開かないと
//    「その会社が何kgまで出せるか」が分からない → 量が足りず失敗する。
// D: 3社から何kgずつ買うかを +/- で組み立てる（組み合わせ可）。
// E: 量・予算・納期・安定性が結果として返る。成立する解は複数ある。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";

interface Supplier {
  id: string;
  name: string;
  emoji: string;
  yenPerKg: number;
  max: number; // 出せる上限 kg
  quality: string;
  lead: string;
  /** 来週の生産に間に合うか */
  inTime: boolean;
  stability: string;
  stable: boolean;
}

const SUPPLIERS: Supplier[] = [
  { id: "a", name: "A社", emoji: "🚚", yenPerKg: 900, max: 120, quality: "◎ とても良い", lead: "早い（3日）", inTime: true, stability: "◎ 安定している", stable: true },
  { id: "b", name: "B社", emoji: "🛻", yenPerKg: 600, max: 80, quality: "○ ふつう", lead: "遅い（10日）", inTime: false, stability: "△ 年によって変わる", stable: false },
  { id: "c", name: "C社", emoji: "🚐", yenPerKg: 750, max: 60, quality: "◎ とても良い", lead: "ふつう（5日）", inTime: true, stability: "○ わりと安定", stable: true },
];

const NEED = 120; // kg
const BUDGET = 96000; // 円（目安）
const STEP = 20;

export default function SourcingGame({ onComplete }: Q1GameProps) {
  const [kg, setKg] = useState<Record<string, number>>({ a: 0, b: 0, c: 0 });
  const [open, setOpen] = useState<string | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const [result, setResult] = useState<null | {
    total: number;
    cost: number;
    lateKg: number;
    concentrated: boolean;
  }>(null);

  const total = SUPPLIERS.reduce((a, s) => a + kg[s.id], 0);
  const cost = SUPPLIERS.reduce((a, s) => a + kg[s.id] * s.yenPerKg, 0);

  const change = (id: string, d: number) => {
    const s = SUPPLIERS.find((x) => x.id === id)!;
    setKg((k) => ({ ...k, [id]: Math.max(0, Math.min(s.max, k[id] + d)) }));
    setResult(null);
  };

  const run = () => {
    const lateKg = SUPPLIERS.filter((s) => !s.inTime).reduce((a, s) => a + kg[s.id], 0);
    const concentrated = SUPPLIERS.some((s) => kg[s.id] >= NEED);
    setResult({ total, cost, lateKg, concentrated });
  };

  const ok = result && result.total >= NEED && result.lateKg === 0;

  if (ok) {
    const overBudget = result.cost > BUDGET;
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">いちご原料 {result.total}kg、そろった！</span>
          <div className="result-rows">
            <span className="rrow">
              <b>そろった量</b>
              <span>{result.total}kg／{NEED}kg ✓</span>
            </span>
            <span className="rrow">
              <b>材料費</b>
              <span className={overBudget ? "bad" : "good"}>
                {result.cost.toLocaleString()}円{overBudget ? "（目安より高め）" : "（目安内）"}
              </span>
            </span>
            <span className="rrow">
              <b>届く日</b>
              <span className="good">来週までに間に合う ✓</span>
            </span>
            <span className="rrow">
              <b>安定性</b>
              <span className={result.concentrated ? "" : "good"}>
                {result.concentrated
                  ? "1社にまとめた（その会社が届けられないと止まる）"
                  : "何社かに分けた ✓"}
              </span>
            </span>
          </div>
        </div>
        <p className="game-line soft center-line">
          そろえ方はひとつじゃない。何を大事にするかで、選び方が変わる。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          この仕入れでいく！
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">仕入先を見て、いちご原料をそろえよう</span>
        <span className="task-sub">
          目標 {NEED}kg・来週まで／材料費の目安 {BUDGET.toLocaleString()}円
        </span>
      </div>

      {/* live total */}
      <div className="meter-box">
        <div className="meter-head">
          <span>そろった量</span>
          <strong className={total >= NEED ? "good" : ""}>
            {total}kg / {NEED}kg
          </strong>
        </div>
        <div className="mini-bar">
          <div
            className={`mini-fill ${total >= NEED ? "" : "warn"}`}
            style={{ width: `${Math.min(100, (total / NEED) * 100)}%` }}
          />
        </div>
        <div className="meter-head">
          <span>材料費</span>
          <strong className={cost > BUDGET ? "bad" : ""}>{cost.toLocaleString()}円</strong>
        </div>
      </div>

      {/* suppliers */}
      <div className="supplier-list">
        {SUPPLIERS.map((s) => {
          const isOpen = open === s.id;
          return (
            <div key={s.id} className={`supplier ${isOpen ? "open" : ""}`}>
              <button
                className="supplier-head"
                onClick={() => {
                  setOpen(isOpen ? null : s.id);
                  if (!isOpen) setSeen((v) => (v.includes(s.id) ? v : [...v, s.id]));
                }}
              >
                <span className="sup-emoji">{s.emoji}</span>
                <span className="sup-name">{s.name}</span>
                <span className="sup-price">{s.yenPerKg}円/kg</span>
                <span className="sup-toggle">{isOpen ? "− とじる" : "+ くわしく"}</span>
              </button>
              {isOpen && (
                <div className="supplier-detail">
                  <p>品質：{s.quality}</p>
                  <p>届く日：{s.lead}</p>
                  <p>
                    出せる量：<strong>{s.max}kgまで</strong>
                  </p>
                  <p>安定性：{s.stability}</p>
                </div>
              )}
              <div className="supplier-buy">
                <button className="kg-btn" onClick={() => change(s.id, -STEP)} disabled={kg[s.id] === 0}>
                  −
                </button>
                <span className="kg-value">
                  {kg[s.id]}
                  <small>kg</small>
                </span>
                <button
                  className="kg-btn"
                  onClick={() => change(s.id, STEP)}
                  disabled={kg[s.id] >= s.max}
                >
                  ＋
                </button>
                {kg[s.id] >= s.max && <span className="kg-note">この会社の上限</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* what happened */}
      {result && !ok && (
        <div className="sched-issues">
          {result.total < NEED && (
            <p>
              {NEED - result.total}kg 足りなかった…。このままではアイスがつくれない。
            </p>
          )}
          {result.lateKg > 0 && (
            <p>
              安くできた！でも{result.lateKg}kg分が、いちごが必要な日までに届かなかった…。
            </p>
          )}
        </div>
      )}
      {seen.length === 0 && (
        <p className="game-line soft">仕入先の「くわしく」を開くと、出せる量や届く日が分かるよ。</p>
      )}

      <button className="btn primary big" disabled={total === 0} onClick={run}>
        {total === 0 ? "仕入れる量をきめよう" : "▶ 仕入れてみる"}
      </button>
      {total > 0 && (
        <button className="btn ghost" onClick={() => { setKg({ a: 0, b: 0, c: 0 }); setResult(null); }}>
          はじめからえらび直す
        </button>
      )}
    </div>
  );
}
