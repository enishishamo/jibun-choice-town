// Q1: イベントを企画する仕事 (gameType: plan_mix)
// B: 会場も日にちも決まったが、中身が決まっていない。
// C: 来場者の想定・会場の条件・使える時間の3枚の資料。開かないと
//    「広場は火が使えない」「小さい子が多い」などが分からない。
// D: 候補の企画を選んで組み合わせる。時間と会場条件の中で成り立つ
//    組み合わせは複数ある（正解はひとつではない）。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";

const P = (n: string) => `${import.meta.env.BASE_URL}assets/event/${n}.png`;

interface Idea {
  id: string;
  name: string;
  img: string;
  minutes: number;
  /** 会場条件に引っかかる場合の理由（資料に書いてある） */
  blocked?: string;
  forKids: number; // 小さい子も楽しめる 0-2
  forAdults: number; // 大人も楽しめる 0-2
  note: string;
}

const IDEAS: Idea[] = [
  { id: "band", name: "バンド演奏", img: P("a_musician"), minutes: 60, forKids: 1, forAdults: 2, note: "音が大きい。ステージが必要。" },
  { id: "dance", name: "ダンスショー", img: P("a_dancer"), minutes: 40, forKids: 2, forAdults: 1, note: "見ていて楽しい。ステージが必要。" },
  { id: "magic", name: "マジックショー", img: P("a_magician"), minutes: 30, forKids: 2, forAdults: 2, note: "近くで見ると盛り上がる。" },
  { id: "mascot", name: "マスコットと写真", img: P("a_mascot"), minutes: 30, forKids: 2, forAdults: 0, note: "小さい子に人気。" },
  { id: "food", name: "キッチンカー", img: P("p_booth_food"), minutes: 0, forKids: 1, forAdults: 2, note: "ずっと出ている。休けいにもなる。" },
  { id: "goods", name: "手づくり市（物販）", img: P("p_booth_goods"), minutes: 0, forKids: 0, forAdults: 2, note: "ずっと出ている。" },
  {
    id: "fire",
    name: "キャンプファイヤー",
    img: P("p_flag"),
    minutes: 40,
    forKids: 1,
    forAdults: 1,
    blocked: "この広場は火を使えない決まりだった…",
    note: "夜にもりあがる。",
  },
];

const STAGE_MINUTES = 150; // ステージで使える時間（10:00-16:00のうち）

export default function PlanEventGame({ onComplete }: Q1GameProps) {
  const [picked, setPicked] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const chosen = IDEAS.filter((i) => picked.includes(i.id));
  const minutes = chosen.reduce((a, i) => a + i.minutes, 0);
  const kids = chosen.reduce((a, i) => a + i.forKids, 0);
  const adults = chosen.reduce((a, i) => a + i.forAdults, 0);
  const hasAllDay = chosen.some((i) => i.minutes === 0);

  const docs = [
    {
      id: "who",
      icon: "👨‍👩‍👧",
      title: "来てほしい人",
      body: (
        <>
          <p>近所の家族連れが中心。<strong>小さい子ども</strong>とその家族が多い見こみ。</p>
          <p>買い物ついでに立ち寄る<strong>大人</strong>も来る。</p>
        </>
      ),
    },
    {
      id: "place",
      icon: "🗺",
      title: "会場の条件",
      body: (
        <>
          <p>市民広場。ステージを1つ立てられる。</p>
          <p><strong>火を使うもの（たき火など）はできない</strong>決まり。</p>
          <p>キッチンカーは決められた場所に停められる。</p>
        </>
      ),
    },
    {
      id: "time",
      icon: "🕙",
      title: "使える時間",
      body: (
        <>
          <p>10:00〜16:00。準備と片づけを引くと、<strong>ステージで使えるのは合計{STAGE_MINUTES}分まで</strong>。</p>
          <p>ずっと出ているお店（キッチンカーなど）は、この時間に入らない。</p>
        </>
      ),
    },
  ];

  if (done) {
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">イベントの中身が決まった！</span>
          <div className="plan-list">
            {chosen.map((i) => (
              <span key={i.id} className="plan-chip">
                <img src={i.img} alt="" />
                {i.name}
                <small>{i.minutes > 0 ? `${i.minutes}分` : "ずっと"}</small>
              </span>
            ))}
          </div>
          <div className="result-rows">
            <span className="rrow"><b>ステージの時間</b><span className="good">{minutes}分／{STAGE_MINUTES}分</span></span>
            <span className="rrow"><b>小さい子も楽しめる</b><span>{"★".repeat(Math.min(3, Math.ceil(kids / 2))) || "—"}</span></span>
            <span className="rrow"><b>大人も楽しめる</b><span>{"★".repeat(Math.min(3, Math.ceil(adults / 2))) || "—"}</span></span>
          </div>
        </div>
        <p className="game-line soft center-line">
          組み合わせはひとつじゃない。だれに来てほしいかで、イベントの性格が変わる。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          このプランでいく！
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">やりたいことをえらんで、組み合わせよう</span>
        <span className="task-sub">
          ステージで使えるのは合計{STAGE_MINUTES}分まで／いま {minutes}分
        </span>
      </div>

      <div className="meter-box">
        <div className="meter-head">
          <span>ステージの時間</span>
          <strong className={minutes > STAGE_MINUTES ? "bad" : ""}>{minutes}分 / {STAGE_MINUTES}分</strong>
        </div>
        <div className="mini-bar">
          <div
            className={`mini-fill ${minutes > STAGE_MINUTES ? "over" : ""}`}
            style={{ width: `${Math.min(100, (minutes / STAGE_MINUTES) * 100)}%` }}
          />
        </div>
        <div className="plan-meters">
          <span className={kids >= 3 ? "ok" : ""}>👧 小さい子 {"●".repeat(Math.min(3, Math.ceil(kids / 2)))}{"○".repeat(Math.max(0, 3 - Math.ceil(kids / 2)))}</span>
          <span className={adults >= 3 ? "ok" : ""}>🧑 大人 {"●".repeat(Math.min(3, Math.ceil(adults / 2)))}{"○".repeat(Math.max(0, 3 - Math.ceil(adults / 2)))}</span>
        </div>
      </div>

      <div className="idea-grid">
        {IDEAS.map((i) => {
          const on = picked.includes(i.id);
          return (
            <button
              key={i.id}
              className={`idea-card ${on ? "selected" : ""}`}
              onClick={() => {
                if (i.blocked && !on) {
                  setNote(`${i.blocked} 🗺会場の条件を見てみよう。`);
                  return;
                }
                setNote(null);
                setPicked((p) => (on ? p.filter((x) => x !== i.id) : [...p, i.id]));
              }}
            >
              <img src={i.img} alt="" />
              <span className="idea-name">{i.name}</span>
              <small>{i.minutes > 0 ? `${i.minutes}分` : "ずっと"}</small>
              {on && <span className="idea-check">✓</span>}
            </button>
          );
        })}
      </div>

      {note && <p className="game-note">{note}</p>}

      <InfoCards cards={docs} label="こまったら見る資料" />

      <button
        className="btn primary big"
        disabled={picked.length === 0}
        onClick={() => {
          if (minutes > STAGE_MINUTES) {
            setNote(`ステージの時間が ${minutes}分。${STAGE_MINUTES}分をこえてしまう…🕙使える時間を見てみよう。`);
            return;
          }
          if (kids < 3) {
            setNote("家族連れが中心なのに、小さい子が楽しめるものが少ないかも…👨‍👩‍👧来てほしい人を見てみよう。");
            return;
          }
          if (!hasAllDay) {
            setNote("ステージだけだと、待ち時間に何もない…。ずっと出ているものもあるといいかも。");
            return;
          }
          setNote(null);
          setDone(true);
        }}
      >
        ▶ このプランでいけるか見る
      </button>
    </div>
  );
}
