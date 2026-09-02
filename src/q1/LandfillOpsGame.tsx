// Q1: 最終処分場の管理者 (gameType: landfill_ops)
// 核: 「埋め立ては、埋めて終わりじゃない」— どの区画に埋め、今夜どこへ
// 覆いをかけるかを、天気と残りの材料で毎日決め直す。
// 覆土は飛散・におい・雨水（浸出水）対策の日課。今週は覆土材の納入が
// 遅れていて全面には足りない——優先順位が仕事になる。
// ルールは src/q1/wasteLogic.ts。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import {
  LF_DAYS, LF_CELL_CAP, LF_TANK_CAP, LF_COMPLAINT_LIMIT,
  newLandfill, lfPlace, lfNight, lfGrade, lfNextLoad, lfExposed,
} from "./wasteLogic";
import type { LandfillState, LfWeather, LfLoad } from "./wasteLogic";

const W_LABEL: Record<LfWeather, string> = { rain: "🌧 雨", wind: "💨 強い風", calm: "☀️ おだやか" };
const LOAD_LABEL: Record<LfLoad, string> = { ash: "⚱️ 焼却灰", incomb: "🪨 不燃残さ" };

type Step = "place" | "cover" | "failed" | "done";

export default function LandfillOpsGame({ onComplete }: Q1GameProps) {
  const [s, setS] = useState<LandfillState>(() => newLandfill());
  const [step, setStep] = useState<Step>("place");
  const [covers, setCovers] = useState<number[]>([]);
  const [failText, setFailText] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(1);

  const restart = () => {
    setS(newLandfill());
    setStep("place");
    setCovers([]);
    setNote(null);
    setAttempts((a) => a + 1);
  };

  if (step === "failed") {
    return (
      <div className="game board-game">
        <div className="result-card"><span className="result-title">操業を止めて、立て直し</span></div>
        <p className="game-line center-line">{failText}</p>
        <p className="game-line soft center-line">天気と搬入は毎週ちがう。覆いの使いどきを組み立て直そう。</p>
        <button className="btn primary big" onClick={restart}>🔁 次の週をあずかる</button>
      </div>
    );
  }

  if (step === "done") {
    const grade = lfGrade(s);
    const buried = s.fill.reduce((a, b) => a + b, 0);
    return (
      <div className="game board-game">
        <div className="result-card good"><span className="result-title">今週も、まちのごみを受け止めきった</span></div>
        <p className="game-line soft center-line">
          {grade === "perfect"
            ? "苦情ゼロ・水位も低い。覆いの優先順位が完璧だった。"
            : "回しきれた。集約して埋めると覆いの枚数が減ることも、覚えておこう。"}
          {attempts > 1 ? `（${attempts}週目で安定）` : ""}
        </p>
        <p className="game-line soft center-line">
          今週埋めたのは{buried}台ぶん。処分場の残りは<strong>埋めた分だけ確実に減る</strong>。
          残りが使える年数 = 残りの容量 ÷ 1年に埋める量。全国平均は<strong>約25年</strong>（2023年度）。
          だから灰を資源に変える提案や、まちの3Rを進める提案も、この仕事の大事な一部。
        </p>
        <button className="btn primary big" onClick={onComplete}>来週の計画を立てる</button>
      </div>
    );
  }

  const today = s.schedule[s.day - 1];
  const nextLoad = lfNextLoad(s);
  const weather = s.weather[s.day - 1];
  const tomorrow = s.day < LF_DAYS ? s.weather[s.day] : null;

  const meters = (
    <div style={{ display: "flex", gap: 10, margin: "4px 14px", fontSize: 12, flexWrap: "wrap" }}>
      <span>🟫 覆い材 {s.soil}</span>
      <span>💧 タンク {s.tank}/{LF_TANK_CAP}</span>
      <span>📣 苦情 {s.complaints}/{LF_COMPLAINT_LIMIT - 1}まで</span>
      <span>今夜 {W_LABEL[weather]}{tomorrow ? ` / 明日 ${W_LABEL[tomorrow]}` : ""}</span>
    </div>
  );

  const cells = (clickable: boolean, toggleMode: boolean) => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, margin: "8px 16px" }}>
      {s.fill.map((f, i) => (
        <button
          key={i}
          disabled={clickable ? !nextLoad : toggleMode ? !lfExposed(s).includes(i) : true}
          onClick={() => {
            if (clickable) {
              const r = lfPlace(s, i);
              if (r.result === "no_space_fail") { setFailText("この種類を置ける区画がなくなり、搬入を断ることになってしまった。"); setStep("failed"); return; }
              if (r.result === "cell_full") { setNote("この区画はいっぱい。ほかへ。"); return; }
              if (r.result === "type_mismatch") { setNote("係員が手で×をつくった——この区画には受け入れられない。"); return; }
              setS(r.state);
              setNote(null);
              if (r.state.placedToday >= today.length) {
                const exp = lfExposed(r.state);
                // duty default: cover everything exposed (trim only if material is short)
                setStep("cover");
                setCovers(exp.slice(0, r.state.soil));
                setNote(exp.length > r.state.soil ? "覆い材が足りない…どこを覆うか選ぼう。" : "今日さわった区画に覆いをかけて、夜をむかえる。");
              }
            } else if (toggleMode) {
              if (!lfExposed(s).includes(i)) { setNote(s.covered[i] ? "この区画は覆われたまま（さわっていない）。" : "ここは空でだいじょうぶ。"); return; }
              const has = covers.includes(i);
              const next = has ? covers.filter((x) => x !== i) : [...covers, i];
              if (next.length > s.soil) { setNote("覆い材が足りない。"); return; }
              setCovers(next);
              setNote(null);
            }
          }}
          style={{
            height: 96, borderRadius: 14, border: "2px solid rgba(0,0,0,0.15)",
            background: "#efe9dc", position: "relative", overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${(f / LF_CELL_CAP) * 78}%`, background: "#b8a58c", transition: "height 0.3s" }} />
          {((toggleMode && covers.includes(i)) || (f > 0 && s.covered[i])) && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(90,140,90,0.45)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🟩</div>
          )}
          <span style={{ position: "relative", fontSize: 12 }}>
            区画{i + 1} {s.cellType[i] ? (s.cellType[i] === "ash" ? "⚱️" : "🪨") : ""}<br />{f}/{LF_CELL_CAP}
          </span>
        </button>
      ))}
    </div>
  );

  if (step === "place") {
    return (
      <div className="game board-game">
        <div className="task-bar">
          <span className="task-now">{s.day}日目：搬入 のこり{today.length - s.placedToday}台</span>
          <span className="task-sub">{nextLoad ? `つぎの荷: ${LOAD_LABEL[nextLoad]} — どの区画へ？` : "配置完了"}</span>
        </div>
        {meters}
        <div style={{ textAlign: "center", fontSize: 22 }}>
          {today.slice(s.placedToday).map((l, i) => (i === 0 ? "▶" : "") + (l === "ash" ? "⚱️" : "🪨")).join(" ")}
        </div>
        {cells(true, false)}
        <InfoCards
          label="しごとの資料"
          cards={[{
            id: "rule", icon: "📋", title: "処分場のきまり",
            body: (
              <>
                <p><strong>覆い（覆土）は毎日の日課</strong>：その日さわった区画（作業面）に必ずかけて、
                  飛散・におい・雨水の侵入を防ぐ。かけた覆いは、次にその区画をさわるまで残る。</p>
                <p>今週は材料の納入が遅れていて<strong>全部には足りない日がある</strong>——
                  さわる区画を少なくする埋め方と、足りない夜の優先順位が腕の見せどころ。</p>
                <p><strong>この処分場の受入区分：⚱️焼却灰 と 🪨不燃残さ は別の区画へ</strong>（灰は資源化に
                  回せるよう分けて管理する、この施設のきまり）。</p>
                <p>🌧 雨の夜：覆いのない区画は、雨がごみに触れて<strong>汚れた水（浸出水）</strong>になり、
                  処理タンクにたまる（1区画で+2。タンクは1日に1しか処理できない）。</p>
                <p>💨 風の夜：覆いのない区画から飛散・においが出て<strong>苦情</strong>になる（1区画で+1）。</p>
                <p>あふれ・苦情{LF_COMPLAINT_LIMIT}件で操業見直し。埋める区画を<strong>集約</strong>すると覆いが少なくてすむ。</p>
              </>
            ),
          }]}
        />
        {note && <p className="game-note">{note}</p>}
      </div>
    );
  }

  // cover phase
  const exposedNow = lfExposed(s);
  const coverCost = covers.length;
  const shortfall = exposedNow.length - Math.min(s.soil, exposedNow.length);
  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">{s.day}日目の夜じたく：今夜は {W_LABEL[weather]}</span>
        <span className="task-sub">今日さわった区画には覆いをかけるのが日課（1区画=材料1）</span>
      </div>
      {meters}
      {cells(false, true)}
      <p className="game-line soft center-line">
        今夜おおう：{coverCost}/{exposedNow.length}区画 ・ 材料のこり {s.soil}
        {shortfall > 0 ? "（足りない！どこを覆うか選んで）" : ""}
      </p>
      {note && <p className="game-note">{note}</p>}
      <button
        className="btn primary big"
        onClick={() => {
          const r = lfNight(s, covers);
          if (r.note.includes("足りない")) { setNote(r.note); return; }
          if (r.event === "overflow_fail" || r.event === "complaint_fail") { setFailText(r.note); setStep("failed"); return; }
          if (r.event === "cleared") { setS(r.state); setStep("done"); return; }
          setS(r.state);
          setStep("place");
          setNote(
            r.weather === "rain"
              ? r.waterAdded > 0 ? `夜のあいだに雨。むき出しの区画から浸出水が +${r.waterAdded}。` : "雨だったが、覆いのおかげで水は増えなかった。"
              : r.weather === "wind"
                ? r.complaintsAdded > 0 ? `夜の強風で飛散・におい。苦情が +${r.complaintsAdded} 件…` : "強風だったが、覆いのおかげで飛ばなかった。"
                : "おだやかな夜だった。",
          );
        }}
      >
        🌙 夜をむかえる
      </button>
    </div>
  );
}
