// Q1: 画面の見やすさ改善 (gameType: ui_clarity)
// 核: 「足すほど散らかる」— テスト報告に合う直しを3つまで選ぶ。decoy（派手アニメ・
// 全部表示）は混雑を悪化させ差し戻し。モックがライブで変わる。studioLogicが機械強制。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import { UI_PICK_LIMIT, UI_MISTAKE_LIMIT, newUiState, uiToggle, uiServe, uiFault } from "./studioLogic";
import type { UiState, UiFixId, UiReportId } from "./studioLogic";

type Step = "work" | "failed" | "done";

const REPORT_TEXT: Record<UiReportId, string> = {
  misstap: "こうげきボタンを押したいのに、となりの「けってい」を押しちゃう",
  color_only: "敵と味方が、色でしか区別できなくて分かりにくい",
  tiny_text: "たいりょくの数字が小さすぎて、読めない",
  no_cooldown: "ひっさつ技がいつ使えるようになるのか、分からない",
  glare: "背景がまぶしくて、敵の弾が見えない",
};
const FIX_INFO: Record<UiFixId, { label: string; sub: string }> = {
  separate_buttons: { label: "ボタンを離す", sub: "こうげきと決定の間を空ける" },
  shape_enemy_mark: { label: "形でも区別", sub: "敵に△マークを足す" },
  bigger_hp_text: { label: "数字を大きく", sub: "たいりょく表示を拡大" },
  cooldown_ring: { label: "残りの輪", sub: "技ボタンに残り時間ゲージ" },
  dim_background: { label: "背景を暗く", sub: "たたかい中は背景をおさえる" },
  flashy_anim: { label: "派手アニメ", sub: "画面全体にキラキラを足す" },
  show_everything: { label: "全部表示", sub: "情報をぜんぶ画面に出す" },
  recolor_only: { label: "色を変える", sub: "敵の色を別の色にするだけ" },
};

export default function UiClarityGame({ onComplete }: Q1GameProps) {
  const [us, setUs] = useState<UiState>(() => newUiState());
  const [step, setStep] = useState<Step>("work");
  const [note, setNote] = useState<string | null>("テスト報告に合う直しを、3つまで選ぼう。");
  const [faultReport, setFaultReport] = useState<UiReportId | null>(null);
  const [attempts, setAttempts] = useState(1);

  const restart = () => {
    setUs(newUiState());
    setNote("テスト報告に合う直しを、3つまで選ぼう。");
    setFaultReport(null);
    setStep("work");
    setAttempts((a) => a + 1);
  };

  const has = (f: UiFixId) => us.picked.includes(f);

  // the screen mock IS the world: it changes live with each pick
  const mock = (
    <div style={{ margin: "6px 14px", position: "relative", height: 150, borderRadius: 14, overflow: "hidden", border: "2px solid #22343c", background: has("dim_background") ? "linear-gradient(#3a4652,#2c3742)" : "linear-gradient(#8fb6e0,#f0d9a0)" }}>
      {/* enemies vs ally */}
      <span style={{ position: "absolute", left: "16%", top: "26%", fontSize: 24, color: "#d97b6c" }}>●{has("shape_enemy_mark") && <b style={{ fontSize: 13 }}>△</b>}</span>
      <span style={{ position: "absolute", left: "38%", top: "16%", fontSize: 24, color: "#d97b6c" }}>●{has("shape_enemy_mark") && <b style={{ fontSize: 13 }}>△</b>}</span>
      <span style={{ position: "absolute", left: "26%", top: "58%", fontSize: 24, color: has("recolor_only") ? "#c9a0d9" : "#6c9ed9" }}>●</span>
      {/* HP */}
      <span style={{ position: "absolute", left: 8, top: 6, fontWeight: "bold", color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.5)", fontSize: has("bigger_hp_text") ? 20 : 9 }}>HP 37/50</span>
      {/* buttons */}
      <div style={{ position: "absolute", right: 8, bottom: 8, display: "flex", gap: has("separate_buttons") ? 18 : 2 }}>
        <span style={{ background: "#e8e2d2", borderRadius: 8, padding: "5px 8px", fontSize: 11 }}>⚔ こうげき</span>
        <span style={{ background: "#e8e2d2", borderRadius: 8, padding: "5px 8px", fontSize: 11 }}>✔ けってい</span>
      </div>
      {/* skill button */}
      <div style={{ position: "absolute", left: 8, bottom: 8, background: "#e8e2d2", borderRadius: 999, width: 34, height: 34, display: "grid", placeItems: "center", fontSize: 15, border: has("cooldown_ring") ? "3px solid #7fb98a" : "none" }}>✨</div>
      {has("flashy_anim") && <span style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 34, opacity: 0.55 }}>✨🎆✨🎇✨</span>}
      {has("show_everything") && (
        <div style={{ position: "absolute", left: "30%", top: 4, fontSize: 8.5, background: "rgba(255,255,255,0.85)", borderRadius: 6, padding: 3, lineHeight: 1.3 }}>
          そうび/スコア/ちず/クエスト/もちもの/てんき/じかん…
        </div>
      )}
    </div>
  );

  if (step === "failed") {
    return (
      <div className="game board-game">
        <div className="result-card"><span className="result-title">画面の直しは、リーダーが引き取った</span></div>
        {mock}
        <p className="game-line center-line">「報告と直しを、1対1でつなげてみよう」——ホワイトボードに報告が貼り直された。</p>
        <p className="game-line soft center-line">足すほど、散らかる。直しは報告に合わせて、必要なぶんだけ。（報告は毎回ちがう）</p>
        <button className="btn primary big" onClick={restart}>🔁 別の報告で</button>
      </div>
    );
  }

  if (step === "done") {
    const perfect = us.redos === 0 && attempts === 1;
    return (
      <div className="game board-game">
        <div className="result-card good"><span className="result-title">再テスト、「見やすい！」の声</span></div>
        {mock}
        <p className="game-line soft center-line">
          {perfect ? "3つの報告に、3つの直し。むだのない画面になった。" : "直った。色だけにたよらない・今いる情報だけ、が合言葉。"}
        </p>
        <p className="game-line soft center-line">
          UIデザイナーは「かっこいい画面」より先に「まちがえない画面」を作る人なんだ。
        </p>
        <button className="btn primary big" onClick={onComplete}>案を送る</button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">たたかい画面を、報告に合わせて直す</span>
        <span className="task-sub">やり直せるのは あと{UI_MISTAKE_LIMIT - us.redos - 1}回</span>
      </div>

      {mock}

      <div style={{ margin: "4px 14px", padding: "7px 10px", borderRadius: 10, background: "#f6f1e3", border: "1.5px solid #d8c9a8", fontSize: 16 }}>
        <b style={{ fontSize: 13, color: "#6b5d45" }}>📮 テスト報告（3件）</b>
        {us.c.reports.map((r) => (
          <div key={r.id} style={{ marginTop: 3, padding: faultReport === r.id ? "2px 6px" : 0, borderRadius: 8, border: faultReport === r.id ? "2px solid #d9744a" : "none" }}>
            ・{REPORT_TEXT[r.id]}
          </div>
        ))}
      </div>

      <InfoCards
        label="しごとの資料"
        cards={[{
          id: "rule", icon: "📋", title: "UIのきまり",
          body: (
            <>
              <p>報告と直しは<strong>1対1</strong>。報告にない直しは、画面を混雑させる。</p>
              <p>色だけで区別しない。形や文字もいっしょに使う。</p>
              <p>今のプレイに必要な情報だけを出す。直しは3つまで。</p>
            </>
          ),
        }]}
      />

      {note && <p className="game-note">{note}</p>}

      <p className="pick-title">直しを選ぶ（{us.picked.length}/{UI_PICK_LIMIT}）</p>
      <div className="choice-row wrap">
        {(Object.keys(FIX_INFO) as UiFixId[]).map((f) => (
          <button
            key={f}
            className={`choice-card ${has(f) ? "selected" : ""}`}
            onClick={() => {
              const nx = uiToggle(us, f);
              if (nx.refusal) { setNote(nx.refusal); return; }
              setUs(nx);
              setFaultReport(null);
              setNote(null);
            }}
          >
            <span className="choice-name">{FIX_INFO[f].label}</span>
            <small style={{ opacity: 0.7 }}>{FIX_INFO[f].sub}</small>
          </button>
        ))}
      </div>

      <button
        className="btn primary big"
        onClick={() => {
          const fault = uiFault(us);
          const r = uiServe(us);
          setUs(r.state);
          if (r.state.outcome === "done") { setStep("done"); return; }
          if (r.state.outcome === "mentor_fail") { setStep("failed"); return; }
          if (fault?.kind === "decoy") {
            setFaultReport(null);
            setNote(`…テスターが顔をしかめた。「${FIX_INFO[fault.fix].label}」で、画面がかえって見にくい。`);
          } else if (fault?.kind === "report") {
            setFaultReport(fault.report);
            setNote("…テスターが報告の1つを、とんとんと指さした。");
          }
        }}
      >
        ✅ 再テスト
      </button>
    </div>
  );
}
