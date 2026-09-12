// Q1: イベントを知らせる仕事 / 広報・PR (gameType: reach_mix)
// legacy-reach-mix rebuild, translation t5-compare-candidate-plans (adopted after r1-r8
// design review; Human Decision 2026-09-12 removed the fixed tie-break and added the
// sticky comparison bar). Rules live in src/q1/reachMixLogic.ts (mirrors
// factory/projects/legacy-reach-mix/design/design-sim.mjs exactly).
//
// B: イベントの準備は進んだけれど、まだだれも知らない。今回の重点対象・今回の状況は
//    毎回変わる。C: 重点対象＋3つの状況設定（常設のsticky比較サマリーバー、開閉操作
//    不要）と、3つの広報プラン案（タップして開く読み物、中心媒体の一般的な強み・
//    弱みが説明文に組み込まれている——独立した参考カードは存在しない）。
// D: 今回の重点対象・状況に照らして3つのプランを比較し、妥当な1つを選んで1回だけ
//    確定する（同程度に妥当なプランが複数あれば、そのどれを選んでも正解）。
import { useLayoutEffect, useRef, useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import type { PlanId } from "./reachMixLogic";
import { PLAN_IDS, newSession, sessionWin, stumbleFor } from "./reachMixLogic";
import type { Audience, ReachMixSession } from "./reachMixLogic";

const AUDIENCE_INFO: Record<Audience, { label: string; emoji: string }> = {
  family: { label: "子育て中の家族", emoji: "👨‍👩‍👧" },
  young: { label: "若い世代", emoji: "📱" },
  older: { label: "年配の世代・地域の幅広い人", emoji: "🏘️" },
};

const PLAN_INFO: Record<PlanId, { name: string; emoji: string; body: string }> = {
  flyer_plan: {
    name: "プランA チラシ・掲示",
    emoji: "📄",
    body: "保育園・幼稚園・小学校にチラシを置かせてもらい、掲示板にも貼ってもらう。子育て中の家族に特に強く、同じような地域イベントで来場者に『どこでイベントを知ったか』を尋ねたアンケートでは、チラシと答えた人が一番多かったという実績がある（保育園・幼稚園・小学校へのチラシ配布は、その実際の配布経路として記録されている）。ただし、協力してくれる施設が少ないと、配れる数も減ってしまう。",
  },
  sns_plan: {
    name: "プランB SNS・ウェブサイト",
    emoji: "💬",
    body: "SNSに投稿し、ウェブサイトも新しくする。若い世代によく届く。ただし、アカウントのフォロワーが少ないと、届く範囲も狭くなる。",
  },
  media_plan: {
    name: "プランC ポスター・報道機関",
    emoji: "📰",
    body: "街にポスターを貼り、新聞社・テレビ局に取材資料を送る。年配の世代・地域の幅広い人によく届く。準備時間が短いと、資料が薄くなってしまう。取材してもらえるかどうかは新聞社・テレビ局が決める。",
  },
};

const COOP_LABEL: Record<Scenario["coopInstitutions"], string> = { 1: "1つ", 2: "2つ", 3: "3つ" };
const FOLLOWER_LABEL: Record<Scenario["followerTier"], string> = { 0: "少ない", 1: "ふつう", 2: "多い" };
const PREP_LABEL: Record<Scenario["prepWeeks"], string> = { 1: "1週間", 2: "2週間", 3: "3週間" };

// 主催団体自身の作業上のつまずき（対象側の反応には一切依拠しない——design review r10 BLOCKER是正: CAUSAL_REALISM_ERROR）
const STUMBLE_TEXT: Record<ReturnType<typeof stumbleFor>, string> = {
  flyer: "協力施設が少なく、用意したチラシの多くを配りきれずに残ってしまった。",
  sns: "投稿自体は予定どおり公開できたが、用意していた追加素材は『フォロワーが多く、投稿の届く範囲が広いときに重ねて投下する』という運用上の想定で準備していたもの。今回はフォロワーが少ないという、投稿前から分かっていた状況に照らすと、その運用条件自体に当てはまらず、結局投下しないまま終わった。",
  media: "投げ込み資料は送れたが、準備期間が短く詳しい資料を間に合わせられなかった。",
};

// プランの実行がスムーズに進む/つまずく様子を示す、媒体固有の具体的な視覚的変化
// （数値・到達人数は一切含まない——game_translations.system_reactionの「具体的な視覚的変化」を表現）。
const PLAN_VISUAL: Record<PlanId, { win: string; lose: string }> = {
  flyer_plan: { win: "📄→🏫→✅", lose: "📄📄📄→🏫→📦" },
  sns_plan: { win: "💬→🌐→✅", lose: "💬→🗂️→📦" },
  media_plan: { win: "📰→📮→✅", lose: "📰→📮→📦" },
};

type Scenario = ReachMixSession["scenario"];
type Phase = "select" | "result" | "reflect";

// .app-frame (the shared app shell) sets only overflow-x, which per the CSS overflow spec makes
// overflow-y compute to "auto" — but its height is min-height:100dvh (grows with content), so it
// never actually scrolls itself; the page/body does. That means `position: sticky` on a
// descendant is anchored to app-frame's box (which just moves with the page) and never visually
// sticks. `position: fixed` sidesteps this entirely (no ancestor here sets a transform/filter,
// so its containing block is the viewport) — used for the comparison bar below instead.
const CARD_STYLE = `
  .reachmix-summary { background: var(--ivory); border: 2px solid var(--orange); border-radius: 16px; padding: 10px 14px; box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 4px; }
  .reachmix-summary-title { font-size: 12.5px; font-weight: bold; margin-bottom: 2px; }
  .reachmix-summary-row { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; color: var(--text-soft); }
  .reachmix-summary-primary { flex-direction: column; align-items: flex-start; justify-content: flex-start; gap: 1px; font-size: 12px; color: var(--text); }
  .reachmix-summary-primary b { font-size: 14.5px; }
  .reachmix-summary-fixed-wrap { position: fixed; top: 0; left: 0; right: 0; display: flex; justify-content: center; z-index: 50; pointer-events: none; }
  .reachmix-summary-fixed-inner { pointer-events: auto; width: 100%; max-width: 480px; box-sizing: border-box; padding: 10px 16px 0; }
  .reachmix-cards { display: flex; flex-direction: column; gap: 8px; }
  .reachmix-card { background: var(--ivory); border: 2px solid var(--line); border-radius: 14px; padding: 8px 12px; box-shadow: var(--shadow); }
  .reachmix-card-picked { border-color: var(--orange); border-width: 3px; }
  .reachmix-card-head { display: flex; justify-content: space-between; align-items: center; width: 100%; background: none; border: none; padding: 4px 0; font-size: 13.5px; font-weight: bold; text-align: left; min-height: 44px; }
  .reachmix-card-toggle { color: var(--text-soft); font-size: 16px; }
  .reachmix-card-body { font-size: 14px; color: var(--text-soft); line-height: 1.5; margin: 2px 0 0; }
  .reachmix-result-visual { text-align: center; font-size: 34px; margin: 6px 0; }
`;

export default function PromoGame({ onComplete, onPartialComplete }: Q1GameProps) {
  const [session] = useState<ReachMixSession>(() => newSession());
  // openedEver: monotonic — has this card been read at least once (drives the disclosure gate).
  // currentOpen: the card's current expand/collapse state — a real toggle, closing does not
  // affect openedEver (game_spec_v1.json primary_action: "タップで開閉"; first_5_seconds_v8.json:
  // "閉じたままでも見出しだけは常時表示して簡易比較できる設計").
  const [openedEver, setOpenedEver] = useState<Set<PlanId>>(new Set());
  const [currentOpen, setCurrentOpen] = useState<Set<PlanId>>(new Set());
  const [selected, setSelected] = useState<PlanId | null>(null);
  const [confirmedPlan, setConfirmedPlan] = useState<PlanId | null>(null);
  const [reflectPick, setReflectPick] = useState<PlanId | null>(null);
  const [phase, setPhase] = useState<Phase>("select");
  const barRef = useRef<HTMLDivElement>(null);
  const [barH, setBarH] = useState(150); // sensible default before first measurement
  useLayoutEffect(() => {
    if (barRef.current) setBarH(barRef.current.offsetHeight);
  }, [session]);

  const allOpened = openedEver.size === PLAN_IDS.length;
  const win = confirmedPlan ? sessionWin(session, confirmedPlan) : null;

  const toggleOpen = (id: PlanId) => {
    setOpenedEver((s) => (s.has(id) ? s : new Set(s).add(id)));
    setCurrentOpen((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const confirm = () => {
    if (!selected || !allOpened) return;
    setConfirmedPlan(selected);
    setPhase("result");
  };

  const audience = AUDIENCE_INFO[session.primary];
  const summaryBar = (
    <div className="reachmix-summary">
      <div className="reachmix-summary-title">📣 イベントの準備は進んだ。でも、まだだれも知らない！</div>
      <div className="reachmix-summary-row reachmix-summary-primary">
        <span>{audience.emoji} 今回、特に届けたい相手</span>
        <b>{audience.label}</b>
      </div>
      <div className="reachmix-summary-row">
        <span>🏫 協力してくれる施設の数</span>
        <b>{COOP_LABEL[session.scenario.coopInstitutions]}</b>
      </div>
      <div className="reachmix-summary-row">
        <span>📶 SNSアカウントのフォロワーの多さ</span>
        <b>{FOLLOWER_LABEL[session.scenario.followerTier]}</b>
      </div>
      <div className="reachmix-summary-row">
        <span>🗓️ 準備にかけられる期間</span>
        <b>{PREP_LABEL[session.scenario.prepWeeks]}</b>
      </div>
    </div>
  );

  const planCards = (pickable: boolean, pick: PlanId | null, onPick: (id: PlanId) => void) => (
    <div className="reachmix-cards">
      {session.order.map((id) => {
        const info = PLAN_INFO[id];
        const isOpen = currentOpen.has(id);
        const isPicked = pick === id;
        return (
          <div key={id} className={`reachmix-card${isPicked ? " reachmix-card-picked" : ""}`}>
            <button className="reachmix-card-head" onClick={() => toggleOpen(id)}>
              <span>{info.emoji} {info.name}</span>
              <span className="reachmix-card-toggle">{isOpen ? "－" : "＋"}</span>
            </button>
            {isOpen && <p className="reachmix-card-body">{info.body}</p>}
            {isOpen && pickable && (
              <button
                className={`btn ${isPicked ? "primary" : ""}`}
                style={{ marginTop: 6, minHeight: 44 }}
                onClick={() => onPick(id)}
              >
                {isPicked ? "✓ この案で決める" : "この案で決める"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );

  if (phase === "select") {
    return (
      <div className="game board-game">
        <style>{CARD_STYLE}</style>
        <div className="reachmix-summary-fixed-wrap">
          <div className="reachmix-summary-fixed-inner" ref={barRef}>
            {summaryBar}
          </div>
        </div>
        <div style={{ height: barH }} aria-hidden />
        {planCards(true, selected, setSelected)}
        <button
          className="btn primary big"
          disabled={!allOpened || !selected}
          style={{ opacity: !allOpened || !selected ? 0.45 : 1 }}
          onClick={confirm}
        >
          {!allOpened
            ? "3つのプランをすべて読んでから決める（確定したらやり直せない）"
            : selected
              ? `${PLAN_INFO[selected].name}で知らせる（確定したらやり直せない）`
              : "プランを1つえらんでから決める（確定したらやり直せない）"}
        </button>
      </div>
    );
  }

  if (phase === "result" && win) {
    return (
      <div className="game board-game">
        <style>{CARD_STYLE}</style>
        <div className="result-card good">
          <span className="result-title">今回のプランはうまく進んだ！</span>
        </div>
        <div className="reachmix-result-visual">{PLAN_VISUAL[confirmedPlan!].win}</div>
        <p className="game-line center-line">{PLAN_INFO[confirmedPlan!].name}の実行が、今回はスムーズに進んでいく。</p>
        <p className="game-line soft center-line">実行委員会のメンバーから「これでいこう、この調子で進めよう」と前向きな声が上がった。</p>
        <button className="btn primary big" onClick={onComplete}>次へ</button>
      </div>
    );
  }

  if (phase === "result" && win === false) {
    return (
      <div className="game board-game">
        <style>{CARD_STYLE}</style>
        <div className="result-card">
          <span className="result-title">今回は、うまく進まなかった</span>
        </div>
        <div className="reachmix-result-visual">{PLAN_VISUAL[confirmedPlan!].lose}</div>
        <p className="game-line center-line">{STUMBLE_TEXT[stumbleFor(confirmedPlan!)]}</p>
        <p className="game-line soft center-line">実行委員会のメンバーから「ここは次回、もう少し工夫が必要かもしれないね」という声が上がった。</p>
        <button
          className="btn primary big"
          onClick={() => setPhase("reflect")}
        >
          振り返ってみる
        </button>
      </div>
    );
  }

  // 非採点の振り返り（Gate G）: 同じ重点対象・状況・3つのプラン案を再提示し、
  // 「今度はどのプランを選べばよかったか」を考える。結果は変わらない。
  return (
    <div className="game board-game">
      <style>{CARD_STYLE}</style>
      <div className="task-bar">
        <span className="task-now">今度はどのプランを選べばよかったか、もう一度考えてみよう</span>
        <span className="task-sub">これは振り返りで、結果はもう変わらない</span>
      </div>
      {summaryBar}
      {planCards(true, reflectPick, setReflectPick)}
      <button className="btn primary big" disabled={!reflectPick} style={{ opacity: reflectPick ? 1 : 0.45 }} onClick={() => (onPartialComplete ? onPartialComplete() : onComplete())}>
        次へ
      </button>
    </div>
  );
}
