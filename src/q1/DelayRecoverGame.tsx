// Q1: 添乗員・旅程管理担当 (gameType: delay_recover)
// B: 修学旅行中、新幹線が30分遅延した。到着後の見学先・バス・宿の3つの関係先すべてに影響が及ぶ。
//    添乗員として、状況確認→学校への報告→3つの関係先への連絡→学校の承認→共有、という流れの中で
//    対応を組み立てる。
// C: 遅延の状況（30分・運送機関の事情）、確定行程表上どの関係先に影響が及ぶか、そして宿泊施設だけが
//    持つ実在の傾向（夕食提供の締切があり、早く連絡するほど調整の余地が残る）。詳細はdelayRecoverLogic.ts。
// D: 状況確認→学校報告→3者への連絡（宿を他の2者より先に）→学校承認→共有、という前提条件で
//    ゲートされた流れの中で、連絡ボタンをタップする順序そのもので宿泊施設への優先度を表現する。
//
// 2026-09-10 (Q1 Autonomous Factory, legacy-delay-recover rebuild, t5-hedged-evidence-scope): 旧実装は
// 行動カードを自由に追加・削除・並び替えて何度でも再提出できる構造だった（reverse audit: exploit
// "select-all"、進行コストのない総当たり）。新実装は、5段階の流れを前提条件ゲート（各ボタンは前段階
// が終わるまでdisabled）で強制し、3つの関係先への連絡を1回性のタップ（押した瞬間に確定、取り消し・
// 再連絡不可）にすることで、旧来の自由な並び替え・再提出を構造的に排除した。3つの関係先カードの
// 画面上の表示順はセッションごとにランダム化し（design review r1 MEDIUM是正: 固定表示順を逆に辿る
// だけの戦略が意図せず常に成功していた）、位置ではなく内容を読むことでしか正解に近づけないようにした。
// 判定基準（宿を2者より先に連絡したかどうか）は、研究が確認した実在の傾向をゲームとして単純化した
// 運用上のルールであり、他の2者に時間的制約が一切ないことを意味しない（design review r2 BLOCKER
// 是正: 学習到達点の文言が排他的な誤解を招かないよう、design chain全体で証拠限定的な表現に統一した）。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import {
  CONTACTS,
  CONTACT_DETAIL,
  CONTACT_LABELS,
  contactOrderWins,
  newSession,
  type ContactId,
  type Session,
} from "./delayRecoverLogic";

export default function DelayRecoverGame({ onComplete, onPartialComplete }: Q1GameProps) {
  const [session] = useState<Session>(() => newSession());
  const [checkOpened, setCheckOpened] = useState(false);
  const [reported, setReported] = useState(false);
  const [openedContacts, setOpenedContacts] = useState<Set<ContactId>>(new Set());
  const [contactedOrder, setContactedOrder] = useState<ContactId[]>([]);
  const [approved, setApproved] = useState(false);
  const [outcome, setOutcome] = useState<"playing" | "reflecting" | "done">("playing");
  const [reflectOrder, setReflectOrder] = useState<ContactId[]>([]);

  const openContact = (id: ContactId) =>
    setOpenedContacts((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

  const contact = (id: ContactId) =>
    setContactedOrder((prev) => (prev.includes(id) ? prev : [...prev, id]));

  const share = () => {
    const win = contactOrderWins(contactedOrder);
    setOutcome(win ? "done" : "reflecting");
  };

  const toggleReflect = (id: ContactId) =>
    setReflectOrder((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  if (outcome === "done") {
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">予定を、つなぎ直せた！</span>
          <p className="join-conclusion">
            宿の夕食提供に間に合い、学校の承認のもと関係先へ確定内容を共有した。
          </p>
        </div>
        <p className="game-line soft center-line">
          添乗員だけでは決めない。学校の承認を得ながら、見学先・バス・宿、みんなへつなぎ直す仕事。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          みんなに知らせる
        </button>
      </div>
    );
  }

  if (outcome === "reflecting") {
    const canFinish = reflectOrder.length === CONTACTS.length;
    return (
      <div className="game board-game">
        <div className="result-card">
          <span className="result-title">予定を、うまくつなぎ直せなかった</span>
          <p className="game-line soft">
            宿の夕食提供には間に合わなかったみたい。同じ3つの関係先のデータをもう一度見比べて、
            次はどの順で連絡するか考えてみよう。
          </p>
        </div>
        <div className="dx-grid route-grid">
          {CONTACTS.map((id) => (
            <div key={id} className="dx-card">
              <div className="dx-head">
                <span className="dx-name">{CONTACT_LABELS[id].icon} {CONTACT_LABELS[id].name}</span>
              </div>
              <p className="dx-pattern">{CONTACT_DETAIL[id]}</p>
            </div>
          ))}
        </div>
        <p className="game-line soft center-line farm-disclaimer">
          今度はどの順で連絡すればよかったと思う？（タップした順にえらぼう）
        </p>
        <div className="choice-row wrap">
          {CONTACTS.map((id) => (
            <button
              key={id}
              className={`dx-commit ${reflectOrder.includes(id) ? "on" : ""}`}
              onClick={() => toggleReflect(id)}
            >
              {reflectOrder.includes(id) ? `${reflectOrder.indexOf(id) + 1}. ` : ""}
              {CONTACT_LABELS[id].icon} {CONTACT_LABELS[id].name}
            </button>
          ))}
        </div>
        <p className="game-line soft center-line farm-disclaimer">※この選択で結果は変わりません</p>
        <button
          className="btn primary big"
          disabled={!canFinish}
          onClick={() => (onPartialComplete ?? onComplete)()}
        >
          先へ進む
        </button>
      </div>
    );
  }

  const allContacted = contactedOrder.length === CONTACTS.length;

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">新幹線が、30分おくれるという放送があった</span>
        <span className="task-sub">状況を確認して、順番に対応しよう</span>
      </div>

      <div className="dx-card">
        <div className="dx-head">
          <span className="dx-name">🔍 状況確認</span>
          <button className="dx-more" aria-label="データを見る" onClick={() => setCheckOpened(true)}>
            {checkOpened ? "－" : "？"}
          </button>
        </div>
        {checkOpened && (
          <p className="dx-pattern">新幹線が30分遅延しています。到着後の見学先・バス・宿すべてに影響が及びます。</p>
        )}
      </div>

      <button className="btn primary big" disabled={!checkOpened || reported} onClick={() => setReported(true)}>
        {reported ? "✓ 学校へ報告した" : "学校へ状況を報告する"}
      </button>

      {reported && (
        <>
          <p className="game-line soft center-line">3つの関係先に連絡しよう</p>
          <div className="dx-grid route-grid">
            {session.displayOrder.map((id) => {
              const isOpened = openedContacts.has(id);
              const isContacted = contactedOrder.includes(id);
              return (
                <div key={id} className={`dx-card ${isContacted ? "selected" : ""}`}>
                  <div className="dx-head">
                    <span className="dx-name">{CONTACT_LABELS[id].icon} {CONTACT_LABELS[id].name}</span>
                    {!isContacted && (
                      <button className="dx-more" aria-label="データを見る" onClick={() => openContact(id)}>
                        {isOpened ? "－" : "？"}
                      </button>
                    )}
                  </div>
                  {isContacted ? (
                    <p className="dx-pattern good">連絡済み（{contactedOrder.indexOf(id) + 1}番目）</p>
                  ) : (
                    isOpened && (
                      <>
                        <p className="dx-pattern">{CONTACT_DETAIL[id]}</p>
                        <button className="btn choice on" onClick={() => contact(id)}>
                          連絡する
                        </button>
                      </>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <button className="btn primary big" disabled={!allContacted || approved} onClick={() => setApproved(true)}>
        {approved ? "✓ 学校の承認を得た" : "学校の承認を得る"}
      </button>

      <button className="btn primary big" disabled={!approved} onClick={share}>
        全員へ共有する
      </button>
    </div>
  );
}
