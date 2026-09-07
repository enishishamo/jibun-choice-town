// Q1: 電力の需給や系統運用に関わる仕事 (gameType: forecast_and_balance)
// B: 猛暑で冷房の需要が伸び続けている。
// C: 需要予測グラフ／気温予報／現在の供給力／使える調整力カード。
//    気温予報を見ないと「このあと需要がどこまで伸びるか」が分からない。
// D: 供給を足す/減らす → 時間を進める → 需給バランスが変化。
//    現在値だけ見て進めると15時に足りなくなる（＝失敗が結果で返る）。
//
// 2026-09-07 repair (Continuous Product Loop, factory/state/audits/
// audit-summary.md GQ48/CA57): see powerLogic.ts for why hydro is now a
// genuinely scarce, once-per-day resource instead of a free always-on
// source -- this is what closes the "turn everything on at 13:00 and
// never touch it again" guaranteed win.
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import { HOURS, HYDRO_BUDGET_HOURS, SOURCES, canCover, checkDemandFor, computeSupply, marginLevel } from "./powerLogic";
import type { SourceId } from "./powerLogic";

export default function PowerGame({ onComplete }: Q1GameProps) {
  const [step, setStep] = useState(0); // index into HOURS
  const [on, setOn] = useState<SourceId[]>([]);
  const [openTemp, setOpenTemp] = useState(false);
  const [openGraph, setOpenGraph] = useState(false);
  // 貯水池は一日合計1時間ぶんだけ。使うたびに減り、0になったら今日はもう
  // 使えない（ボタンが押せなくなる）。
  const [hydroLeft, setHydroLeft] = useState(HYDRO_BUDGET_HOURS);
  // 供給不足のまま時間を進めると、その時刻で停電（失敗）になる
  const [blackoutAt, setBlackoutAt] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const cur = HOURS[step];
  const supply = computeSupply(on);
  // 2026-09-07 repair round 2: see powerLogic.ts's checkDemandFor for why
  // the badge/bars/warning judge "will this plan survive the next
  // advance", not the current (already-secured) hour's own demand.
  const checkDemand = checkDemandFor(step);
  const level = marginLevel(supply, checkDemand);
  const levelText = { green: "🟢 余裕あり", yellow: "🟡 余裕が少ない", red: "🔴 足りない" }[level];

  const toggle = (id: SourceId) => {
    if (id === "hydro" && hydroLeft <= 0 && !on.includes("hydro")) return; // 空の貯水池は入れられない
    setOn((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  };

  // 「進める」は今の供給計画で次の1時間をまかなう、という決定。
  // 次の時間の需要に届いていなければ、成功が続くのではなく停電が起きる。
  const advance = () => {
    if (step + 1 >= HOURS.length) {
      setDone(true);
      return;
    }
    const next = HOURS[step + 1];
    if (!canCover(supply, next.demand)) {
      setBlackoutAt(next.h);
      return;
    }
    // 水力を使っていた1時間ぶん、貯水池を消費する。使い切ったら自動で止まる。
    if (on.includes("hydro")) {
      const left = hydroLeft - 1;
      setHydroLeft(left);
      if (left <= 0) setOn((o) => o.filter((x) => x !== "hydro"));
    }
    setStep(step + 1);
  };

  const restart = () => {
    setStep(0);
    setOn([]);
    setHydroLeft(HYDRO_BUDGET_HOURS);
    setBlackoutAt(null);
  };

  // E(失敗): 供給不足の結果が停電として街に返る。答えは教えず、
  // 「その時間にどれだけ使われるはずだったか」= 需要予測(C)へ目を向けさせる。
  if (blackoutAt !== null) {
    return (
      <div className="game board-game">
        <div className="city-lights">
          <span>🌃</span><span>🚦</span><span>🌃</span><span>🏥</span>
        </div>
        <div className="sched-issues">
          <p>🔴 {blackoutAt}時。使う量が、作る量をこえてしまった。</p>
          <p>街の一部で電気が止まり、信号が消えた交差点に人が走っていく…。</p>
        </div>
        <p className="game-line soft center-line">
          {blackoutAt}時には、どれくらい電気が使われるはずだったんだろう？
        </p>
        <button className="btn primary big" onClick={restart}>
          ⏪ 13時にもどってやり直す
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="game board-game">
        <div className="city-lights">
          <span>🏥</span><span>🚃</span><span>🏠</span><span>🏪</span>
        </div>
        <p className="game-line center-line">
          17時。街の電気は、一度も途切れなかった。<br />
          病院も、電車も、家も、お店も、いつもどおり。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          今日の記録をつける
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="mission-bar">
        <span className="mission-bar-title">
          {cur.h}:00　気温{cur.temp}℃　電気の使用量：{cur.demand}万kW
        </span>
        <div className="mission-chips">
          <span className={`mchip ${level === "green" ? "ok" : level === "yellow" ? "soft" : "bad"}`}>
            {levelText}
          </span>
          <span className="mchip">供給 {supply}万kW</span>
        </div>
      </div>

      {/* balance gauge = live feedback */}
      <div className="balance-box">
        <div className="balance-bar">
          <div
            className="balance-demand"
            style={{ width: `${Math.min(100, (checkDemand / 6000) * 100)}%` }}
          >
            <span>使う量</span>
          </div>
          <div
            className={`balance-supply ${level}`}
            style={{ width: `${Math.min(100, (supply / 6000) * 100)}%` }}
          >
            <span>作る量</span>
          </div>
        </div>
        {level !== "green" && (
          <p className="balance-warn">
            使う量が、作る量に追いついてきた…！このまま進めたら、どうなるんだろう？
          </p>
        )}
      </div>

      {/* C: data cards */}
      <div className="layer-row">
        <button className={`layer-btn ${openTemp ? "active" : ""}`} onClick={() => setOpenTemp(!openTemp)}>
          🌡 気温予報
        </button>
        <button className={`layer-btn ${openGraph ? "active" : ""}`} onClick={() => setOpenGraph(!openGraph)}>
          📈 需要予測グラフ
        </button>
      </div>
      {openTemp && (
        <div className="tool-panel">
          {HOURS.map((h) => (
            <p key={h.h} className={h.h === 15 ? "bad" : ""}>
              {h.h}:00　{h.temp}℃{h.h === 15 && "　← いちばん暑い"}
            </p>
          ))}
        </div>
      )}
      {openGraph && (
        <div className="tool-panel">
          <div className="mini-graph">
            {HOURS.map((h) => (
              <span key={h.h} className={`graph-bar ${h.h === cur.h ? "now" : ""}`}>
                <span style={{ height: `${(h.demand / 5400) * 100}%` }} />
                <small>{h.h}時</small>
              </span>
            ))}
          </div>
          <p className="soft-note">15時ごろに、いちばん電気が使われそう。</p>
        </div>
      )}

      {/* D: supply controls */}
      <div className="choice-row wrap">
        {SOURCES.map((s) => {
          const isHydro = s.id === "hydro";
          const spent = isHydro && hydroLeft <= 0 && !on.includes(s.id);
          return (
            <button
              key={s.id}
              className={`choice-card ${on.includes(s.id) ? "selected" : ""}`}
              disabled={spent}
              onClick={() => toggle(s.id)}
            >
              <span className="choice-emoji">{s.emoji}</span>
              <span className="choice-name">{s.name}</span>
              <small>
                {spent
                  ? "貯水池が空になった（今日はもう使えない）"
                  : isHydro
                    ? on.includes(s.id)
                      ? `+${s.add}万kW 稼働中（残り${hydroLeft}時間ぶん）`
                      : `+${s.add}万kW（残り${hydroLeft}時間ぶん）`
                    : on.includes(s.id)
                      ? `+${s.add}万kW 稼働中`
                      : `+${s.add}万kW`}
              </small>
            </button>
          );
        })}
      </div>

      <button className="btn primary big" onClick={advance}>
        ⏩ {step + 1 >= HOURS.length ? "夕方まで進める" : `${HOURS[step + 1].h}:00へ進める`}
      </button>
    </div>
  );
}
