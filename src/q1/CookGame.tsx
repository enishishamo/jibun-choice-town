// Q1: 給食調理員
// B: 500人分を安全に完成させる（工程表はチーフが事前に作成済み）。
// C: 作業工程表・衛生ルール・中心温度計・記録票。
// D: 「測る→基準と比べる→対応する→再確認する→記録する」。
//    どこを測るかは衛生ルールを読まないと選べない。
//    温度基準は「中心75℃以上・1分以上」に統一。
// E: 配缶→検食→教室→いただきます。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";

const A = (n: string) => `${import.meta.env.BASE_URL}assets/${n}.png`;

type Phase = "brief" | "chart" | "where" | "measure1" | "compare" | "measure2" | "record";

const SPOTS = [
  { id: "thin", label: "手前のうすい切り身", ok: false },
  { id: "middle", label: "まんなかの切り身", ok: false },
  { id: "thick", label: "いちばん厚い切り身", ok: true },
];

export default function CookGame({ experience, onComplete }: Q1GameProps) {
  const [phase, setPhase] = useState<Phase>("brief");
  const [note, setNote] = useState<string | null>(null);
  const [stuck, setStuck] = useState(false); // thermometer inserted (1st round)
  const [temps2, setTemps2] = useState<number[]>([]); // 2nd round: 3 points
  const [recorded, setRecorded] = useState(false);

  const docs = [
    {
      id: "chart",
      icon: "📋",
      title: "作業工程表（チーフ作成）",
      body: (
        <>
          <p>9:00 下処理 → 10:15 加熱調理 → <strong>11:20 中心温度の確認</strong> → 11:40 配缶 → 11:50 検食 → 12:15 給食</p>
          <p className="soft-note">工程表は事前に作られている。これを確認しながら動く。</p>
        </>
      ),
    },
    {
      id: "rule",
      icon: "🧼",
      title: "衛生ルール",
      body: (
        <>
          <p>加熱は<strong>中心75℃以上になってから、1分以上</strong>続けて確認する。</p>
          <p>温度は<strong>いちばん火が通りにくいところ</strong>（厚い切り身など）をえらんで、<strong>3か所以上</strong>はかる。</p>
          <p>確認した温度と時刻は記録票に残す。</p>
        </>
      ),
    },
    {
      id: "record",
      icon: "✍️",
      title: "記録票",
      body: (
        <>
          <p>中心温度の記録：（まだ記入なし）</p>
          <p className="soft-note">確認がすんだら、ここに記入する。</p>
        </>
      ),
    },
  ];

  if (phase === "brief") {
    return (
      <div className="game board-game">
        <img className="game-scene" src={experience.place.image} alt="給食室" />
        <div className="intro-monologue">
          <img src={A("char-cook")} alt="" />
          <div>
            <p>今日は500人分。オーブンでは焼き魚500切れを加熱中。</p>
            <p className="intro-q">安全に出せるかどうか、どうやって確かめるんだろう？</p>
          </div>
        </div>
        <button className="btn primary big" onClick={() => setPhase("chart")}>
          工程表をたしかめる
        </button>
      </div>
    );
  }

  const header = (
    <div className="clock-bar">
      <span className="clock-emoji">🕐</span>
      <span className="clock-now">{phase === "record" ? "11:35" : "11:20"}</span>
      <span className="clock-goal">工程表：中心温度の確認の時間</span>
    </div>
  );

  if (phase === "chart") {
    return (
      <div className="game board-game">
        {header}
        <InfoCards cards={docs} label="給食室の資料" />
        <p className="game-line">
          工程表によると、いまは<strong>中心温度の確認</strong>の時間。
          オーブンから焼き魚の天板が出てきた！
        </p>
        <button className="btn primary big" onClick={() => setPhase("where")}>
          🌡 中心温度計を手に取る
        </button>
      </div>
    );
  }

  if (phase === "where") {
    return (
      <div className="game board-game">
        {header}
        <InfoCards cards={docs} label="給食室の資料" />
        <p className="game-line">
          500切れぜんぶは、はかれない。<strong>どの魚をはかる？</strong>
        </p>
        {note && <p className="game-note">{note}</p>}
        <div className="stack">
          {SPOTS.map((s) => (
            <button
              key={s.id}
              className="btn choice"
              onClick={() => {
                if (!s.ok) {
                  setNote(
                    "うすいところが75℃でも、厚いところはまだかもしれない…。🧼衛生ルールに「どこをはかるか」が書いてあるよ。",
                  );
                  return;
                }
                setNote(null);
                setPhase("measure1");
              }}
            >
              🐟 {s.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === "measure1") {
    return (
      <div className="game board-game">
        {header}
        <div className="measure-box">
          {!stuck ? (
            <>
              <img src={A("tool-thermo")} alt="中心温度計" />
              <p className="game-line">いちばん厚い切り身の、まんなかへ…</p>
              <button className="btn primary big" onClick={() => setStuck(true)}>
                🌡 温度計をさす
              </button>
            </>
          ) : (
            <>
              <img src={A("tool-thermo")} alt="中心温度計" />
              <p className="temp bad">中心温度 62℃</p>
              <p className="game-line">…この温度って、出していいの？</p>
              <button className="btn primary big" onClick={() => setPhase("compare")}>
                🧼 衛生ルールの基準とくらべる
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (phase === "compare") {
    return (
      <div className="game board-game">
        {header}
        <div className="compare-box">
          <div className="compare-row">
            <span className="compare-label">いまの温度</span>
            <span className="compare-val bad">62℃</span>
          </div>
          <div className="compare-row">
            <span className="compare-label">基準（衛生ルール）</span>
            <span className="compare-val">中心75℃以上・1分以上</span>
          </div>
          <p className="game-line"><strong>まだ足りない！</strong>このままでは出せない。</p>
        </div>
        <button className="btn primary big" onClick={() => setPhase("measure2")}>
          オーブンで加熱を続ける
        </button>
      </div>
    );
  }

  if (phase === "measure2") {
    const RESULTS = [76, 77, 76];
    const done = temps2.length >= 3;
    return (
      <div className="game board-game">
        {header}
        <div className="measure-box">
          <p className="game-line">
            数分後。こんどはルールどおり、<strong>3か所</strong>はかろう。
          </p>
          <div className="spot-row">
            {RESULTS.map((t, i) => (
              <button
                key={i}
                className={`spot-fish ${temps2.length > i ? "measured" : ""}`}
                disabled={temps2.length !== i}
                onClick={() => setTemps2((arr) => [...arr, t])}
              >
                🐟
                <span className="spot-temp">{temps2.length > i ? `${t}℃` : "はかる"}</span>
              </button>
            ))}
          </div>
          {done && (
            <>
              <p className="temp good">3か所とも 75℃以上 ✓</p>
              <p className="game-line">このまま<strong>1分以上</strong>加熱を続けて…よし、基準クリア！</p>
            </>
          )}
        </div>
        {done && (
          <button className="btn primary big" onClick={() => setPhase("record")}>
            ✍️ 記録票に記入する
          </button>
        )}
      </div>
    );
  }

  // record
  return (
    <div className="game board-game">
      {header}
      <div className="record-sheet">
        <span className="doc-label">✍️ 中心温度 記録票</span>
        <div className="record-row"><span>料理</span><span>焼き魚（さば）</span></div>
        <div className="record-row"><span>時刻</span><span>11:35</span></div>
        <div className="record-row"><span>中心温度</span><span>76℃・77℃・76℃</span></div>
        <div className="record-row"><span>75℃以上で1分以上</span><span>{recorded ? "✓ 確認ずみ" : "─"}</span></div>
      </div>
      {!recorded ? (
        <button className="btn primary big" onClick={() => setRecorded(true)}>
          記入する
        </button>
      ) : (
        <>
          <p className="game-line center-line">
            記録もばっちり。あとで「ちゃんと確認したよ」と示せる大事な仕事。
          </p>
          <button className="btn primary big" onClick={onComplete}>
            配缶して、教室へ！
          </button>
        </>
      )}
    </div>
  );
}
