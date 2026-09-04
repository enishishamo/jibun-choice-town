// Q1: ヤードプランナー (gameType: yard_plan)
// 核: 「あとで取り出す順を、先に読む」— TOSの搬出予定を読み、引取の早い箱が
// 上になるよう仮置きする。属性制約(電源/隔離)と夜明けシミュはportLogic側で強制。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import { withRuby } from "../lib/ruby";
import { REHANDLE_LIMIT, newYardState, yardPlace, yardFinish, yardSimulate } from "./portLogic";
import type { YardState, Cont } from "./portLogic";

const KIND_ICON = { normal: "📦", reefer: "🧊", hazmat: "⚠️" } as const;
const PICK_COLOR = { 1: "#e4938a", 2: "#e5c77f", 3: "#8fb7ce" } as const;

type Step = "work" | "sim" | "failed" | "done";

export default function YardPlanGame({ onComplete }: Q1GameProps) {
  const [ys, setYs] = useState<YardState>(() => newYardState());
  const [step, setStep] = useState<Step>("work");
  const [note, setNote] = useState<string | null>(null);
  const [simStep, setSimStep] = useState(0);
  const [attempts, setAttempts] = useState(1);

  const restart = () => {
    setYs(newYardState());
    setNote(null);
    setSimStep(0);
    setStep("work");
    setAttempts((a) => a + 1);
  };

  const contChip = (c: Cont, big = false) => (
    <span
      key={c.id}
      style={{
        display: "inline-flex", alignItems: "center", gap: 3,
        background: "#fffdf5", border: `2.5px solid ${PICK_COLOR[c.pickup]}`,
        borderRadius: 9, padding: big ? "6px 10px" : "2px 6px",
        fontSize: big ? 15 : 12, fontWeight: "bold",
      }}
    >
      {KIND_ICON[c.kind]} {c.id}
      <small style={{ fontWeight: "normal" }}>{c.pickup}日</small>
    </span>
  );

  const sim = ys.outcome === "placed" || step === "sim" || step === "done" || step === "failed" ? yardSimulate(ys) : null;

  // dawn replay: the yard state AS OF a sim step — picked boxes leave, and the
  // boxes dug aside for the current pickup are shown lifted with ❗
  const simSnapshot = (upto: number) => {
    const cols = ys.cols.map((c) => c.map((x) => ({ ...x, lifted: false })));
    const power = ys.power.map((x) => ({ ...x, lifted: false }));
    const haz = ys.haz.map((x) => ({ ...x, lifted: false }));
    if (!sim) return { cols, power, haz, gone: [] as string[] };
    const gone: string[] = [];
    for (let k = 0; k <= upto && k < sim.log.length; k++) {
      const e = sim.log[k];
      gone.push(e.id);
      for (const arr of [power, haz]) {
        const i = arr.findIndex((x) => x.id === e.id);
        if (i >= 0) arr.splice(i, 1);
      }
      for (const col of cols) {
        const i = col.findIndex((x) => x.id === e.id);
        if (i >= 0) col.splice(i, 1);
        if (k === upto) for (const d of e.dug) {
          const j = col.findIndex((x) => x.id === d);
          if (j >= 0) col[j] = { ...col[j], lifted: true };
        }
      }
    }
    return { cols, power, haz, gone };
  };

  // the yard IS the world: stacks stay visible on every screen
  const snap = step === "sim" && sim ? simSnapshot(simStep) : null;
  const viewCols = snap ? snap.cols : ys.cols.map((c) => c.map((x) => ({ ...x, lifted: false })));
  const viewPower = snap ? snap.power : ys.power.map((x) => ({ ...x, lifted: false }));
  const viewHaz = snap ? snap.haz : ys.haz.map((x) => ({ ...x, lifted: false }));
  const yardView = (
    <div style={{ display: "flex", gap: 8, margin: "6px 14px", alignItems: "flex-end" }}>
      {viewCols.map((col, i) => (
        <button
          key={i}
          disabled={step !== "work"}
          onClick={() => {
            const nx = yardPlace(ys, String(i) as "0");
            if (nx.refusal) { setNote(nx.refusal); return; }
            setYs(nx);
            setNote(null);
          }}
          style={{ flex: 1, minHeight: 108, borderRadius: 10, border: "2px dashed #b8ad90", background: "#efe9d6", display: "flex", flexDirection: "column-reverse", alignItems: "center", gap: 3, padding: 6 }}
        >
          {col.map((c) => (
            <span key={c.id} style={c.lifted ? { transform: "translateY(-10px) rotate(-4deg)", transition: "transform 0.4s", position: "relative" } : undefined}>
              {contChip(c)}
              {c.lifted && <span style={{ position: "absolute", top: -12, right: -6, fontSize: 12 }}>❗</span>}
            </span>
          ))}
          {col.length === 0 && <small style={{ color: "#9a8f76" }}>列{i + 1}</small>}
        </button>
      ))}
      <button
        disabled={step !== "work"}
        onClick={() => {
          const nx = yardPlace(ys, "power");
          if (nx.refusal) { setNote(nx.refusal); return; }
          setYs(nx); setNote(null);
        }}
        style={{ width: 76, minHeight: 108, borderRadius: 10, border: "2px solid #7fa8cc", background: "#e3edf5", display: "flex", flexDirection: "column-reverse", alignItems: "center", gap: 3, padding: 4 }}
      >
        {viewPower.map((c) => contChip(c))}
        <small style={{ color: "#5c7ea0" }}>🔌電源</small>
      </button>
      <button
        disabled={step !== "work"}
        onClick={() => {
          const nx = yardPlace(ys, "haz");
          if (nx.refusal) { setNote(nx.refusal); return; }
          setYs(nx); setNote(null);
        }}
        style={{ width: 76, minHeight: 108, borderRadius: 10, border: "2px solid #cc8f7f", background: "#f5e6e3", display: "flex", flexDirection: "column-reverse", alignItems: "center", gap: 3, padding: 4 }}
      >
        {viewHaz.map((c) => contChip(c))}
        <small style={{ color: "#a06a5c" }}>⚠️隔離</small>
      </button>
    </div>
  );

  if (step === "failed") {
    return (
      <div className="game board-game">
        <div className="result-card"><span className="result-title">朝のゲートが、渋滞してしまった</span></div>
        {yardView}
        <p className="game-line center-line">
          積み替えが{sim?.rehandles}回。取り出すたびに上の箱をどかすことになり、トラックの列ができた。
          先輩と置き方を組み直した。
        </p>
        <p className="game-line soft center-line">（船の中身と引取日は、毎回ちがう）</p>
        <button className="btn primary big" onClick={restart}>🔁 次の船で</button>
      </div>
    );
  }

  if (step === "done") {
    const perfect = (sim?.rehandles ?? 9) === 0 && attempts === 1;
    return (
      <div className="game board-game">
        <div className="result-card good"><span className="result-title">朝の搬出、スムーズに完了！</span></div>
        {yardView}
        <p className="game-line soft center-line">
          積み替え{sim?.rehandles}回。
          {perfect ? "先の予定まで読み切った、みごとな仮置き。" : "届いた。積み替えが少ないほど、朝が速くなる。"}
        </p>
        <p className="game-line soft center-line">
          {withRuby("置き場所ひとつで、荷物が家に着く時刻が変わる。｜蔵置《ぞうち》（仮置きの場所ぎめ）は、港の頭脳だ。")}
        </p>
        <button className="btn primary big" onClick={onComplete}>報告する</button>
      </div>
    );
  }

  if (step === "sim" && sim) {
    const shown = sim.log.slice(0, simStep + 1);
    const last = shown[shown.length - 1];
    return (
      <div className="game board-game">
        <div className="task-bar">
          <span className="task-now">夜明け：トラックが順番に来る</span>
          <span className="task-sub">積み替え {shown.reduce((n, l) => n + l.dug.length, 0)} 回（{REHANDLE_LIMIT}回で渋滞）</span>
        </div>
        {yardView}
        <p className="game-note" style={{ margin: "4px 14px" }}>
          🚛📦{last.id} 出発
          {last.dug.length > 0 ? ` — 上の箱をどかした❗` : " — そのまま"}
        </p>
        <button
          className="btn primary big"
          onClick={() => {
            if (simStep + 1 < sim.log.length) { setSimStep(simStep + 1); return; }
            const fin = yardFinish(ys);
            setYs(fin);
            setStep(fin.outcome === "done" ? "done" : "failed");
          }}
        >
          {simStep + 1 < sim.log.length ? "つぎの便" : "朝を終える"}
        </button>
      </div>
    );
  }

  const next = ys.queue[0];
  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">{withRuby("船から下りる箱の、｜仮置《かりお》きを決める")}</span>
        <span className="task-sub">のこり {ys.queue.length} 個</span>
      </div>

      {next && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "6px 14px" }}>
          <span style={{ fontSize: 13 }}>🏗 つぎの箱:</span>
          {contChip(next, true)}
          {next.kind === "reefer" && <small style={{ color: "#5c7ea0" }}>冷凍（電源がいる）</small>}
          {next.kind === "hazmat" && <small style={{ color: "#a06a5c" }}>危険物（はなして置く）</small>}
        </div>
      )}

      {yardView}

      <InfoCards
        label="しごとの資料"
        cards={[{
          id: "tos", icon: "🖥", title: "TOS（搬出予定の一覧）",
          body: (
            <>
              <p>これから下りる箱と、トラックが取りに来る日：</p>
              <p style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{ys.queue.map((c) => contChip(c))}</p>
              <p><strong>きまり1：</strong>下の箱を先に出すと、上の箱をどかす「積み替え」が起きる。</p>
              <p><strong>きまり2：</strong>引取の早い箱ほど、上へ。</p>
              <p><strong>きまり3：</strong>{withRuby("🧊は🔌電源列、⚠️は｜隔離《かくり》区画だけ。")}</p>
            </>
          ),
        }]}
      />

      {note && <p className="game-note">{withRuby(note)}</p>}

      {ys.outcome === "placed" && (
        <button className="btn primary big" onClick={() => { setSimStep(0); setStep("sim"); }}>
          🌅 朝を見る
        </button>
      )}
    </div>
  );
}
