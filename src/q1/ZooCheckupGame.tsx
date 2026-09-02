// Q1: 動物園の獣医師 (gameType: zoo_checkup)
// 核: 「まず触る、とは限らない」— 負担の小さい検査から選び、結果が方針を
// 変えるかを考えて、動物への負担をおさえたまま原因を特定する。
// ルールは src/q1/zooLogic.ts（血液以外の単独検査では確定しない証拠設計）。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import { BURDEN_BUDGET, newZooState, zooCheck, zooDecide, zooInspect } from "./zooLogic";
import type { ZooState, ZooCheck, ZooPlan, ZooCause } from "./zooLogic";

const CHECKS: { id: ZooCheck; label: string }[] = [
  { id: "diary", label: "📔 飼育日誌を読む（負担0）" },
  { id: "camera", label: "🎥 カメラ映像を見る（負担0）" },
  { id: "inspect", label: "👀 柵ごしの視診（負担1）" },
  { id: "fecal", label: "💩 うんちの検査（負担1）" },
  { id: "blood", label: "💉 保定して血液検査（負担3）" },
];
const PLANS: { id: ZooPlan; label: string }[] = [
  { id: "deworm", label: "💊 寄生虫のお薬の計画を立てる" },
  { id: "diet_review", label: "🥗 おやつと食事の見直しを頼む" },
  { id: "rest_pain", label: "🛏️ 安静と痛みのケアを始める" },
];
const CAUSE_LABEL: Record<ZooCause, string> = {
  worms: "おなかの寄生虫",
  overfeed: "おやつのあげすぎ",
  injury: "足のけが",
};

type Step = "work" | "failed" | "done";

export default function ZooCheckupGame({ onComplete }: Q1GameProps) {
  const [zs, setZs] = useState<ZooState>(() => newZooState());
  const [evidence, setEvidence] = useState<{ check: ZooCheck; text: string }[]>([]);
  const [step, setStep] = useState<Step>("work");
  const [note, setNote] = useState<string | null>(null);
  const [failText, setFailText] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(1);
  const c = zs.c;
  const burden = zs.burden;

  const restart = () => {
    setZs(newZooState());
    setEvidence([]);
    setNote(null);
    setFailText(null);
    setStep("work");
    setAttempts((a) => a + 1);
  };

  const alive = (cause: ZooCause) => {
    for (const e of evidence) {
      if (zooInspect({ cause }, e.check).text !== e.text) return false;
    }
    return true;
  };

  if (step === "failed") {
    return (
      <div className="game board-game">
        <div className="result-card"><span className="result-title">チーム会議で、見立て直し</span></div>
        <p className="game-line center-line">
          {failText ??
            "方針が合わず、効果が出なかった。獣医チームで所見を見直して、正しいケアに切りかえたよ。赤ちゃんはだいじょうぶ。"}
        </p>
        <p className="game-line soft center-line">「その検査で、方針は変わる？」——負担と情報のバランスを考え直そう。</p>
        <button className="btn primary big" onClick={restart}>🔁 次の診察に挑戦</button>
      </div>
    );
  }

  if (step === "done") {
    const grade = burden <= 1 ? "perfect" : "good";
    return (
      <div className="game board-game">
        <div className="result-card good"><span className="result-title">負担をおさえて、原因にたどりついた！</span></div>
        <p className="game-line soft center-line">
          原因は「{CAUSE_LABEL[c.cause]}」。つかった負担は {burden}。
          {grade === "perfect"
            ? "観察と、的をしぼったひと調べだけで確定——「まず触る、とは限らない」のお手本。"
            : "確定はできた。0負担の観察でどこまで絞れるかが、次の腕の見せどころ。"}
          {attempts > 1 ? `（${attempts}回目の診察で成功）` : ""}
        </p>
        <p className="game-line soft center-line">
          歩き方の動画も、落ちたうんちも、りっぱな「検査」。動物がふだん通り暮らしたまま
          調べるのが、動物園の獣医さんの技なんだ。
        </p>
        <button className="btn primary big" onClick={onComplete}>カルテに記録する</button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">赤ちゃんのようすが、いつもとちがう</span>
        <span className="task-sub">動物への負担（こえる検査は選べない）</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4, margin: "6px 14px" }}>
        <span style={{ fontSize: 12 }}>🦝 負担</span>
        {Array.from({ length: BURDEN_BUDGET }).map((_, i) => (
          <span key={i} style={{ width: 26, height: 10, borderRadius: 5, background: i < burden ? "#d9744a" : "#e9e2cf", transition: "background 0.4s" }} />
        ))}
        <span style={{ fontSize: 11, color: "#8a7f6a" }}>{burden}/{BURDEN_BUDGET}</span>
      </div>

      <div style={{ display: "flex", gap: 6, margin: "6px 14px", flexWrap: "wrap" }}>
        {(Object.keys(CAUSE_LABEL) as ZooCause[]).map((cause) => (
          <span key={cause} style={{
            fontSize: 12, padding: "4px 10px", borderRadius: 12,
            background: alive(cause) ? "#fdf3d8" : "#e8e8e8",
            textDecoration: alive(cause) ? "none" : "line-through",
            opacity: alive(cause) ? 1 : 0.5,
          }}>
            {CAUSE_LABEL[cause]}
          </span>
        ))}
      </div>

      {evidence.length === 0 && (
        <p className="game-line soft center-line">
          いきなり捕まえたりしない。<strong>負担の小さい調べ方</strong>から。
          「その検査で方針が変わるか」も考えて選ぼう。
        </p>
      )}
      {evidence.map((e, i) => (
        <p key={i} className="game-note" style={{ margin: "4px 14px" }}>
          🔎 {CHECKS.find((k) => k.id === e.check)?.label.split("（")[0]}：{e.text}
        </p>
      ))}
      {note && <p className="game-note">{note}</p>}

      <p className="pick-title">調べる</p>
      <div className="choice-row wrap">
        {CHECKS.map((k) => {
          const used = zs.checked.includes(k.id);
          return (
            <button
              key={k.id}
              className="choice-card"
              disabled={used}
              style={{ opacity: used ? 0.4 : 1 }}
              onClick={() => {
                const { state, result } = zooCheck(zs, k.id);
                setZs(state);
                if ("refused" in result) {
                  if (state.outcome === "restraint_aborted") {
                    setFailText("保定に強い抵抗——無理はさせられないので、今日の診察は中止。動物の安全がいちばん。あらためて診察をやり直そう。");
                    setStep("failed");
                    return;
                  }
                  setNote(result.refused);
                  return;
                }
                setEvidence((ev) => [...ev, { check: k.id, text: result.text }]);
                setNote(null);
              }}
            >
              <span className="choice-name">{k.label}</span>
            </button>
          );
        })}
      </div>

      <p className="pick-title">方針を決める（1回勝負）</p>
      <div className="choice-row wrap">
        {PLANS.map((p) => (
          <button
            key={p.id}
            className="choice-card"
            onClick={() => {
              const r = zooDecide(zs, p.id);
              setZs(r);
              if (r.refusal) { setNote(r.refusal); return; }
              if (r.outcome === "solved") { setStep("done"); return; }
              setStep("failed");
            }}
          >
            <span className="choice-name">{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
