// Q1: 造林作業員 (gameType: plant_plan)
// 核: 「植えれば森に戻る、ではない」— 樹種×場所の相性、シカ対策、足りない
// 予算の配分。検証はforestLogic側で機械強制。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import { withRuby } from "../lib/ruby";
import {
  PLANT_BUDGET, PLANT_REDO_LIMIT, GUARD_COST, newPlantState, plantServe, plantCost, speciesFit,
} from "./forestLogic";
import type { PlantState, PlantPlan, Zone, Species, Guard } from "./forestLogic";

type Step = "work" | "failed" | "done";

const ZONE_LABEL: Record<Zone, string> = { ridge: "尾根（上）", slope: "中腹", valley: "沢ぞい（下）" };
const ZONE_EMOJI: Record<Zone, string> = { ridge: "⛰", slope: "🌄", valley: "🏞" };
const SP_LABEL: Record<Species, string> = { sugi: "スギ", hinoki: "ヒノキ", karamatsu: "カラマツ" };
const GUARD_LABEL: Record<Guard, string> = { none: "なし", tube: "チューブ", fence: "柵" };

const emptyPlan = (): PlantPlan => ({
  ridge: { species: null, guard: "none" },
  slope: { species: null, guard: "none" },
  valley: { species: null, guard: "none" },
});

export default function PlantPlanGame({ onComplete }: Q1GameProps) {
  const [ps, setPs] = useState<PlantState>(() => newPlantState());
  const [plan, setPlan] = useState<PlantPlan>(emptyPlan);
  const [sel, setSel] = useState<Zone>("ridge");
  const [step, setStep] = useState<Step>("work");
  const [note, setNote] = useState<string | null>("区画を選んで、苗と対策を決めよう。");
  const [faultZone, setFaultZone] = useState<Zone | null>(null);
  const [attempts, setAttempts] = useState(1);

  const restart = () => {
    setPs(newPlantState());
    setPlan(emptyPlan());
    setFaultZone(null);
    setSel("ridge");
    setNote("区画を選んで、苗と対策を決めよう。");
    setStep("work");
    setAttempts((a) => a + 1);
  };

  const cost = plantCost(plan);

  // the hillside IS the world (and the 3-years-later preview on terminal screens)
  const hill = (after = false) => (
    <div style={{ margin: "6px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
      {ps.c.zones.map((z) => {
        const p = plan[z.zone];
        const fits = p.species ? speciesFit(z.moisture, p.species) : false;
        const guarded = z.deer === "low" || p.guard !== "none";
        const ok = p.species && fits && guarded;
        return (
          <button
            key={z.zone}
            disabled={step !== "work"}
            onClick={() => { setSel(z.zone); setNote(null); setFaultZone(null); }}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 12,
              border: faultZone === z.zone ? "2.5px solid #d9744a" : sel === z.zone && step === "work" ? "3px solid #4a90d9" : "2px solid #cbd6b5",
              boxShadow: faultZone === z.zone ? "0 0 10px rgba(217,116,74,0.5)" : "none",
              background: after ? (ok ? "#e7f3d8" : "#efe3d3") : z.zone === "ridge" ? "#eef0e2" : z.zone === "slope" ? "#e7eed9" : "#dfeee4",
              textAlign: "left",
            }}
          >
            <span style={{ fontSize: 22 }}>{ZONE_EMOJI[z.zone]}</span>
            <span style={{ fontSize: 12, width: 104 }}>
              {ZONE_LABEL[z.zone]}
              <br />
              <small style={{ color: "#77705d" }}>
                {z.moisture === "dry" ? "かわく" : z.moisture === "wet" ? "しめる" : "ふつう"}・シカ{z.deer === "high" ? "多い🦌" : "少ない"}
              </small>
            </span>
            <span style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
              {after ? (
                ok ? <>🌱🌱🌱 <small>そだっている</small></> : (
                  <>🥀 <small>{!p.species ? "何もない" : !fits ? "場所に合わず、枯れた…" : "シカに食べられた…"}</small></>
                )
              ) : (
                <>
                  <span>{p.species ? `🌱${SP_LABEL[p.species]}` : "—"}</span>
                  <span>{p.guard !== "none" ? (p.guard === "fence" ? "🚧柵" : "🧪チューブ") : ""}</span>
                </>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );

  const budget = (
    <div style={{ display: "flex", alignItems: "center", gap: 4, margin: "2px 14px", fontSize: 12 }}>
      <span>💰 予算</span>
      {Array.from({ length: PLANT_BUDGET }).map((_, i) => (
        <span key={i} style={{ width: 20, height: 10, borderRadius: 5, background: i < cost ? "#d9a84a" : "#e9e2cf" }} />
      ))}
      <span style={{ color: cost > PLANT_BUDGET ? "#c0392b" : "#8a7f6a" }}>{cost}/{PLANT_BUDGET}</span>
    </div>
  );

  if (step === "failed") {
    return (
      <div className="game board-game">
        <div className="result-card"><span className="result-title">植え直しは、来年の春に</span></div>
        {hill(true)}
        <p className="game-line center-line">植えたぶんは先輩たちが手当てしてくれた。計画を組み直そう。</p>
        <p className="game-line soft center-line">場所の相性 × シカ × 予算。3つで決めるのがコツ。（山のようすは毎回ちがう）</p>
        <button className="btn primary big" onClick={restart}>🔁 別の山で</button>
      </div>
    );
  }

  if (step === "done") {
    const perfect = ps.redos === 0 && attempts === 1;
    return (
      <div className="game board-game">
        <div className="result-card good"><span className="result-title">植栽計画、通った！</span></div>
        <p className="game-line soft center-line">3年後の、この斜面——</p>
        {hill(true)}
        <p className="game-line soft center-line">
          {perfect ? "一発承認。相性もシカも予算も、ぜんぶ読めていた。" : "承認された。苗が草より高くなるまで、世話はつづく。"}
        </p>
        <p className="game-line soft center-line">
          {withRuby("伐ったあとに植えて育てる——｜再造林《さいぞうりん》まで終えて、はじめて「森を守った」と言える。")}
        </p>
        <button className="btn primary big" onClick={onComplete}>苗を運ぶ</button>
      </div>
    );
  }

  const zc = ps.c.zones.find((z) => z.zone === sel)!;
  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">伐ったあとの山に、森を返す</span>
        <span className="task-sub">やり直せるのは あと{PLANT_REDO_LIMIT - ps.redos - 1}回</span>
      </div>

      {hill()}
      {budget}

      <p className="pick-title">{ZONE_EMOJI[sel]} {ZONE_LABEL[sel]} に植える苗</p>
      <div className="choice-row">
        {(Object.keys(SP_LABEL) as Species[]).map((sp) => (
          <button
            key={sp}
            className={`choice-card ${plan[sel].species === sp ? "selected" : ""}`}
            onClick={() => { setPlan((p) => ({ ...p, [sel]: { ...p[sel], species: p[sel].species === sp ? null : sp } })); setNote(null); }}
          >
            <span className="choice-name">🌱 {SP_LABEL[sp]}</span>
          </button>
        ))}
      </div>
      <p className="pick-title">シカ対策（{ZONE_LABEL[sel]}）</p>
      <div className="choice-row">
        {(Object.keys(GUARD_LABEL) as Guard[]).map((g) => (
          <button
            key={g}
            className={`choice-card ${plan[sel].guard === g ? "selected" : ""}`}
            onClick={() => { setPlan((p) => ({ ...p, [sel]: { ...p[sel], guard: g } })); setNote(null); }}
          >
            <span className="choice-name">{g === "none" ? "なし" : g === "tube" ? "🧪チューブ" : "🚧柵"}</span>
            {g !== "none" && <small style={{ opacity: 0.7 }}>費用{GUARD_COST[g]}</small>}
          </button>
        ))}
      </div>

      <InfoCards
        label="しごとの資料"
        cards={[{
          id: "rule", icon: "📋", title: "植栽のめやす",
          body: (
            <>
              <p><strong>相性：</strong>スギは水が好き（かわく場所×）。カラマツはかわいた場所に強い（しめる場所×）。ヒノキはその間。</p>
              <p><strong>シカ：</strong>多い区画は、柵かチューブがないと苗が食べられる。</p>
              <p><strong>予算：</strong>苗は各区画1コマ。チューブ1・柵2。ぜんぶには足りない朝もある——多い区画から守る。</p>
            </>
          ),
        }]}
      />

      {note && <p className="game-note">{note}</p>}
      <p className="game-note" style={{ margin: "4px 14px" }}>
        {zc.deer === "high" ? "🦌 この区画は、ふんと食べあとが多い。" : "この区画のシカの気配は、少なめ。"}
      </p>

      <button
        className="btn primary big"
        onClick={() => {
          const r = plantServe(ps, plan);
          setPs(r.state);
          if (r.state.outcome === "done") { setStep("done"); return; }
          if (r.state.outcome === "mentor_fail") { setStep("failed"); return; }
          // staged: the senior points at ONE zone (where, never why)
          let fz: Zone | null = null;
          for (const z of ps.c.zones) {
            const pp = plan[z.zone];
            if (!pp.species || !speciesFit(z.moisture, pp.species) || (z.deer === "high" && pp.guard === "none")) { fz = z.zone; break; }
          }
          setFaultZone(r.problem === "over_budget" ? null : fz);
          setNote(r.problem === "over_budget"
            ? "係の人が、予算のメーターをとんとんと指でたたいた。"
            : "先輩が、ひとつの区画の前でしゃがみこんだ。理由は言ってくれない。");
        }}
      >
        ✅ 計画を出す
      </button>
    </div>
  );
}
