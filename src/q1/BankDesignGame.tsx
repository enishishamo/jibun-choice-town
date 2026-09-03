// Q1: 多自然川づくりの設計 (gameType: bank_design)
// 核: 「固める場所を、最小限にしぼる」— 安全が必要な区間は守り、それ以外は
// 川の自然にまかせる。落差には魚道。riverLogicが機械強制。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import { withRuby } from "../lib/ruby";
import { BANK_BUDGET, BANK_REDO_LIMIT, WORK_COST, newBankState, bankServe, bankCost, bankNature } from "./riverLogic";
import type { BankState, BankPlan, Section, Work } from "./riverLogic";

type Step = "work" | "failed" | "done";

const SEC_LABEL: Record<Section, string> = { homes: "住宅のそば", bend: "カーブ（侵食あと）", fields: "田んぼのわき", weir: "落差のある堰" };
const SEC_EMOJI: Record<Section, string> = { homes: "🏠", bend: "↩️", fields: "🌾", weir: "🚧" };
const WORKS: { id: Work; label: string; sub: string }[] = [
  { id: "concrete", label: "コンクリ護岸", sub: `いちばん固い・費用${WORK_COST.concrete}` },
  { id: "stone_root", label: "石積み＋根固め", sub: `固さと自然の間・費用${WORK_COST.stone_root}` },
  { id: "leave", label: "自然のまま", sub: "費用0・生きものに最良" },
  { id: "fishway", label: "魚道をつける", sub: `魚がのぼれる道・費用${WORK_COST.fishway}` },
];

const emptyPlan = (): BankPlan => ({ homes: null, bend: null, fields: null, weir: null });

export default function BankDesignGame({ onComplete }: Q1GameProps) {
  const [bs, setBs] = useState<BankState>(() => newBankState());
  const [plan, setPlan] = useState<BankPlan>(emptyPlan);
  const [sel, setSel] = useState<Section>("homes");
  const [step, setStep] = useState<Step>("work");
  const [note, setNote] = useState<string | null>("区間を選んで、工法を決めよう。");
  const [faultSec, setFaultSec] = useState<Section | null>(null);
  const [attempts, setAttempts] = useState(1);

  const restart = () => {
    setBs(newBankState());
    setPlan(emptyPlan());
    setSel("homes");
    setNote("区間を選んで、工法を決めよう。");
    setFaultSec(null);
    setStep("work");
    setAttempts((a) => a + 1);
  };

  const cost = bankCost(plan);

  const riverStrip = (after = false) => (
    <div style={{ margin: "6px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
      {bs.c.sections.map((sec) => {
        const w = plan[sec.section];
        return (
          <button
            key={sec.section}
            disabled={step !== "work"}
            onClick={() => { setSel(sec.section); setNote(null); setFaultSec(null); }}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 12,
              border: faultSec === sec.section ? "2.5px solid #d9744a" : sel === sec.section && step === "work" ? "3px solid #4a90d9" : "2px solid #c3d2da",
              boxShadow: faultSec === sec.section ? "0 0 10px rgba(217,116,74,0.5)" : "none",
              background: "linear-gradient(90deg,#dcead0 0 26%,#9fc8de 26%)",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: 20 }}>{SEC_EMOJI[sec.section]}</span>
            <span style={{ fontSize: 12, width: 128 }}>
              {SEC_LABEL[sec.section]}
              <br />
              <small style={{ color: "#5f6f78" }}>
                {sec.section === "weir" ? "魚がのぼれない段差" : `${sec.homesBehind ? "うしろに家" : "うしろは畑や野原"}${sec.erosion ? "・けずられたあと🌊" : ""}`}
              </small>
            </span>
            <span style={{ fontSize: 12, color: "#2e4a5a" }}>
              {after ? (
                w === "leave" ? "🐟 瀬と淵ができた" : w === "fishway" ? "🐟 魚がのぼっていく" : w === "stone_root" ? "🌿 石のすきまに生きもの" : "…コンクリのまま"
              ) : (
                w ? WORKS.find((x) => x.id === w)?.label : "—"
              )}
            </span>
          </button>
        );
      })}
      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
        <span>💰 予算</span>
        {Array.from({ length: BANK_BUDGET }).map((_, i) => (
          <span key={i} style={{ width: 20, height: 10, borderRadius: 5, background: i < cost ? "#d9a84a" : "#e9e2cf" }} />
        ))}
        <span style={{ color: cost > BANK_BUDGET ? "#c0392b" : "#8a7f6a" }}>{cost}/{BANK_BUDGET}</span>
        {step !== "work" && <span style={{ marginLeft: "auto" }}>🌿 自然のこり {bankNature(plan)}/6</span>}
      </div>
    </div>
  );

  if (step === "failed") {
    return (
      <div className="game board-game">
        <div className="result-card"><span className="result-title">設計会議で、通らなかった</span></div>
        {riverStrip()}
        <p className="game-line center-line">図面はベテラン設計者が引き取った。安全と自然、両方の目で見直すそうだ。</p>
        <p className="game-line soft center-line">守る区間をしぼる。ぜんぶ固めるのは、答えじゃない。（川のようすは毎回ちがう）</p>
        <button className="btn primary big" onClick={restart}>🔁 別の川で</button>
      </div>
    );
  }

  if (step === "done") {
    const perfect = bs.redos === 0 && attempts === 1 && bankNature(plan) >= 4;
    return (
      <div className="game board-game">
        <div className="result-card good"><span className="result-title">設計、会議を通った！</span></div>
        <p className="game-line soft center-line">3年後の、この川——</p>
        {riverStrip(true)}
        <p className="game-line soft center-line">
          {perfect ? withRuby("守る所は守り、あとは川にまかせた。｜瀬《せ》と｜淵《ふち》がもどる設計だ。") : "通った。固める場所が少ないほど、生きものの居場所がふえる。"}
        </p>
        <p className="game-line soft center-line">
          「ぜんぶコンクリで固めれば安全」は、昔の考え方。いまの川づくりは<strong>必要最小限</strong>が合言葉なんだ。
        </p>
        <button className="btn primary big" onClick={onComplete}>図面を送る</button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">この川の護岸を、設計する</span>
        <span className="task-sub">やり直せるのは あと{BANK_REDO_LIMIT - bs.redos - 1}回</span>
      </div>

      {riverStrip()}

      <p className="pick-title">{SEC_EMOJI[sel]} {SEC_LABEL[sel]} の工法</p>
      <div className="choice-row wrap">
        {WORKS.filter((w) => (sel === "weir" ? w.id === "fishway" || w.id === "leave" : w.id !== "fishway")).map((w) => (
          <button
            key={w.id}
            className={`choice-card ${plan[sel] === w.id ? "selected" : ""}`}
            onClick={() => { setPlan((p) => ({ ...p, [sel]: p[sel] === w.id ? null : w.id })); setNote(null); }}
          >
            <span className="choice-name" style={{ fontSize: 13 }}>{w.label}</span>
            <small style={{ opacity: 0.7 }}>{w.sub}</small>
          </button>
        ))}
      </div>

      <InfoCards
        label="しごとの資料"
        cards={[{
          id: "rule", icon: "📋", title: "多自然川づくりのきまり",
          body: (
            <>
              <p>護岸は<strong>必要最小限</strong>。家のうしろと、けずられたカーブは、しっかり守る。</p>
              <p>安全に問題のない区間は、自然のままが最良。</p>
              <p>{withRuby("段差で魚が止まる堰には、｜魚道《ぎょどう》（魚がのぼる道）。")}</p>
            </>
          ),
        }]}
      />

      {note && <p className="game-note">{note}</p>}

      <button
        className="btn primary big"
        onClick={() => {
          const r = bankServe(bs, plan);
          setBs(r.state);
          if (r.state.outcome === "done") { setStep("done"); return; }
          if (r.state.outcome === "mentor_fail") { setStep("failed"); return; }
          // staged: the chief engineer taps ONE section of the drawing
          let fs: Section | null = null;
          if (r.problem === "over_budget") fs = null;
          else {
            for (const sec of bs.c.sections) {
              const w = plan[sec.section];
              if (!w) { fs = sec.section; break; }
              if (sec.section === "weir" && w !== "fishway") { fs = "weir"; break; }
              if (sec.section !== "weir") {
                const strong = sec.homesBehind || sec.erosion;
                if (strong && w === "leave") { fs = sec.section; break; }
                if (!strong && w === "concrete") { fs = sec.section; break; }
              }
            }
          }
          setFaultSec(fs);
          setNote(r.problem === "over_budget" ? "係の人が、予算のメーターを指でたたいた。" : "主任が図面のひとつの区間を、とんとんと指でたたいた。");
        }}
      >
        ✅ 図面を出す
      </button>
    </div>
  );
}
