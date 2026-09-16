// Q1: 店舗デザイナー・内装設計に関わる仕事 (gameType: zone_and_fit)
// B: 基準を守って、席数と動線もいい店の形をつくる。
// C: 現況図（柱・給排水の壁・トイレ・居抜き2槽シンク）／施設基準カード
//    （別表19の構造要件・寸法数値は出さない）／予算（ch3の承認額を反映）。
// D: 基準で必須の設備を先に置き、残り面積で席数×動線を組む →
//    「図面をチェックする」（基準＝保健所に事前相談／営業 の2タブ。design v1.2 §4）。
// 給排水の壁際にしか水まわりを置けない等の現況図制約は、置く瞬間に理由つきで返す。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import {
  COLS, ROWS, PARTS, FAUCETS, FIXED,
  col, placedOf as placedOfCells, seatsFor, costFor, canPlace, computeIssues,
} from "./zoneFitLogic";
import type { PartId, Faucet } from "./zoneFitLogic";

export default function ZoneFitGame({ onComplete }: Q1GameProps) {
  const [cells, setCells] = useState<Partial<Record<number, PartId>>>({});
  const [faucet, setFaucet] = useState<Faucet | null>(null);
  const [selected, setSelected] = useState<PartId | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [issues, setIssues] = useState<{ kijun: string[]; eigyo: string[] } | null>(null);
  const [tab, setTab] = useState<"kijun" | "eigyo">("kijun");
  const [okPlan, setOkPlan] = useState(false);
  const [cleared, setCleared] = useState(false);

  // budget follows the ch3 approval (state hand-off; fixed fallback = 280)
  let loan = 280;
  try {
    const v = localStorage.getItem("jc.shop-opening.loanAmount");
    if (v === "250" || v === "280") loan = Number(v);
  } catch { /* fall back to 280 */ }

  const placedOf = (p: PartId) => placedOfCells(cells, p);
  const seats = seatsFor(cells);
  const cost = costFor(cells, faucet);

  const touch = () => { setIssues(null); setOkPlan(false); };

  const place = (i: number) => {
    setNote(null);
    const reject = canPlace(selected, i, cells, faucet, loan);
    if (reject === "fixed_sink") { setNote("居抜きの2槽シンク。まだ使える。ここは活かそう。"); return; }
    if (reject === "fixed_toilet") { setNote("トイレの場所は動かせない。"); return; }
    if (reject === "fixed_pillar") { setNote("柱は動かせない。"); return; }
    if (cells[i]) {
      touch();
      setCells((c) => { const n = { ...c }; delete n[i]; return n; });
      return;
    }
    if (reject === "no_selection") return;
    if (reject === "plumbing_wall_only") {
      setNote("給排水の管は、左の壁までしか来ていない。水を使う設備は、あの壁の近くにしか置けない。");
      return;
    }
    if (reject === "toilet_adjacency_required") {
      setNote("トイレ「専用」の手洗いだから、トイレのすぐそばに置きたい。");
      return;
    }
    if (reject === "faucet_type_required") {
      setNote("手洗いは、水栓のタイプ（ハンドル式・レバー式・センサー式）をえらんでから置こう。");
      return;
    }
    if (reject === "single_only") {
      setNote("それは1つだけ。置き直すなら、置いてあるものをタップして外そう。");
      return;
    }
    if (reject === "over_budget") {
      setNote(`センサー式まで入れると、承認された${loan}万円をこえてしまう…。基準に合う別のタイプはないかな。`);
      return;
    }
    touch();
    setCells((c) => ({ ...c, [i]: selected! }));
  };

  const runCheck = () => {
    setNote(null);
    const { kijun, eigyo } = computeIssues(cells, faucet, loan);
    setIssues({ kijun, eigyo });
    setTab(kijun.length ? "kijun" : "eigyo");
    setOkPlan(kijun.length === 0 && eigyo.length === 0);
  };

  // ---------- E ----------
  if (cleared) {
    const counters = placedOf("counter").length;
    return (
      <div className="game board-game">
        <p className="game-line center-line">図面が決まって、工事が始まった。</p>
        <div className="mission-chips center-line">
          <span className="mchip ok">席数 {seats}席</span>
          <span className="mchip ok">水栓 {FAUCETS.find((f) => f.id === faucet)!.name.replace(/（.+）/, "")}</span>
          <span className="mchip ok">予算 {cost}/{loan}万円</span>
        </div>
        <p className="game-line center-line">
          {counters > 0
            ? "「カウンターごしに話せる店にしたい」— ハルさんの希望もかなった。"
            : "テーブル中心の、ゆったりした形になった。カウンターの夢は、いつか2号店で。"}
        </p>
        <p className="game-line soft center-line">先に保健所に相談したから、工事のやり直しの心配はない。</p>
        <button className="btn primary big" onClick={onComplete}>
          図面をハルさんにわたす
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="mission-bar">
        <span className="mission-bar-title">基準を守って、席数と動線をつくろう</span>
        <div className="mission-chips">
          <span className={`mchip ${seats >= 8 ? "ok" : ""}`}>席 {seats}/8</span>
          <span className={`mchip ${cost > loan ? "bad" : ""}`}>予算 {cost}/{loan}万</span>
        </div>
      </div>

      <InfoCards
        label="設計の資料"
        cards={[
          { id: "genkyo", icon: "📐", title: "現況図のメモ",
            body: <p>💧は居抜きの2槽シンク（使える）。🧱の柱と🚻のトイレは動かせない。給排水の管は左の壁ぞいだけ。</p> },
          { id: "kijun", icon: "📋", title: "保健所の施設基準",
            body: (
              <>
                <p>・厨房と客席は<strong>区画</strong>する（ドアなどで仕切る）</p>
                <p>・手洗いの水栓は「<strong>手でさわらずに止められる構造</strong>」（センサー式・レバー式・足踏み式など）</p>
                <p>・器具を洗う2槽シンク／フタ付きゴミ箱／扉付き食器棚</p>
                <p>・トイレには<strong>専用の</strong>手洗い</p>
              </>
            ) },
          { id: "hope", icon: "🙂", title: "ハルさんの希望",
            body: <p>席はなるべく多く（計画は8席が前提）。できれば、カウンターごしに話せる店に。</p> },
        ]}
      />

      {/* the floor grid */}
      <div className="floor-grid">
        {Array.from({ length: COLS * ROWS }, (_, i) => (
          <button
            key={i}
            className={`floor-cell ${col(i) <= 1 ? "plumb" : ""} ${FIXED[i] ? "fixed" : ""} ${cells[i] ? "filled" : ""} ${selected && !cells[i] && !FIXED[i] ? "ready" : ""}`}
            onClick={() => place(i)}
          >
            {FIXED[i] ?? (cells[i] ? PARTS.find((p) => p.id === cells[i])!.emoji : "")}
          </button>
        ))}
      </div>
      <p className="game-line soft">左の色つきの列＝給排水の管が来ている壁ぞい。置いたものはタップで外せる。</p>

      {/* palette */}
      <div className="choice-row wrap">
        {PARTS.map((p) => (
          <button
            key={p.id}
            className={`choice-card slim ${selected === p.id ? "selected" : ""} ${!p.multi && placedOf(p.id).length ? "soft-done" : ""}`}
            onClick={() => { setSelected(selected === p.id ? null : p.id); setNote(null); }}
          >
            <span className="choice-emoji">{p.emoji}</span>
            <span className="choice-name">{p.name}</span>
          </button>
        ))}
      </div>
      {selected === "wash" && (
        <div className="choice-row">
          {FAUCETS.map((f) => (
            <button
              key={f.id}
              className={`layer-btn ${faucet === f.id ? "active" : ""}`}
              onClick={() => { setFaucet(f.id); touch(); }}
            >
              {f.name} +{f.cost}万
            </button>
          ))}
        </div>
      )}

      {note && <div className="sched-issues"><p>{note}</p></div>}

      {issues && (
        <div className="check-result">
          <div className="chapter-tabs">
            <button className={`chapter-tab ${tab === "kijun" ? "on" : ""}`} onClick={() => setTab("kijun")}>
              🏥 基準（保健所より）{issues.kijun.length === 0 && " ✓"}
            </button>
            <button className={`chapter-tab ${tab === "eigyo" ? "on" : ""}`} onClick={() => setTab("eigyo")}>
              🍚 営業（席数・動線）{issues.eigyo.length === 0 && " ✓"}
            </button>
          </div>
          <div className="sched-issues">
            {(tab === "kijun" ? issues.kijun : issues.eigyo).map((l) => <p key={l}>・{l}</p>)}
            {(tab === "kijun" ? issues.kijun : issues.eigyo).length === 0 && (
              <p className="good">こちらは、だいじょうぶそうだ。</p>
            )}
          </div>
        </div>
      )}

      <div className="stack">
        {okPlan ? (
          <button className="btn primary big" onClick={() => setCleared(true)}>
            ✅ この図面で決定する
          </button>
        ) : (
          <button className="btn primary big" onClick={runCheck}>
            📋 図面をチェックする（保健所に事前相談）
          </button>
        )}
        {Object.keys(cells).length > 0 && (
          <button className="btn ghost" onClick={() => { setCells({}); touch(); setNote(null); }}>
            ぜんぶ置き直す
          </button>
        )}
      </div>
    </div>
  );
}
