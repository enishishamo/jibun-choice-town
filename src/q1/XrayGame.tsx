// Q1: 診療放射線技師 (gameType: xray_shoot)
// この仕事の核：
//   「外からは見えないからだの中を、"診断に使える画像"にして見えるようにする」
// C = 医師のさつえい依頼票（みたい場所・「息を止めた瞬間に撮る」・被ばくを最小に）。
//     答えは依頼票にしか書かれていない（画面のガイドで繰り返さない）。
// D = 部位を自分で決めて撮る／呼吸を読んでシャッターを切る／
//     写りを自分の目で確かめる／左右を見比べて所見を自分で決めて届ける
// 失敗が本当に効く：
//   - シャッター1回 = X線1回。5回を超えると症例失敗（患者への負担）
//   - まちがった所見を2回届けると症例失敗（診断がおくれる）
//   - 失敗したら新しい症例でやり直し（モヤの位置は毎回変わる）
// 症例は3種類からランダム：右肺にモヤ／左肺にモヤ／どちらもきれい。
import { useEffect, useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import BodyInsideView from "./BodyInsideView";
import InfoCards from "./InfoCards";

type Where = "chest" | "belly" | "head";
const WHERE: { id: Where; icon: string; label: string }[] = [
  { id: "head", icon: "🧠", label: "あたま" },
  { id: "chest", icon: "🫀", label: "むね" },
  { id: "belly", icon: "🫄", label: "おなか" },
];
const WHERE_LABEL: Record<Where, string> = { head: "あたま", chest: "むね", belly: "おなか" };

type Step = "order" | "shoot" | "check" | "look" | "done" | "failed";
type Side = "right" | "left";
type CaseKind = Side | "none";
const SIDE_LABEL: Record<Side, string> = { right: "右の肺", left: "左の肺" };
const CASES: CaseKind[] = ["right", "left", "none"];
const EXPOSURE_LIMIT = 5;

// Breathing cycle. The display only describes what the patient is doing —
// WHICH moment to shoot is written only in the doctor's order sheet (C).
const BREATH: { label: string; hold: boolean; ms: number }[] = [
  { label: "すって……", hold: false, ms: 1000 },
  { label: "はいて……", hold: false, ms: 1000 },
  { label: "おおきく すって……", hold: false, ms: 1000 },
  { label: "……とまった。", hold: true, ms: 1000 },
];

function newCase(): CaseKind {
  return CASES[Math.floor(Math.random() * CASES.length)];
}

export default function XrayGame({ onComplete }: Q1GameProps) {
  const [step, setStep] = useState<Step>("order");
  const [caseKind, setCaseKind] = useState<CaseKind>(newCase);
  const [failReason, setFailReason] = useState<string | null>(null);
  const [orderOpened, setOrderOpened] = useState(false);
  const [where, setWhere] = useState<Where | null>(null);
  const [shotWhere, setShotWhere] = useState<Where | null>(null);
  const [breathIdx, setBreathIdx] = useState(0);
  const [quality, setQuality] = useState<"sharp" | "blurred" | null>(null);
  const [exposures, setExposures] = useState(0);
  const [misreads, setMisreads] = useState(0);
  const [attempts, setAttempts] = useState(1);
  const [seen, setSeen] = useState<Side[]>([]);
  const [lastSeen, setLastSeen] = useState<Side | null>(null);
  const [note, setNote] = useState<string | null>(null);

  // A failed case starts over with a NEW random case, so an answer learned by
  // brute force does not carry over.
  const restart = () => {
    setCaseKind(newCase());
    setFailReason(null);
    setOrderOpened(false); // each case requires consulting the order sheet again
    setWhere(null);
    setShotWhere(null);
    setBreathIdx(0);
    setQuality(null);
    setExposures(0);
    setMisreads(0);
    setAttempts((a) => a + 1);
    setSeen([]);
    setLastSeen(null);
    setNote(null);
    setStep("order");
  };

  // Advance the breathing cycle while aiming.
  useEffect(() => {
    if (step !== "shoot") return;
    const t = setTimeout(
      () => setBreathIdx((i) => (i + 1) % BREATH.length),
      BREATH[breathIdx].ms,
    );
    return () => clearTimeout(t);
  }, [step, breathIdx]);

  const exposureMeter = `☢️ つかったX線 ${exposures}/${EXPOSURE_LIMIT}`;

  // ---------- C: 依頼票を読んで、どこをどう撮るか自分で決める ----------
  if (step === "order") {
    return (
      <div className="game board-game">
        <div className="task-bar">
          <span className="task-now">医師から、さつえいの依頼が届いた</span>
          <span className="task-sub">外から見ても、からだの中は分からない</span>
        </div>

        <div className="body-stage">
          <BodyInsideView inside={false} hazeSide={caseKind} />
          <span className="body-cap">外から見えるのは、ここまで</span>
        </div>

        <InfoCards
          label="さつえい依頼票"
          onOpen={() => setOrderOpened(true)}
          cards={[
            {
              id: "order",
              icon: "📋",
              title: "医師からの依頼票",
              body: (
                <>
                  <p>
                    <strong>みたい場所：</strong>肺（はい）の中。せきが続いている。
                  </p>
                  <p>
                    <strong>だいじなこと：</strong>むねは呼吸でうごく。
                    <strong>息を止めた瞬間</strong>に撮らないと、写真がブレます。
                  </p>
                  <p>
                    <strong>おねがい：</strong>X線はからだに負担があるので、
                    使えるのは<strong>{EXPOSURE_LIMIT}回まで</strong>。むだな撮影はしないこと。
                  </p>
                </>
              ),
            },
          ]}
        />

        <p className="pick-title">どこを撮る？</p>
        <div className="choice-row wrap">
          {WHERE.map((w) => (
            <button
              key={w.id}
              className={`choice-card ${where === w.id ? "selected" : ""}`}
              onClick={() => {
                setWhere(w.id);
                setNote(null);
              }}
            >
              <span className="choice-emoji">{w.icon}</span>
              <span className="choice-name">{w.label}</span>
            </button>
          ))}
        </div>
        {note && <p className="game-note">{note}</p>}

        <button
          className="btn primary big"
          onClick={() => {
            if (!orderOpened) {
              setNote("撮る前に、医師の依頼票をひらいて確認するのがきまり。");
              return;
            }
            if (!where) {
              setNote("どこを撮るか、まだ決めていない。");
              return;
            }
            setNote(null);
            setBreathIdx(0);
            setStep("shoot");
          }}
        >
          📷 装置の前へ
        </button>
      </div>
    );
  }

  // ---------- D: 患者のようすを読んで、シャッターを切る ----------
  if (step === "shoot") {
    const phase = BREATH[breathIdx];
    return (
      <div className="game board-game">
        <div className="task-bar">
          <span className="task-now">{WHERE_LABEL[where!]}を撮る</span>
          <span className="task-sub">{exposureMeter}｜患者さんのようすを、よく見て</span>
        </div>

        <div className="body-stage">
          <BodyInsideView inside={false} hazeSide={caseKind} />
          <span className="body-cap">🫁 {phase.label}</span>
        </div>

        {note && <p className="game-note">{note}</p>}

        <button
          className="btn primary big"
          onClick={() => {
            // The budget is a hard limit: the shot past it never happens.
            if (exposures >= EXPOSURE_LIMIT) {
              setFailReason(
                "X線を使いきってしまった。患者さんの負担が大きく、今日はもう撮影できない。",
              );
              setStep("failed");
              return;
            }
            setExposures(exposures + 1);
            setShotWhere(where);
            setQuality(phase.hold ? "sharp" : "blurred");
            setNote(null);
            setStep("check");
          }}
        >
          📸 シャッターを切る
        </button>
      </div>
    );
  }

  // ---------- D: 写りを自分の目で確かめる ----------
  if (step === "check") {
    const blurred = quality === "blurred";
    const wrongPart = shotWhere !== "chest";
    return (
      <div className="game board-game">
        <div className="task-bar">
          <span className="task-now">うつった画像を、たしかめる</span>
          <span className="task-sub">{exposureMeter}｜この画像で、依頼にこたえられる？</span>
        </div>

        <div
          className="body-stage revealing"
          style={blurred ? { filter: "blur(4px)", opacity: 0.9 } : undefined}
        >
          {wrongPart ? (
            <BodyInsideView inside={false} hazeSide={caseKind} />
          ) : (
            <BodyInsideView inside hazeSide={caseKind} />
          )}
          <span className="body-cap">
            {wrongPart
              ? `うつったのは、${WHERE_LABEL[shotWhere!]}のあたり`
              : blurred
                ? "……なんだか、ぼやけている"
                : "むねの中が、うつった"}
          </span>
        </div>

        {note && <p className="game-note">{note}</p>}

        <div className="choice-row">
          <button
            className="btn"
            onClick={() => {
              setQuality(null);
              setShotWhere(null);
              setNote(null);
              setStep("order");
            }}
          >
            🔁 とりなおす
          </button>
          <button
            className="btn primary"
            onClick={() => {
              if (wrongPart) {
                setNote(
                  `医師「これは${WHERE_LABEL[shotWhere!]}の画像だね……依頼票を確認して、撮りなおしてもらえる？」`,
                );
                return;
              }
              if (blurred) {
                setNote("先輩技師「ブレていて、中がよく見えない。これは医師に届けられないな」");
                return;
              }
              setNote(null);
              setStep("look");
            }}
          >
            ✅ この画像でいく
          </button>
        </div>
      </div>
    );
  }

  // ---------- D: 左右を自分の目で見比べて、所見を決める ----------
  if (step === "look") {
    const both = seen.length === 2;
    return (
      <div className="game board-game">
        <div className="task-bar">
          <span className="task-now">左右の肺を見くらべて、気づいたことを医師へ</span>
          <span className="task-sub">タップすると、その肺に注目できる</span>
        </div>
        <div className="body-stage">
          <BodyInsideView
            inside
            hazeSide={caseKind}
            focus={lastSeen}
            onPickLung={(side) => {
              setSeen((s) => (s.includes(side) ? s : [...s, side]));
              setLastSeen(side);
              setNote(`${SIDE_LABEL[side]}に注目している……`);
            }}
          />
          <span className="body-cap">タップ：右の肺 / 左の肺</span>
        </div>
        {note && <p className="game-note">{note}</p>}

        {both && (
          <>
            <p className="pick-title">医師へ、なんと伝える？（まちがえられるのは1回まで）</p>
            <div className="choice-row wrap">
              {(
                [
                  { id: "right", label: "右の肺があやしい" },
                  { id: "left", label: "左の肺があやしい" },
                  { id: "none", label: "どちらもきれい" },
                ] as { id: CaseKind; label: string }[]
              ).map((c) => (
                <button
                  key={c.id}
                  className="choice-card"
                  onClick={() => {
                    if (c.id === caseKind) {
                      setNote(null);
                      setStep("done");
                      return;
                    }
                    const m = misreads + 1;
                    setMisreads(m);
                    if (m >= 2) {
                      setFailReason(
                        "まちがった見立てを2回つたえてしまった。診断がおくれてしまう。",
                      );
                      setStep("failed");
                      return;
                    }
                    setNote("医師「本当に？ もういちど、左右をよーく見くらべてみて」");
                  }}
                >
                  <span className="choice-name">{c.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // ---------- 症例失敗：新しい症例でやり直し ----------
  if (step === "failed") {
    return (
      <div className="game board-game">
        <div className="result-card">
          <span className="result-title">今日は、ここまで</span>
        </div>
        <p className="game-line center-line">{failReason}</p>
        <p className="game-line soft center-line">
          だいじょうぶ、先輩も最初はそうだった。<strong>次の患者さん</strong>でもう一度。
          （症例は毎回ちがう）
        </p>
        <button className="btn primary big" onClick={restart}>
          🔁 次の症例に挑戦する
        </button>
      </div>
    );
  }

  // ---------- E: Before → After ----------
  const clean = caseKind === "none";
  const perfect = exposures === 1 && misreads === 0 && attempts === 1;
  return (
    <div className="game board-game">
      <div className="result-card good">
        <span className="result-title">見えなかった中が、診断に使える画像になった</span>
        <div className="ba-mini">
          <span className="ba-mini-item">
            <span className="ba-mini-emoji">🧍</span>
            <small>外からでは<br />分からない</small>
          </span>
          <span className="ba-mini-arrow">→</span>
          <span className="ba-mini-item">
            <span className="ba-mini-emoji">🫁</span>
            <small>
              {clean ? (
                <>肺はきれい<br />だと分かった</>
              ) : (
                <>{SIDE_LABEL[caseKind as Side]}に<br />白いモヤがある</>
              )}
            </small>
          </span>
        </div>
      </div>
      <p className="game-line soft center-line">
        {perfect
          ? "X線1回・見立ても一発。依頼票と患者さんをよく見ていた証拠。"
          : `つかったX線${exposures}回・見立てなおし${misreads}回` +
            (attempts > 1 ? `・${attempts}人目の患者さんで成功。` : "。") +
            "コツをつかめば、患者さんの負担をもっと減らせる。"}
      </p>
      <p className="game-line soft center-line">
        {clean
          ? "「何もない」と分かることも、医師にとって大切な手がかりになる。"
          : "きみの画像と気づきは、医師にとって新しい手がかりになる。"}
      </p>
      <button className="btn primary big" onClick={onComplete}>
        画像を送る
      </button>
    </div>
  );
}
