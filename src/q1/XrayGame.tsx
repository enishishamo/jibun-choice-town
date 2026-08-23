// Q1: 診療放射線技師 (gameType: xray_shoot)
// B: 外から見えない肺の中を、診断に使える画像にしたい。
// C: 向き・撮影範囲・息のタイミング。何が「診断に使える画像」かは
//    チェックリストを開かないと分からない。
// D: 3つを決めて撮影 → 出来た画像を見る → 足りなければ条件を変えて
//    撮り直す。正解は教えず、写り方で気づく。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";

const M = (n: string) => `${import.meta.env.BASE_URL}assets/medical/${n}.jpg`;

type Facing = "front" | "side";
type Range = "narrow" | "chest" | "belly";
type Breath = "hold" | "normal";

export default function XrayGame({ onComplete }: Q1GameProps) {
  const [facing, setFacing] = useState<Facing | null>(null);
  const [range, setRange] = useState<Range | null>(null);
  const [breath, setBreath] = useState<Breath | null>(null);
  const [shot, setShot] = useState<null | { img: string; problems: string[] }>(null);
  const [tries, setTries] = useState(0);

  const ready = facing && range && breath;

  const docs = [
    { id: "check", icon: "✅", title: "どこまで写っていればいい？",
      body: (<>
        <p>・肺の<strong>上のはしから下のはし</strong>まで入っている</p>
        <p>・<strong>左右の肺が両方</strong>写っている</p>
        <p>・<strong>背骨が中央</strong>にきている（からだがねじれていない）</p>
        <p>・息を止めて撮れていて、ぶれていない</p>
      </>) },
    { id: "how", icon: "🫁", title: "どうして息を止めるの？",
      body: <p>息を吸って止めると肺がふくらんで、中のようすが見えやすくなる。動くとぶれてしまう。</p> },
  ];

  const shoot = () => {
    const problems: string[] = [];
    if (facing === "side") problems.push("横向きだと、左右の肺が重なって見くらべにくい");
    if (range === "narrow") problems.push("範囲がせまくて、肺の下のほうが切れている");
    if (range === "belly") problems.push("おなかまで入っていて、肺が小さくしか写っていない");
    if (breath === "normal") problems.push("息を止めていないので、ぼんやりしている");
    const img =
      problems.length === 0 ? "xray_ok" : range === "narrow" ? "xray_a" : facing === "side" ? "xray_b" : "xray_c";
    setShot({ img: M(img), problems });
    setTries((t) => t + 1);
  };

  if (shot && shot.problems.length === 0) {
    return (
      <div className="game board-game">
        <div className="xray-view good">
          <img src={shot.img} alt="撮影した画像" />
          <span className="xray-cap">肺全体が、はっきり写った</span>
        </div>
        <p className="game-line center-line">
          外から見えなかった肺の中が、<strong>診断に使える画像</strong>になった。
          {tries > 1 && <><br />（{tries}回目でうまくいった）</>}
        </p>
        <button className="btn primary big" onClick={onComplete}>
          画像を医師へ送る
        </button>
      </div>
    );
  }

  const Row = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="pick-block">
      <span className="pick-title">{title}</span>
      <div className="pick-cards">{children}</div>
    </div>
  );

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">条件を決めて、撮ってみよう</span>
        <span className="task-sub">出来た画像を見て、足りなければ撮り直せる</span>
      </div>

      {shot && (
        <>
          <div className="xray-view">
            <img src={shot.img} alt="撮影した画像" />
            <span className="xray-cap">撮った画像</span>
          </div>
          <div className="sched-issues">
            {shot.problems.map((p) => <p key={p}>{p}</p>)}
          </div>
        </>
      )}

      <Row title="① からだの向き">
        <button className={`pick-choice ${facing === "front" ? "selected" : ""}`} onClick={() => { setFacing("front"); setShot(null); }}>
          <span className="pc-emoji">🧍</span><span className="pc-name">正面</span>
        </button>
        <button className={`pick-choice ${facing === "side" ? "selected" : ""}`} onClick={() => { setFacing("side"); setShot(null); }}>
          <span className="pc-emoji">🚶</span><span className="pc-name">横向き</span>
        </button>
      </Row>
      <Row title="② 撮影する範囲">
        <button className={`pick-choice ${range === "narrow" ? "selected" : ""}`} onClick={() => { setRange("narrow"); setShot(null); }}>
          <span className="pc-name">せまく</span><small>胸の上だけ</small>
        </button>
        <button className={`pick-choice ${range === "chest" ? "selected" : ""}`} onClick={() => { setRange("chest"); setShot(null); }}>
          <span className="pc-name">胸ぜんぶ</span><small>肺の上から下まで</small>
        </button>
        <button className={`pick-choice ${range === "belly" ? "selected" : ""}`} onClick={() => { setRange("belly"); setShot(null); }}>
          <span className="pc-name">広く</span><small>おなかまで</small>
        </button>
      </Row>
      <Row title="③ 息のタイミング">
        <button className={`pick-choice ${breath === "hold" ? "selected" : ""}`} onClick={() => { setBreath("hold"); setShot(null); }}>
          <span className="pc-emoji">🫁</span><span className="pc-name">吸って止める</span>
        </button>
        <button className={`pick-choice ${breath === "normal" ? "selected" : ""}`} onClick={() => { setBreath("normal"); setShot(null); }}>
          <span className="pc-emoji">💨</span><span className="pc-name">ふつうに呼吸</span>
        </button>
      </Row>

      <InfoCards cards={docs} label="こまったら見る資料" />

      <button className="btn primary big" disabled={!ready} onClick={shoot}>
        {ready ? (shot ? "▶ もう一度 撮影する" : "📷 撮影する") : "3つとも決めよう"}
      </button>
    </div>
  );
}
