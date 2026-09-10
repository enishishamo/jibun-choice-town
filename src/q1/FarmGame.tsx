// Q1: 農家・生産者 (gameType: sow_and_grow)
// B: 給食室から注文が来た。今の月・締め切り・気象予報に合う品種を選ぶ。
// C: 3つの品種の播種適期・収穫日数・耐暑性。今日の月・締め切りまでの
//    残り日数・気象予報（毎セッションランダム）。
// D: 状況を品種カードと照らし合わせ、3条件（時期・日数・耐暑性）すべてに
//    合う品種を選んでまく（詳細は farmLogic.ts）。
//
// 2026-09-10 (Q1 Autonomous Factory, legacy-sow-and-grow rebuild,
// t1-season-deadline-match): 旧実装は月・締め切り・気象予報が常に固定
// （今は7月、11月に300kg、猛暑予報）で、品種を選んだ時点で結果（成功/
// 失敗のタイムライン）が完全に決まっていた——内容を読まずに「あかね夏を
// 選べば必ず勝てる」という記憶ゲームだった（reverse audit:
// exploit=memorize, player_judgment_required=false）。新実装では今日の
// 月・締め切り・気象予報を毎セッションランダム化し、3品種に本物の
// トレードオフ（早いが暑さに弱い/遅いが暑さに強い/中くらいで遅まき専用）
// を持たせることで、複数品種が季節的候補になる月では締め切り・耐暑性の
// 実際の組み合わせが答えを左右するようにした（design-sim.mjs参照）。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import { evaluate, newSession, shuffledIds, VARIETIES, VARIETY_IDS } from "./farmLogic";

export default function FarmGame({ onComplete, onPartialComplete }: Q1GameProps) {
  const [session] = useState(() => newSession());
  const [order] = useState(() => shuffledIds(VARIETY_IDS));
  const [committed, setCommitted] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<"playing" | "success" | "partial">("playing");

  const varietyList = order.map((id) => VARIETIES.find((v) => v.id === id)!);

  const sow = (varietyId: string) => {
    setCommitted(varietyId);
    const v = VARIETIES.find((x) => x.id === varietyId)!;
    const win = evaluate(v, session.sowMonth, session.deadlineOffsetMonths, session.forecastHot).win;
    setOutcome(win ? "success" : "partial");
  };

  if (outcome === "success") {
    const chosen = VARIETIES.find((v) => v.id === committed)!;
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">にんじん300kg、収穫！</span>
          <p className="join-conclusion">
            → <strong>{chosen.name}</strong>は、季節・締め切り・暑さのすべてに合っていた
          </p>
        </div>
        <p className="game-line soft center-line">
          給食室からの注文は、何か月も前の品種選びから始まっていた。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          給食室へ届けよう！
        </button>
      </div>
    );
  }

  if (outcome === "partial") {
    return (
      <div className="game board-game">
        <div className="result-card">
          <span className="result-title">思ったように育たなかった</span>
          <p className="game-line soft">
            季節・締め切り・暑さのどれかが合わなかったみたい。次はどう育てるか、みんなで考え直すことになった。
          </p>
        </div>
        <button className="btn primary big" onClick={() => (onPartialComplete ?? onComplete)()}>
          先へ進む
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">
          今日は{session.sowMonth}月。給食室から「{((session.sowMonth - 1 + session.deadlineOffsetMonths) % 12) + 1}
          月までに、にんじんXkg」という注文が来た。今年の夏の予報は{session.forecastHot ? "猛暑" : "例年並み"}。
        </span>
        <span className="task-sub">どの品種を選ぶ？</span>
      </div>

      <div className="dx-grid farm-grid">
        {varietyList.map((v) => {
          const isCommitted = committed === v.id;
          return (
            <div key={v.id} className={`dx-card ${isCommitted ? "selected" : ""}`}>
              <div className="dx-head">
                <span className="dx-name">{v.name}</span>
                <button
                  className="dx-more"
                  aria-label={openId === v.id ? "とじる" : "どんな品種か見る"}
                  onClick={() => setOpenId(openId === v.id ? null : v.id)}
                >
                  {openId === v.id ? "－" : "？"}
                </button>
              </div>
              {openId === v.id && (
                <p className="dx-pattern">
                  播種適期 {v.window.map((m) => `${m}月`).join("・")} / 収穫まで約{v.harvestDays}日 /
                  暑さに{v.heatOk ? "強い" : "弱い"}
                </p>
              )}
              <button
                className={`dx-commit ${isCommitted ? "on" : ""}`}
                onClick={() => sow(v.id)}
              >
                これでまく
              </button>
            </div>
          );
        })}
      </div>

      <p className="game-line soft center-line farm-disclaimer">
        ※品種の数値はこのゲームの中だけの、学習用の設定です
      </p>
    </div>
  );
}
