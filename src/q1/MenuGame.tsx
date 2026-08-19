// Q1 game: 栄養教諭 — build tomorrow's lunch for 500 kids the way a pro
// does: juggling nutrition, budget, allergy safety, season and leftover
// records at the same time. The tools (C) are not hint buttons — each one
// shows a different professional viewpoint on the tray being built (D).
// Mid-game, a planned ingredient fails to arrive and the child re-plans.
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";

const A = (n: string) => `${import.meta.env.BASE_URL}assets/${n}.png`;

type SlotId = "main" | "protein" | "side" | "soup";

interface Dish {
  id: string;
  name: string;
  emoji: string;
  cost: number; // yen per child
  veg: number; // 0-2
  protein: number; // 0-2
  allergen?: string; // e.g. 卵
  seasonal?: boolean;
  ingredient: string; // key ingredient (used by the delivery trouble)
  leftoverNote: string;
}

const SLOTS: { id: SlotId; name: string }[] = [
  { id: "main", name: "主食" },
  { id: "protein", name: "主菜" },
  { id: "side", name: "副菜" },
  { id: "soup", name: "汁物" },
];

const MENU: Record<SlotId, Dish[]> = {
  main: [
    { id: "rice", name: "ごはん", emoji: "🍚", cost: 40, veg: 0, protein: 0, ingredient: "お米", leftoverNote: "いつも安定の人気" },
    { id: "wakame", name: "わかめごはん", emoji: "🍙", cost: 45, veg: 1, protein: 0, ingredient: "わかめ", leftoverNote: "けっこう人気だった" },
    { id: "bread", name: "コッペパン", emoji: "🥖", cost: 45, veg: 0, protein: 0, ingredient: "小麦", leftoverNote: "少し残る日もある" },
  ],
  protein: [
    { id: "aji", name: "あじの塩焼き", emoji: "🐟", cost: 95, veg: 0, protein: 2, seasonal: true, ingredient: "あじ", leftoverNote: "骨があって少し残った" },
    { id: "karaage", name: "とりのからあげ", emoji: "🍗", cost: 85, veg: 0, protein: 2, ingredient: "とり肉", leftoverNote: "ほぼ完食！大人気" },
    { id: "tamago", name: "たまごやき", emoji: "🥚", cost: 55, veg: 0, protein: 1, allergen: "卵", ingredient: "卵", leftoverNote: "人気で安い定番" },
  ],
  side: [
    { id: "gomaae", name: "ほうれん草のごまあえ", emoji: "🥬", cost: 35, veg: 2, protein: 0, ingredient: "ほうれん草", leftoverNote: "少し残りがち…" },
    { id: "corn-salad", name: "とうもろこしサラダ", emoji: "🌽", cost: 55, veg: 2, protein: 0, seasonal: true, ingredient: "とうもろこし", leftoverNote: "旬の日はよく食べる" },
    { id: "potato", name: "フライドポテト", emoji: "🍟", cost: 55, veg: 0, protein: 0, ingredient: "じゃがいも", leftoverNote: "完食！でも野菜はとれない…" },
  ],
  soup: [
    { id: "miso", name: "具だくさんみそ汁", emoji: "🥣", cost: 45, veg: 2, protein: 1, ingredient: "とうふ・野菜", leftoverNote: "安定して食べてくれる" },
    { id: "corn-soup", name: "コーンスープ", emoji: "🌽", cost: 60, veg: 1, protein: 0, ingredient: "とうもろこし", leftoverNote: "大人気！でもちょっと高い" },
    { id: "natsuyasai", name: "夏野菜スープ", emoji: "🍅", cost: 50, veg: 2, protein: 0, seasonal: true, ingredient: "トマト・なす", leftoverNote: "彩りがよくて評判" },
  ],
};

const BUDGET = 250; // yen per child
const ALLERGY_TODAY = "卵";
const VEG_NEED = 3;
const PROTEIN_NEED = 2;

type Tray = Partial<Record<SlotId, Dish>>;

const totals = (tray: Tray) => {
  const dishes = Object.values(tray).filter(Boolean) as Dish[];
  return {
    cost: dishes.reduce((s, d) => s + d.cost, 0),
    veg: dishes.reduce((s, d) => s + d.veg, 0),
    protein: dishes.reduce((s, d) => s + d.protein, 0),
    allergyHits: dishes.filter((d) => d.allergen === ALLERGY_TODAY),
    seasonal: dishes.filter((d) => d.seasonal),
    full: SLOTS.every((s) => tray[s.id]),
  };
};

type Phase = "intro" | "board" | "trouble";

export default function MenuGame({ experience, onComplete }: Q1GameProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [openTool, setOpenTool] = useState<string | null>(null);
  const [tray, setTray] = useState<Tray>({});
  const [activeSlot, setActiveSlot] = useState<SlotId>("main");
  const [note, setNote] = useState<string | null>(null);
  const [goneDish, setGoneDish] = useState<Dish | null>(null); // the one that failed to arrive
  const [troubleDone, setTroubleDone] = useState(false);

  const t = totals(tray);

  // ---------- C: the professional's tools ----------
  if (phase === "intro") {
    return (
      <div className="game">
        <div className="intro-monologue">
          <img src={A("char-nutrition")} alt="" />
          <div>
            <p>500人分の献立って、好きな料理をならべるだけじゃないみたい。</p>
            <p className="intro-q">献立を考えるプロは、何を見ているんだろう？</p>
          </div>
        </div>
        <div className="tool-grid three">
          {experience.tools.map((tool) => (
            <button
              key={tool.id}
              className={`tool-card ${openTool === tool.id ? "open" : ""}`}
              onClick={() => setOpenTool(openTool === tool.id ? null : tool.id)}
            >
              <span className="tool-emoji">{tool.emoji}</span>
              <span className="tool-name">{tool.name}</span>
              {openTool === tool.id && <span className="tool-desc">{tool.desc}</span>}
            </button>
          ))}
        </div>
        <p className="game-line soft">この道具、ぜんぶ献立づくりで使うみたい…</p>
        <button className="btn primary big" onClick={() => setPhase("board")}>
          道具をかりて、献立づくりスタート！
        </button>
      </div>
    );
  }

  // ---------- trouble: the planned ingredient doesn't arrive ----------
  if (phase === "trouble" && goneDish) {
    return (
      <div className="game">
        <div className="trouble-card">
          <span className="trouble-flash">⚡ EVENT</span>
          <p className="trouble-title">
            畑から連絡！<br />
            予定していた「{goneDish.ingredient}」が届かない！
          </p>
          <p className="trouble-line">
            「{goneDish.name}」は明日は作れない…。<br />
            旬カレンダーや予算表を見ながら、代わりを考えよう。
          </p>
        </div>
        <button
          className="btn primary big"
          onClick={() => {
            setTray((tr) => {
              const next = { ...tr };
              for (const s of SLOTS) if (next[s.id]?.id === goneDish.id) delete next[s.id];
              return next;
            });
            setActiveSlot("side");
            setNote(null);
            setPhase("board");
          }}
        >
          献立を考え直す
        </button>
      </div>
    );
  }

  // ---------- D: the tray board ----------
  const dishAvailable = (d: Dish) => !goneDish || d.id !== goneDish.id;

  const missionChips = [
    { id: "count", label: "500人分", ok: t.full },
    { id: "budget", label: "予算内", ok: t.full && t.cost <= BUDGET },
    { id: "allergy", label: "アレルギー対応", ok: t.full && t.allergyHits.length === 0 },
    { id: "nutri", label: "必要な栄養", ok: t.full && t.veg >= VEG_NEED && t.protein >= PROTEIN_NEED },
    { id: "season", label: "季節の食材", ok: t.seasonal.length > 0, soft: true },
  ];

  const submit = () => {
    if (!t.full) return;
    if (t.allergyHits.length > 0) {
      setNote("待って、なにか引っかかる…。⚠️アレルギー表をたしかめてみよう。");
      setOpenTool(null);
      return;
    }
    if (t.cost > BUDGET) {
      setNote("おいしそう！でもお金が足りるかな…。💴予算表を見てみよう。");
      setOpenTool(null);
      return;
    }
    if (t.veg < VEG_NEED || t.protein < PROTEIN_NEED) {
      setNote("500人の体をつくる給食としては、なにかが足りないかも。🥗栄養チェックをのぞいてみよう。");
      setOpenTool(null);
      return;
    }
    if (!troubleDone) {
      // The tray works... and then reality happens (condition change).
      const target = tray.side ?? tray.protein;
      if (target) {
        setGoneDish(target);
        setTroubleDone(true);
        setPhase("trouble");
        return;
      }
    }
    onComplete();
  };

  const toolPanel = () => {
    switch (openTool) {
      case "nutri":
        return (
          <div className="tool-panel">
            <p>🥗 <strong>栄養チェック</strong></p>
            <p>{t.veg >= VEG_NEED ? "野菜はばっちり！" : `野菜がすくないかも（いま ${t.veg} / 目安 ${VEG_NEED}）`}</p>
            <p>{t.protein >= PROTEIN_NEED ? "たんぱく質もOK！" : "体をつくる、たんぱく質が足りないかも"}</p>
          </div>
        );
      case "budget":
        return (
          <div className="tool-panel">
            <p>💴 <strong>予算表</strong></p>
            <p>
              現在：<strong className={t.cost > BUDGET ? "bad" : ""}>{t.cost}円</strong> / 1人
              　予算：{BUDGET}円 / 1人
            </p>
            <div className="mini-bar">
              <div
                className={`mini-fill ${t.cost > BUDGET ? "over" : ""}`}
                style={{ width: `${Math.min(100, (t.cost / BUDGET) * 100)}%` }}
              />
            </div>
            {t.cost > BUDGET && <p className="bad">予算オーバー！どこか見直そう</p>}
          </div>
        );
      case "allergy":
        return (
          <div className="tool-panel">
            <p>⚠️ <strong>アレルギー表</strong></p>
            <p>明日は「{ALLERGY_TODAY}」アレルギーの子がいます。</p>
            {t.allergyHits.length > 0 ? (
              <p className="bad">「{t.allergyHits.map((d) => d.name).join("・")}」には{ALLERGY_TODAY}が入っている！</p>
            ) : (
              <p className="good">いまのトレーは、全員が安心して食べられる</p>
            )}
          </div>
        );
      case "season": {
        const all = SLOTS.flatMap((s) => MENU[s.id]).filter(dishAvailable);
        const seasonal = all.filter((d) => d.seasonal);
        return (
          <div className="tool-panel">
            <p>🌸 <strong>旬カレンダー（いまは夏）</strong></p>
            <p>旬の食材：{seasonal.map((d) => `${d.emoji}${d.ingredient}`).join("　")}</p>
            <p className="soft-note">旬はおいしくて、栄養たっぷり。ほうれん草は冬が旬。</p>
          </div>
        );
      }
      case "record": {
        const chosen = Object.values(tray).filter(Boolean) as Dish[];
        return (
          <div className="tool-panel">
            <p>🍽️ <strong>食べ残し記録</strong></p>
            {chosen.length === 0 ? (
              <p>トレーに料理をのせると、前回の記録が見られるよ。</p>
            ) : (
              chosen.map((d) => (
                <p key={d.id}>
                  {d.emoji} {d.name}：{d.leftoverNote}
                </p>
              ))
            )}
          </div>
        );
      }
      case "rule":
        return (
          <div className="tool-panel">
            <p>📋 <strong>学校給食の基準</strong></p>
            <p>エネルギー・栄養バランス・衛生・アレルギー対応…学校給食には決まりがある。</p>
            <p className="soft-note">この画面の上の「ミッション」が、その条件だよ。</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="game board-game">
      <div className="mission-bar">
        <span className="mission-bar-title">明日の給食を完成させよう！</span>
        <div className="mission-chips">
          {missionChips.map((m) => (
            <span key={m.id} className={`mchip ${m.ok ? "ok" : m.soft ? "soft" : ""}`}>
              {m.ok ? "✓" : m.soft ? "△" : "・"} {m.label}
            </span>
          ))}
        </div>
      </div>

      <div className="tray-board">
        <div className="tray-visual">
          {SLOTS.map((s) => {
            const d = tray[s.id];
            return (
              <button
                key={s.id}
                className={`tray-slot ${activeSlot === s.id ? "active" : ""} ${d ? "filled" : ""}`}
                onClick={() => {
                  setActiveSlot(s.id);
                  setNote(null);
                }}
              >
                <span className="slot-label">{s.name}</span>
                {d ? (
                  <>
                    <span className="slot-dish-emoji">{d.emoji}</span>
                    <span className="slot-dish-name">{d.name}</span>
                  </>
                ) : (
                  <span className="slot-empty">えらぶ</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="dish-picker">
        <span className="picker-title">「{SLOTS.find((s) => s.id === activeSlot)?.name}」をえらぼう</span>
        <div className="picker-row">
          {MENU[activeSlot].map((d) => {
            const gone = !dishAvailable(d);
            const selected = tray[activeSlot]?.id === d.id;
            return (
              <button
                key={d.id}
                className={`dish-card ${selected ? "selected" : ""} ${gone ? "gone" : ""}`}
                disabled={gone}
                onClick={() => {
                  setTray((tr) => ({ ...tr, [activeSlot]: d }));
                  setNote(null);
                  const idx = SLOTS.findIndex((s) => s.id === activeSlot);
                  const nextEmpty = SLOTS.slice(idx + 1).find((s) => !tray[s.id]);
                  if (nextEmpty) setActiveSlot(nextEmpty.id);
                }}
              >
                <span className="dish-emoji">{d.emoji}</span>
                <span className="dish-name">{d.name}</span>
                <span className="dish-cost">{d.cost}円 {d.seasonal && "🌸"}</span>
                {gone && <span className="dish-gone-label">届かない…</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="tool-dock">
        {experience.tools.map((tool) => (
          <button
            key={tool.id}
            className={`dock-btn ${openTool === tool.id ? "active" : ""}`}
            onClick={() => setOpenTool(openTool === tool.id ? null : tool.id)}
          >
            <span>{tool.emoji}</span>
            <small>{tool.name}</small>
          </button>
        ))}
      </div>
      {toolPanel()}

      {note && <p className="game-note">{note}</p>}

      <button className="btn primary big" disabled={!t.full} onClick={submit}>
        {t.full ? "これでいこう！" : "トレーをうめよう"}
      </button>
    </div>
  );
}
