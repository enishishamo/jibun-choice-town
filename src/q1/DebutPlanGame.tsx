// Q1: 展示・広報企画 (gameType: debut_plan)
// 核: 「デビューは、赤ちゃんが決める」— 練習記録を読んでプランを組み、当日の
// ストレスサインに応じて 続行/縮小/中止 を判断する。サインなき中止は
// 「説明のつかない中止」としてロジックが拒否し、サイン後の中止は良い判断。
// ルールは src/q1/zooLogic.ts。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import {
  DEBUT_SLOTS, SIGN_LIMIT, newDebutCase, startDebut, debutStep, planValue, debutGrade,
} from "./zooLogic";
import type { DebutCase, DebutPlan, DebutState, ShrinkLever, SignType } from "./zooLogic";

const SIGN_LABEL: Record<SignType, string> = {
  pace: "同じ場所を行ったり来たりしている",
  hide: "隠れ場に入る時間が長くなってきた",
  eat_stop: "食べるのをやめて、あたりを気にしている",
};
const LEVERS: { id: ShrinkLever; label: string }[] = [
  { id: "shorten", label: "⏱ 時間を切り上げる方向に" },
  { id: "widen", label: "↔️ 観覧の距離を広げる" },
  { id: "cap", label: "🎟 人数をしぼる" },
];

type Step = "plan" | "run" | "failed" | "done";

export default function DebutPlanGame({ onComplete }: Q1GameProps) {
  const [c, setC] = useState<DebutCase>(() => newDebutCase());
  const [plan, setPlan] = useState<DebutPlan>({ duration: 2, distance: 2, capped: true });
  const [ds, setDs] = useState<DebutState | null>(null);
  const [step, setStep] = useState<Step>("plan");
  const [note, setNote] = useState<string | null>(null);
  const [failText, setFailText] = useState("");
  const [attempts, setAttempts] = useState(1);

  const restart = () => {
    setC(newDebutCase());
    setPlan({ duration: 2, distance: 2, capped: true });
    setDs(null);
    setNote(null);
    setStep("plan");
    setAttempts((a) => a + 1);
  };

  if (step === "failed") {
    return (
      <div className="game board-game">
        <div className="result-card"><span className="result-title">今日は、ここまで</span></div>
        {ds && (
          <div className="body-stage" style={{ padding: "6px 0" }}>
            <div style={{ position: "relative", width: "92%", maxWidth: 360, height: 110, background: "linear-gradient(#e2ecd8, #c9dcb9)", borderRadius: 14, border: "2px solid #b7d2a6", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 6, left: 8, fontSize: 14 }}>
                {[0, 1, 2].map((i) => (<span key={i}>{i < ds.signs ? "⚠️" : "▫️"}</span>))}
              </div>
              <div style={{ position: "absolute", left: 10, bottom: 8, width: 84, height: 58, background: "linear-gradient(#7d6247, #5f4a34)", borderRadius: "40px 40px 12px 12px", textAlign: "center", border: "2px solid #4c3b29" }}>
                <div style={{ fontSize: 20, marginTop: 2 }}>🦝</div>
                <div style={{ fontSize: 10, color: "#fff" }}>かくれ場でおやすみ</div>
              </div>
              <span style={{ position: "absolute", top: 4, right: 8, fontSize: 15, opacity: 0.45 }}>🚶🚶🚶 →</span>
              <span style={{ position: "absolute", bottom: 4, right: 8, fontSize: 10, color: "#4c6242", background: "rgba(255,255,255,0.75)", borderRadius: 8, padding: "1px 7px" }}>
                お客さんは、しずかに帰っていった
              </span>
            </div>
          </div>
        )}
        <p className="game-line center-line">{failText}</p>
        <p className="game-line soft center-line">
          あの子は寝室でゆっくり休んでいるよ。ここからは先輩の企画担当が引き継いで、
          飼育チームと計画を立て直してくれる。デビューはやり直せる。（性格も当日のできごとも、毎回ちがう）
        </p>
        <button className="btn primary big" onClick={restart}>🔁 別の日に、もう一度計画する</button>
      </div>
    );
  }

  if (step === "done" && ds) {
    const grade = debutGrade(ds);
    const early = ds.outcome === "done_early";
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">{early ? "早めに切り上げた。それが正解！" : "デビュー初日、ぶじ終了！"}</span>
        </div>
        <p className="game-line soft center-line">
          {grade === "perfect"
            ? early
              ? "サインが重なったのを見て、ためらわず切り上げた。「今日は見られないことがあります」と言えるのがプロ。"
              : "サインゼロで最後まで。練習記録からプランを当てた、みごとな企画。"
            : "終えられた。記録を読んで最初のプランを合わせると、もっと落ち着いた初日になる。"}
          {attempts > 1 ? `（${attempts}回目の計画で成功）` : ""}
        </p>
        <p className="game-line soft center-line">
          「かならず見せる」より「動物が出るかどうか選べる」。それが、いまの動物園の展示の考え方なんだ。
        </p>
        <button className="btn primary big" onClick={onComplete}>ふり返りを書いて共有する</button>
      </div>
    );
  }

  if (step === "plan") {
    const v = planValue(plan);
    return (
      <div className="game board-game">
        <div className="task-bar">
          <span className="task-now">デビュー初日のプランを組む</span>
          <span className="task-sub">プラン値 {v} — 園の期待に届くかは園長がチェックする（練習が順調な子ほど、期待も大きい）</span>
        </div>

        <InfoCards
          label="しごとの資料"
          cards={[
            {
              id: "log", icon: "📗", title: "展示練習の記録（この子のようす）",
              body: (<>{c.practiceLog.map((l, i) => <p key={i}>・{l}</p>)}</>),
            },
            {
              id: "rule", icon: "📋", title: "デビューのきまり",
              body: (
                <>
                  <p>最初から終日公開はしない。<strong>練習のようすに合わせて</strong>短時間・遠め・人数しぼりから。</p>
                  <p>当日にストレスサイン（行ったり来たり・隠れがち・食べるのをやめる）が出たら、
                    <strong>縮小や中止をためらわない</strong>。サイン{SIGN_LIMIT}つで、その日は終了。</p>
                  <p>サインが出ていないのに中止はできない（お客さんに説明がつかない）。</p>
                  <p>縮小はどれも同じではない。<strong>人数しぼりは「こみあい」に、距離を広げるのは「近い観覧」に、
                    切り上げは「長い公開」に</strong>、いちばんよくきく。</p>
                </>
              ),
            },
          ]}
        />

        <p className="pick-title">こうかい時間</p>
        <div className="choice-row">
          {([1, 2, 3] as const).map((d) => (
            <button key={d} className={`choice-card ${plan.duration === d ? "selected" : ""}`} onClick={() => setPlan({ ...plan, duration: d })}>
              <span className="choice-name">{d === 1 ? "30分" : d === 2 ? "1時間" : "2時間"}</span>
            </button>
          ))}
        </div>
        <p className="pick-title">観覧の近さ</p>
        <div className="choice-row">
          {([1, 2, 3] as const).map((d) => (
            <button key={d} className={`choice-card ${plan.distance === d ? "selected" : ""}`} onClick={() => setPlan({ ...plan, distance: d })}>
              <span className="choice-name">{d === 1 ? "遠くから" : d === 2 ? "ふつう" : "近くまで"}</span>
            </button>
          ))}
        </div>
        <p className="pick-title">人数せいげん</p>
        <div className="choice-row">
          <button className={`choice-card ${plan.capped ? "selected" : ""}`} onClick={() => setPlan({ ...plan, capped: true })}>
            <span className="choice-name">しぼる</span>
          </button>
          <button className={`choice-card ${!plan.capped ? "selected" : ""}`} onClick={() => setPlan({ ...plan, capped: false })}>
            <span className="choice-name">せいげんなし</span>
          </button>
        </div>

        {note && <p className="game-note">{note}</p>}
        <button
          className="btn primary big"
          onClick={() => {
            const s = startDebut(c, plan);
            if (s.outcome === "expect_fail") {
              setNote("園長「それでは、楽しみにしてきたお客さんに応えられないよ」");
              return;
            }
            setDs(s);
            setNote("開園。赤ちゃんのようすをよく見て。");
            setStep("run");
          }}
        >
          🦝 この計画で、初日をむかえる
        </button>
      </div>
    );
  }

  // run phase
  if (!ds) return null;
  const curEvent = ds.slot < DEBUT_SLOTS ? ds.c.events[ds.slot] : "none";
  // The yard IS the feedback: the cub drifts toward the hide box as signs
  // accumulate (CSS transition), the viewing lane shows today's crowd pressure,
  // and the sign lamps light up — legible without reading any text.
  const cubLeftPct = Math.max(18, 68 - ds.signs * 25);
  const crowdIcons =
    (curEvent === "crowd" ? "🚌" : curEvent === "noise" ? "📢" : "") +
    "🧍".repeat((ds.plan.capped || ds.shrinks.includes("cap") ? 1 : 3) + (curEvent === "crowd" ? 2 : 0));
  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">初日 {Math.min(ds.slot + 1, DEBUT_SLOTS)}/{DEBUT_SLOTS} 時間帯</span>
        <span className="task-sub">サイン {ds.signs}/{SIGN_LIMIT - 1}まで ・ 縮小ずみ {ds.shrinks.length}</span>
      </div>

      <div className="body-stage" style={{ padding: "8px 0" }}>
        <div style={{ position: "relative", width: "92%", maxWidth: 360, height: 150, background: "linear-gradient(#e7f2dc, #cfe4bd)", borderRadius: 14, border: "2px solid #b7d2a6", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 6, left: 8, display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.85)", borderRadius: 10, padding: "3px 8px", fontSize: 13 }}>
            <span style={{ fontSize: 10, color: "#6b6152" }}>サイン</span>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ width: 14, height: 14, borderRadius: 7, display: "inline-block", background: i < ds.signs ? "#e4593f" : "#ddd6c2", boxShadow: i < ds.signs ? "0 0 6px rgba(228,89,63,0.7)" : "none", transition: "background 0.4s" }} />
            ))}
          </div>
          <div style={{ position: "absolute", top: 6, right: 8, background: "rgba(255,255,255,0.85)", borderRadius: 10, padding: "3px 8px", fontSize: 15 }}>
            <span style={{ fontSize: 10, color: "#6b6152" }}>観覧 </span>{crowdIcons}
          </div>
          <div style={{ position: "absolute", left: 10, bottom: 10, width: 84, height: 62, background: "linear-gradient(#7d6247, #5f4a34)", borderRadius: "40px 40px 12px 12px", textAlign: "center", border: "2px solid #4c3b29" }}>
            <div style={{ fontSize: 22, marginTop: 4 }}>🌑</div>
            <div style={{ fontSize: 10, color: "#fff" }}>かくれ場</div>
          </div>
          <span style={{ position: "absolute", bottom: 16, left: `${cubLeftPct}%`, fontSize: 46, transition: "left 0.7s ease", filter: "drop-shadow(0 3px 3px rgba(0,0,0,0.25))" }}>🦝</span>
          <span style={{ position: "absolute", bottom: 4, right: 8, fontSize: 10, color: "#4c6242", background: "rgba(255,255,255,0.75)", borderRadius: 8, padding: "1px 7px" }}>
            {ds.signs === 0 ? "落ち着いて過ごしている" : ds.signs === 1 ? "かくれ場が気になり始めた" : "かくれ場のそばから離れない"}
          </span>
        </div>
      </div>

      {ds.slotLog.map((l, i) => (
        <p key={i} className="game-note" style={{ margin: "4px 14px" }}>
          {l.event === "crowd" ? "🚌 団体のお客さんが着いた。" : l.event === "noise" ? "📢 近くで大きな音がした。" : "☀️ おだやかな時間帯。"}
          {l.sign ? ` ⚠️ ${SIGN_LABEL[l.sign]}` : " 赤ちゃんは落ち着いている。"}
        </p>
      ))}
      {note && <p className="game-note">{note}</p>}

      {ds.slot < DEBUT_SLOTS && (
        <p className="game-note" style={{ margin: "4px 14px", fontWeight: 600 }}>
          いまのようす：
          {ds.c.events[ds.slot] === "crowd"
            ? "🚌 団体のお客さんが着いて、観覧通路がこみはじめた。"
            : ds.c.events[ds.slot] === "noise"
              ? "📢 近くで大きな音がしている。ざわつきやすい時間帯。"
              : "☀️ おだやかな時間帯。"}
        </p>
      )}

      <p className="pick-title">この時間帯、どうする？</p>
      <div className="choice-row wrap">
        <button
          className="choice-card"
          onClick={() => {
            const r = debutStep(ds, { kind: "continue" });
            setDs(r);
            setNote(null);
            if (r.outcome === "hidden_fail") { setFailText("サインが重なり、赤ちゃんは隠れ場から出てこなくなった。判断が少し遅かった——初日は中止して、静かに休ませよう。"); setStep("failed"); }
            else if (r.outcome === "done_full") setStep("done");
          }}
        >
          <span className="choice-name">▶ このまま続行</span>
        </button>
        {LEVERS.map((l) => (
          <button
            key={l.id}
            className="choice-card"
            disabled={ds.shrinks.includes(l.id)}
            style={{ opacity: ds.shrinks.includes(l.id) ? 0.4 : 1 }}
            onClick={() => {
              const r = debutStep(ds, { kind: "shrink", lever: l.id });
              setDs(r);
              setNote("運営を縮小して、ようすを見る。");
              if (r.outcome === "hidden_fail") { setFailText("縮小したが、サインが重なってしまった。初日は中止して休ませよう。"); setStep("failed"); }
              else if (r.outcome === "done_full") setStep("done");
            }}
          >
            <span className="choice-name">{l.label}</span>
          </button>
        ))}
        <button
          className="choice-card"
          onClick={() => {
            const r = debutStep(ds, { kind: "stop" });
            setDs(r);
            if (r.refusal) { setNote(r.refusal); return; }
            if (r.outcome === "done_early") { setStep("done"); return; }
            if (r.outcome === "postponed") {
              setFailText("サインが早くから重なり、ほとんど公開できないまま中止に。プランが今日のこの子に合っていなかった——仕切り直して、計画から見直そう。");
              setStep("failed");
            }
          }}
        >
          <span className="choice-name">🛑 今日はここまで（中止）</span>
        </button>
      </div>
    </div>
  );
}
