// Q1: 工場のラインをよくする仕事 (gameType: line_debug)
// B: ラインのどこかで詰まって、作れる数が減り、ロスも出ている。
// C: 工程ごとのデータ（処理数/h・停止時間・たまり・ロス）。タップして
//    開かないと、どこが遅いのか分からない。
// D: ラインを動かす → 詰まりを目で見る → データで原因の工程を特定 →
//    設備条件を調整 → もう一度動かして Before/After を比べる。
import { useEffect, useState } from "react";
import type { Q1GameProps } from "./gameTypes";

interface Step {
  id: string;
  name: string;
  emoji: string;
  rate: number; // 個/h
  stop: number; // 分
  queue: number; // たまり
  loss: number; // ロス
}

const BASE: Step[] = [
  { id: "s1", name: "原料", emoji: "🥛", rate: 400, stop: 0, queue: 0, loss: 0 },
  { id: "s2", name: "混ぜる", emoji: "🌀", rate: 400, stop: 0, queue: 0, loss: 0 },
  { id: "s3", name: "冷やす", emoji: "❄️", rate: 400, stop: 1, queue: 2, loss: 0 },
  { id: "s4", name: "容器へ", emoji: "🥤", rate: 390, stop: 0, queue: 5, loss: 0 },
  { id: "s5", name: "包装", emoji: "🎁", rate: 240, stop: 12, queue: 25, loss: 30 },
  { id: "s6", name: "箱づめ", emoji: "📦", rate: 200, stop: 8, queue: 10, loss: 0 },
];
const FIXED: Step[] = [
  { id: "s1", name: "原料", emoji: "🥛", rate: 460, stop: 0, queue: 0, loss: 0 },
  { id: "s2", name: "混ぜる", emoji: "🌀", rate: 460, stop: 0, queue: 0, loss: 0 },
  { id: "s3", name: "冷やす", emoji: "❄️", rate: 460, stop: 0, queue: 1, loss: 0 },
  { id: "s4", name: "容器へ", emoji: "🥤", rate: 460, stop: 0, queue: 2, loss: 0 },
  { id: "s5", name: "包装", emoji: "🎁", rate: 460, stop: 3, queue: 4, loss: 10 },
  { id: "s6", name: "箱づめ", emoji: "📦", rate: 460, stop: 0, queue: 2, loss: 0 },
];

const BOTTLENECK = "s5";

const TWEAKS = [
  { id: "guide", name: "ガイドの位置を変える", desc: "包装フィルムの通り道を調整して、ひっかかりを減らす" },
  { id: "speed", name: "ラインの速さを変える", desc: "手前の工程と包装の速さを合わせる" },
  { id: "switch", name: "切替えの条件を変える", desc: "フィルムを交換するタイミングを見直して、止まる回数を減らす" },
];

type Phase = "idle" | "running" | "found" | "tuning" | "rerun" | "done";

export default function FactoryLineGame({ onComplete }: Q1GameProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [fixed, setFixed] = useState(false);
  const [openStep, setOpenStep] = useState<string | null>(null);
  const [seenData, setSeenData] = useState<string[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [tweaks, setTweaks] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);

  const steps = fixed ? FIXED : BASE;
  const jam = !fixed;

  // running animation timing
  useEffect(() => {
    if (phase !== "running" && phase !== "rerun") return;
    const t = setTimeout(() => setPhase(phase === "running" ? "found" : "done"), 3200);
    return () => clearTimeout(t);
  }, [phase]);

  const totals = fixed
    ? { made: 460, stop: 3, loss: 10 }
    : { made: 400, stop: 12, loss: 30 };

  if (phase === "done") {
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">ラインが流れるようになった！</span>
          <div className="result-rows">
            <span className="rrow">
              <b>作れた数（1時間）</b>
              <span className="good">400個 → 460個</span>
            </span>
            <span className="rrow">
              <b>止まった時間</b>
              <span className="good">12分 → 3分</span>
            </span>
            <span className="rrow">
              <b>ロス（すてた数）</b>
              <span className="good">30個 → 10個</span>
            </span>
          </div>
        </div>
        <p className="game-line center-line">
          さっき詰まっていた場所を、アイスが流れるようになった！
        </p>
        <button className="btn primary big" onClick={onComplete}>
          今日の記録をまとめる
        </button>
      </div>
    );
  }

  const lineBoard = (
    <div className="factory-line">
      {steps.map((s) => {
        const isJam = jam && s.id === BOTTLENECK && (phase === "running" || phase === "found" || phase === "tuning");
        return (
          <button
            key={s.id}
            className={`fstep ${isJam ? "jam" : ""} ${openStep === s.id ? "open" : ""} ${
              picked === s.id ? "picked" : ""
            }`}
            onClick={() => {
              if (phase === "found") {
                setOpenStep(openStep === s.id ? null : s.id);
                setSeenData((v) => (v.includes(s.id) ? v : [...v, s.id]));
              }
            }}
          >
            <span className="fstep-emoji">{s.emoji}</span>
            <small>{s.name}</small>
            {isJam && <span className="fstep-alert">！</span>}
            {openStep === s.id && (
              <span className="fstep-data">
                <span>{s.rate}個/h</span>
                <span>止まり {s.stop}分</span>
                <span>たまり {s.queue}個</span>
                <span>ロス {s.loss}個</span>
              </span>
            )}
          </button>
        );
      })}
      {/* the ice cream flowing along the line */}
      {(phase === "running" || phase === "rerun") && (
        <span className={`flow-ice ${jam && phase === "running" ? "stuck" : "smooth"}`}>🍨</span>
      )}
    </div>
  );

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">
          {phase === "idle" && "ラインを動かして、止まる場所を探そう"}
          {phase === "running" && "アイスがラインを流れていく…"}
          {phase === "found" && "工程をタップして、データを見てみよう"}
          {phase === "tuning" && "設備の条件を調整してみよう"}
          {phase === "rerun" && "もう一度、ラインを動かしてみる…"}
        </span>
        <span className="task-sub">
          作れた数 {totals.made}個/h ・ 止まり {totals.stop}分 ・ ロス {totals.loss}個
        </span>
      </div>

      {lineBoard}

      {phase === "idle" && (
        <button className="btn primary big" onClick={() => setPhase("running")}>
          ▶ ラインを動かす
        </button>
      )}

      {phase === "running" && (
        <p className="game-line center-line soft">…どこかで止まっているみたい。</p>
      )}

      {phase === "found" && (
        <>
          {seenData.length > 0 && (
            <>
              <p className="game-line">どの工程が原因だと思う？</p>
              <div className="choice-row wrap">
                {steps.map((s) => (
                  <button
                    key={s.id}
                    className={`choice-card ${picked === s.id ? "selected" : ""}`}
                    onClick={() => {
                      if (s.id !== BOTTLENECK) {
                        setNote(
                          `${s.name}は${s.rate}個/hで流れている。ほかの工程のデータも見くらべてみよう。`,
                        );
                        return;
                      }
                      setNote(null);
                      setPicked(s.id);
                      setPhase("tuning");
                    }}
                  >
                    <span className="choice-emoji">{s.emoji}</span>
                    <span className="choice-name">{s.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
          {seenData.length === 0 && (
            <p className="game-line soft">工程をタップすると、その場所のデータが見られるよ。</p>
          )}
          {note && <p className="game-note">{note}</p>}
        </>
      )}

      {phase === "tuning" && (
        <>
          <div className="result-card">
            <span className="result-title">包装：240個/h・止まり12分・ロス30個</span>
            <p className="soft-note">
              ほかの工程は400個/hで流れているのに、ここだけ240個/h。ここで詰まっていた。
            </p>
          </div>
          <p className="game-line">どこを調整する？（いくつでも）</p>
          <div className="stack">
            {TWEAKS.map((t) => (
              <button
                key={t.id}
                className={`btn choice ${tweaks.includes(t.id) ? "on" : ""}`}
                onClick={() =>
                  setTweaks((v) => (v.includes(t.id) ? v.filter((x) => x !== t.id) : [...v, t.id]))
                }
              >
                <span className="tweak-check">{tweaks.includes(t.id) ? "✓" : "＋"}</span>
                <span className="tweak-body">
                  <b>{t.name}</b>
                  <small>{t.desc}</small>
                </span>
              </button>
            ))}
          </div>
          <button
            className="btn primary big"
            disabled={tweaks.length === 0}
            onClick={() => {
              setFixed(true);
              setOpenStep(null);
              setPhase("rerun");
            }}
          >
            {tweaks.length === 0 ? "調整するところをえらぼう" : "▶ もう一度ラインを動かす"}
          </button>
        </>
      )}

      {phase === "rerun" && (
        <p className="game-line center-line soft">詰まっていた場所を、アイスが流れていく…</p>
      )}
    </div>
  );
}
