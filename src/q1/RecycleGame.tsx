// Q1: 食品残渣を選別し肥料化するリサイクル工場作業員 (gameType: sort_out)
// B: リサイクル工場のラインに3つの異物が流れてきた。それぞれの異物が実際にどんな性質を持つか
//    （磁石に近づけると引き寄せられる／持ち上げるとふわっと軽く舞う／どちらでもなく小さくて
//    ずしっと重い）は毎回、異物ごとに独立にランダムで決まる。3枚の異物カードはすべて同じ中立の
//    見た目で、開いて観察結果を読むまで性質は分からない。
// C/D: 各異物のカードを開いて実際の観察結果を読んでから、その性質に物理的な原理が合う道具
//    （磁選機／風力選別／手選別）を選び、実施ボタンで1回の適用として確定する。詳細はsortOutLogic.ts。
//
// 2026-09-10 (Q1 Autonomous Factory, legacy-sort-out rebuild, t1-observe-and-apply-once): 旧実装は
// 道具を無制限に持ち替えて同じ異物へ何度でも試せる構造だった（reverse audit: exploit "brute
// force"、進行コストのない総当たり）。新実装は、異物ごとに1回の適用で結果を確定する構造にし、旧来の
// 無制限な再試行を構造的に排除した。旧実装の「網（ふるい）」は、research.mdの検証により軽いフィルム
// 状の異物への根拠がより直接的な「風力選別」へ差し替えた（既存content data schoolLunch.tsが既に
// 用意していた風力選別ツールとの不整合も解消）。3枚の異物カードはすべて同じ中立の見た目にし、異物の
// 性質は異物ごとに独立にランダムに割り当てる（design review r1 BLOCKER是正: 異物に固有の物理的
// アイデンティティを持たせたまま性質を独立ランダムにすると、物理的に矛盾した組み合わせが生じうる）。
// 結果表示は、選んだ道具の原理が観察した性質に合っていたかどうかのみを述べ、選ばなかった道具が
// 現実に無効である、あるいは工場全体の異物除去が完全に解決した、という主張は行わない（design review
// r1 BLOCKER是正: MISMATCH_PARTIAL_EFFECT_OVERCLAIM/EXCLUSIVITY_OVERCLAIM）。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import {
  CORRECT_TOOL,
  ITEMS,
  PROPERTY_OBSERVATION,
  TOOLS,
  TOOL_LABELS,
  newSession,
  sessionWin,
  type ItemId,
  type Session,
  type ToolId,
} from "./sortOutLogic";

const K = (n: string) => `${import.meta.env.BASE_URL}assets/kyushoku/${n}.jpg`;

interface ItemUI {
  opened: boolean;
  selectedTool: ToolId | null;
  appliedTool: ToolId | null;
}

const initialItemUI = (): ItemUI => ({ opened: false, selectedTool: null, appliedTool: null });

export default function RecycleGame({ onComplete, onPartialComplete, hasCompleted }: Q1GameProps) {
  const [session] = useState<Session>(() => newSession());
  const [itemUI, setItemUI] = useState<Record<ItemId, ItemUI>>(
    () => Object.fromEntries(ITEMS.map((id) => [id, initialItemUI()])) as Record<ItemId, ItemUI>,
  );
  const [outcome, setOutcome] = useState<"playing" | "reflecting" | "done">("playing");
  const [reflectPicks, setReflectPicks] = useState<Partial<Record<ItemId, ToolId>>>({});

  const farmDone = hasCompleted("farmer-lunch");

  // Every transition below derives entirely from this setter's own `prev` -- no reading a
  // sibling item's or sibling field's render-scope value -- matching HotelReceiveGame.tsx's
  // groupUI pattern (impl review r1 HIGH BATCHING_STATE_CLOSURE fix: the earlier version had
  // selectTool/apply as 3 separate useState pieces that each read one another's render-scope
  // value as a guard condition instead of being self-contained).
  const openItem = (id: ItemId) =>
    setItemUI((prev) => (prev[id].opened ? prev : { ...prev, [id]: { ...prev[id], opened: true } }));

  const selectTool = (id: ItemId, tool: ToolId) =>
    setItemUI((prev) => (prev[id].appliedTool ? prev : { ...prev, [id]: { ...prev[id], selectedTool: tool } }));

  const apply = (id: ItemId) =>
    setItemUI((prev) => {
      if (prev[id].appliedTool || !prev[id].selectedTool) return prev;
      return { ...prev, [id]: { ...prev[id], appliedTool: prev[id].selectedTool } };
    });

  const finishScreen = () => {
    const picks = Object.fromEntries(ITEMS.map((id) => [id, itemUI[id].appliedTool])) as Record<ItemId, ToolId>;
    const win = sessionWin(session, picks);
    setOutcome(win ? "done" : "reflecting");
  };

  const setReflectPick = (id: ItemId, tool: ToolId) =>
    setReflectPicks((prev) => ({ ...prev, [id]: tool }));

  const docs = [
    {
      id: "rule",
      icon: "📋",
      title: "この工場の受入ルール",
      body: (
        <>
          <p>この工場は、食べ残しを<strong>発酵させて肥料にする</strong>契約・しくみ。</p>
          <p>受け入れられるのは<strong>食品だけ</strong>。金属・プラスチック・ビニールは機械の故障や肥料の品質低下のもと（肥料法は、品質を下げる異物の混入を禁止している）。</p>
        </>
      ),
    },
  ];

  if (outcome === "done") {
    return (
      <div className="game board-game">
        <div className="scene-shot">
          <img src={K("compost_to_farm")} alt="発酵させて肥料になり、畑へ" />
          <span className="scene-shot-cap">食べ残し → 発酵 → たい肥 → 畑へ</span>
        </div>
        <div className="result-card good">
          <span className="result-title">3つとも、性質に合う道具で正しく仕分けられた！</span>
        </div>
        <p className="game-line center-line">
          きれいになった食べ残しは、発酵させて約2か月で肥料に。
          <br />
          できた肥料は、畑へ運ばれていく…
          {farmDone && (
            <>
              <br />
              <strong>あ！さっきのにんじん畑につながった！</strong>
            </>
          )}
        </p>
        <p className="game-line soft">
          いちばんいいのは、まず食べ残しを減らすこと。それでも出たものを、できるだけもう一度使う。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          つながりを見届ける
        </button>
      </div>
    );
  }

  if (outcome === "reflecting") {
    const canFinish = ITEMS.every((id) => reflectPicks[id]);
    return (
      <div className="game board-game">
        <div className="result-card">
          <span className="result-title">一部の異物は、この場面では仕分けられなかった</span>
          <p className="game-line soft">
            同じ3つの観察結果をもう一度見比べて、次はどの道具を選ぶか考えてみよう。
          </p>
        </div>
        <div className="dx-grid route-grid">
          {ITEMS.map((id) => {
            const property = session.assignment[id];
            return (
              <div key={id} className="dx-card">
                <div className="dx-head">
                  <span className="dx-name">📦 異物</span>
                </div>
                <p className="dx-pattern">{PROPERTY_OBSERVATION[property]}</p>
                <p className="game-line soft">
                  あなたが選んだ道具: {itemUI[id].appliedTool ? `${TOOL_LABELS[itemUI[id].appliedTool as ToolId].icon} ${TOOL_LABELS[itemUI[id].appliedTool as ToolId].name}` : "（未選択）"}
                </p>
              </div>
            );
          })}
        </div>
        <p className="game-line soft center-line farm-disclaimer">
          今度はどの道具を選べばよかったと思う？
        </p>
        {ITEMS.map((id) => (
          <div key={id} className="choice-row wrap">
            {TOOLS.map((tool) => (
              <button
                key={tool}
                className={`dx-commit ${reflectPicks[id] === tool ? "on" : ""}`}
                onClick={() => setReflectPick(id, tool)}
              >
                {TOOL_LABELS[tool].icon} {TOOL_LABELS[tool].name}
              </button>
            ))}
          </div>
        ))}
        <p className="game-line soft center-line farm-disclaimer">※この選択で結果は変わりません</p>
        <button
          className="btn primary big"
          disabled={!canFinish}
          onClick={() => (onPartialComplete ?? onComplete)()}
        >
          先へ進む
        </button>
      </div>
    );
  }

  const allApplied = ITEMS.every((id) => itemUI[id].appliedTool);

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">食べ残しが工場に届いた</span>
        <span className="task-sub">でも、このままではリサイクルできない！異物を観察してから、合う道具を選ぼう</span>
      </div>

      <div className="scene-strip">
        <img src={K("food_waste")} alt="学校から届いた食べ残し" />
        <span className="strip-cap">きょうの給食のあと、学校から届いた</span>
      </div>

      <div className="dx-grid route-grid">
        {ITEMS.map((id) => {
          const ui = itemUI[id];
          const isApplied = Boolean(ui.appliedTool);
          const property = session.assignment[id];
          const correctlySorted = isApplied && ui.appliedTool === CORRECT_TOOL[property];
          return (
            <div key={id} className={`dx-card ${correctlySorted ? "selected" : ""}`}>
              <div className="dx-head">
                <span className="dx-name">📦 異物</span>
                {!isApplied && (
                  <button className="dx-more" aria-label="観察する" onClick={() => openItem(id)}>
                    {ui.opened ? "－" : "？"}
                  </button>
                )}
              </div>
              {isApplied ? (
                correctlySorted ? (
                  <p className="dx-pattern good">
                    {TOOL_LABELS[ui.appliedTool as ToolId].icon} で正しく仕分けられた！
                  </p>
                ) : (
                  <p className="dx-pattern">
                    この場面では、{TOOL_LABELS[ui.appliedTool as ToolId].name}の原理はこの異物の性質に合わず、コンベアの上に残ったまま。
                  </p>
                )
              ) : (
                ui.opened && (
                  <>
                    <p className="dx-pattern">{PROPERTY_OBSERVATION[property]}</p>
                    <div className="choice-row wrap">
                      {TOOLS.map((tool) => (
                        <button
                          key={tool}
                          className={`dx-commit ${ui.selectedTool === tool ? "on" : ""}`}
                          onClick={() => selectTool(id, tool)}
                        >
                          {TOOL_LABELS[tool].icon} {TOOL_LABELS[tool].name}
                        </button>
                      ))}
                    </div>
                    <button
                      className="btn choice on"
                      disabled={!ui.selectedTool}
                      onClick={() => apply(id)}
                    >
                      使う
                    </button>
                  </>
                )
              )}
            </div>
          );
        })}
      </div>

      <InfoCards cards={docs} label="こまったら見る資料" />

      <button className="btn primary big" disabled={!allApplied} onClick={finishScreen}>
        結果を見る
      </button>
    </div>
  );
}
