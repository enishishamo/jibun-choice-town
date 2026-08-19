// Q1 game: 農家・生産者 — the lunch that starts three months earlier.
// C: the farmer's judgment material (seeds, weather forecast, water,
// machines) stays available the whole time via the dock; the heatwave
// (condition change) makes the child consult it and re-plan.
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoDock from "./InfoDock";

const A = (n: string) => `${import.meta.env.BASE_URL}assets/${n}.png`;

type Step = "plant" | "grow" | "heat" | "harvest";

export default function FarmGame({ experience, onComplete }: Q1GameProps) {
  const [step, setStep] = useState<Step>("plant");
  const [note, setNote] = useState<string | null>(null);

  // The dock shows different info depending on the field's situation.
  const dockExtra = (toolId: string) => {
    if (toolId === "weather") {
      return (
        <p className="soft-note">
          {step === "plant" && "予報：しばらく晴れ。種まきにはよさそう。"}
          {step === "grow" && "予報：おだやかな天気がつづく。"}
          {(step === "heat" || step === "harvest") && "予報：☀️猛暑がつづきそう。畑の水分に注意！"}
        </p>
      );
    }
    if (toolId === "seed") {
      return <p className="soft-note">にんじんは種まきから約3か月で収穫できる。</p>;
    }
    if (toolId === "water") {
      return <p className="soft-note">{step === "heat" ? "暑い日は朝夕2回の水やりで守れることも。" : "土がかわいたらたっぷりと。"}</p>;
    }
    return null;
  };

  return (
    <div className="game board-game">
      <div className="mission-bar">
        <span className="mission-bar-title">3か月後、にんじん300kgを給食へ！</span>
        <div className="mission-chips">
          <span className={`mchip ${step !== "plant" ? "ok" : ""}`}>{step !== "plant" ? "✓" : "・"} 種まき</span>
          <span className={`mchip ${step === "harvest" ? "ok" : ""}`}>{step === "harvest" ? "✓" : "・"} 育てる</span>
          <span className="mchip">・ 収穫</span>
        </div>
      </div>

      {step === "plant" && (
        <>
          <img className="game-scene" src={experience.place.image} alt="畑" />
          <p className="game-line">
            ここは3か月前の畑。道具と天気予報を見ながら考えよう。いつ種をまく？
          </p>
          {note && <p className="game-note">{note}</p>}
          <div className="stack">
            <button className="btn primary" onClick={() => { setNote(null); setStep("grow"); }}>
              今すぐまく！
            </button>
            <button
              className="btn ghost"
              onClick={() => setNote("🌱種・苗の情報を見てみよう。にんじんは育つのに約3か月…今まかないと間に合わない！")}
            >
              来月でいいかな…
            </button>
          </div>
        </>
      )}

      {step === "grow" && (
        <>
          <img className="game-icon" src={A("item-seedling")} alt="苗" />
          <p className="game-line">芽が出た！すくすく育っている…</p>
          <button className="btn primary" onClick={() => setStep("heat")}>
            1か月後へ ▶
          </button>
        </>
      )}

      {step === "heat" && (
        <>
          <div className="alert-box">
            <span className="big-emoji">☀️</span>
            <p>猛暑がつづいている！畑がカラカラだ！</p>
          </div>
          {note && <p className="game-note">{note}</p>}
          <div className="stack">
            <button className="btn primary" onClick={() => { setNote(null); setStep("harvest"); }}>
              水やりを朝夕2回に増やして守る
            </button>
            <button
              className="btn ghost"
              onClick={() => setNote("🌦天気予報を見てみよう。猛暑はまだつづきそう…このままだと、にんじんがしおれてしまう！")}
            >
              そのまま様子を見る
            </button>
          </div>
        </>
      )}

      {step === "harvest" && (
        <>
          <img className="game-icon" src={A("item-carrot")} alt="にんじん" />
          <p className="game-line">
            猛暑をのりこえて3か月。立派なにんじんがずらり！300kgを収穫して、トラックへ。
          </p>
          <button className="btn primary" onClick={onComplete}>
            収穫する！
          </button>
        </>
      )}

      <InfoDock tools={experience.tools} extra={dockExtra} />
    </div>
  );
}
