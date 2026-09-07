// Q1: 工場のラインをよくする仕事 (gameType: line_debug)
// B: ラインのどこかで詰まって、作れる数が減り、ロスも出ている。
// C: 工程ごとのデータ（処理数/h・停止時間・たまり・ロス）。タップして
//    開かないと、どこが遅いのか分からない。
// D: ラインを動かす → 詰まりを目で見る → データで原因の工程を特定 →
//    設備条件を調整 → もう一度動かして Before/After を比べる。
//
// 2026-09-07 repair round 1 (Continuous Product Loop, factory/state/audits/
// audit-summary.md GQ39/CA57 — "赤い詰まり表示が固定の正解工程を直接示し、
// 調整内容に関係なく同じ改善結果になる"): removed the red pre-tap
// highlight, and made the tweak choice affect the outcome. Independent
// review found round 1 reintroduced the same defect class in new shapes —
// see factory/q1-improve-line-debug/review.result.json — all fixed in
// round 2 (this version): tweaks are single-select (physically impossible
// to "pick everything" and win); a wrong-station guess budget
// (MAX_DIAGNOSIS_ATTEMPTS) closes the open-all-6-then-click-each-in-turn
// brute force loop; the tweak descriptions no longer restate the diagnosis
// ("ひっかかりを減らす" removed); s6 now also carries a small loss so
// finding the true bottleneck needs comparing MAGNITUDE across stations,
// not just checking which one has a non-zero field.
import { useEffect, useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import { BASE, BOTTLENECK, FIXED, MAX_DIAGNOSIS_ATTEMPTS, MIN_STEPS_SEEN, PARTIAL, TWEAKS, isFullFix } from "./factoryLineLogic";

type Phase = "idle" | "running" | "found" | "tuning" | "rerun" | "done" | "done-partial";
type Outcome = "jam" | "full" | "partial";

export default function FactoryLineGame({ onComplete, onPartialComplete }: Q1GameProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [outcome, setOutcome] = useState<Outcome>("jam");
  const [openStep, setOpenStep] = useState<string | null>(null);
  const [seenData, setSeenData] = useState<string[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [tweak, setTweak] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [wrongGuesses, setWrongGuesses] = useState(0);
  // did the player ever correctly name the bottleneck, or did they run out
  // of guesses first? Both are honest "didn't fully solve it" outcomes, but
  // deserve different messages -- one never even confirmed the cause.
  const [diagFailed, setDiagFailed] = useState(false);

  const steps = outcome === "full" ? FIXED : outcome === "partial" ? PARTIAL : BASE;

  // running animation timing
  useEffect(() => {
    if (phase !== "running" && phase !== "rerun") return;
    const t = setTimeout(
      () => setPhase(phase === "running" ? "found" : outcome === "partial" ? "done-partial" : "done"),
      3200,
    );
    return () => clearTimeout(t);
  }, [phase, outcome]);

  const totals = { made: steps[4].rate, stop: steps[4].stop, loss: steps[4].loss };

  if (phase === "done") {
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">ラインが流れるようになった！</span>
          <div className="result-rows">
            <span className="rrow">
              <b>作れた数（1時間）</b>
              <span className="good">400個 → {totals.made}個</span>
            </span>
            <span className="rrow">
              <b>止まった時間</b>
              <span className="good">12分 → {totals.stop}分</span>
            </span>
            <span className="rrow">
              <b>ロス（すてた数）</b>
              <span className="good">30個 → {totals.loss}個</span>
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

  // 2026-09-07 repair: an honest, weaker outcome -- either the wrong
  // station was never correctly identified (nothing was touched, numbers
  // are unchanged) or it was identified but the wrong tweak was chosen
  // (flow improves a little, the waste problem does not). Progress isn't
  // blocked (Job Reveal still happens), and neither is disguised as the
  // same success as a correct diagnosis + correct tweak.
  if (phase === "done-partial") {
    return (
      <div className="game board-game">
        <div className="result-card">
          <span className="result-title">
            {diagFailed ? "原因を見つけられなかった" : "流れは少しよくなったが、ロスはまだ多い"}
          </span>
          <div className="result-rows">
            <span className="rrow">
              <b>作れた数（1時間）</b>
              <span>400個 → {totals.made}個</span>
            </span>
            <span className="rrow">
              <b>止まった時間</b>
              <span>12分 → {totals.stop}分</span>
            </span>
            <span className="rrow">
              <b>ロス（すてた数）</b>
              <span>30個 → {totals.loss}個</span>
            </span>
          </div>
        </div>
        <p className="game-line soft center-line">
          {diagFailed
            ? "何ヶ所か調べてみたけど、今日はどこが原因か決めきれなかった。次はもっとデータを見くらべてみよう。"
            : "止まる回数は減ったけど、すてる数はほとんど変わっていない。データが示していたのは、別の原因だったかもしれない。"}
        </p>
        <button className="btn primary big" onClick={() => (onPartialComplete ?? onComplete)()}>
          今日の記録をまとめる
        </button>
      </div>
    );
  }

  const lineBoard = (
    <div className="factory-line">
      {steps.map((s) => {
        return (
          <button
            key={s.id}
            className={`fstep ${openStep === s.id ? "open" : ""} ${
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
      {/* the ice cream flowing along the line -- "stuck" (running, still
         broken) wobbles near the START of the line only, never near the
         bottleneck's own position, so it cannot be read as a positional
         answer leak. "stutter" (rerun after the wrong tweak) genuinely
         looks different from "smooth" (rerun after the right one) -- the
         waste problem the numbers still show has a visible echo, not just
         a different ending screen. */}
      {(phase === "running" || phase === "rerun") && (
        <span
          className={`flow-ice ${
            phase === "running" ? "stuck" : outcome === "partial" ? "stutter" : "smooth"
          }`}
        >
          🍨
        </span>
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
          {seenData.length >= MIN_STEPS_SEEN && (
            <>
              <p className="game-line">どの工程が原因だと思う？</p>
              <div className="choice-row wrap">
                {steps.map((s) => (
                  <button
                    key={s.id}
                    className={`choice-card ${picked === s.id ? "selected" : ""}`}
                    onClick={() => {
                      if (s.id !== BOTTLENECK) {
                        // 2026-09-07 repair round 2 (independent review
                        // BLOCKER: unlimited free wrong guesses let a
                        // player open all 6 stations then click every
                        // choice-card in turn until one worked, without
                        // ever reading the data). A wrong guess now costs
                        // one of a small budget; running out ends the
                        // chapter honestly without the answer ever being
                        // handed over.
                        const next = wrongGuesses + 1;
                        setWrongGuesses(next);
                        if (next > MAX_DIAGNOSIS_ATTEMPTS) {
                          setDiagFailed(true);
                          setPhase("done-partial");
                          return;
                        }
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
          {seenData.length < MIN_STEPS_SEEN && (
            <p className="game-line soft">
              工程をタップすると、その場所のデータが見られるよ。あと{MIN_STEPS_SEEN - seenData.length}つは見くらべてみよう。
            </p>
          )}
          {note && <p className="game-note">{note}</p>}
        </>
      )}

      {phase === "tuning" && (
        <>
          <div className="result-card">
            <span className="result-title">包装：240個/h・止まり12分・ロス30個</span>
            <p className="soft-note">
              原料や混ぜる工程は400個/hで流れているのに、ここだけ240個/h。ここで詰まっていた。
            </p>
          </div>
          {/* 2026-09-07 repair round 2 (independent review BLOCKER: "いくつ
             でも" multi-select meant picking all three tweaks always
             included the correct one, so reading the data was never
             actually required -- a player could just select everything).
             Single-select now: only one adjustment can be made this round,
             a genuine either/or choice a data-blind player has no way to
             win for free. */}
          <p className="game-line">どこを1つだけ調整する？</p>
          <div className="stack">
            {TWEAKS.map((t) => (
              <button
                key={t.id}
                className={`btn choice ${tweak === t.id ? "on" : ""}`}
                onClick={() => setTweak(t.id)}
              >
                <span className="tweak-check">{tweak === t.id ? "✓" : "＋"}</span>
                <span className="tweak-body">
                  <b>{t.name}</b>
                  <small>{t.desc}</small>
                </span>
              </button>
            ))}
          </div>
          <button
            className="btn primary big"
            disabled={tweak === null}
            onClick={() => {
              // the tweak actually chosen determines the outcome -- the
              // player has to judge from the case's own stop/loss numbers
              // which one real cause they point to, since none of the
              // three descriptions above says why it would (or wouldn't)
              // help.
              setOutcome(isFullFix(tweak) ? "full" : "partial");
              setOpenStep(null);
              setPhase("rerun");
            }}
          >
            {tweak === null ? "調整するところをえらぼう" : "▶ もう一度ラインを動かす"}
          </button>
        </>
      )}

      {phase === "rerun" && (
        <p className="game-line center-line soft">詰まっていた場所を、アイスが流れていく…</p>
      )}
    </div>
  );
}
