// Q1: 包装・パッケージを考える仕事 (gameType: package_design)
// B: 包む材料も高くなった。減らしたいが、商品を守れないと困る。
// C: 素材ごとの特徴（冷凍に向くか・強さ・コスト・使う材料の量）を
//    「特徴を見る」で開いて確認できる。開かないと、紙が冷凍に弱いこと
//    などが分からない。
// D: 素材 × 形 × サイズ を組み立てて「テストする」→ 4つのテスト結果。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import {
  MATERIALS,
  SHAPES,
  SIZES,
  COST_TARGET,
  cost as computeCost,
  frozen as computeFrozen,
  carry as computeCarry,
  openness as computeOpenness,
  label as computeLabel,
  isPass,
  type Material,
  type Shape,
  type Size,
} from "./packageLogic";

const MARK = ["✕", "△", "○", "◎"];

export default function PackageGame({ onComplete }: Q1GameProps) {
  const [mat, setMat] = useState<Material | null>(null);
  const [shape, setShape] = useState<Shape | null>(null);
  const [size, setSize] = useState<Size | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [tested, setTested] = useState(false);

  const ready = mat && shape && size;
  const cost = ready ? computeCost({ mat, shape, size }) : 0;
  const frozen = mat ? computeFrozen({ mat }) : 0;
  const carry = ready ? computeCarry({ mat, shape }) : 0;
  const openness = shape ? computeOpenness({ shape }) : 0;
  const label = size ? computeLabel({ size }) : 0;
  // 2026-09-13 audit fix: 素材・形を選んだ時点でわかる「運ぶ」の見込みを、
  // サイズ未選択でもプレビューできるようにする（下のライブ表示で使う）。
  const carryPreview = mat && shape ? computeCarry({ mat, shape }) : null;

  const pass = !!ready && isPass({ mat, shape, size });

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

      {/* 2026-09-13 audit fix: 以前はここに何も無く、選んだ素材/形の説明文
          (detail) が次の選択で上書きされて消えてしまうため、「冷凍」や
          「運ぶ」の合否は結局テストするまで分からなかった（読む→閉じる→
          頭の中で比較、のアンチパターン）。①②③を選ぶそばから常に見える
          ライブ判定に変更する。 */}
      <div className="taste-panel">
        <div className="taste-cost">
          <span>包装コスト（目安）</span>
          <strong className={ready ? (cost <= COST_TARGET ? "good" : "bad") : ""}>
            {ready ? `${cost}円/個` : "？"}
          </strong>
        </div>
        <div className="taste-rows">
          <span className={`taste-row ${mat ? (frozen >= 2 ? "ok" : "low") : ""}`}>
            <b>冷凍</b>
            <span className="dots">{mat ? MARK[frozen] : "？"}</span>
          </span>
          <span className={`taste-row ${carryPreview !== null ? (carryPreview >= 2 ? "ok" : "low") : ""}`}>
            <b>運ぶ</b>
            <span className="dots">{carryPreview !== null ? MARK[carryPreview] : "？"}</span>
          </span>
          <span className={`taste-row ${size ? (label >= 2 ? "ok" : "low") : ""}`}>
            <b>表示スペース</b>
            <span className="dots">{size ? MARK[label] : "？"}</span>
          </span>
        </div>
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
