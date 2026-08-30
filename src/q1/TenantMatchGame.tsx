// Q1: 商店街の空き店舗対策に関わる仕事 (gameType: tenant_match)
// B: 空き店舗3つ・出店希望3組。だれをどの店に迎える？
// C: 空き店舗カルテ（家賃・水回り・所有者の意向メモ）／通りの業種ならび。
//    B物件の条件カードは意向メモを読まないと根拠をもって選べない。
// D: 希望者を店へ割り当て＋所有者に合う契約条件を提案 →「たしかめる」。
//    判定マトリクスは design.md v1.2 §1 の6パターン全網羅。
// Art: TODO(art) board-street.png 生成後にCSSカードをクロップ表示へ差し替え。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";

type ShopId = "A" | "B" | "C";
type GuestId = "haru" | "zakka" | "bread";
type CardId = "term" | "rentup" | "keep";

const GUESTS: { id: GuestId; emoji: string; name: string; want: string }[] = [
  { id: "haru", emoji: "🍚", name: "ハルさん（定食屋）", want: "厨房（水回り）が必要。家賃は月8万円まで" },
  { id: "zakka", emoji: "🪴", name: "雑貨屋を開きたい人", want: "水回りはいらない。商店街にない業種" },
  { id: "bread", emoji: "🥐", name: "パン屋を開きたい人", want: "商店街にすでに2軒ある業種" },
];

interface Shop {
  id: ShopId;
  emoji: string;
  name: string;
  facts: string[];
  memo?: string; // owner's intent memo (the key C for negotiation)
}
const SHOPS: Shop[] = [
  {
    id: "A",
    emoji: "👕",
    name: "元・洋品店",
    facts: ["せまい", "家賃 安い", "水回り なし", "所有者「どうぞ歓迎」"],
  },
  {
    id: "B",
    emoji: "🍜",
    name: "元・食堂",
    facts: ["給排水あり（厨房が作りやすい）", "家賃 ふつう"],
    memo:
      "大事にしてきた店だから、知らない人に「ずっと貸しっぱなし」になるのが不安。古い店だから、直してもらうのはかまわない。ただ、家賃を安くしすぎるのはいやだ。",
  },
  {
    id: "C",
    emoji: "👘",
    name: "元・呉服店",
    facts: ["広い", "所有者「代々の店。貸す気はない」"],
  },
];

// The street as it stands: what kinds of shops already exist (業種マップ).
const STREET: { emoji: string; label: string; shopId?: ShopId }[] = [
  { emoji: "🥐", label: "パン屋" },
  { emoji: "🏚", label: "空き店舗A", shopId: "A" },
  { emoji: "🥬", label: "八百屋" },
  { emoji: "🏚", label: "空き店舗B", shopId: "B" },
  { emoji: "🥐", label: "パン屋" },
  { emoji: "🏚", label: "空き店舗C", shopId: "C" },
];

const CARDS: { id: CardId; text: string }[] = [
  { id: "term", text: "期間を区切った契約にする（まずは3年。様子を見て更新）" },
  { id: "rentup", text: "家賃を少し上げるかわりに、改装は自由にしてもらう" },
  { id: "keep", text: "内装は大きく変えない約束にする" },
];

export default function TenantMatchGame({ onComplete }: Q1GameProps) {
  const [assign, setAssign] = useState<Partial<Record<ShopId, GuestId>>>({});
  const [bCard, setBCard] = useState<CardId | null>(null);
  const [selected, setSelected] = useState<GuestId | null>(null);
  const [karte, setKarte] = useState<ShopId | null>(null);
  const [dialogB, setDialogB] = useState(false);
  const [memoOpen, setMemoOpen] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [cleared, setCleared] = useState(false);

  const guestOf = (s: ShopId) => GUESTS.find((g) => g.id === assign[s]);

  const drop = (guest: GuestId, shop: ShopId) => {
    setNote(null);
    setSelected(null);
    if (shop === "C") {
      setNote("所有者さんに話を聞きに行った。「代々の店だから、貸す気はないんだ」…首はたてにふられなかった。ほかの店はどうだろう。");
      return;
    }
    if (shop === "B" && guest !== "haru") {
      // Bounce BEFORE the condition dialog (critic-review 2回目の実装注意).
      const g = GUESTS.find((x) => x.id === guest)!;
      setNote(`${g.name}は水回りを使わないお店。この物件のいちばんの持ち味が、いきてこないかも。`);
      return;
    }
    // A guest can only stand in one shop at a time.
    setAssign((a) => {
      const next = { ...a };
      for (const s of ["A", "B"] as ShopId[]) if (next[s] === guest) delete next[s];
      next[shop] = guest;
      return next;
    });
    if (shop === "B" && guest === "haru") {
      setBCard(null);
      setDialogB(true);
    }
  };

  const check = () => {
    setNote(null);
    const haruAt = (["A", "B"] as ShopId[]).find((s) => assign[s] === "haru");
    if (!haruAt) {
      setNote("ハルさんの行き先が、まだ決まっていない。今月中に決めたい、と言っていたよ。");
      return;
    }
    if (haruAt === "A") {
      setNote("厨房を一からつくると、改装のお金がかかりすぎる。ハルさんの予算では厳しそうだ。");
      return;
    }
    // haru is at B
    if (bCard === "keep") {
      setNote("所有者さん「うーん、わたしの心配はそこじゃないんだ」。それに、定食屋を開くなら厨房の工事がいるんじゃないかな。");
      return;
    }
    if (!bCard) {
      setDialogB(true);
      return;
    }
    if (!assign.A) {
      setNote("もう1枚のシャッターにも、開けたい人が来ている。組み合わせを考えてみよう。");
      return;
    }
    // success (2 solutions x A-business tradeoff)
    try {
      localStorage.setItem("jc.shop-opening.tenantChoice", assign.A);
    } catch { /* storage may be unavailable; the game still works */ }
    setCleared(true);
  };

  // ---------- E: which shutters open, and under which promise ----------
  if (cleared) {
    const aGuest = guestOf("A")!;
    const cardText = CARDS.find((c) => c.id === bCard)!.text;
    return (
      <div className="game board-game">
        <div className="street-row small">
          {STREET.map((s, i) => (
            <span key={i} className={`street-shop ${s.shopId && assign[s.shopId] ? "opened" : ""} ${s.shopId === "C" ? "closed" : ""}`}>
              {s.shopId && assign[s.shopId] ? GUESTS.find((g) => g.id === assign[s.shopId!])!.emoji : s.emoji}
            </span>
          ))}
        </div>
        <p className="game-line center-line">シャッターが、2枚開くことになった。</p>
        <div className="sched-issues ok-issues">
          <p>🍚 ハルさんは元・食堂と契約へ。約束は「{cardText}」。</p>
          {bCard === "rentup" && <p>そのぶん、ハルさんの毎月の家賃は少し重くなる。</p>}
          {aGuest.id === "zakka" ? (
            <p>🪴 元・洋品店には雑貨屋さん。商店街にない業種がふえて、通りを歩く人がふえそう。</p>
          ) : (
            <p>🥐 元・洋品店にはパン屋さん。開店はできたけど、これでパン屋が3軒。お客をとり合わないか、組合では心配の声も。</p>
          )}
        </div>
        <button className="btn primary big" onClick={onComplete}>
          通りを見わたす
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="mission-bar">
        <span className="mission-bar-title">3組のうち、だれをどの店に迎える？</span>
        <div className="mission-chips">
          <span className="mchip">空き店舗 3</span>
          <span className="mchip">希望者 3組</span>
        </div>
      </div>

      {/* the street: existing shops + vacant shutters (業種マップを兼ねる) */}
      <p className="game-line soft">🏘 いまの通り（空き店舗をタップするとカルテが開くよ）</p>
      <div className="street-row">
        {STREET.map((s, i) => {
          const guest = s.shopId ? guestOf(s.shopId) : undefined;
          return (
            <button
              key={i}
              className={`street-shop ${s.shopId ? "vacant" : ""} ${guest ? "assigned" : ""} ${selected && s.shopId ? "ready" : ""}`}
              onClick={() => {
                if (!s.shopId) return;
                if (selected) { drop(selected, s.shopId); return; }
                // tapping B while ハルさん stands there = renegotiate the terms
                if (s.shopId === "B" && assign.B === "haru") { setNote(null); setDialogB(true); return; }
                setKarte(s.shopId);
              }}
            >
              <span className="street-emoji">{guest ? guest.emoji : s.emoji}</span>
              <small>{s.shopId ? SHOPS.find((x) => x.id === s.shopId)!.name : s.label}</small>
            </button>
          );
        })}
      </div>

      {/* applicants */}
      <p className="game-line soft">えらんで、迎えたい店をタップしよう。</p>
      <div className="choice-row wrap">
        {GUESTS.map((g) => {
          const placed = (["A", "B"] as ShopId[]).find((s) => assign[s] === g.id);
          return (
            <button
              key={g.id}
              className={`choice-card ${selected === g.id ? "selected" : ""} ${placed ? "soft-done" : ""}`}
              onClick={() => setSelected(selected === g.id ? null : g.id)}
            >
              <span className="choice-emoji">{g.emoji}</span>
              <span className="choice-name">{g.name}</span>
              <small>{placed ? `→ ${SHOPS.find((x) => x.id === placed)!.name}` : g.want}</small>
            </button>
          );
        })}
      </div>

      {note && <div className="sched-issues"><p>{note}</p></div>}

      <div className="stack">
        <button className="btn primary big" onClick={check}>
          🤝 組み合わせをたしかめる
        </button>
        {(assign.A || assign.B) && (
          <button className="btn ghost" onClick={() => { setAssign({}); setBCard(null); setNote(null); }}>
            ぜんぶ外す
          </button>
        )}
      </div>

      {/* ---------- karte modal (C) ---------- */}
      {karte && (
        <div className="modal-veil" onClick={() => setKarte(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const s = SHOPS.find((x) => x.id === karte)!;
              return (
                <>
                  <p className="modal-title">{s.emoji} {s.name} のカルテ</p>
                  <ul className="karte-list">
                    {s.facts.map((f) => <li key={f}>{f}</li>)}
                  </ul>
                  {s.memo && (
                    <p className="karte-memo">🗣 所有者さんの話：「{s.memo}」</p>
                  )}
                  <button className="btn" onClick={() => setKarte(null)}>とじる</button>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ---------- B contract-condition dialog ---------- */}
      {dialogB && (
        <div className="modal-veil">
          <div className="modal-card">
            <p className="modal-title">🍜 元・食堂の所有者さんに、どんな条件を提案する？</p>
            {memoOpen && (
              <p className="karte-memo">🗣「{SHOPS[1].memo}」</p>
            )}
            <div className="stack">
              {CARDS.map((c) => (
                <button
                  key={c.id}
                  className={`btn card-line ${bCard === c.id ? "primary" : ""}`}
                  onClick={() => setBCard(c.id)}
                >
                  {c.text}
                </button>
              ))}
              <button className="btn ghost" onClick={() => setMemoOpen(true)}>
                🗣 もう一度、所有者さんの話を聞く
              </button>
              <button
                className="btn primary"
                disabled={!bCard}
                onClick={() => { setDialogB(false); setMemoOpen(false); }}
              >
                この条件で話してみる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
