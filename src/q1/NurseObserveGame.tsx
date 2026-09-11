// Q1: 病棟看護師 (gameType: observe_care)
// B: 熱も呼吸も良くなってきたはずの患者が「なんか、だるくて……」と話している。食事・水分・排尿の
//    それぞれに気になる変化があるかどうかは、毎回セッションごとに独立にランダムで決まる。
// C/D: 7枚の観察カード（顔色・様子／食事／水分／排尿／体温／SpO₂／睡眠）をすべて開いて読んでから、
//    食事・水分・排尿の3項目それぞれを『気になる』か『特に変化なし』かでマークし、必ず『チームに
//    共有する』にチェックを入れて、1回のコミットで確定する。詳細はnurseObserveLogic.ts。
//
// 2026-09-10 (Q1 Autonomous Factory, legacy-observe-care rebuild, t1-mark-and-share-once): 旧実装は
// 3つの見立て（病名候補）から唯一の正解を選ばせ、同じ画面で何度でもやり直せる構造だった（reverse
// audit: exploit "brute force"）。それだけでなく、research.mdの調査により、看護師の実務上の到達点は
// 「病名を1つに確定すること」ではなく「気になる変化に気づいて、必ず共有すること」であると判明した
// （看護師は病名診断にこだわる必要がないという医師執筆のテキストの明言）。新実装は、病名を問わず、
// 食事・水分・排尿の3項目それぞれの気になる変化を見極めてマークし、必ず共有する、という構造にした。
// design review r1（FAIL 42、BLOCKER×4）は、最初のバージョンが『気になる変化が2項目以上あれば
// 報告、そうでなければ経過観察』という組み合わせ判定ルールを独自に考案し、それを専門的な正解として
// 認定していたことを指摘した——研究はそのような数値基準を一切示しておらず、単一の所見だけでも
// 要連絡に分類されうる（東京都医師会ガイドブック）。r2の修正で、報告/経過観察という対応の判定・
// 認定そのものをゲームの成功条件・結果表示から完全に撤去し、『気になる変化を項目ごとに正しく見極め、
// 必ず共有できたか』のみを問う設計に改めた（design review r2 PASS 86）。全項目の状態は最初から
// 単一のitemUI状態オブジェクトに統合し、各更新関数が自身のsetItemUI updaterのprevだけから完結する
// 構造にしている（legacy-sort-outの実装レビューr1で見つかったバッチング安全性の教訓を予防適用）。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import {
  EVIDENCE_ITEMS,
  EVIDENCE_LABELS,
  EVIDENCE_OBSERVATION,
  FIXED_CARDS,
  newSession,
  sessionWin,
  type EvidenceId,
  type Session,
} from "./nurseObserveLogic";

interface EvidenceUI {
  opened: boolean;
  mark: boolean | null; // true = concerning, false = not concerning, null = unmarked
}

const initialEvidenceUI = (): EvidenceUI => ({ opened: false, mark: null });

export default function NurseObserveGame({ onComplete, onPartialComplete }: Q1GameProps) {
  const [session] = useState<Session>(() => newSession());
  const [evidenceUI, setEvidenceUI] = useState<Record<EvidenceId, EvidenceUI>>(
    () => Object.fromEntries(EVIDENCE_ITEMS.map((id) => [id, initialEvidenceUI()])) as Record<EvidenceId, EvidenceUI>,
  );
  const [fixedOpened, setFixedOpened] = useState<Record<string, boolean>>(
    () => Object.fromEntries(FIXED_CARDS.map((c) => [c.id, false])),
  );
  const [shareChecked, setShareChecked] = useState(false);
  const [outcome, setOutcome] = useState<"playing" | "reflecting" | "done">("playing");
  const [reflectPicks, setReflectPicks] = useState<Partial<Record<EvidenceId, boolean>>>({});

  const openEvidence = (id: EvidenceId) =>
    setEvidenceUI((prev) => (prev[id].opened ? prev : { ...prev, [id]: { ...prev[id], opened: true } }));

  const markEvidence = (id: EvidenceId, mark: boolean) =>
    setEvidenceUI((prev) => (prev[id].opened ? { ...prev, [id]: { ...prev[id], mark } } : prev));

  const openFixed = (id: string) =>
    setFixedOpened((prev) => (prev[id] ? prev : { ...prev, [id]: true }));

  const openedCount =
    EVIDENCE_ITEMS.filter((id) => evidenceUI[id].opened).length +
    FIXED_CARDS.filter((c) => fixedOpened[c.id]).length;
  const allMarked = EVIDENCE_ITEMS.every((id) => evidenceUI[id].mark !== null);

  const confirm = () => {
    if (!allMarked || !shareChecked) return;
    const flags = Object.fromEntries(EVIDENCE_ITEMS.map((id) => [id, evidenceUI[id].mark])) as Record<EvidenceId, boolean>;
    const win = sessionWin(session, flags, shareChecked);
    setOutcome(win ? "done" : "reflecting");
  };

  const setReflectPick = (id: EvidenceId, mark: boolean) =>
    setReflectPicks((prev) => ({ ...prev, [id]: mark }));

  if (outcome === "done") {
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">気になる変化を正しく見極め、チームに伝えられた！</span>
          <p className="game-line soft">
            主治医やチームから「教えてくれてありがとう、詳しく見てみましょう」という返事があった。
            この先どう対応するかは、これから相談して決める。
          </p>
        </div>
        <button className="btn primary big" onClick={onComplete}>
          みんなに伝わったのを見届ける
        </button>
      </div>
    );
  }

  if (outcome === "reflecting") {
    const canFinish = EVIDENCE_ITEMS.every((id) => reflectPicks[id] !== undefined);
    return (
      <div className="game board-game">
        <div className="result-card">
          <span className="result-title">伝わった内容が、実際の状況とずれていた</span>
          <p className="game-line soft">
            同じ観察内容をもう一度見比べて、次はどうマークするか考えてみよう。
          </p>
        </div>
        <div className="dx-grid route-grid">
          {EVIDENCE_ITEMS.map((id) => (
            <div key={id} className="dx-card">
              <div className="dx-head">
                <span className="dx-name">{EVIDENCE_LABELS[id].icon} {EVIDENCE_LABELS[id].name}</span>
              </div>
              <p className="dx-pattern">
                {session.evidence[id] ? EVIDENCE_OBSERVATION[id].concerning : EVIDENCE_OBSERVATION[id].stable}
              </p>
              <p className="game-line soft">
                あなたのマーク: {evidenceUI[id].mark === null ? "（未選択）" : evidenceUI[id].mark ? "気になる" : "特に変化なし"}
              </p>
            </div>
          ))}
        </div>
        <p className="game-line soft center-line farm-disclaimer">今度はどうマークすればよかったと思う？</p>
        {EVIDENCE_ITEMS.map((id) => (
          <div key={id} className="choice-row wrap">
            <button
              className={`dx-commit ${reflectPicks[id] === true ? "on" : ""}`}
              onClick={() => setReflectPick(id, true)}
            >
              {EVIDENCE_LABELS[id].name}: 気になる
            </button>
            <button
              className={`dx-commit ${reflectPicks[id] === false ? "on" : ""}`}
              onClick={() => setReflectPick(id, false)}
            >
              {EVIDENCE_LABELS[id].name}: 特に変化なし
            </button>
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

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">「なんか、だるくて……」</span>
        <span className="task-sub">熱も呼吸も良くなってきたはずなのに…？　観察したカード: {openedCount}/7</span>
      </div>

      <div className="dx-grid route-grid">
        {FIXED_CARDS.map((c) => (
          <div key={c.id} className="dx-card">
            <div className="dx-head">
              <span className="dx-name">{c.icon} {c.name}</span>
              {!fixedOpened[c.id] && (
                <button className="dx-more" aria-label="観察する" onClick={() => openFixed(c.id)}>？</button>
              )}
            </div>
            {fixedOpened[c.id] && <p className="dx-pattern">{c.observation}</p>}
          </div>
        ))}

        {EVIDENCE_ITEMS.map((id) => {
          const ui = evidenceUI[id];
          return (
            <div key={id} className="dx-card">
              <div className="dx-head">
                <span className="dx-name">{EVIDENCE_LABELS[id].icon} {EVIDENCE_LABELS[id].name}</span>
                {!ui.opened && (
                  <button className="dx-more" aria-label="観察する" onClick={() => openEvidence(id)}>？</button>
                )}
              </div>
              {ui.opened && (
                <>
                  <p className="dx-pattern">
                    {session.evidence[id] ? EVIDENCE_OBSERVATION[id].concerning : EVIDENCE_OBSERVATION[id].stable}
                  </p>
                  <div className="choice-row wrap">
                    <button
                      className={`dx-commit ${ui.mark === true ? "on" : ""}`}
                      onClick={() => markEvidence(id, true)}
                    >
                      気になる
                    </button>
                    <button
                      className={`dx-commit ${ui.mark === false ? "on" : ""}`}
                      onClick={() => markEvidence(id, false)}
                    >
                      特に変化なし
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <label className="game-line soft center-line">
        <input
          type="checkbox"
          disabled={!allMarked}
          checked={shareChecked}
          onChange={(e) => setShareChecked(e.target.checked)}
        />
        {" "}チームに共有する
      </label>

      <button className="btn primary big" disabled={!allMarked || !shareChecked} onClick={confirm}>
        確定する
      </button>
    </div>
  );
}
