// Q1: 広報・PR (gameType: reach_mix)
// B: イベントを考えたのに、まだだれも知らない。
// C: 「だれに届けたいか」の資料と、媒体ごとの届き方。媒体カードを
//    開かないと、どの相手に強いのかが分からない。
// D: 媒体を選ぶと、3つの相手グループへの届き方が同時に変わる。
//    「SNSかポスターか」ではなく、組み合わせで面をつくる。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";

const P = (n: string) => `${import.meta.env.BASE_URL}assets/event/${n}.png`;

type Group = "near" | "family" | "far";
const GROUPS: { id: Group; label: string; emoji: string; need: number }[] = [
  { id: "near", label: "近所の人", emoji: "🏠", need: 3 },
  { id: "family", label: "小さい子の家族", emoji: "👨‍👩‍👧", need: 3 },
  { id: "far", label: "少し遠くの人", emoji: "🚃", need: 2 },
];

interface Media {
  id: string;
  name: string;
  img: string;
  cost: number; // 用意する手間（1-3）
  reach: Record<Group, number>;
  desc: string;
}

// ※届き方の強弱は、子どもが違いを体感するための仮の設定。
const MEDIA: Media[] = [
  { id: "poster", name: "街のポスター", img: P("m_street"), cost: 2,
    reach: { near: 3, family: 1, far: 0 },
    desc: "駅前や商店街にはる。その道を通る人に強い。遠くの人には届きにくい。" },
  { id: "board", name: "学校・児童館の掲示", img: P("m_board"), cost: 1,
    reach: { near: 1, family: 3, far: 0 },
    desc: "子どもが通う場所にはる。家族に届きやすい。" },
  { id: "sns", name: "SNSの投稿", img: P("m_sns"), cost: 1,
    reach: { near: 1, family: 2, far: 3 },
    desc: "遠くの人にも広がる。ただし見ていない人には届かない。" },
  { id: "flyer", name: "チラシを配る", img: P("m_flyer"), cost: 3,
    reach: { near: 3, family: 2, far: 0 },
    desc: "手わたしで確実に届く。ただし人手と時間がかかる。" },
  { id: "web", name: "ウェブサイト", img: P("m_web"), cost: 2,
    reach: { near: 1, family: 1, far: 2 },
    desc: "くわしい情報を置ける。さがして来た人が見る。" },
  { id: "mail", name: "メールのお知らせ", img: P("m_mail"), cost: 1,
    reach: { near: 2, family: 1, far: 1 },
    desc: "前に来た人に届く。新しい人には届きにくい。" },
];

const BUDGET = 5; // 用意できる手間の合計

export default function PromoGame({ onComplete }: Q1GameProps) {
  const [picked, setPicked] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const chosen = MEDIA.filter((m) => picked.includes(m.id));
  const cost = chosen.reduce((a, m) => a + m.cost, 0);
  const reach = (g: Group) => chosen.reduce((a, m) => a + m.reach[g], 0);

  const docs = [
    {
      id: "who",
      icon: "🎯",
      title: "だれに届けたい？",
      body: (
        <>
          <p>🏠 <strong>近所の人</strong>：当日ふらっと来られる。いちばん来てほしい。</p>
          <p>👨‍👩‍👧 <strong>小さい子の家族</strong>：今回のイベントの中心。</p>
          <p>🚃 <strong>少し遠くの人</strong>：来られたらうれしい。</p>
        </>
      ),
    },
    {
      id: "limit",
      icon: "🧰",
      title: "用意できる手間",
      body: <p>準備できる人と時間はかぎられている。<strong>手間の合計 {BUDGET} まで</strong>。</p>,
    },
  ];

  if (done) {
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">イベントのことが、届きはじめた！</span>
          <div className="reach-rows">
            {GROUPS.map((g) => (
              <span key={g.id} className="reach-row">
                <b>{g.emoji} {g.label}</b>
                <span className="reach-bar">
                  <span className="reach-fill" style={{ width: `${Math.min(100, (reach(g.id) / 5) * 100)}%` }} />
                </span>
              </span>
            ))}
          </div>
          <div className="plan-list">
            {chosen.map((m) => (
              <span key={m.id} className="plan-chip">
                <img src={m.img} alt="" />
                {m.name}
              </span>
            ))}
          </div>
        </div>
        <p className="game-line soft center-line">
          たくさん届けばいいわけじゃない。来てほしい人に届いたかどうか。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          この方法でいく！
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">届けたい人に届く方法をえらぼう</span>
        <span className="task-sub">手間の合計 {cost} / {BUDGET}（カードを開くと、どの人に強いか分かる）</span>
      </div>

      {/* live reach */}
      <div className="meter-box">
        {GROUPS.map((g) => {
          const v = reach(g.id);
          return (
            <div key={g.id} className="reach-live">
              <span className={v >= g.need ? "ok" : ""}>{g.emoji} {g.label}</span>
              <span className="reach-bar">
                <span
                  className={`reach-fill ${v >= g.need ? "enough" : ""}`}
                  style={{ width: `${Math.min(100, (v / 5) * 100)}%` }}
                />
              </span>
            </div>
          );
        })}
      </div>

      <div className="media-grid">
        {MEDIA.map((m) => {
          const on = picked.includes(m.id);
          const isOpen = open === m.id;
          return (
            <div key={m.id} className={`media-card ${on ? "selected" : ""}`}>
              <button
                className="media-main"
                onClick={() => {
                  setNote(null);
                  setPicked((p) => (on ? p.filter((x) => x !== m.id) : [...p, m.id]));
                }}
              >
                <img src={m.img} alt="" />
                <span className="media-name">{m.name}</span>
                <small>手間 {m.cost}</small>
                {on && <span className="idea-check">✓</span>}
              </button>
              <button className="media-more" onClick={() => setOpen(isOpen ? null : m.id)}>
                {isOpen ? "− とじる" : "+ どんな人に届く？"}
              </button>
              {isOpen && (
                <div className="media-detail">
                  <p>{m.desc}</p>
                  <p className="soft-note">
                    {GROUPS.map((g) => `${g.emoji}${"●".repeat(m.reach[g.id])}${"○".repeat(3 - m.reach[g.id])}`).join("　")}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {note && <p className="game-note">{note}</p>}
      <InfoCards cards={docs} label="こまったら見る資料" />

      <button
        className="btn primary big"
        disabled={picked.length === 0}
        onClick={() => {
          if (cost > BUDGET) {
            setNote(`手間が ${cost}。用意できるのは ${BUDGET} まで…🧰資料を見てみよう。`);
            return;
          }
          const short = GROUPS.filter((g) => reach(g.id) < g.need);
          if (short.length > 0) {
            setNote(`${short.map((g) => g.label).join("と")}に、まだあまり届いていない…。カードを開いて、その人に強い方法をさがそう。`);
            return;
          }
          setNote(null);
          setDone(true);
        }}
      >
        ▶ この方法で知らせてみる
      </button>
    </div>
  );
}
