// Q1: 不具合の再現手順しぼりこみ (gameType: bug_repro)
// 核: 「1回に1条件だけ変える」— テスト機の予算内で💥の最小条件ペアを特定し、
// 最短の再現手順として不具合票を書く。studioLogicが機械強制。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import { withRuby } from "../lib/ruby";
import { CONDS, RUN_BUDGET, REPRO_MISTAKE_LIMIT, newReproState, reproRun, reproFile } from "./studioLogic";
import type { ReproState, Cond } from "./studioLogic";

type Step = "work" | "failed" | "done";

const COND_INFO: Record<Cond, { emoji: string; label: string }> = {
  after_save: { emoji: "💾", label: "セーブ直後" },
  net_off: { emoji: "📡", label: "通信オフ" },
  item_used: { emoji: "🧪", label: "アイテム使用" },
  cave_area: { emoji: "🕳", label: "どうくつ" },
};

export default function BugReproGame({ onComplete }: Q1GameProps) {
  const [rs, setRs] = useState<ReproState>(() => newReproState());
  const [sel, setSel] = useState<Cond[]>([]);
  const [step, setStep] = useState<Step>("work");
  const [note, setNote] = useState<string | null>("条件を組み合わせて、テスト実行してみよう。");
  const [attempts, setAttempts] = useState(1);

  const restart = () => {
    setRs(newReproState());
    setSel([]);
    setNote("条件を組み合わせて、テスト実行してみよう。");
    setStep("work");
    setAttempts((a) => a + 1);
  };

  const toggle = (c: Cond) => {
    setSel((xs) => (xs.includes(c) ? xs.filter((x) => x !== c) : [...xs, c]));
    setNote(null);
  };

  // the test bench IS the world: run log with ✅/💥 stamps
  const bench = (
    <div style={{ margin: "6px 14px", background: "#2c3440", borderRadius: 14, padding: "8px 10px", color: "#dfe6ee" }}>
      <div style={{ display: "flex", alignItems: "center", fontSize: 12.5 }}>
        <span>🖥 テスト機のログ</span>
        <span style={{ marginLeft: "auto" }}>実行のこり {RUN_BUDGET - rs.runs.length}</span>
      </div>
      {rs.runs.length === 0 && <div style={{ fontSize: 11.5, color: "#93a3b3", marginTop: 4 }}>（まだ実行していない）</div>}
      {rs.runs.map((r, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: 14 }}>
          <span>{r.crashed ? "💥" : "✅"}</span>
          <span style={{ fontSize: 13.5 }}>{r.conds.length === 0 ? "（条件なし）" : r.conds.map((c) => COND_INFO[c].emoji + COND_INFO[c].label).join(" ＋ ")}</span>
          {r.crashed && <span style={{ marginLeft: "auto", fontSize: 10.5, color: "#e8a0a0" }}>止まった！</span>}
        </div>
      ))}
    </div>
  );

  if (step === "failed") {
    return (
      <div className="game board-game">
        <div className="result-card"><span className="result-title">票は、リーダーが引き取った</span></div>
        {bench}
        <p className="game-line center-line">「惜しい。手順のしぼりこみは、いっしょにやり直そう」——発売前の時間は貴重だ。</p>
        <p className="game-line soft center-line">コツは、1回に1条件だけ変えること。（止まる条件は毎回ちがう）</p>
        <button className="btn primary big" onClick={restart}>🔁 別の不具合で</button>
      </div>
    );
  }

  if (step === "done") {
    const perfect = rs.mistakes === 0 && attempts === 1;
    return (
      <div className="game board-game">
        <div className="result-card good"><span className="result-title">不具合票が、受理された！</span></div>
        {bench}
        <p className="game-line soft center-line">
          {withRuby(`最短の｜再現手順《さいげんてじゅん》：${rs.c.pair.map((c) => COND_INFO[c].label).join("＋")}で必ず止まる。`)}
        </p>
        <p className="game-line soft center-line">
          {perfect ? "開発席の赤ランプが灯り、プログラマーがすぐ調べ始めた。" : "「たまに止まる」が「必ず止まる手順」になった。これで直せる。"}
        </p>
        <button className="btn primary big" onClick={onComplete}>票を回す</button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">{withRuby("「たまに止まる」の最短の｜再現手順《さいげんてじゅん》を、つきとめる")}</span>
        <span className="task-sub">まちがえられる票は あと{REPRO_MISTAKE_LIMIT - rs.mistakes - 1}枚</span>
      </div>

      {bench}

      <InfoCards
        label="しごとの資料"
        cards={[{
          id: "rule", icon: "📋", title: "不具合票のきまり",
          body: (
            <>
              <p>{withRuby("｜不具合票《ふぐあいひょう》には、だれでも再現できる手順を書く。「たまに」はNG。")}</p>
              <p>コツは1回に1条件だけ変えること。ちがいが出たら、その条件があやしい。</p>
              <p>票を出す前に、その手順<strong>だけ</strong>で止まるのを自分の目で確かめる。</p>
            </>
          ),
        }]}
      />

      {note && <p className="game-note">{withRuby(note)}</p>}

      <p className="game-line" style={{ margin: "4px 16px 0", fontSize: 16 }}>
        いまの条件：{sel.length === 0 ? "（なし）" : sel.map((c) => COND_INFO[c].label).join("＋")}
      </p>
      <p className="pick-title">条件を選ぶ（いま {sel.length} 個）</p>
      <div className="choice-row wrap">
        {CONDS.map((c) => (
          <button key={c} className={`choice-card ${sel.includes(c) ? "selected" : ""}`} onClick={() => toggle(c)}>
            <span className="choice-name">{COND_INFO[c].emoji} {COND_INFO[c].label}</span>
          </button>
        ))}
      </div>

      <div className="choice-row">
        <button
          className="choice-card"
          onClick={() => {
            const nx = reproRun(rs, sel);
            if (nx.refusal) { setNote(nx.refusal); return; }
            setRs(nx);
            setNote(null);
          }}
        >
          <span className="choice-name">▶ テスト実行</span>
          <small style={{ opacity: 0.7 }}>この条件で動かす</small>
        </button>
        <button
          className="choice-card"
          onClick={() => {
            const r = reproFile(rs, sel);
            setRs(r.state);
            if (r.state.refusal) { setNote(r.state.refusal); return; }
            if (r.state.outcome === "done") { setStep("done"); return; }
            if (r.state.outcome === "mentor_fail") { setStep("failed"); return; }
            setNote(
              !r.minimal
                ? "…票が戻ってきた。付せんに「もっと短い手順が、あるはずです」。"
                : "…票が戻ってきた。付せんに「この手順だけで止まるか、確認を」。",
            );
          }}
        >
          <span className="choice-name">📝 票を書く</span>
          <small style={{ opacity: 0.7 }}>選んだ条件が手順になる</small>
        </button>
      </div>
    </div>
  );
}
