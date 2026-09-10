// Q1: ホテル・旅館の団体受入担当 (gameType: hotel_receive)
// B: 修学旅行の団体が到着する日。花組・月組・星組の3つの班それぞれについて、提示された部屋の定員が
//    班の人数に足りているかを確認し、アレルギー事前調査票を見てメンバーのうち実際に個別対応食が
//    必要な人だけを選び、1班ずつチェックインさせる。
// C: 班ごとの人数データ、提示された部屋タイプ（定員入り）、メンバーごとのアレルギー事前調査票
//    （7大アレルギー品目ごとの除去要否）。詳細はhotelReceiveLogic.ts。
// D: 部屋の判定（この部屋でよい／別の部屋が必要）と、個別対応食が必要なメンバーの選択を、班ごとに
//    1回のコミットで確定する（同一班内のやり直しはない）。
//
// 2026-09-10 (Q1 Autonomous Factory, legacy-hotel-receive rebuild, t1-check-in-per-group): 旧実装は
// 部屋グリッドへのドラッグ配置に無コストの何度でもやり直しがあり（reverse audit: brute_force）、
// 月組の「バス酔いしやすく到着後すぐ休ませたい」というデータが勝利条件で一切使われない装飾データ
// だった。research.md（jc-researcher調査）で「休養ニーズ→部屋の位置」という因果関係が宿泊業界で
// 確認できなかったため、この因果関係を発明せず、判断要素から除外した（旧実装のBANDS.noteに残る
// 「乗り物酔いしやすい」という記述はflavor textとして他ゲーム（安全計画・バス運行）との継続性の
// ために残るが、この宿ゲームの勝利条件では一切使わない）。新実装は、提示された部屋の定員充足を
// 確認する検証課題（design review r1 BLOCKER是正: 「定員完全一致のみ正解」という研究が裏付けない
// 規則を排除）と、メンバー個人単位でアレルギー該当者を特定する判断（design review r1 BLOCKER是正:
// 実在する個人単位の調査票の粒度に合わせた）の2つを、班ごとに1回のコミットで確定する
// （design-sim.mjs参照、design review r2 PASS 88）。失敗時は同じデータを再提示する非採点の振り返り
// 選択を挟み、Q1 First-Play Standard Gate G「考え直す余地」に対応する（この振り返りは結果を一切
// 変えない）。
//
// impl review r1 HIGH是正 (IMPLEMENTATION_FLOW_DIVERGENCE): game_spec_v1.jsonのinitial_visual_state
// は「3枚の班カード（固定表示、それぞれ現在の状態を示すアイコン付き）」を要求しており、班を1つずつ
// 順番に切り替える一問一答式のウィザードではなく、3班のカードが常に画面に並び、班ごとのコミットで
// その班のアイコンが即座に結果へ変わる構成を意図していた。旧実装（このファイルのv1）は1班ずつしか
// 表示せず、コミット後に結果を示さずに次の班へ無言で切り替えていたため、この仕様と乖離していた。
// v2で3班同時表示（各班が自分の開示ゲート・判定・選択・コミットボタンを独立して持つ）に修正し、
// コミット直後にその班のアイコンが完了／まだできない状態へ即座に変わることを確認した。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import {
  ALLERGEN_LABELS,
  GROUP_IDS,
  GROUP_LABELS,
  MEMBER_LABELS,
  ROOM_LABELS,
  groupWin,
  newSession,
  sessionWin,
  type GroupId,
  type GroupPick,
  type Session,
} from "./hotelReceiveLogic";

type CardId = "size" | "allergy";

interface GroupUI {
  openCards: Set<CardId>;
  acceptRoom: boolean | null;
  specialMealMembers: Set<number>;
  committed: boolean;
  win: boolean | null;
}

function initialGroupUI(): GroupUI {
  return { openCards: new Set(), acceptRoom: null, specialMealMembers: new Set(), committed: false, win: null };
}

function emptyPick(): GroupPick {
  return { acceptRoom: null as unknown as boolean, specialMealMembers: [] };
}

export default function HotelReceiveGame({ onComplete, onPartialComplete }: Q1GameProps) {
  const [session] = useState<Session>(() => newSession());
  const [groupUI, setGroupUI] = useState<Record<GroupId, GroupUI>>(
    () => Object.fromEntries(GROUP_IDS.map((id) => [id, initialGroupUI()])) as Record<GroupId, GroupUI>,
  );
  const [outcome, setOutcome] = useState<"playing" | "reflecting" | "done">("playing");
  const [finalPicks, setFinalPicks] = useState<Record<GroupId, GroupPick> | null>(null);
  const [reflectPicks, setReflectPicks] = useState<Partial<Record<GroupId, GroupPick>>>({});

  const order = GROUP_IDS;

  const updateGroup = (id: GroupId, patch: Partial<GroupUI>) =>
    setGroupUI((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const toggleCard = (id: GroupId, card: CardId) =>
    setGroupUI((prev) => {
      const next = new Set(prev[id].openCards);
      next.add(card);
      return { ...prev, [id]: { ...prev[id], openCards: next } };
    });

  const toggleMember = (id: GroupId, i: number) =>
    setGroupUI((prev) => {
      const next = new Set(prev[id].specialMealMembers);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return { ...prev, [id]: { ...prev[id], specialMealMembers: next } };
    });

  const commit = (id: GroupId) => {
    const ui = groupUI[id];
    if (ui.acceptRoom === null) return;
    const pick: GroupPick = { acceptRoom: ui.acceptRoom, specialMealMembers: [...ui.specialMealMembers] };
    const win = groupWin(session.groups[id], pick);
    const nextUI = { ...groupUI, [id]: { ...ui, committed: true, win } };
    setGroupUI(nextUI);

    const allCommitted = order.every((g) => nextUI[g].committed);
    if (!allCommitted) return;

    const picks = Object.fromEntries(
      order.map((g) => [
        g,
        g === id ? pick : { acceptRoom: nextUI[g].acceptRoom as boolean, specialMealMembers: [...nextUI[g].specialMealMembers] },
      ]),
    ) as Record<GroupId, GroupPick>;
    setFinalPicks(picks);
    const allWin = order.every((g) => nextUI[g].win);
    setOutcome(allWin ? "done" : "reflecting");
  };

  const canFinishReflection = order.every((id) => {
    const p = reflectPicks[id];
    return p && p.acceptRoom !== null;
  });

  if (outcome === "done" && finalPicks) {
    const finalWin = sessionWin(session, finalPicks);
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">3つの班、無事にチェックインできた！</span>
          <div className="result-rows">
            {order.map((id) => (
              <span key={id} className="rrow">
                <b>{GROUP_LABELS[id].icon} {GROUP_LABELS[id].name}</b>
                <span className="good">完了</span>
              </span>
            ))}
          </div>
        </div>
        <p className="game-line soft center-line">
          班は学校が作ったもの。宿の仕事は、その班を実際の部屋・個人単位のアレルギー対応へ、うまく収めること。
        </p>
        <button className="btn primary big" onClick={finalWin ? onComplete : (onPartialComplete ?? onComplete)}>
          お出むかえする！
        </button>
      </div>
    );
  }

  if (outcome === "reflecting") {
    return (
      <div className="game board-game">
        <div className="result-card">
          <span className="result-title">まだチェックインできていない班がある</span>
          <p className="game-line soft">
            手配そのものが無駄だったわけではないが、本当に必要だった部屋・食事の対応に届いて
            いなかったみたい。同じ3班のデータをもう一度見比べて、次はどうするか考えてみよう。
          </p>
        </div>
        <div className="result-rows">
          {order.map((id) => (
            <span key={id} className="rrow">
              <b>{GROUP_LABELS[id].icon} {GROUP_LABELS[id].name}</b>
              <span className={groupUI[id].win ? "good" : "bad"}>{groupUI[id].win ? "完了" : "まだできない"}</span>
            </span>
          ))}
        </div>

        <p className="game-line soft center-line farm-disclaimer">3班のデータをもう一度見比べよう</p>
        <div className="dx-grid route-grid">
          {order.map((id) => (
            <div key={id} className="dx-card">
              <div className="dx-head">
                <span className="dx-name">{GROUP_LABELS[id].icon} {GROUP_LABELS[id].name}</span>
              </div>
              <p className="dx-pattern">
                人数: {session.groups[id].size}名 ／ 提示された部屋: {ROOM_LABELS[session.groups[id].proposedRoom]}
              </p>
              <p className="dx-pattern">
                {session.groups[id].memberAllergens.map((allergens, i) => (
                  <span key={i} style={{ display: "block" }}>
                    {MEMBER_LABELS[i]}:{" "}
                    {allergens.length > 0 ? allergens.map((a) => ALLERGEN_LABELS[a]).join("・") + "が除去要" : "除去要の品目なし"}
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>

        {order.map((id) => (
          <div key={id} className="dx-card">
            <p className="game-line soft center-line farm-disclaimer">
              {GROUP_LABELS[id].icon} {GROUP_LABELS[id].name}：今度はどう判断すればよかったと思う？
            </p>
            <div className="choice-row wrap">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  className={`dx-commit ${(reflectPicks[id] ?? emptyPick()).acceptRoom === v ? "on" : ""}`}
                  onClick={() =>
                    setReflectPicks((prev) => ({ ...prev, [id]: { ...(prev[id] ?? emptyPick()), acceptRoom: v } }))
                  }
                >
                  {v ? "この部屋でよい" : "別の部屋が必要"}
                </button>
              ))}
            </div>
            <div className="choice-row wrap">
              {Array.from({ length: session.groups[id].size }, (_, i) => i).map((i) => (
                <button
                  key={i}
                  className={`dx-commit ${(reflectPicks[id] ?? emptyPick()).specialMealMembers.includes(i) ? "on" : ""}`}
                  onClick={() =>
                    setReflectPicks((prev) => {
                      const base = prev[id] ?? emptyPick();
                      const set = new Set(base.specialMealMembers);
                      if (set.has(i)) set.delete(i);
                      else set.add(i);
                      return { ...prev, [id]: { ...base, specialMealMembers: [...set] } };
                    })
                  }
                >
                  {MEMBER_LABELS[i]}に個別対応食
                </button>
              ))}
            </div>
          </div>
        ))}

        <p className="game-line soft center-line farm-disclaimer">※この選択で結果は変わりません</p>
        <button
          className="btn primary big"
          disabled={!canFinishReflection}
          onClick={() => (onPartialComplete ?? onComplete)()}
        >
          先へ進む
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">3つの班をチェックインさせよう</span>
        <span className="task-sub">班ごとに、部屋の判定と個別対応食が必要な人を確認しよう</span>
      </div>

      {order.map((id) => {
        const ui = groupUI[id];
        const group = session.groups[id];
        const allRead = ui.openCards.has("size") && ui.openCards.has("allergy");
        const canCommit = allRead && ui.acceptRoom !== null;

        if (ui.committed) {
          return (
            <div key={id} className={`dx-card ${ui.win ? "selected" : ""}`}>
              <div className="dx-head">
                <span className="dx-name">{GROUP_LABELS[id].icon} {GROUP_LABELS[id].name}</span>
              </div>
              <p className={`dx-pattern ${ui.win ? "good" : "bad"}`}>
                {ui.win ? "チェックインが完了した" : "まだチェックインできない"}
              </p>
            </div>
          );
        }

        return (
          <div key={id} className="dx-card">
            <div className="dx-head">
              <span className="dx-name">{GROUP_LABELS[id].icon} {GROUP_LABELS[id].name}をチェックインさせよう</span>
            </div>

            <div className="dx-grid route-grid">
              <div className="dx-card">
                <div className="dx-head">
                  <span className="dx-name">👥 人数・提示された部屋</span>
                  <button className="dx-more" aria-label="データを見る" onClick={() => toggleCard(id, "size")}>
                    {ui.openCards.has("size") ? "－" : "？"}
                  </button>
                </div>
                {ui.openCards.has("size") && (
                  <p className="dx-pattern">
                    {GROUP_LABELS[id].name}は{group.size}名です。提示された部屋: {ROOM_LABELS[group.proposedRoom]}
                  </p>
                )}
              </div>
              <div className="dx-card">
                <div className="dx-head">
                  <span className="dx-name">📋 アレルギー事前調査票</span>
                  <button className="dx-more" aria-label="データを見る" onClick={() => toggleCard(id, "allergy")}>
                    {ui.openCards.has("allergy") ? "－" : "？"}
                  </button>
                </div>
                {ui.openCards.has("allergy") && (
                  <p className="dx-pattern">
                    {group.memberAllergens.map((allergens, i) => (
                      <span key={i} style={{ display: "block" }}>
                        {MEMBER_LABELS[i]}:{" "}
                        {allergens.length > 0 ? allergens.map((a) => ALLERGEN_LABELS[a]).join("・") + "が除去要" : "除去要の品目なし"}
                      </span>
                    ))}
                  </p>
                )}
              </div>
            </div>

            <p className="game-line soft center-line">部屋の判定</p>
            <div className="choice-row wrap">
              {[true, false].map((v) => (
                <button
                  key={String(v)}
                  className={`btn choice ${ui.acceptRoom === v ? "on" : ""}`}
                  disabled={!allRead}
                  onClick={() => updateGroup(id, { acceptRoom: v })}
                >
                  <span className="tweak-check">{ui.acceptRoom === v ? "✓" : "＋"}</span>
                  <span className="tweak-body"><b>{v ? "この部屋でよい" : "別の部屋が必要"}</b></span>
                </button>
              ))}
            </div>

            <p className="game-line soft center-line">個別対応食が必要な人（0人以上）</p>
            <div className="choice-row wrap">
              {Array.from({ length: group.size }, (_, i) => i).map((i) => (
                <button
                  key={i}
                  className={`btn choice ${ui.specialMealMembers.has(i) ? "on" : ""}`}
                  disabled={!allRead}
                  onClick={() => toggleMember(id, i)}
                >
                  <span className="tweak-check">{ui.specialMealMembers.has(i) ? "✓" : "＋"}</span>
                  <span className="tweak-body"><b>{MEMBER_LABELS[i]}</b></span>
                </button>
              ))}
            </div>

            <button className="btn primary big" disabled={!canCommit} onClick={() => commit(id)}>
              チェックインする
            </button>
            {!allRead && (
              <p className="game-line soft center-line farm-disclaimer">※両方の「？」を見てから判定しよう</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
