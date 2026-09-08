// Q1: 水道の漏水調査員 (gameType: leak_trace)
// 核: 「弁を閉めて針を見る → 区間を絞る → 路面で聴いて勾配を読む → とぎれる音を除外
// → ここが漏水点だと報告する」。掘るのは修理班。外れたら新しく聴くまで次は報告できない。
// Rules live in src/q1/leakLogic.ts (mirrors factory/projects/leak-detective/design/state_table.json).
// This component renders ONLY publicView(): it never reads the hidden leak/house
// position, so no UI reaction can leak the answer (design review r3/r4).
import { useEffect, useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import {
  SEGMENTS, SEGMENT_NAMES, POINTS, FLOW, newState, publicView, closeValve, openValve, listen, report,
  reportBlocked, setFocus, heard, revealLeak,
} from "./leakLogic";
import type { LeakState, Seg, Spot } from "./leakLogic";

type Phase = "night" | "digging" | "hit" | "partial";

const ROW_Y: Record<Seg, number> = { A: 62, B: 160, C: 258 };
const pointX = (p: number) => 64 + (p - 1) * 56; // 56 viewBox units ≈ 44px at 375px: each hit circle (r=28) is a full 44px target

export default function LeakTraceGame({ onComplete, onPartialComplete }: Q1GameProps) {
  const [s, setS] = useState<LeakState>(() => newState());
  const [phase, setPhase] = useState<Phase>("night");
  const [selected, setSelected] = useState<Spot | null>(null);
  const [timeline, setTimeline] = useState<string[]>([]);
  const [flashSeg, setFlashSeg] = useState<Seg | null>(null); // valve reaction (identical for every segment)
  const [lastHeard, setLastHeard] = useState<Spot | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(1);
  const v = publicView(s);

  useEffect(() => {
    if (!flashSeg) return;
    const t = setTimeout(() => setFlashSeg(null), 700);
    return () => clearTimeout(t);
  }, [flashSeg]);

  const tapValve = (seg: Seg) => {
    if (phase !== "night") return;
    if (v.closed === seg) { setS(openValve(s).state); setTimeline((l) => [...l, `🔧 弁${seg}を開けた`]); return; }
    const r = closeValve(s, seg);
    if (!r.ok) { setNote(r.reason === "valve_budget" ? "今夜の弁の操作は、もう使い切った。" : null); return; }
    setS(r.state);
    setFlashSeg(seg);
    setNote(null);
    setTimeline((l) => [...l, `🔧 弁${seg}を閉めた → 針 ${publicView(r.state).flow.toFixed(1)}`]);
  };
  const tapPoint = (seg: Seg, point: number) => {
    if (phase !== "night") return;
    if (heard(s, seg, point)) { setSelected({ seg, point }); setNote(null); return; }
    const r = listen(s, seg, point);
    if (!r.ok) { setNote(r.reason === "listen_budget" ? "今夜、聴ける点はもうない。" : null); return; }
    const rd = heard(r.state, seg, point)!;
    setS(r.state);
    setLastHeard({ seg, point });
    setSelected({ seg, point });
    setNote(null);
    setTimeline((l) => [...l, `🎧 ${seg}${point}: ${"▮".repeat(rd.level)}${"▯".repeat(5 - rd.level)} ${rd.continuity === "steady" ? "ずっと" : "とぎれる"}`]);
  };
  const doReport = () => {
    if (!selected) return;
    const r = report(s, selected.seg, selected.point);
    if (!r.ok) return;
    setS(r.state);
    setPhase("digging");
    setTimeline((l) => [...l, `📣 ${selected.seg}${selected.point} を報告 → 修理班が掘る`]);
    setTimeout(() => {
      if (r.hit) setPhase("hit");
      else {
        setSelected(null);
        setPhase(r.state.outcome === "partial" ? "partial" : "night");
        setNote(r.state.outcome === "partial" ? null : "乾いた管だった……埋め戻し。新しく聴いてから、もう一度考えよう。");
      }
    }, 1400);
  };
  const restart = () => {
    const fresh = newState();
    setS({ ...fresh, c: s.c }); // same night, same leak: only the judgement changes
    setPhase("night"); setSelected(null); setTimeline([]); setLastHeard(null); setNote(null);
    setAttempt((a) => a + 1);
  };

  const blocked = selected ? reportBlocked(s, selected.seg, selected.point) : reportBlocked(s);
  const missedHere = (seg: Seg, p: number) => v.misses.some((m) => m.seg === seg && m.point === p);
  const lastReading = lastHeard ? heard(s, lastHeard.seg, lastHeard.point) : undefined;

  // ---------- shared pieces ----------
  const gaugeAngle = (flow: number) => -90 + Math.min(1, flow / 3) * 180; // 0..3 m3/h over a half circle
  const Gauge = ({ flow, calm }: { flow: number; calm?: boolean }) => (
    <svg viewBox="0 0 120 74" width={120} height={74} aria-label={`区画量水器 ${flow.toFixed(1)}`}>
      <path d="M10 64 A50 50 0 0 1 110 64" fill="none" stroke="#e6dccb" strokeWidth={10} />
      <path d="M10 64 A50 50 0 0 1 22 36" fill="none" stroke="#8fce8f" strokeWidth={10} />
      <text x="26" y="30" fontSize="8" fill="#6d6350">正常ならここ</text>
      <g transform={`rotate(${gaugeAngle(flow)} 60 64)`} style={{ transition: "transform 0.8s" }}>
        <line x1="60" y1="64" x2="60" y2="20" stroke={calm ? "#2c5c8a" : "#c0392b"} strokeWidth={3} strokeLinecap="round" className={calm ? "" : "leak-needle"} />
      </g>
      <circle cx="60" cy="64" r="4" fill="#6d6350" />
      <text x="60" y="72" fontSize="10" textAnchor="middle" fill="#3b3325">{flow.toFixed(1)} m³/h</text>
    </svg>
  );
  const budgetsRow = (
    <div style={{ display: "flex", gap: 14, justifyContent: "center", fontSize: 12, color: "#6d6350", margin: "4px 0" }}>
      <span>🔧 弁 {v.budgets.valve}</span><span>🎧 聴く {v.budgets.listens}</span><span>📣 報告 {v.budgets.reports}</span>
    </div>
  );
  const records = (
    <div style={{ margin: "4px 12px", padding: "6px 8px", background: "#fbf6ea", borderRadius: 10, fontSize: 11, color: "#3b3325", minHeight: 30 }}>
      <div style={{ color: "#8a7f6a", fontSize: 10 }}>記録</div>
      <div style={{ maxHeight: 74, overflowY: "auto" }}>{timeline.length === 0 ? <div style={{ color: "#a89f8c" }}>（まだ何もない）</div> : timeline.map((t, i) => <div key={i}>{t}</div>)}</div>
    </div>
  );

  // ---------- terminal screens ----------
  if (phase === "hit") {
    const leak = revealLeak(s)!;
    return (
      <div className="game board-game">
        <div className="result-card good"><span className="result-title">{v.outcome === "perfect" ? "1回目で当たり！ 漏水点を特定した" : "当たり！ 漏水点を特定した"}</span></div>
        <div style={{ textAlign: "center", fontSize: 40, margin: "6px 0" }}>🕳️💦→🔧→🌅</div>
        <p className="game-line center-line">修理班が {SEGMENT_NAMES[leak.seg]} の{leak.point}番の下を掘ると、管の割れ目から水が噴き出していた。</p>
        <p className="game-line soft center-line">管を直して埋め戻し。明け方には道路の湿りが消え、針は「正常ならここ」に戻った。</p>
        <div style={{ display: "flex", justifyContent: "center" }}><Gauge flow={FLOW.base} calm /></div>
        {attempt > 1 && <p className="game-line soft center-line">（{attempt}回目の夜で特定）</p>}
        <button className="btn primary big" onClick={onComplete}>朝を迎える</button>
      </div>
    );
  }
  if (phase === "partial") {
    const secondFail = v.misses.length >= 2 || attempt > 1;
    const hint = v.misses.some((m) => heard(s, m.seg, m.point)?.continuity === "intermittent") ? "とぎれる音を報告していないか？" : "針が落ちた区間はどこだった？";
    return (
      <div className="game board-game">
        <div className="result-card"><span className="result-title">今夜は特定できなかった</span></div>
        <div style={{ textAlign: "center", fontSize: 40, margin: "6px 0" }}>🕳️➖→🌫️</div>
        <p className="game-line center-line">掘った穴の管は乾いていた。埋め戻したあとも、道路はまだ湿っていて、針は高いまま。</p>
        <p className="game-line soft center-line">漏れは次の夜へ持ち越し。</p>
        {secondFail && <p className="game-line soft center-line">{hint}</p>}
        <div style={{ display: "flex", justifyContent: "center" }}><Gauge flow={FLOW.base + FLOW.leak} /></div>
        {records}
        <div className="stack" style={{ gap: 8, marginTop: 8 }}>
          <button className="btn primary big" onClick={restart}>🔁 もう一度この夜へ</button>
          <button className="btn" onClick={() => onPartialComplete ? onPartialComplete() : onComplete()}>次の夜にまわす</button>
        </div>
      </div>
    );
  }

  // ---------- the night ----------
  return (
    <div className="game board-game">
      <style>{`
        @keyframes leak-steady { from { transform: translateX(0); } to { transform: translateX(-16px); } }
        @keyframes leak-burst { 0%,54% { opacity: 1; } 55%,100% { opacity: 0.08; } }
        @keyframes leak-needle { 0%,100% { transform: rotate(-1.5deg); } 50% { transform: rotate(1.5deg); } }
        @keyframes leak-glow { 0%,100% { opacity: 0.35; } 50% { opacity: 1; } }
        .leak-needle { transform-origin: 60px 64px; animation: leak-needle 0.35s infinite; }
        .leak-pt { animation: leak-glow 2.4s infinite; }
        .leak-dig { animation: leak-glow 0.5s infinite; }
      `}</style>
      <div className="task-bar">
        <span className="task-now">💧 晴れてるのに、道がぬれてる…（このあたりのどこか）</span>
        <span className="task-sub">深夜の住宅街 — 地面の下のどこかで漏れている</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 12px" }}>
        <Gauge flow={v.flow} calm={phase !== "night"} />
        <div style={{ fontSize: 11, color: "#6d6350", textAlign: "right", maxWidth: 190 }}>
          夜なのに、まだ流れてる<br />
          <span style={{ fontSize: 10, color: "#a89f8c" }}>ゲームでは1区間を1つの弁で表しています</span>
        </div>
      </div>

      <svg viewBox="0 0 400 300" width="100%" style={{ display: "block", background: "linear-gradient(#1f2a44, #2f3d5c)", borderRadius: 12, margin: "0 12px", width: "calc(100% - 24px)" }}>
        {SEGMENTS.map((seg) => {
          const y = ROW_Y[seg];
          const dim = v.focus !== null && v.focus !== seg;
          const closed = v.closed === seg;
          return (
            <g key={seg} opacity={dim ? 0.35 : 1} style={{ transition: "opacity 0.3s" }}>
              {/* houses (one per listening point; the nearest house blinks with an intermittent sound) */}
              {Array.from({ length: POINTS }, (_, i) => i + 1).map((p) => {
                const x = pointX(p);
                const blink = lastHeard && lastHeard.seg === seg && lastHeard.point === p && lastReading?.continuity === "intermittent";
                return (
                  <g key={p}>
                    <rect x={x - 10} y={y - 44} width={20} height={16} rx={2} fill="#3a4a6b" />
                    <polygon points={`${x - 12},${y - 44} ${x},${y - 54} ${x + 12},${y - 44}`} fill="#4c5b7c" />
                    <rect x={x - 4} y={y - 39} width={8} height={7} rx={1} fill={blink ? "#ffd86b" : "#2a3552"} style={blink ? { animation: "leak-burst 1.1s infinite" } : undefined} />
                  </g>
                );
              })}
              {/* road + pipe */}
              <rect x={40} y={y - 18} width={340} height={36} rx={6} fill="#3d4459" />
              <line x1={52} y1={y} x2={372} y2={y} stroke={flashSeg === seg ? "#1c2437" : closed ? "#5a6378" : "#9db7d8"} strokeWidth={5} strokeLinecap="round" style={{ transition: "stroke 0.25s" }} />
              {/* valve (tap) + segment label (tap = the child's hypothesis focus) */}
              <g onClick={() => tapValve(seg)} style={{ cursor: "pointer" }}>
                <circle cx={30} cy={y} r={22} fill="transparent" />
                <circle cx={30} cy={y} r={12} fill={closed ? "#c0392b" : "#8a7f6a"} stroke="#e6dccb" strokeWidth={2} />
                <text x={30} y={y + 4} fontSize="10" textAnchor="middle" fill="#fff">{closed ? "閉" : "弁"}</text>
              </g>
              <g onClick={() => setS(setFocus(s, seg))} style={{ cursor: "pointer" }}>
                <rect x={44} y={y + 20} width={92} height={22} rx={6} fill={v.focus === seg ? "#f5b642" : "#2a3552"} stroke="#8a7f6a" />
                <text x={90} y={y + 35} fontSize="10" textAnchor="middle" fill={v.focus === seg ? "#3b3325" : "#e6dccb"}>{v.focus === seg ? `区間${seg}を調べ中` : `区間${seg}を調べる`}</text>
              </g>
              {/* listening points */}
              {Array.from({ length: POINTS }, (_, i) => i + 1).map((p) => {
                const x = pointX(p);
                const rd = heard(s, seg, p);
                const isSel = selected?.seg === seg && selected?.point === p;
                const missed = missedHere(seg, p);
                return (
                  <g key={p} onClick={() => tapPoint(seg, p)} style={{ cursor: "pointer" }}>
                    <circle cx={x} cy={y} r={28} fill="transparent" />
                    <circle cx={x} cy={y} r={rd ? 9 : 7} fill={missed ? "#7a5a5a" : rd ? "#f5e6d0" : "#dbe6f2"} stroke={isSel ? "#f5b642" : "#1f2a44"} strokeWidth={isSel ? 3 : 1.5} className={rd ? "" : "leak-pt"} />
                    {!rd && <text x={x} y={y + 3} fontSize="8" textAnchor="middle" fill="#1f2a44">🎧</text>}
                    {rd && !missed && (
                      <g clipPath="url(#leakclip)">
                        <text x={x} y={y + 3} fontSize="9" textAnchor="middle" fill="#3b3325">{"▮".repeat(rd.level)}</text>
                      </g>
                    )}
                    {missed && <text x={x} y={y + 3} fontSize="9" textAnchor="middle" fill="#fff">✕</text>}
                    <text x={x + 14} y={y - 10} fontSize="8" textAnchor="middle" fill="#c9c2b3">{p}</text>
                  </g>
                );
              })}
            </g>
          );
        })}
        {phase === "digging" && selected && (
          <g className="leak-dig"><text x={pointX(selected.point)} y={ROW_Y[selected.seg] - 8} fontSize="22" textAnchor="middle">🚧</text></g>
        )}
      </svg>

      {/* last listening reaction: the waveform shows continuity without words */}
      {lastReading && lastHeard && (
        <div style={{ margin: "6px 12px 0", display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#3b3325" }}>
          <span>🎧 {lastHeard.seg}{lastHeard.point}</span>
          <div style={{ flex: 1, height: 18, overflow: "hidden", background: "#fbf6ea", borderRadius: 9, position: "relative" }}>
            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: "200%", background: `repeating-linear-gradient(90deg, #2c5c8a 0 3px, transparent 3px 8px)`, opacity: 0.9, animation: `leak-steady 0.5s linear infinite${lastReading.continuity === "intermittent" ? ", leak-burst 1.1s infinite" : ""}` }} />
          </div>
          <span>{"▮".repeat(lastReading.level)}{"▯".repeat(5 - lastReading.level)}</span>
          <span style={{ color: "#8a7f6a" }}>{lastReading.continuity === "steady" ? "ずっと" : "とぎれる"}</span>
        </div>
      )}

      {budgetsRow}
      {records}
      {note && <p className="game-note">{note}</p>}

      <div style={{ margin: "6px 12px 0" }}>
        <button
          className="btn primary big"
          disabled={!selected || blocked !== null || phase !== "night"}
          style={{ opacity: !selected || blocked !== null || phase !== "night" ? 0.45 : 1 }}
          onClick={doReport}
        >
          {phase === "digging"
            ? "修理班が掘っている…"
            : blocked === "locked_after_miss"
              ? "新しく聴いてから（報告はまだ）"
              : selected
                ? `📣 ${selected.seg}${selected.point} が漏水点だと報告（報告したら戻せない、あと${v.budgets.reports}回）`
                : `聴いた点をえらんで報告（報告したら戻せない、あと${v.budgets.reports}回）`}
        </button>
      </div>
    </div>
  );
}
