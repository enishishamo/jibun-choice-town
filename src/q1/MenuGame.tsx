// Q1: 栄養教諭・学校栄養職員
// B: 来月使う予定のほうれん草が天候の影響で不足しそう。
// C: 献立表・栄養基準・価格・旬地場・調理場の資料（中身が判断材料）。
// D: 資料を読むと対応案が思い浮かぶ（=C閲覧で案が解放）。案ごとに
//    栄養・予算・地場・調理のバランスが違い、成立する解は複数ある。
// E: 食材が決まり、注文が農家・納入業者へつながる。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";

interface Plan {
  id: string;
  fromDoc: string; // which document sparks this idea
  title: string;
  detail: string;
  evals: { label: string; grade: "◎" | "○" | "△" }[];
  followUp: string; // what happens next if chosen
}

const PLANS: Plan[] = [
  {
    id: "same-veg",
    fromDoc: "price",
    title: "案：別の産地からほうれん草を確保する",
    detail: "献立はそのまま。ただし今は値段が上がっている。",
    evals: [
      { label: "献立どおり", grade: "◎" },
      { label: "栄養", grade: "◎" },
      { label: "予算", grade: "△" },
      { label: "地場", grade: "△" },
    ],
    followUp: "納入業者さんに、別の産地のほうれん草をさがしてもらう。",
  },
  {
    id: "swap-veg",
    fromDoc: "season",
    title: "案：地場の小松菜に変更する",
    detail: "同じ青菜のなかま。ごまあえも同じ作り方でOK。",
    evals: [
      { label: "栄養", grade: "◎" },
      { label: "予算", grade: "◎" },
      { label: "地場", grade: "◎" },
      { label: "調理", grade: "◎" },
    ],
    followUp: "この町の農家さんに、小松菜を注文する。",
  },
  {
    id: "swap-dish",
    fromDoc: "kitchen",
    title: "案：料理ごと、旬のキャベツの料理に変更する",
    detail: "安くて旬。ただし作業が変わるので調理場と相談が必要。",
    evals: [
      { label: "予算", grade: "◎" },
      { label: "旬", grade: "◎" },
      { label: "栄養", grade: "○" },
      { label: "調理", grade: "△" },
    ],
    followUp: "調理場のチーフと作業を確認して、キャベツを注文する。",
  },
];

type Phase = "brief" | "board" | "confirm";

export default function MenuGame({ onComplete }: Q1GameProps) {
  const [phase, setPhase] = useState<Phase>("brief");
  const [opened, setOpened] = useState<string[]>([]);
  const [picked, setPicked] = useState<Plan | null>(null);

  const markOpened = (id: string) =>
    setOpened((o) => (o.includes(id) ? o : [...o, id]));

  const unlockedPlans = PLANS.filter((p) => opened.includes(p.fromDoc));

  const docs = [
    {
      id: "menu",
      icon: "📋",
      title: "来月の献立（計画ずみ）",
      body: (
        <>
          <p>11月の献立（ある日）：</p>
          <p>🍚 ごはん ／ 🐟 さばの塩焼き ／ 🥬 <strong>ほうれん草のごまあえ</strong> ／ 🥣 具だくさんみそ汁</p>
          <p className="soft-note">献立は1か月以上前に計画してある。</p>
        </>
      ),
    },
    {
      id: "nutri",
      icon: "🥗",
      title: "栄養の基準",
      body: (
        <>
          <p>給食1食で、エネルギーや鉄・カルシウムなどの目安が決められている。</p>
          <p>ほうれん草や小松菜などの<strong>青菜は、鉄やカルシウムの大事なもと</strong>。減らすなら代わりが必要。</p>
        </>
      ),
    },
    {
      id: "price",
      icon: "💴",
      title: "食材と価格",
      body: (
        <>
          <p>ほうれん草：いつもの約1.5倍に値上がり中（長雨で不作）</p>
          <p>小松菜（地場）：値段は安定。手に入りやすい</p>
          <p>キャベツ：今は安い</p>
          <p className="soft-note">※価格は市場の状況で毎週変わる。</p>
        </>
      ),
    },
    {
      id: "season",
      icon: "🌸",
      title: "旬・地場の情報",
      body: (
        <>
          <p>11月においしい野菜：<strong>小松菜・キャベツ・だいこん</strong> など。</p>
          <p>小松菜は<strong>この町の農家さんも育てている</strong>（地場食材）。</p>
          <p>ほうれん草も冬が旬だが、今年は長雨のえいきょうで少ない。</p>
        </>
      ),
    },
    {
      id: "kitchen",
      icon: "🍳",
      title: "調理場の情報",
      body: (
        <>
          <p>「ごまあえ」は青菜をゆでてあえる料理。<strong>小松菜でも同じ作り方でOK</strong>。</p>
          <p>料理そのものを変えるときは、作業の流れや設備を調理場と確認する必要がある。</p>
        </>
      ),
    },
  ];

  if (phase === "brief") {
    return (
      <div className="game board-game">
        <div className="trouble-card">
          <span className="trouble-flash">📞 産地から連絡</span>
          <p className="trouble-title">
            「長雨のえいきょうで、来月分の<br />ほうれん草が少なくなりそうです。<br />値段も上がりそうです…」
          </p>
          <p className="trouble-line">
            来月の献立には「ほうれん草のごまあえ」がある。<br />どう調整する？
          </p>
        </div>
        <button className="btn primary big" onClick={() => setPhase("board")}>
          資料を見て考える
        </button>
      </div>
    );
  }

  if (phase === "confirm" && picked) {
    return (
      <div className="game board-game">
        <div className="plan-card chosen">
          <span className="plan-title">{picked.title}</span>
          <div className="plan-evals">
            {picked.evals.map((e) => (
              <span key={e.label} className={`eval-chip g${e.grade === "◎" ? 2 : e.grade === "○" ? 1 : 0}`}>
                {e.label} {e.grade}
              </span>
            ))}
          </div>
          <p className="plan-follow">{picked.followUp}</p>
        </div>
        <p className="game-line soft">
          どの案も「まちがい」じゃない。何を大事にするかで答えが変わるのが、この仕事。
        </p>
        <div className="stack">
          <button className="btn primary big" onClick={onComplete}>
            この案でいく！
          </button>
          <button className="btn ghost" onClick={() => { setPicked(null); setPhase("board"); }}>
            やっぱり考え直す
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="mission-bar">
        <span className="mission-bar-title">ほうれん草が足りない！どう調整する？</span>
        <div className="mission-chips">
          <span className={`mchip ${opened.length >= 2 ? "ok" : ""}`}>
            {opened.length >= 2 ? "✓" : "・"} 資料を読む（{Math.min(opened.length, 2)}/2）
          </span>
          <span className={`mchip ${picked ? "ok" : ""}`}>・ 案を決める</span>
        </div>
      </div>

      <InfoCards cards={docs} onOpen={markOpened} />

      <div className="plan-zone">
        <span className="doc-label">💡 思いついた案</span>
        {unlockedPlans.length === 0 && (
          <p className="plan-hint">
            まだ案が思いつかない…。まずは資料をひらいて、状況をつかもう。
          </p>
        )}
        {unlockedPlans.map((p) => (
          <button
            key={p.id}
            className="plan-card"
            onClick={() => {
              setPicked(p);
              setPhase("confirm");
            }}
          >
            <span className="plan-title">{p.title}</span>
            <span className="plan-detail">{p.detail}</span>
          </button>
        ))}
        {unlockedPlans.length > 0 && unlockedPlans.length < PLANS.length && (
          <p className="plan-hint">ほかの資料を読むと、べつの案も思いつくかも。</p>
        )}
      </div>
    </div>
  );
}
