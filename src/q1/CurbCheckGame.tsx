// Q1: ごみ収集作業員 (gameType: curb_check)
// 核: 「回収は、積むかどうかを現場で判断する仕事」— 袋を観察し、ルールと
// 突き合わせて 積む / シールを貼って残す / 危険物は隔離して連絡 を決める。
// ルールは src/q1/wasteLogic.ts（判定・袋生成・ミス予算）。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import { CURB_MISTAKE_LIMIT, makeBags, judgeBag, pickDayType } from "./wasteLogic";
import type { Bag, CurbAction, DayType } from "./wasteLogic";

type Step = "work" | "failed" | "done";

const ACTIONS: { id: CurbAction; label: string; sub?: string }[] = [
  { id: "load", label: "🚛 積む" },
  { id: "reject_wrong_type", label: "🏷️ 残す：分別がちがう" },
  { id: "reject_wrong_bag", label: "🏷️ 残す：指定袋でない" },
  { id: "reject_hazard", label: "⚠️ はなれて、営業所へ連絡", sub: "危険物かも" },
];

const DAY_INFO: Record<DayType, { name: string; bag: string; ok: string; ng: string }> = {
  burnable: {
    name: "燃やすごみ",
    bag: "まちの指定袋（半透明の青）",
    ok: "生ごみ・紙くず・落ち葉など",
    ng: "ビン・カン・われもの・プラ容器（分別ちがい）",
  },
  plastic: {
    name: "プラスチック容器",
    bag: "まちの指定袋（半透明の青）",
    ok: "プラのカップ・トレー・レジ袋など",
    ng: "生ごみ・ビン・カン（分別ちがい）",
  },
};

export default function CurbCheckGame({ onComplete }: Q1GameProps) {
  const [day, setDay] = useState<DayType>(() => pickDayType());
  const [bags, setBags] = useState<Bag[]>(() => makeBags(Math.random, day));
  const [idx, setIdx] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [step, setStep] = useState<Step>("work");
  const [failText, setFailText] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(1);

  const restart = () => {
    const d = pickDayType();
    setDay(d);
    setBags(makeBags(Math.random, d));
    setIdx(0);
    setMistakes(0);
    setNote(null);
    setStep("work");
    setAttempts((a) => a + 1);
  };

  if (step === "failed") {
    return (
      <div className="game board-game">
        <div className="result-card">
          <span className="result-title">今日は、ここまで</span>
        </div>
        <p className="game-line center-line">{failText}</p>
        <p className="game-line soft center-line">
          だいじょうぶ、先輩と一緒にもう一度。（集積所の袋は、毎回ちがう）
        </p>
        <button className="btn primary big" onClick={restart}>
          🔁 次の集積所へ
        </button>
      </div>
    );
  }

  if (step === "done") {
    const perfect = mistakes === 0 && attempts === 1;
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">この集積所、回収完了！</span>
        </div>
        <p className="game-line soft center-line">
          {perfect
            ? "全部一発で正しく判断できた。積むだけじゃなく「残す」判断もできるのがプロの目。"
            : `まちがい${mistakes}回${attempts > 1 ? `・${attempts}か所目で完了` : ""}。残す理由まで当てられれば一人前。`}
        </p>
        <p className="game-line soft center-line">
          ⚠️ スプレー缶やリチウム電池は、収集車の中で火が出ることがある。
          見つけたら子どもは触らず、<strong>大人や市の窓口に知らせよう</strong>。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          つぎの集積所へ向かう
        </button>
      </div>
    );
  }

  const bag = bags[idx];
  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">この袋、積んでいい？（{idx + 1}/{bags.length}）</span>
        <span className="task-sub">まちがえられるのは あと{CURB_MISTAKE_LIMIT - mistakes - 1}回</span>
      </div>

      <div className="body-stage" style={{ padding: "14px 0" }}>
        <div
          style={{
            margin: "0 auto",
            width: 150,
            height: 140,
            borderRadius: "18px 18px 22px 22px",
            background: bag.look.bagStyle === "black" ? "#5a5a5f" : "rgba(160,200,235,0.55)",
            border: "3px solid " + (bag.look.bagStyle === "black" ? "#3f3f44" : "#7fa8cc"),
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <span style={{ fontSize: 34, letterSpacing: 4, filter: bag.look.bagStyle === "black" ? "brightness(0.4) blur(2px)" : "none" }}>
            {bag.look.items.join("")}
          </span>
          <span style={{ fontSize: 11, color: "#555", background: "rgba(255,255,255,0.8)", borderRadius: 8, padding: "2px 8px" }}>
            {bag.look.bagStyle === "black" ? "黒い袋" : "指定袋（半透明）"}
          </span>
        </div>
        <span className="body-cap">👀 {bag.look.hint}</span>
      </div>

      <InfoCards
        label="しごとの資料"
        cards={[
          {
            id: "rule",
            icon: "📋",
            title: "今日の収集ルール",
            body: (
              <>
                <p><strong>今日は「{DAY_INFO[day].name}」の日。</strong>出せるのは{DAY_INFO[day].bag}だけ。</p>
                <p><strong>積めるもの：</strong>{DAY_INFO[day].ok}</p>
                <p><strong>積めないもの：</strong>{DAY_INFO[day].ng}、指定袋でない袋。</p>
                <p><strong>⚠️あぶないもの：</strong>スプレー缶・電池は収集車の中で火が出ることがある。
                  積まずに、はなれて営業所へ連絡する。</p>
              </>
            ),
          },
        ]}
      />

      {note && <p className="game-note">{note}</p>}

      <div className="choice-row wrap">
        {ACTIONS.map((a) => (
          <button
            key={a.id}
            className="choice-card"
            onClick={() => {
              const r = judgeBag(bag, a.id);
              if (r === "fire") {
                setFailText("危険物を積んでしまった…収集車の荷台から煙が出て、今日の収集は中止になった。スプレー缶や電池は、積まずに連絡が正解。");
                setStep("failed");
                return;
              }
              if (r === "mistake") {
                const m = mistakes + 1;
                setMistakes(m);
                if (m >= CURB_MISTAKE_LIMIT) {
                  setFailText(
                    bag.truth === "ok"
                      ? "回収できる袋を残しすぎて、住民から苦情が来てしまった。"
                      : "まちがった判断が続いて、工場から連絡が来た。",
                  );
                  setStep("failed");
                  return;
                }
                setNote(
                  bag.truth === "ok"
                    ? "…これは回収できる袋だった。残された住民は困ってしまう。"
                    : bag.truth === "hazard"
                      ? "…この袋、よく見るとあぶないものが入っていた。対応がちがう。"
                      : "…理由がちがった。袋と中身をもう一度よく見よう。",
                );
              } else {
                setNote(
                  a.id === "load"
                    ? "よし、荷台へ。"
                    : a.id === "reject_hazard"
                      ? "はなれて営業所へ連絡した。専門の手順で回収してもらう。"
                      : "シールを貼って残した。理由が伝われば、次はちゃんと出してもらえる。",
                );
              }
              if (idx + 1 >= bags.length) setStep("done");
              else setIdx(idx + 1);
            }}
          >
            <span className="choice-name">{a.label}</span>
            {a.sub && <small style={{ opacity: 0.7 }}>{a.sub}</small>}
          </button>
        ))}
      </div>
    </div>
  );
}
