// Q1: 診療放射線技師 (gameType: xray_shoot) — Stage 4 redesign (proposal A)
// この仕事の核：
//   「外からは見えないからだの中を、"診断に使える画像"にして見えるようにする」
// プレイヤーの判断（すべて xrayLogic.ts が判定する）：
//   1. フレーミング — この患者の体格・写り位置を見て、フレームの位置×サイズを決める
//      （正解オーバーレイは無い。依頼票は原理だけ教える）
//   2. タイミング — 呼吸を読み、息が止まった瞬間に撮る
//   3. 品質判定 — うつった画像（切れ/ブレ/OK）を自分の目で見て、届けるか撮り直すか決める
//   4. 被ばく予算 — 撮影1回=X線1回。広いフレームは2回ぶん（ALARA）。5回で症例失敗
// 気づきメモ（どちらの肺があやしいか）は技師の本分でないため合否ゲートにしない。
// 正解ならE画面で医師に感謝され、外しても症例は失敗しない。
import { useEffect, useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import BodyInsideView from "./BodyInsideView";
import InfoCards from "./InfoCards";
import {
  BUILD_SCALE, EXPOSURE_LIMIT, FRAME_COST, FRAME_POSITIONS, FRAME_SIZES, LUNG_POS_DY, MISJUDGE_LIMIT,
  canAfford, deliveryRejectionReason, frameRect, isPerfect, newCase, noteIsCorrect, shoot,
} from "./xrayLogic";
import type { CaseKind, FramePos, FrameSize, PatientCase, ShotResult, Side } from "./xrayLogic";

type Step = "order" | "frame" | "shoot" | "check" | "note" | "done" | "failed";
const SIDE_LABEL: Record<Side, string> = { right: "右の肺", left: "左の肺" };
const POS_LABEL: Record<FramePos, string> = { high: "うえ", mid: "まんなか", low: "した" };
const SIZE_LABEL: Record<FrameSize, string> = { S: "小", M: "中", L: "大" };

// Breathing cycle. The display only describes what the patient is doing —
// WHICH moment to shoot is written only in the doctor's order sheet (C).
const BREATH: { label: string; hold: boolean; ms: number }[] = [
  { label: "すって……", hold: false, ms: 1000 },
  { label: "はいて……", hold: false, ms: 1000 },
  { label: "おおきく すって……", hold: false, ms: 1000 },
  { label: "……とまった。", hold: true, ms: 1000 },
];

export default function XrayGame({ onComplete }: Q1GameProps) {
  const [step, setStep] = useState<Step>("order");
  const [c, setCase] = useState<PatientCase>(newCase);
  const [failReason, setFailReason] = useState<string | null>(null);
  const [orderOpened, setOrderOpened] = useState(false);
  const [pos, setPos] = useState<FramePos | null>(null);
  const [size, setSize] = useState<FrameSize | null>(null);
  const [breathIdx, setBreathIdx] = useState(0);
  const [shot, setShot] = useState<ShotResult | null>(null);
  const [exposures, setExposures] = useState(0);
  const [retakes, setRetakes] = useState(0);
  const [misjudges, setMisjudges] = useState(0);
  const [attempts, setAttempts] = useState(1);
  const [seen, setSeen] = useState<Side[]>([]);
  const [lastSeen, setLastSeen] = useState<Side | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [noteResult, setNoteResult] = useState<boolean | null>(null);

  // A failed case starts over with a NEW random patient, so a memorized
  // framing/answer does not carry over.
  const restart = () => {
    setCase(newCase());
    setFailReason(null);
    setOrderOpened(false);
    setPos(null);
    setSize(null);
    setBreathIdx(0);
    setShot(null);
    setExposures(0);
    setRetakes(0);
    setMisjudges(0);
    setAttempts((a) => a + 1);
    setSeen([]);
    setLastSeen(null);
    setNote(null);
    setNoteResult(null);
    setStep("order");
  };

  // Advance the breathing cycle while aiming.
  useEffect(() => {
    if (step !== "shoot") return;
    const t = setTimeout(() => setBreathIdx((i) => (i + 1) % BREATH.length), BREATH[breathIdx].ms);
    return () => clearTimeout(t);
  }, [step, breathIdx]);

  const scale = BUILD_SCALE[c.build];
  const dy = LUNG_POS_DY[c.lungPos];
  const meter = `☢️ X線 ${exposures}/${EXPOSURE_LIMIT}`;
  const curFrame = pos && size ? frameRect(pos, size) : null;

  // ---------- C: 依頼票を読む ----------
  if (step === "order") {
    return (
      <div className="game board-game">
        <div className="task-bar">
          <span className="task-now">医師から、さつえいの依頼が届いた</span>
          <span className="task-sub">外から見ても、からだの中は分からない</span>
        </div>

        <div className="body-stage">
          <BodyInsideView inside={false} hazeSide={c.haze} scale={scale} dy={dy} />
          <span className="body-cap">今日の患者さん（よく見ておこう）</span>
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
                    <strong>知りたいこと：</strong>せきが続いている。肺（はい）の中のようすを見たい。
                    <strong>左右の肺が両方、切れずに</strong>写っていること。
                  </p>
                  <p>
                    <strong>コツ：</strong>肺はむねの中、かたのすぐ下あたり。
                    からだの大きい人は、写る範囲も大きくなる。
                  </p>
                  <p>
                    <strong>だいじなこと：</strong>むねは呼吸でうごく。<strong>息が止まった瞬間</strong>に
                    撮らないとブレる。X線は<strong>{EXPOSURE_LIMIT}回まで</strong>。
                    広いフレームは2回ぶん使う。むだな被ばくをさせないこと。
                  </p>
                </>
              ),
            },
          ]}
        />

        {note && <p className="game-note">{note}</p>}
        <button
          className="btn primary big"
          onClick={() => {
            if (!orderOpened) {
              setNote("撮る前に、医師の依頼票をひらいて確認するのがきまり。");
              return;
            }
            setNote(null);
            setStep("frame");
          }}
        >
          📷 装置の前へ
        </button>
      </div>
    );
  }

  // ---------- D1: フレーミング（位置×サイズを患者を見て決める） ----------
  if (step === "frame") {
    return (
      <div className="game board-game">
        <div className="task-bar">
          <span className="task-now">どこを、どの広さで撮る？</span>
          <span className="task-sub">{meter}｜患者さんのからだをよく見て決めよう</span>
        </div>

        <div className="body-stage">
          <BodyInsideView inside={false} hazeSide={c.haze} scale={scale} dy={dy} frame={curFrame} />
          <span className="body-cap">フレーム＝X線が当たる範囲</span>
        </div>

        <div className="choice-row wrap">
          {FRAME_POSITIONS.map((p) => (
            <button key={p} className={`choice-card ${pos === p ? "selected" : ""}`} onClick={() => { setPos(p); setNote(null); }}>
              <span className="choice-name">位置：{POS_LABEL[p]}</span>
            </button>
          ))}
        </div>
        <div className="choice-row wrap">
          {FRAME_SIZES.map((s) => (
            <button key={s} className={`choice-card ${size === s ? "selected" : ""}`} onClick={() => { setSize(s); setNote(null); }}>
              <span className="choice-name">サイズ：{SIZE_LABEL[s]}{FRAME_COST[s] > 1 ? "（X線2回ぶん）" : ""}</span>
            </button>
          ))}
        </div>
        {note && <p className="game-note">{note}</p>}

        <button
          className="btn primary big"
          onClick={() => {
            if (!pos || !size) {
              setNote("フレームの位置とサイズを決めよう。");
              return;
            }
            if (!canAfford(exposures, size)) {
              setFailReason("X線を使いきってしまった。患者さんの負担が大きく、今日はもう撮影できない。");
              setStep("failed");
              return;
            }
            setNote(null);
            // Random starting phase so the shutter moment can't be memorized.
            setBreathIdx(Math.floor(Math.random() * BREATH.length));
            setStep("shoot");
          }}
        >
          ✅ この範囲でかまえる
        </button>
      </div>
    );
  }

  // ---------- D2: 呼吸を読んで、シャッターを切る ----------
  if (step === "shoot") {
    const phase = BREATH[breathIdx];
    return (
      <div className="game board-game">
        <div className="task-bar">
          <span className="task-now">かまえた。あとは、いつ撮るか</span>
          <span className="task-sub">{meter}｜患者さんのようすを、よく見て</span>
        </div>

        <div className="body-stage">
          <BodyInsideView inside={false} hazeSide={c.haze} scale={scale} dy={dy} frame={curFrame} />
          <span className="body-cap">🫁 {phase.label}</span>
        </div>

        {note && <p className="game-note">{note}</p>}
        <button
          className="btn primary big"
          onClick={() => {
            const r = shoot(c, pos!, size!, phase.hold);
            setExposures((e) => e + r.cost);
            setShot(r);
            setNote(null);
            setStep("check");
          }}
        >
          📸 シャッターを切る
        </button>
      </div>
    );
  }

  // ---------- D3: うつった画像を自分の目で確かめる ----------
  if (step === "check" && shot) {
    return (
      <div className="game board-game">
        <div className="task-bar">
          <span className="task-now">うつった画像を、たしかめる</span>
          <span className="task-sub">{meter}｜この画像で、医師の依頼にこたえられる？</span>
        </div>

        <div
          className="body-stage revealing"
          style={shot.blurred ? { filter: "blur(4px)", opacity: 0.9 } : undefined}
        >
          <BodyInsideView inside hazeSide={c.haze} scale={scale} dy={dy} frame={curFrame} clipToFrame />
          <span className="body-cap">うつった画像（フレームの外は写らない）</span>
        </div>

        {note && <p className="game-note">{note}</p>}
        <div className="choice-row">
          <button
            className="btn"
            onClick={() => {
              setRetakes((r) => r + 1);
              setShot(null);
              setNote(null);
              setStep("frame");
            }}
          >
            🔁 とりなおす
          </button>
          <button
            className="btn primary"
            onClick={() => {
              const reject = deliveryRejectionReason(shot);
              if (reject) {
                // A rejected delivery is a misjudgement with a real cost:
                // the first one teaches nothing specific (no free oracle),
                // the second names the defect, the third ends the case.
                const m = misjudges + 1;
                setMisjudges(m);
                if (m >= MISJUDGE_LIMIT) {
                  setFailReason(
                    "見られない画像を、何度も先輩に持っていってしまった。「自分の目でたしかめる」のも技師の仕事——今日はここまで。",
                  );
                  setStep("failed");
                  return;
                }
                if (m === 1) {
                  setNote("先輩技師「ん？ 本当にこれでいい？ 依頼票を思い出して、もういちど自分の目でたしかめて」");
                } else {
                  setNote(
                    reject === "cutoff"
                      ? "先輩技師「よく見て。肺のはしが切れている。左右の肺がまるごと写っていないと、医師は診断できないんだ」"
                      : "先輩技師「よく見て。ブレていて中が見えない。呼吸が止まった瞬間に撮れていたかな」",
                  );
                }
                return;
              }
              setNote(null);
              setStep("note");
            }}
          >
            ✅ この画像でいく
          </button>
        </div>
      </div>
    );
  }

  // ---------- おまけのD: 左右を見比べて、気づきをメモする（合否ゲートではない） ----------
  if (step === "note") {
    const both = seen.length === 2;
    return (
      <div className="game board-game">
        <div className="task-bar">
          <span className="task-now">届ける前に、左右を見くらべてみよう</span>
          <span className="task-sub">気づいたことをメモすると、医師の助けになる</span>
        </div>
        <div className="body-stage">
          <BodyInsideView
            inside hazeSide={c.haze} scale={scale} dy={dy}
            frame={curFrame} clipToFrame
            focus={lastSeen}
            onPickLung={(side) => {
              setSeen((s) => (s.includes(side) ? s : [...s, side]));
              setLastSeen(side);
              setNote(`${SIDE_LABEL[side]}に注目している……`);
            }}
          />
          <span className="body-cap">届ける画像（タップ：右の肺 / 左の肺）</span>
        </div>
        {note && <p className="game-note">{note}</p>}

        {both && (
          <>
            <p className="pick-title">メモに何と書く？</p>
            <div className="choice-row wrap">
              {(
                [
                  { id: "right", label: "右の肺に白いモヤ" },
                  { id: "left", label: "左の肺に白いモヤ" },
                  { id: "none", label: "どちらもきれいに見える" },
                ] as { id: CaseKind; label: string }[]
              ).map((ch) => (
                <button
                  key={ch.id}
                  className="choice-card"
                  onClick={() => {
                    setNoteResult(noteIsCorrect(c, ch.id));
                    setNote(null);
                    setStep("done");
                  }}
                >
                  <span className="choice-name">{ch.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // ---------- 症例失敗：新しい患者でやり直し ----------
  if (step === "failed") {
    return (
      <div className="game board-game">
        <div className="result-card">
          <span className="result-title">今日は、ここまで</span>
        </div>
        <p className="game-line center-line">{failReason}</p>
        <p className="game-line soft center-line">
          だいじょうぶ、先輩も最初はそうだった。<strong>次の患者さん</strong>でもう一度。
          （患者さんの体格も写り方も、毎回ちがう）
        </p>
        <button className="btn primary big" onClick={restart}>
          🔁 次の患者さんを担当する
        </button>
      </div>
    );
  }

  // ---------- E: Before → After ----------
  const clean = c.haze === "none";
  const perfect = isPerfect(c, exposures, retakes, noteResult === true) && misjudges === 0;
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
                <>肺はきれいに<br />写っていた</>
              ) : (
                <>{SIDE_LABEL[c.haze as Side]}に<br />白いモヤが写った</>
              )}
            </small>
          </span>
        </div>
      </div>
      <p className="game-line soft center-line">
        {noteResult
          ? "医師「メモ、助かったよ。画像もきれいだ」— きみの気づきが診断を早くした。"
          : "医師は画像をじっくり読み、見立てを立てた。（メモの見立てはちがっていたけれど、画像がよければ診断はできる）"}
      </p>
      <p className="game-line soft center-line">
        {perfect
          ? `X線${exposures}回だけ・撮りなおしゼロ・メモも正解。むだな負担のない、プロの仕事。`
          : `つかったX線${exposures}回・とりなおし${retakes}回・先輩への差しもどし${misjudges}回` +
            (attempts > 1 ? `・${attempts}人目の患者さんで成功。` : "。") +
            "コツをつかめば、もっと少ない負担で撮れる。"}
      </p>
      <button className="btn primary big" onClick={onComplete}>
        画像を送る
      </button>
    </div>
  );
}
