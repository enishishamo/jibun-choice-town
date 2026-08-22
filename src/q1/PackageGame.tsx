// Q1: 包装・パッケージを考える仕事 (gameType: package_design)
// B: 包む材料も高くなった。減らしたいが、商品を守れないと困る。
// C: 素材ごとの特徴（冷凍に向くか・強さ・コスト・使う材料の量）を
//    「特徴を見る」で開いて確認できる。開かないと、紙が冷凍に弱いこと
//    などが分からない。
// D: 素材 × 形 × サイズ を組み立てて「テストする」→ 4つのテスト結果。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";

interface Material {
  id: string;
  name: string;
  emoji: string;
  cost: number; // 1個あたり円
  frozen: number; // 冷凍への強さ 0-3
  strength: number; // つぶれにくさ 0-3
  desc: string;
}
const MATERIALS: Material[] = [
  { id: "paper", name: "紙", emoji: "📄", cost: 6, frozen: 1, strength: 1, desc: "軽くて安い。ただし冷凍庫の水分でふやけやすい。" },
  { id: "plastic", name: "プラスチック", emoji: "🧴", cost: 9, frozen: 3, strength: 2, desc: "冷凍に強く、水をとおさない。使う材料はやや多め。" },
  { id: "alumi", name: "アルミ", emoji: "🥈", cost: 13, frozen: 3, strength: 3, desc: "とても丈夫で冷凍にも強い。そのぶんコストが高い。" },
  { id: "bio", name: "バイオ素材", emoji: "🌱", cost: 12, frozen: 2, strength: 2, desc: "植物からつくる素材。環境にやさしいが、まだコストは高め。" },
];

interface Shape {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  strength: number;
  open: number; // あけやすさ 0-3
  desc: string;
}
const SHAPES: Shape[] = [
  { id: "cup", name: "カップ", emoji: "🥣", cost: 3, strength: 2, open: 3, desc: "そのまま食べやすい。少し場所をとる。" },
  { id: "bag", name: "ふくろ", emoji: "🍬", cost: 0, strength: 0, open: 2, desc: "材料が少なくてすむ。つぶれには弱い。" },
  { id: "box", name: "はこ", emoji: "📦", cost: 5, strength: 3, open: 1, desc: "しっかり守れる。材料を多く使う。" },
];

interface Size {
  id: string;
  name: string;
  costMul: number;
  label: number; // 表示スペース 0-3
  desc: string;
}
const SIZES: Size[] = [
  { id: "s", name: "小さめ", costMul: 0.8, label: 1, desc: "材料が少なくてすむ。書ける表示のスペースが少ない。" },
  { id: "m", name: "ふつう", costMul: 1, label: 3, desc: "必要な表示がぜんぶ書ける。" },
  { id: "l", name: "大きめ", costMul: 1.3, label: 3, desc: "余裕があるが、材料もコストも増える。" },
];

const COST_TARGET = 14; // 円/個 以下にしたい

const MARK = ["✕", "△", "○", "◎"];

export default function PackageGame({ onComplete }: Q1GameProps) {
  const [mat, setMat] = useState<Material | null>(null);
  const [shape, setShape] = useState<Shape | null>(null);
  const [size, setSize] = useState<Size | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [tested, setTested] = useState(false);

  const ready = mat && shape && size;
  const cost = ready ? Math.round((mat.cost + shape.cost) * size.costMul) : 0;
  const frozen = mat ? mat.frozen : 0;
  const carry = ready ? Math.min(3, mat.strength + shape.strength - 1) : 0;
  const openness = shape ? shape.open : 0;
  const label = size ? size.label : 0;

  const pass = ready && frozen >= 2 && carry >= 2 && label >= 2 && cost <= COST_TARGET;

  if (tested && pass) {
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">この包み方、合格！</span>
          <div className="result-rows">
            <span className="rrow"><b>冷凍テスト</b><span className="good">{MARK[frozen]}</span></span>
            <span className="rrow"><b>運ぶテスト</b><span className="good">{MARK[carry]}</span></span>
            <span className="rrow"><b>あけやすさ</b><span>{MARK[openness]}</span></span>
            <span className="rrow"><b>必要な表示</b><span className="good">書けた ✓</span></span>
            <span className="rrow"><b>包装コスト</b><span className="good">{cost}円/個</span></span>
          </div>
        </div>
        <p className="game-line soft center-line">
          守ることと、へらすこと。その間をさがすのがこの仕事。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          この包み方でいく！
        </button>
      </div>
    );
  }

  const Row = <T extends { id: string; name: string; desc: string }>({
    title,
    items,
    picked,
    onPick,
    render,
  }: {
    title: string;
    items: T[];
    picked: T | null;
    onPick: (v: T) => void;
    render: (v: T) => React.ReactNode;
  }) => (
    <div className="pick-block">
      <span className="pick-title">{title}</span>
      <div className="pick-cards">
        {items.map((it) => (
          <button
            key={it.id}
            className={`pick-choice ${picked?.id === it.id ? "selected" : ""}`}
            onClick={() => {
              onPick(it);
              setTested(false);
              setDetail(it.desc);
            }}
          >
            {render(it)}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">包み方を作って、テストしてみよう</span>
        <span className="task-sub">
          中身を守れて、必要な表示が書けて、コストは{COST_TARGET}円/個まで
        </span>
      </div>

      <Row
        title="① 素材をえらぶ"
        items={MATERIALS}
        picked={mat}
        onPick={setMat}
        render={(m) => (
          <>
            <span className="pc-emoji">{m.emoji}</span>
            <span className="pc-name">{m.name}</span>
            <small>{m.cost}円</small>
          </>
        )}
      />
      <Row
        title="② 形をえらぶ"
        items={SHAPES}
        picked={shape}
        onPick={setShape}
        render={(s) => (
          <>
            <span className="pc-emoji">{s.emoji}</span>
            <span className="pc-name">{s.name}</span>
          </>
        )}
      />
      <Row
        title="③ サイズをえらぶ"
        items={SIZES}
        picked={size}
        onPick={setSize}
        render={(s) => (
          <>
            <span className="pc-name">{s.name}</span>
          </>
        )}
      />

      {detail && <p className="game-note">🔍 {detail}</p>}

      {tested && !pass && ready && (
        <div className="sched-issues">
          {frozen < 2 && <p>冷凍テスト {MARK[frozen]}：冷凍庫の中で、包みがふやけてしまった…</p>}
          {carry < 2 && <p>運ぶテスト {MARK[carry]}：運んでいる間に、アイスがつぶれてしまった…</p>}
          {label < 2 && <p>必要な表示：商品名や原材料、アレルゲンを書くスペースが足りない…</p>}
          {cost > COST_TARGET && <p>包装コスト {cost}円/個：目安より高くなってしまった…</p>}
        </div>
      )}

      {ready && (
        <div className="mini-summary">
          いま：{mat.name} × {shape.name} × {size.name}　／　{cost}円/個
        </div>
      )}

      <button className="btn primary big" disabled={!ready} onClick={() => setTested(true)}>
        {ready ? "▶ テストする" : "素材・形・サイズをえらぼう"}
      </button>
    </div>
  );
}
