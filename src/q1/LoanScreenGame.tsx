// Q1: 創業融資の審査に関わる仕事（日本政策金融公庫） (gameType: loan_screen)
// B: 実績ゼロの創業者に「返せる計画か」を確かめてお金を届ける。
// C: 創業計画書v2／通帳（めくって「貯まり方」を読む）／見積書／返済ミニ計器。
// D: ○/▲を自分で記入して照合 → ▲だけ面談で確認 → 承認額を判断（複数解）。
//    250万(計画書) vs 280万(見積書) の食い違いが照合の鍵（design v1.2 §3）。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";

type CheckId = "savings" | "amount" | "sales";
type Mark = "ok" | "ask";

const CHECKS: { id: CheckId; label: string }[] = [
  { id: "savings", label: "自己資金の貯まり方" },
  { id: "amount", label: "計画書の金額と見積書" },
  { id: "sales", label: "売上の根拠" },
];

// 通帳: 3年ぶんのこつこつ入金を4ページに要約
const PASSBOOK_PAGES = [
  ["3年前〜", "毎月 +3万円", "+3万 +3万 +3万 …", "残高 12万 → 36万"],
  ["2年前〜", "毎月 +3万円", "+3万 +3万 +3万 …", "残高 36万 → 72万"],
  ["1年前〜", "毎月 +3万円", "ボーナス月 +5万", "残高 72万 → 114万"],
  ["今年", "毎月 +3万円", "先月まで続く", "残高 150万円"],
];

const PROFIT = 9; // 万円/月（計画書v2の月の利益）
const repay = (amount: number) => Math.round((amount / 84) * 10) / 10; // 7年返済のめやす

export default function LoanScreenGame({ onComplete }: Q1GameProps) {
  const [openDoc, setOpenDoc] = useState<"plan" | "passbook" | "quote" | null>(null);
  const [seenDocs, setSeenDocs] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [maxPage, setMaxPage] = useState(0);
  const [marks, setMarks] = useState<Partial<Record<CheckId, Mark>>>({});
  const [askedDone, setAskedDone] = useState(false);
  const [meter, setMeter] = useState(280);
  const [note, setNote] = useState<string | null>(null);
  const [approved, setApproved] = useState<number | null>(null);

  // 貯まり方は最後のページまでめくって初めて分かる
  const passbookRead = maxPage >= PASSBOOK_PAGES.length - 1;
  const allMarked = CHECKS.every((c) => marks[c.id]);

  const openDocTab = (doc: "plan" | "passbook" | "quote") => {
    setOpenDoc(openDoc === doc ? null : doc);
    setSeenDocs((s) => (s.includes(doc) ? s : [...s, doc]));
  };

  const mark = (id: CheckId, m: Mark) => {
    setNote(null);
    if (id === "savings" && !passbookRead) {
      setNote("自己資金は「額」だけじゃなく「貯まり方」を見るんだ。通帳を最後までめくってみよう。");
      return;
    }
    // 金額の照合は、両方の書類を実際に開き比べてから（勘での記入を防ぐ）
    if (id === "amount" && !(seenDocs.includes("plan") && seenDocs.includes("quote"))) {
      setNote("金額は、創業計画書と見積書の両方をひらいて、見比べてから記入しよう。");
      return;
    }
    setMarks((x) => ({ ...x, [id]: m }));
  };

  const toInterview = () => {
    setNote(null);
    if (!allMarked) {
      setNote("まだたしかめていない項目がある。○か▲を、自分の手で記入しよう。");
      return;
    }
    if (marks.amount === "ok") {
      setNote("書類のあいだで、数字が合っていないところがないかな。もう一度、開きくらべてみよう。");
      return;
    }
    if (marks.savings === "ask" || marks.sales === "ask") {
      setNote("▲にした項目を見直そう。書類でもう十分たしかめられるものが、まじっていないかな。");
      return;
    }
    setAskedDone(true);
  };

  const decide = (amount: number | null) => {
    setNote(null);
    if (amount === null) {
      setNote("通帳の貯まり方と、計算し直した売上を見て、どこが心配だった？書類は「返せる計画」を示しているようだけれど…");
      return;
    }
    try {
      localStorage.setItem("jc.shop-opening.loanAmount", String(amount));
    } catch { /* storage may be unavailable */ }
    setApproved(amount);
  };

  // ---------- E ----------
  if (approved !== null) {
    return (
      <div className="game board-game">
        <p className="game-line center-line">
          審査の結果、<strong>{approved}万円</strong>の融資が決まった。
        </p>
        <div className="mission-chips center-line">
          <span className="mchip ok">月々の返済 約{repay(approved)}万円</span>
          <span className="mchip ok">計画の利益 月{PROFIT}万円</span>
        </div>
        <p className="game-line center-line">
          {approved === 280
            ? "見積書に合わせて計画書を直してもらい、カウンターも理想の形でつくれる。"
            : "カウンターの改良は開店後のおたのしみに。そのぶん借入は小さく、返済も軽い。"}
        </p>
        <p className="game-line soft center-line">「実績ゼロの自分を、数字で見てもらえた」とハルさん。</p>
        <button className="btn primary big" onClick={onComplete}>
          決定を届ける
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="mission-bar">
        <span className="mission-bar-title">{askedDone ? "いくらまでなら、返せる計画？" : "書類3点を突き合わせよう"}</span>
        <div className="mission-chips">
          <span className={`mchip ${allMarked ? "ok" : ""}`}>照合 {CHECKS.filter((c) => marks[c.id]).length}/3</span>
          {askedDone && <span className="mchip ok">面談ずみ</span>}
        </div>
      </div>

      {/* C: the three documents */}
      <div className="layer-row">
        <button className={`layer-btn ${openDoc === "plan" ? "active" : ""}`} onClick={() => openDocTab("plan")}>
          📄 創業計画書v2
        </button>
        <button className={`layer-btn ${openDoc === "passbook" ? "active" : ""}`} onClick={() => openDocTab("passbook")}>
          📔 通帳
        </button>
        <button className={`layer-btn ${openDoc === "quote" ? "active" : ""}`} onClick={() => openDocTab("quote")}>
          🧾 工事の見積書
        </button>
      </div>

      {openDoc === "plan" && (
        <div className="tool-panel">
          <p>お店：定食屋（8席）／売上：8席×回転×700円 で計算ずみ</p>
          <p>月の利益（見込み）：{PROFIT}万円</p>
          <p>自己資金：150万円　／　<strong>設備資金（借りたい額）：250万円</strong></p>
        </div>
      )}
      {openDoc === "passbook" && (
        <div className="tool-panel passbook">
          <p className="passbook-head">📔 {PASSBOOK_PAGES[page][0]}（{page + 1}/{PASSBOOK_PAGES.length}ページ）</p>
          {PASSBOOK_PAGES[page].slice(1).map((l) => (
            <p key={l} className="passbook-line">{l}</p>
          ))}
          <div className="choice-row">
            <button className="btn" disabled={page === 0} onClick={() => setPage(page - 1)}>← 前へ</button>
            <button
              className="btn"
              disabled={page === PASSBOOK_PAGES.length - 1}
              onClick={() => {
                const p = page + 1;
                setPage(p);
                setMaxPage((m) => Math.max(m, p));
              }}
            >
              めくる →
            </button>
          </div>
          <p className="soft-note">貯まり方まで読めた？ 直前にポンと入った大金は、出所をたずねるんだ。</p>
        </div>
      )}
      {openDoc === "quote" && (
        <div className="tool-panel">
          <p>内装工事一式：<strong>280万円</strong></p>
          <p className="soft-note">（厨房区画・手洗い設備・カウンター造作 ほか）</p>
        </div>
      )}

      {/* D: the checklist the child fills in by hand */}
      {!askedDone && (
        <>
          <p className="game-line soft">✍️ 照合チェックリスト — 自分で記入しよう（○だいじょうぶ／▲面談で聞く）</p>
          <div className="audit-list">
            {CHECKS.map((c) => (
              <div key={c.id} className="audit-row">
                <span className="audit-label">{c.label}</span>
                <span className="audit-marks">
                  <button className={`mark-btn ${marks[c.id] === "ok" ? "on" : ""}`} onClick={() => mark(c.id, "ok")}>○</button>
                  <button className={`mark-btn warn ${marks[c.id] === "ask" ? "on" : ""}`} onClick={() => mark(c.id, "ask")}>▲</button>
                </span>
              </div>
            ))}
          </div>
          <button className="btn primary big" onClick={toInterview}>
            🗣 面談で確認する
          </button>
        </>
      )}

      {/* interview + decision */}
      {askedDone && (
        <>
          <p className="talk-bubble">
            🧑‍💼「見積もりのほうが30万円多いのは、どうしてですか？」<br />
            🙂 ハルさん「途中でカウンター席をよくしたくなって…見積もりを取り直したんです」
          </p>
          <p className="game-line soft">🧮 返済ミニ計器 — 借入額を動かして、返せるかを目で見よう</p>
          <div className="repay-meter">
            <div className="slider-steps wide">
              {[220, 250, 280, 310].map((v) => (
                <button key={v} className={`slider-step ${meter >= v ? "on" : ""}`} onClick={() => setMeter(v)} aria-label={`${v}万円`} />
              ))}
            </div>
            <p className="repay-read">借入 {meter}万円 → 月々の返済 約{repay(meter)}万円（計画の利益 月{PROFIT}万円）</p>
            <div className="balance-bar">
              <div className="balance-demand" style={{ width: `${Math.min(100, (repay(meter) / PROFIT) * 100)}%` }}><span>返済</span></div>
              <div className="balance-supply green" style={{ width: "100%" }}><span>利益</span></div>
            </div>
          </div>
          <div className="stack">
            <button className="btn primary big" onClick={() => decide(280)}>
              280万円で承認（計画書を直してもらう）
            </button>
            <button className="btn primary big" onClick={() => decide(250)}>
              250万円で承認（カウンターは開店後に）
            </button>
            <button className="btn ghost" onClick={() => decide(null)}>
              今回は見送る
            </button>
          </div>
        </>
      )}

      {note && <div className="sched-issues"><p>{note}</p></div>}
    </div>
  );
}
