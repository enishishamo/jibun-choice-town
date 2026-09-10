// Q1: 都市の暑さを分析し、街づくりを考える仕事 (gameType: layer_and_compare)
// B: 同じ猛暑日なのに、場所によって暑さがちがう。3地点（毎セッションランダムな組み合わせ）の
//    日射・風・舗装のデータを見比べて、本当の原因を診断し、対策を1つ選んで実施する。
// C: 地点ごとの日射・風・舗装の読み物。対策の種類とそれぞれが対応する原因。風が弱い（建物密集）
//    地点は個人の一手では直せないという制約。
// D: 各地点の読み物を原因と照合して診断する判断と、診断した原因に合う対策を選んで実施する判断
//    （詳細はheatDiagnosisLogic.ts）。診断・対策を決めたら「実施する」を1回だけ押して結果を
//    確定する（同一セッション内のやり直しはない）。
//
// 2026-09-10 (Q1 Autonomous Factory, legacy-layer-and-compare rebuild, t1-diagnose-and-fix):
// 旧実装は3地点・原因・対策が完全に固定（2地点はfixable=true固定、1地点はfixable=false・
// heat=0固定）で、内容を読まずに対策を置けば必ず成功する地点が決まっていた記憶ゲームだった上、
// 「別の場所に置きなおす」ボタンで同一セッション内の総当たり再挑戦を許していた（reverse audit:
// C_required=false, brute_force=true）。新実装では地点の組み合わせを毎セッションランダム化し、
// 風が支配的原因の地点は対策のしようがない（wind-confoundモデル）というひねりを加えたうえで、
// フラットな失敗結果のみを返す1回のコミット判断にした（design-sim.mjs参照、design review r4
// PASS 88）。失敗時は同じデータを再提示する非採点の振り返り選択を挟み、Q1 First-Play Standard
// Gate G「考え直す余地」に対応する（この振り返りは結果を一切変えない）。
//
// 実装レビューr1（FAIL 48、BLOCKER×2、MEDIUM×1）是正: (1) CORE_DATA_DISCLOSURE_NOT_REQUIRED —
// 3地点すべての「？」を開く（読む）まで「実施する」を活性化しないようにした（openedSlots）。
// (2) THINK_AGAIN_SKIPPABLE — 振り返り選択（reflectionPick）をしないまま「先へ進む」を押せて
// しまっていたため、選択するまで非活性にした。(3) TOOL_ORDER_NOT_SHUFFLED — 対策カードの表示順を
// 毎セッション独立にシャッフルするようにした（toolOrder、IDベースの判定は変更なし）。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import {
  AXIS_TEXT,
  TOOLS,
  TOOL_LABELS,
  newSession,
  sessionWin,
  shuffledIds,
  type Tool,
} from "./heatDiagnosisLogic";

export default function UrbanHeatGame({ onComplete, onPartialComplete }: Q1GameProps) {
  const [session] = useState(() => newSession());
  const [toolOrder] = useState<Tool[]>(() => shuffledIds(TOOLS) as Tool[]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [openSlot, setOpenSlot] = useState<number | null>(null);
  const [openedSlots, setOpenedSlots] = useState<Set<number>>(new Set());
  const [outcome, setOutcome] = useState<"playing" | "reflecting" | "success">("playing");
  const [reflectionPick, setReflectionPick] = useState<number | null>(null);

  const allDataRead = openedSlots.size === session.slots.length;
  const canCommit = allDataRead && selectedSlot !== null && selectedTool !== null;

  const toggleOpen = (i: number) => {
    setOpenSlot(openSlot === i ? null : i);
    setOpenedSlots((prev) => (prev.has(i) ? prev : new Set(prev).add(i)));
  };

  const commit = () => {
    if (selectedSlot === null || !selectedTool) return;
    const win = sessionWin(session, selectedSlot, selectedTool);
    setOutcome(win ? "success" : "reflecting");
  };

  if (outcome === "success") {
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">その地点の暑さがやわらいだ！</span>
          <p className="join-conclusion">→ 原因の診断も、対策選びも、どちらも合っていた</p>
        </div>
        <button className="btn primary big" onClick={onComplete}>
          分析をまとめる
        </button>
      </div>
    );
  }

  if (outcome === "reflecting") {
    return (
      <div className="game board-game">
        <div className="result-card">
          <span className="result-title">思ったほど暑さがやわらがなかった</span>
          <p className="game-line soft">
            対策そのものは無駄ではなかったかもしれないが、その地点で一番効いている原因は解消でき
            なかったみたい。次はどの地点が本当の原因だったと思う？
          </p>
        </div>
        <div className="dx-grid route-grid">
          {session.slots.map((slot, i) => (
            <button
              key={slot.roleId}
              className={`dx-commit ${reflectionPick === i ? "on" : ""}`}
              onClick={() => setReflectionPick(i)}
            >
              {slot.name}
            </button>
          ))}
        </div>
        <p className="game-line soft center-line farm-disclaimer">
          ※この選択で結果は変わりません。もう一度3つの地点を見比べてみよう
        </p>
        <button
          className="btn primary big"
          disabled={reflectionPick === null}
          onClick={() => (onPartialComplete ?? onComplete)()}
        >
          先へ進む
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">同じ猛暑日なのに、場所によって暑さがちがう。なぜ？</span>
        <span className="task-sub">原因を診断して、対策を1つ選んで実施しよう</span>
      </div>

      <div className="dx-grid route-grid">
        {session.slots.map((slot, i) => (
          <div key={slot.roleId} className={`dx-card ${selectedSlot === i ? "selected" : ""}`}>
            <div className="dx-head">
              <span className="dx-name">{slot.name}</span>
              <button
                className="dx-more"
                aria-label={openSlot === i ? "とじる" : "データを見る"}
                onClick={() => toggleOpen(i)}
              >
                {openSlot === i ? "－" : "？"}
              </button>
            </div>
            {openSlot === i && (
              <p className="dx-pattern">
                {AXIS_TEXT.sun[slot.reading.sun]} ／ {AXIS_TEXT.wind[slot.reading.wind]} ／{" "}
                {AXIS_TEXT.pavement[slot.reading.pavement]}
              </p>
            )}
            <button className={`dx-commit ${selectedSlot === i ? "on" : ""}`} onClick={() => setSelectedSlot(i)}>
              この地点に対策する
            </button>
          </div>
        ))}
      </div>

      <div className="zone-row">
        {toolOrder.map((tool) => (
          <button
            key={tool}
            className={`zone-btn ${selectedTool === tool ? "on" : ""}`}
            onClick={() => setSelectedTool(tool)}
          >
            {TOOL_LABELS[tool]}
          </button>
        ))}
      </div>

      <button className="btn primary big" disabled={!canCommit} onClick={commit}>
        実施する
      </button>
      {!allDataRead && (
        <p className="game-line soft center-line farm-disclaimer">
          ※3つの地点すべての「？」を見てから実施しよう
        </p>
      )}
    </div>
  );
}
