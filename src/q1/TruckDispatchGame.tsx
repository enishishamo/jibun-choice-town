// Q1: 海上コンテナ輸送の配車担当 (gameType: truck_dispatch)
// 核: 「急ぎでも、通れない道は通らない」— 背高/重量/経路のハード制約は絶対、
// その上で近い行き先をつないで空走を減らす。制約はportLogic側で機械強制。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import { TRUCKS, DISPATCH_REDO_LIMIT, newDispatchState, dispatchServe, dispatchEmptyRun } from "./portLogic";
import type { DispatchState, Assignment, Job } from "./portLogic";

type Step = "work" | "failed" | "done";

const DEST_LABEL = { A: "A町の倉庫", B: "B町の工場", C: "C町の店" } as const;

export default function TruckDispatchGame({ onComplete }: Q1GameProps) {
  const [ds, setDs] = useState<DispatchState>(() => newDispatchState());
  const [asg, setAsg] = useState<Assignment>({});
  const [sel, setSel] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("work");
  const [note, setNote] = useState<string | null>("荷物を選んで、トラックへ。");
  const [faultTruck, setFaultTruck] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(1);
  const jobs = ds.c.jobs;

  const restart = () => {
    setDs(newDispatchState());
    setAsg({});
    setSel(null);
    setNote("荷物を選んで、トラックへ。");
    setFaultTruck(null);
    setStep("work");
    setAttempts((a) => a + 1);
  };

  const jobChip = (j: Job, active: boolean) => (
    <button
      key={j.id}
      className="choice-card"
      style={{ minWidth: 128, border: active ? "3px solid #4a90d9" : undefined, opacity: asg[j.id] ? 0.45 : 1 }}
      onClick={() => { setSel(sel === j.id ? null : j.id); setNote(null); setFaultTruck(null); }}
    >
      <span className="choice-name" style={{ fontSize: 13 }}>
        📦 {j.id}（{j.size}ft{j.tall ? "・背高" : ""}{j.heavy ? "・重い" : ""}）
      </span>
      <small style={{ opacity: 0.75 }}>{DEST_LABEL[j.dest]}・{j.window}便</small>
    </button>
  );

  // trucks board: assignments ARE the world state, visible on all screens
  const board = (
    <div style={{ margin: "6px 14px" }}>
      {TRUCKS.map((t) => {
        const mine = jobs.filter((j) => asg[j.id]?.truckId === t.id).sort((a, b) => a.window - b.window);
        return (
          <button
            key={t.id}
            disabled={step !== "work"}
            onClick={() => {
              if (!sel) { setNote("先に荷物を選ぼう。"); return; }
              setAsg((a) => ({ ...a, [sel]: { truckId: t.id, slot: jobs.find((j) => j.id === sel)!.window } }));
              setSel(null);
              setFaultTruck(null);
            }}
            style={{
              width: "100%", textAlign: "left", margin: "3px 0", borderRadius: 12, padding: "7px 10px",
              border: faultTruck === t.id ? "2.5px solid #d9744a" : "2px solid #ddd2b4",
              boxShadow: faultTruck === t.id ? "0 0 10px rgba(217,116,74,0.5)" : "none",
              background: "#fbf7ea", display: "flex", alignItems: "center", gap: 8,
            }}
          >
            <span style={{ fontSize: 20 }}>🚛</span>
            <span style={{ fontSize: 13, width: 118 }}>
              {faultTruck === t.id ? "👉 " : ""}{t.name}
              <br />
              <small style={{ color: "#8a7f6a" }}>{t.lowbed ? "背高OK" : "背高は積めない"}{t.light ? "・重い箱は不可" : ""}</small>
            </span>
            <span style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
              {mine.map((j) => (
                <span key={j.id} style={{ background: "#fffdf5", border: "1.5px solid #cdbfa0", borderRadius: 8, padding: "2px 7px", fontSize: 12 }}>
                  {j.window}便 {j.id}→{j.dest}町
                  {j.dest === "B" && <small>（{(asg[j.id]?.route ?? "short") === "short" ? "こみち" : "うかい路"}）</small>}
                </span>
              ))}
              {mine.length === 0 && <small style={{ color: "#a79a7e" }}>（空き）</small>}
            </span>
          </button>
        );
      })}
    </div>
  );

  if (step === "failed") {
    return (
      <div className="game board-game">
        <div className="result-card"><span className="result-title">朝の便は、ベテランが組み直し</span></div>
        {board}
        <p className="game-line center-line">組み替えが続いて時間切れ。先輩の配車表をとなりで見せてもらった。</p>
        <p className="game-line soft center-line">車の条件 × 道の条件 × 予約の時刻、の3つで組むのがコツ。（荷物は毎朝ちがう）</p>
        <button className="btn primary big" onClick={restart}>🔁 明日の朝に</button>
      </div>
    );
  }

  if (step === "done") {
    const empty = dispatchEmptyRun(ds.c, asg);
    const perfect = ds.redos === 0 && attempts === 1 && empty <= 1;
    return (
      <div className="game board-game">
        <div className="result-card good"><span className="result-title">朝いちの4本、出発！</span></div>
        {board}
        <p className="game-line soft center-line">
          から走りメーター：{"🟩".repeat(Math.max(0, 3 - empty))}{"🟧".repeat(Math.min(3, empty))}（少ないほど上手）
        </p>
        <p className="game-line soft center-line">
          {perfect
            ? "一発で、むだ走りの少ない配車。車と道と時刻を全部読めていた。"
            : `出発できた。${ds.redos > 0 ? `差し戻し${ds.redos}回。` : ""}近い行き先をつなぐと、から走りが減る。`}
        </p>
        <p className="game-line soft center-line">
          背高コンテナを積むと車の高さは約4.1m。<strong>通れない道は、急ぎでも通らない</strong>——それが配車の責任。
        </p>
        <button className="btn primary big" onClick={onComplete}>見送る</button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">朝いちの配送 4本を、3台へ</span>
        <span className="task-sub">差し戻しにできるのは あと{DISPATCH_REDO_LIMIT - ds.redos - 1}回</span>
      </div>

      <p className="pick-title">荷物（コンテナ）</p>
      <div className="choice-row wrap">{jobs.map((j) => jobChip(j, sel === j.id))}</div>

      {board}

      {jobs.some((j) => j.dest === "B" && asg[j.id]) && (
        <div style={{ margin: "2px 14px", display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
          <span>🛣 B町への道:</span>
          {jobs.filter((j) => j.dest === "B" && asg[j.id]).map((j) => (
            <button
              key={j.id}
              className="choice-card"
              style={{ padding: "4px 10px", minWidth: 0 }}
              onClick={() => {
                setAsg((a) => ({ ...a, [j.id]: { ...a[j.id], route: (a[j.id].route ?? "short") === "short" ? "detour" : "short" } }));
                setFaultTruck(null);
              }}
            >
              <span className="choice-name" style={{ fontSize: 12 }}>
                {j.id}: {(asg[j.id]?.route ?? "short") === "short" ? "こみち🌉" : "うかい路"}
              </span>
            </button>
          ))}
        </div>
      )}

      <InfoCards
        label="しごとの資料"
        cards={[{
          id: "rule", icon: "📋", title: "配車のきまり",
          body: (
            <>
              <p><strong>背高（せだか）</strong>の箱は、低床の3号車だけ。</p>
              <p><strong>重い</strong>箱は、小型の2号車に積めない。</p>
              <p>予約の便（1便/2便）は変えられない。</p>
              <p>同じ車で2本運ぶなら、行き先が近いどうし（A⇄B、B⇄C）。AとCは遠い。</p>
            </>
          ),
        }, {
          id: "roads", icon: "🗺", title: "道路の制限マップ",
          body: (
            <>
              <div style={{ fontFamily: "monospace", fontSize: 13, lineHeight: 1.7 }}>
                港 ══こみち══🌉3.8m══▶ B町<br />
                港 ──うかい路（制限なし・遠回り）──▶ B町
              </div>
              <p>背高を積んだ車は高さ約4.1m。<strong>こみちのガードは、くぐれない</strong>。</p>
              <p>B町行きは、トラックの札で道を選べる。</p>
            </>
          ),
        }]}
      />

      {note && <p className="game-note">{note}</p>}

      <button
        className="btn primary big"
        onClick={() => {
          const r = dispatchServe(ds, asg);
          setDs(r.state);
          if (r.state.outcome === "done") { setStep("done"); return; }
          if (r.state.outcome === "mentor_fail") { setStep("failed"); return; }
          // staged: the checker taps ONE truck — where, never why
          let fault: string | null = null;
          for (const t of TRUCKS) {
            const mine = jobs.filter((j) => asg[j.id]?.truckId === t.id);
            for (const j of mine) {
              if ((j.tall && !t.lowbed) || (j.heavy && t.light)) fault = t.id;
              if (j.tall && j.dest === "B" && (asg[j.id]?.route ?? "short") !== "detour") fault = t.id;
            }
            const slots = mine.map((j) => asg[j.id].slot);
            if (new Set(slots).size !== slots.length) fault = t.id;
            if (mine.length === 2) {
              const [j1, j2] = mine.sort((x, y) => asg[x.id].slot - asg[y.id].slot);
              if ((j1.dest === "A" && j2.dest === "C") || (j1.dest === "C" && j2.dest === "A")) fault = t.id;
            }
          }
          setFaultTruck(fault);
          setNote(fault ? "点呼で、係が一台のトラックの前で首を横にふった。" : "まだ載せていない荷物がある。");
        }}
      >
        ✅ 点呼する
      </button>
    </div>
  );
}
