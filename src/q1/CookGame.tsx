// Q1: 給食調理員 (gameType: inspect_and_measure)
// B: 工程表（事前作成ずみ）にそって、500人分を安全に完成させる。
// D: 道具主導。子どもが自分で温度計を手に取り、魚のどこを測るか選び、
//    基準（中心75℃以上・1分以上）と見比べ、オーブンを操作して加熱を
//    続け、もう一度測って、記録票に残す。
//    「次へ」ではなく道具の操作でしか進まない。
//    途中、温度計の器具衛生（二次汚染への気づき）を1つ入れる。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";

type SpotId = "thin" | "middle" | "thick";
const SPOTS: { id: SpotId; label: string }[] = [
  { id: "thin", label: "うすい切り身" },
  { id: "middle", label: "ふつうの切り身" },
  { id: "thick", label: "いちばん厚い切り身" },
];
// round1: 厚いところがまだ低い / round2: 追加加熱後
const TEMPS: Record<1 | 2, Record<SpotId, number>> = {
  1: { thin: 76, middle: 68, thick: 62 },
  2: { thin: 82, middle: 78, thick: 76 },
};

export default function CookGame({ onComplete }: Q1GameProps) {
  const [holdThermo, setHoldThermo] = useState(false);
  const [round, setRound] = useState<1 | 2>(1);
  const [measured, setMeasured] = useState<Record<SpotId, number | null>>({
    thin: null,
    middle: null,
    thick: null,
  });
  const [note, setNote] = useState<string | null>(null);
  const [heated, setHeated] = useState(false);
  const [sanitizeAsk, setSanitizeAsk] = useState(false);
  const [sanitized, setSanitized] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [recorded, setRecorded] = useState(false);

  const docs = [
    {
      id: "chart",
      icon: "📋",
      title: "作業工程表（チーフ作成）",
      body: (
        <>
          <p>9:00 下処理 → 10:15 加熱調理 → <strong>11:20 中心温度の確認</strong> → 11:40 配缶 → 11:50 検食</p>
          <p className="soft-note">工程表は事前に作られている。確認しながら動く。</p>
        </>
      ),
    },
    {
      id: "rule",
      icon: "🧼",
      title: "衛生ルール",
      body: (
        <>
          <p>加熱は<strong>中心75℃以上になってから、1分以上</strong>。</p>
          <p><strong>いちばん火が通りにくいところ</strong>（厚い切り身など）をふくめて<strong>3か所以上</strong>はかる。</p>
          <p>温度計などの器具は、使うたびに<strong>アルコールで消毒</strong>する。</p>
          <p>確認した温度と時刻は記録票へ。</p>
        </>
      ),
    },
  ];

  const measure = (spot: SpotId) => {
    if (!holdThermo) {
      setNote("それには道具がいる。下の道具から、どれを使う？");
      return;
    }
    if (round === 2 && !sanitized && !sanitizeAsk) {
      // one hygiene beat before re-measuring (二次汚染への気づき)
      setSanitizeAsk(true);
      setNote(null);
      return;
    }
    setMeasured((m) => ({ ...m, [spot]: TEMPS[round][spot] }));
    setNote(null);
  };

  const allMeasured = SPOTS.every((s) => measured[s.id] !== null);
  const minTemp = Math.min(...SPOTS.map((s) => measured[s.id] ?? 999));
  const anyMeasured = SPOTS.some((s) => measured[s.id] !== null);
  const thickLow = measured.thick !== null && measured.thick < 75;
  const round2ok = round === 2 && allMeasured && minTemp >= 75;

  const openSheet = () => {
    if (round === 1 || !allMeasured) {
      setNote(
        "記録の前に…🧼衛生ルールを見てみよう。「厚いところをふくめて3か所以上」「75℃以上・1分以上」。まだそろってる？",
      );
      return;
    }
    if (!round2ok) return;
    setSheetOpen(true);
    setNote(null);
  };

  if (sheetOpen) {
    return (
      <div className="game board-game">
        <div className="clock-bar">
          <span className="clock-emoji">🕐</span>
          <span className="clock-now">11:36</span>
          <span className="clock-goal">工程表どおり、あとは配缶へ</span>
        </div>
        <div className="record-sheet">
          <span className="doc-label">✍️ 中心温度 記録票</span>
          <div className="record-row"><span>料理</span><span>焼き魚（さば）</span></div>
          <div className="record-row"><span>時刻</span><span>11:35</span></div>
          <div className="record-row"><span>中心温度（3か所）</span><span>82℃・78℃・76℃</span></div>
          <div className="record-row"><span>75℃以上・1分以上</span><span>{recorded ? "✓ 確認ずみ" : "─"}</span></div>
        </div>
        {!recorded ? (
          <button className="btn primary big" onClick={() => setRecorded(true)}>
            記入する
          </button>
        ) : (
          <>
            <p className="game-line center-line">
              「ちゃんと確認したよ」をあとで示せる、大事な記録。
            </p>
            <button className="btn primary big" onClick={onComplete}>
              配缶して、検食して、教室へ！
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="clock-bar">
        <span className="clock-emoji">🕐</span>
        <span className="clock-now">{round === 1 ? "11:20" : "11:32"}</span>
        <span className="clock-goal">工程表：中心温度の確認の時間</span>
      </div>

      {/* the oven with fish — the game board */}
      <div className="oven-panel">
        <span className="doc-label">
          🔥 オーブンから焼き魚500切れの天板が出てきた
          {round === 2 && "（追加加熱ずみ）"}
        </span>
        <div className="spot-row">
          {SPOTS.map((s) => (
            <button
              key={s.id}
              className={`spot-fish ${measured[s.id] !== null ? (measured[s.id]! >= 75 ? "measured" : "lowtemp") : ""} ${holdThermo ? "aim" : ""}`}
              onClick={() => measure(s.id)}
            >
              🐟
              <span className="spot-temp">
                {measured[s.id] !== null ? `${measured[s.id]}℃` : s.label}
              </span>
            </button>
          ))}
        </div>
        {thickLow && round === 1 && (
          <p className="game-line">
            62℃…この数字、出していいのかな？🧼衛生ルールとくらべてみよう。
          </p>
        )}
        {round2ok && (
          <p className="temp good">3か所とも75℃以上 ✓ このまま1分以上加熱を続けて…クリア！</p>
        )}
      </div>

      {sanitizeAsk && !sanitized && (
        <div className="alert-box slim">
          <span className="big-emoji">🌡</span>
          <p>もう一度はかる前に…さっき生っぽい魚にふれた温度計、そのまま使う？</p>
        </div>
      )}
      {sanitizeAsk && !sanitized && (
        <div className="choice-row">
          <button
            className="choice-card"
            onClick={() => setNote("ちょっと待って！🧼衛生ルールには「器具は使うたびにアルコールで消毒」とある。菌をつけないためだ。")}
          >
            <span className="choice-name">そのまま使う</span>
          </button>
          <button
            className="choice-card"
            onClick={() => {
              setSanitized(true);
              setSanitizeAsk(false);
              setNote(null);
            }}
          >
            <span className="choice-name">🧴 アルコールでふいてから</span>
          </button>
        </div>
      )}

      {note && <p className="game-note">{note}</p>}

      {/* tools — the child chooses what to use */}
      <div className="tool-dock">
        <button
          className={`dock-btn big-dock ${holdThermo ? "active" : ""}`}
          onClick={() => {
            setHoldThermo(!holdThermo);
            setNote(holdThermo ? null : "🌡温度計を持った。魚のどこをはかる？");
          }}
        >
          <span>🌡</span>
          <small>中心温度計</small>
        </button>
        <button
          className="dock-btn big-dock"
          onClick={() => {
            if (!anyMeasured) {
              setNote("まずは今の温度をたしかめてから。");
              return;
            }
            if (round === 2) {
              setNote("もう追加加熱ずみ。もう一度はかって確認しよう。");
              return;
            }
            setHeated(true);
            setRound(2);
            setMeasured({ thin: null, middle: null, thick: null });
            setNote("⏱ 6分追加加熱した。ルールどおり、もう一度たしかめよう。");
          }}
        >
          <span>🔥</span>
          <small>オーブン：加熱を続ける</small>
        </button>
        <button className={`dock-btn big-dock ${round2ok ? "pulse" : ""}`} onClick={openSheet}>
          <span>✍️</span>
          <small>記録票</small>
        </button>
      </div>

      <InfoCards cards={docs} label="こまったら見る資料" />
      {heated && round === 2 && !allMeasured && (
        <p className="game-line soft">🌡でもう一度、3か所ぜんぶはかろう。</p>
      )}
    </div>
  );
}
