// Q1: 食品メーカーの「調達」 (gameType: sourcing_mix)
// B: いちご原料120kg（=20kg×6箱）を、来週までにそろえたい。
// C: 3社（価格・積める上限・届く日）— すべて常時表示、開閉なし。
// D: どの会社から何箱ずつ運ぶかを組み立てる（組み合わせ可）。
// E: 量・費用・届く日が、操作した瞬間から見える。
//
// 2026-09-13 (UX/Logic audit — full redesign per items ⑤/⑥-A of the audit
// request). AS-IS problems this replaces (both confirmed real bugs, see
// sourcingLogic.ts's header comment and factory/harness/gameplay-qa-
// sourcing.mjs for the proof):
//   1. LOGIC BUG: the old displayed budget (¥96,000) had ZERO simultaneously
//      valid solutions once the deadline was also respected (cheapest
//      in-time combo was ¥99,000) — a genuine "success solution = 0" defect
//      for anyone trying to also hit the shown budget.
//   2. LOGIC/DESIGN BUG: B社 could never be used AT ALL — any purchase from
//      it instantly failed the "0 late kg" rule, making it a pure trap with
//      no legitimate role.
//   3. UX BUG: 上限/届く日 were hidden behind a "＋くわしく" accordion — the
//      exact "read → memorize → close → compare" pattern this whole audit
//      pass is banning. Every supplier's price/cap/arrival-day is now
//      always-visible text on its own card; nothing needs to be opened.
//   4. UX BUG: outcome (足りない/間に合わない) was only revealed AFTER
//      pressing the commit button. The shelf below now fills LIVE as boxes
//      are added — the child sees "am I done yet" continuously, not just
//      after committing.
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import {
  SUPPLIERS, NEED_BOXES, DEADLINE_DAY, BUDGET, BOX_KG,
  totalBoxes, totalCost, lateBoxes, onTimeBoxes, isSuccess, isSingleSupplierHeavy, emptyOrder,
} from "./sourcingLogic";
import type { Order, Supplier } from "./sourcingLogic";

/** road/gate positions as a 0-100% scale across "today (day 0) .. day 8"
 * (one day of margin past the deadline so the gate/latest truck never sit
 * flush against the track's own edge). */
const ROAD_END_DAY = 8;
const dayPct = (day: number) => `${Math.min(100, (day / ROAD_END_DAY) * 100)}%`;

export default function SourcingGame({ onComplete }: Q1GameProps) {
  const [order, setOrder] = useState<Order>(emptyOrder());
  const [tried, setTried] = useState(false); // has the child pressed 「はこんでみる」at least once

  const boxes = totalBoxes(order);
  const cost = totalCost(order);
  const shelfFilled = Math.min(onTimeBoxes(order), NEED_BOXES); // live — updates as boxes are added, per §UX-BUG-4 above
  const stillOnRoad = lateBoxes(order); // always 0 with the current supplier numbers (see sourcingLogic.ts) — kept real, not hardcoded

  const change = (id: Supplier["id"], d: number) => {
    const s = SUPPLIERS.find((x) => x.id === id)!;
    setOrder((o) => ({ ...o, [id]: Math.max(0, Math.min(s.maxBoxes, o[id] + d)) }));
  };

  const success = isSuccess(order);

  if (success && tried) {
    const overBudget = cost > BUDGET;
    const heavy = isSingleSupplierHeavy(order);
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">いちご原料 {boxes}箱、そろった！</span>
          <div className="result-rows">
            <span className="rrow">
              <b>そろった量</b>
              <span>{boxes}箱／{NEED_BOXES}箱 ✓（{boxes * BOX_KG}kg）</span>
            </span>
            <span className="rrow">
              <b>材料費</b>
              <span className={overBudget ? "bad" : "good"}>
                {cost.toLocaleString()}円{overBudget ? "（目安より高め）" : "（目安内）"}
              </span>
            </span>
            <span className="rrow">
              <b>届く日</b>
              <span className="good">来週までに、全部間に合う ✓</span>
            </span>
          </div>
        </div>
        <p className="game-line soft center-line">
          {heavy
            ? "1社にまとめると安く済むこともあるけど、その会社が急に届けられなくなったら全部止まる。"
            : "そろえ方はひとつじゃない。何を大事にするかで、選び方が変わる。"}
        </p>
        <button className="btn primary big" onClick={onComplete}>
          この仕入れでいく！
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game sourcing-game">
      <div className="task-bar">
        <span className="task-now">いちご原料を、来週までに{NEED_BOXES}箱そろえよう</span>
        <span className="task-sub">1箱＝{BOX_KG}kg／費用の目安 {BUDGET.toLocaleString()}円</span>
      </div>

      {/* 給食室のたな — always visible, fills LIVE as boxes are added below.
         This is the "見る→触る→変わる" moment: no button press needed to
         see whether a choice is helping. */}
      <div className="shelf-box">
        <div className="shelf-head">
          <span>給食室のたな</span>
          <strong className={shelfFilled >= NEED_BOXES ? "good" : ""}>{shelfFilled} / {NEED_BOXES}箱</strong>
        </div>
        <div className="shelf-slots">
          {Array.from({ length: NEED_BOXES }, (_, i) => (
            <span key={i} className={`shelf-slot ${i < shelfFilled ? "filled" : ""}`} aria-hidden="true">📦</span>
          ))}
        </div>
        {stillOnRoad > 0 && (
          <p className="shelf-note">あと{stillOnRoad}箱は、来週までに間に合わず道の上…</p>
        )}
      </div>

      {/* 今週の道 — always visible: shows WHERE each supplier's truck sits
         relative to the day-7 deadline gate, without needing to open or
         read anything (§UX-BUG-3). */}
      <div className="road-box">
        <div className="road-track">
          <span className="road-today">今日</span>
          <span className="road-gate" style={{ left: dayPct(DEADLINE_DAY) }}>
            <span className="road-gate-flag">🚩</span>
            <span className="road-gate-label">来週</span>
          </span>
          {SUPPLIERS.map((s) => (
            <span key={s.id} className="road-truck" style={{ left: dayPct(s.arrivalDay) }}>
              <span className="road-truck-emoji">{s.emoji}</span>
              <span className="road-truck-day">{s.arrivalDay}日目</span>
            </span>
          ))}
        </div>
      </div>

      {/* 仕入先 — price / cap / arrival day are ALL plain always-visible
         text now, on every card, all the time; nothing is behind a toggle
         (§UX-BUG-3). Stacked full-width (not a 3-column grid) so the ±
         buttons can stay full 46px touch targets on a 375px screen — all 3
         are still on one screen with no open/close needed, which is the
         actual requirement (comparing without opening anything). */}
      <div className="supplier-list">
        {SUPPLIERS.map((s) => (
          <div key={s.id} className="supplier">
            <div className="supplier-head supplier-head-flat">
              <span className="sup-emoji">{s.emoji}</span>
              <span className="sup-name">{s.name}</span>
              <span className="sup-price">{s.pricePerBox.toLocaleString()}円／箱</span>
            </div>
            <div className="supplier-facts">
              <span>🗓 {s.arrivalDay}日目に届く</span>
              <span>📦 最大 {s.maxBoxes}箱まで</span>
            </div>
            <div className="supplier-buy">
              <button className="kg-btn" onClick={() => change(s.id, -1)} disabled={order[s.id] === 0} aria-label={`${s.name}を1箱減らす`}>
                −
              </button>
              <span className="kg-value">
                {order[s.id]}
                <small>箱</small>
              </span>
              <button className="kg-btn" onClick={() => change(s.id, 1)} disabled={order[s.id] >= s.maxBoxes} aria-label={`${s.name}を1箱増やす`}>
                ＋
              </button>
              {order[s.id] >= s.maxBoxes && <span className="kg-note">この会社の上限</span>}
            </div>
          </div>
        ))}
      </div>

      {/* 費用 — live total, always visible; budget is a soft "目安" line,
         never a hidden/hard condition. */}
      <div className="meter-box">
        <div className="meter-head">
          <span>材料費</span>
          <strong className={cost > BUDGET ? "bad" : ""}>{cost.toLocaleString()}円</strong>
        </div>
        <div className="mini-bar">
          <div
            className={`mini-fill ${cost > BUDGET ? "warn" : ""}`}
            style={{ width: `${Math.min(100, (cost / BUDGET) * 100)}%` }}
          />
        </div>
      </div>

      {tried && !success && (
        <div className="sched-issues">
          {boxes < NEED_BOXES && <p>まだ{NEED_BOXES - boxes}箱、足りない…。</p>}
          {stillOnRoad > 0 && <p>{stillOnRoad}箱分が、来週までに届かなかった…。</p>}
        </div>
      )}
      {!tried && boxes === 0 && (
        <p className="game-line soft">会社ごとの＋／−で、何箱ずつ運ぶかきめよう。たなの様子がすぐ変わるよ。</p>
      )}

      <button className="btn primary big" disabled={boxes === 0} onClick={() => setTried(true)}>
        {boxes === 0 ? "運ぶ箱をきめよう" : "▶ はこんでみる"}
      </button>
      {boxes > 0 && (
        <button className="btn ghost" onClick={() => { setOrder(emptyOrder()); setTried(false); }}>
          はじめからえらび直す
        </button>
      )}
    </div>
  );
}
