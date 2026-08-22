// Q1: 栄養教諭・学校栄養職員 (gameType: drag_and_drop)
// B: 来月の献立の副菜「ほうれん草のごまあえ」が長雨で調達できない。
// D: 候補の料理をトレーへドラッグして入れかえると、栄養・予算・調達・
//    調理の状態がリアルタイムに変わる。成立する組み合わせは複数ある。
// C: 栄養基準・予算・旬調達・残食記録は「必要になったら開く」資料。
//    ×や△の理由は資料の中にしか書かれていない。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import { useDragDrop } from "./useDragDrop";

// 0=×, 1=△, 2=○, 3=◎
const G = ["×", "△", "○", "◎"];

interface SideDish {
  id: string;
  name: string;
  emoji: string;
  nutri: number;
  budget: number;
  supply: number;
  cook: number;
}

const ORIGINAL: SideDish = {
  id: "hourensou",
  name: "ほうれん草のごまあえ",
  emoji: "🥬",
  nutri: 3,
  budget: 2,
  supply: 0, // 長雨で調達できない
  cook: 3,
};

const CANDIDATES: SideDish[] = [
  { id: "betsusanchi", name: "ほうれん草（別の産地）", emoji: "🥬", nutri: 3, budget: 1, supply: 2, cook: 3 },
  { id: "komatsuna", name: "小松菜のごまあえ", emoji: "🥗", nutri: 3, budget: 3, supply: 3, cook: 3 },
  { id: "cabbage", name: "キャベツのおかかあえ", emoji: "🥦", nutri: 2, budget: 3, supply: 3, cook: 2 },
  { id: "potato", name: "フライドポテト", emoji: "🍟", nutri: 0, budget: 3, supply: 3, cook: 3 },
];

const ALL = [ORIGINAL, ...CANDIDATES];

export default function MenuGame({ onComplete }: Q1GameProps) {
  const [sideId, setSideId] = useState(ORIGINAL.id);
  const [note, setNote] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [selected, setSelected] = useState<string | null>(null); // tap fallback

  const side = ALL.find((d) => d.id === sideId)!;

  const swap = (itemId: string, zoneId: string) => {
    if (zoneId !== "side") return;
    setSideId(itemId);
    setSelected(null);
    setNote(null);
  };

  const { drag, startDrag, surfaceProps } = useDragDrop(swap, (id) => {
    setSelected(selected === id ? null : id);
    setNote(null);
  });

  const statuses = [
    { icon: "🥗", label: "栄養", v: side.nutri },
    { icon: "💴", label: "予算", v: side.budget },
    { icon: "🚚", label: "調達", v: side.supply },
    { icon: "🍳", label: "調理", v: side.cook },
  ];

  const docs = [
    {
      id: "nutri",
      icon: "🥗",
      title: "栄養の基準",
      body: (
        <>
          <p>給食1食で、エネルギーや鉄・カルシウムなどの目安が決められている。</p>
          <p>ほうれん草・小松菜などの<strong>青菜は鉄やカルシウムの大事なもと</strong>。ポテトに変えると、この日は基準に届かない。</p>
        </>
      ),
    },
    {
      id: "budget",
      icon: "💴",
      title: "予算",
      body: (
        <>
          <p>給食は1食ごとの材料費が決まっている。</p>
          <p>別の産地のほうれん草は、今は<strong>いつもの約1.5倍の値段</strong>（だから予算△）。小松菜・キャベツは安定。</p>
        </>
      ),
    },
    {
      id: "supply",
      icon: "🌸",
      title: "旬・調達の情報",
      body: (
        <>
          <p>いつものほうれん草は<strong>長雨で調達×</strong>。</p>
          <p>11月は<strong>小松菜（この町の地場野菜）・キャベツ</strong>がおいしくて手に入りやすい。</p>
        </>
      ),
    },
    {
      id: "record",
      icon: "🍽️",
      title: "残食記録",
      body: (
        <>
          <p>ポテト：人気でいつも完食。でも青菜がなくなる…</p>
          <p>キャベツのおかかあえ：前回けっこう好評。</p>
          <p>ごまあえ：少し残る日もあるが、大事な鉄のもと。</p>
        </>
      ),
    },
  ];

  if (confirmed) {
    return (
      <div className="game board-game">
        <div className="tray2 done">
          <span className="tray2-slot fixed">🍚 ごはん</span>
          <span className="tray2-slot fixed">🐟 さばの塩焼き</span>
          <span className="tray2-slot ok">{side.emoji} {side.name}</span>
          <span className="tray2-slot fixed">🥣 みそ汁</span>
        </div>
        <p className="game-line center-line">
          来月の献立、調整できた！<br />
          変わった注文が、農家さんや納入業者さんへ伝わっていく…
        </p>
        <button className="btn primary big" onClick={onComplete}>
          この献立でいく！
        </button>
      </div>
    );
  }

  const acceptable = side.supply >= 1 && side.nutri >= 1;

  return (
    <div className="game board-game" {...surfaceProps}>
      <div className="mission-bar">
        <span className="mission-bar-title">
          ⚠️ 副菜のほうれん草が調達できない！トレーの料理を入れかえよう
        </span>
        <div className="mission-chips">
          {statuses.map((s) => (
            <span key={s.label} className={`mchip ${s.v >= 2 ? "ok" : s.v === 1 ? "soft" : "bad"}`}>
              {s.icon} {s.label} {G[s.v]}
            </span>
          ))}
        </div>
      </div>

      <div className="tray2" data-drop-zone>
        <span className="tray2-slot fixed">🍚 ごはん</span>
        <span className="tray2-slot fixed">🐟 さばの塩焼き</span>
        <button
          className={`tray2-slot swap ${side.supply === 0 ? "trouble" : "ok"} ${drag || selected ? "ready" : ""}`}
          data-drop="side"
          onClick={() => {
            if (selected) swap(selected, "side");
          }}
        >
          <small>副菜（ここに入れかえ）</small>
          {side.emoji} {side.name}
          {side.supply === 0 && <small className="slot-warn">⚠ 調達できない！</small>}
        </button>
        <span className="tray2-slot fixed">🥣 みそ汁</span>
      </div>

      <div className="candidate-zone">
        <span className="doc-label">🍲 かわりの候補（トレーへドラッグ）</span>
        <div className="choice-row wrap">
          {CANDIDATES.filter((c) => c.id !== sideId).map((c) => (
            <button
              key={c.id}
              className={`choice-card drag-item ${selected === c.id ? "selected" : ""}`}
              onPointerDown={startDrag(c.id)}
            >
              <span className="choice-emoji">{c.emoji}</span>
              <span className="choice-name">{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {note && <p className="game-note">{note}</p>}

      <InfoCards cards={docs} label="こまったら見る資料" />

      <button
        className="btn primary big"
        onClick={() => {
          if (side.supply === 0) {
            setNote("まだ副菜が調達できないまま…。候補の料理をトレーにドラッグして入れかえよう。");
            return;
          }
          if (side.nutri === 0) {
            setNote("おいしそうだけど、なにか引っかかる…。🥗栄養の基準をひらいて確かめてみよう。");
            return;
          }
          setNote(null);
          setConfirmed(true);
        }}
      >
        これでいけるか確認する
      </button>

      {acceptable && (
        <p className="game-line soft">
          ちなみに、成立する組み合わせはひとつじゃない。何を大事にするかで変わるよ。
        </p>
      )}

      {drag && (
        <div className="drag-ghost" style={{ left: drag.x, top: drag.y }}>
          {ALL.find((d) => d.id === drag.id)?.emoji}
        </div>
      )}
    </div>
  );
}
