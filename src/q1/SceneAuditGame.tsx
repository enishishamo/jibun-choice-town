// Q1: 食品衛生監視員（保健所） (gameType: scene_audit)
// B: 実地検査。図面どおりか、基準に合っているか、現場でたしかめる。
// C: 検査チェックリスト（別表19の構造要件）。スポットの「見たままの特徴」を
//    基準と突き合わせないと、○か✗かは決められない。
// D: 見て回る → ○/✗を自分で記入 → 改善指示 → 再検査（design v1.2 §5）。
//    不備はプール抽選（旧ハンドル水栓=固定枠＋フタなしゴミ箱/扉なし食器棚から1件）。
//    レバー式水栓・古い2槽シンクは「紛らわしい適合」— 全部✗の総当たりは通らない。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import { SPOTS, FIXES, defectsFor, isDefect as isDefectOf, spotSeen as spotSeenOf, evaluateJudge, isGoodFix } from "./sceneAuditLogic";
import type { SpotId, Spot, Mark, Drawn } from "./sceneAuditLogic";

export default function SceneAuditGame({ onComplete }: Q1GameProps) {
  // defect pool: backwash is always a defect + one of bin/shelf (drawn once)
  const [drawn] = useState<Drawn>(() => (Math.random() < 0.5 ? "bin" : "shelf"));
  const defects: SpotId[] = defectsFor(drawn);
  const isDefect = (s: SpotId) => isDefectOf(s, drawn);

  const [visited, setVisited] = useState<SpotId[]>([]);
  const [marks, setMarks] = useState<Partial<Record<SpotId, Mark>>>({});
  const [viewing, setViewing] = useState<SpotId | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [phase, setPhase] = useState<"inspect" | "instruct" | "recheck" | "papers">("inspect");
  const [instructing, setInstructing] = useState<SpotId | null>(null);
  const [instructed, setInstructed] = useState<SpotId[]>([]);
  const [rechecked, setRechecked] = useState<SpotId[]>([]);
  const [paperSeen, setPaperSeen] = useState(false);
  const [cleared, setCleared] = useState(false);

  // The non-drawn pool candidate appears as a normal, compliant spot
  // (if the lidless bin was drawn, the shelf is already fine — and vice versa).
  const spotSeen = (s: Spot) => spotSeenOf(s, drawn);

  const judge = () => {
    setNote(null);
    const result = evaluateJudge(visited, marks, drawn);
    if (result === "unvisited_remaining") {
      setNote("まだ見ていない場所がある。ぜんぶ自分の目でたしかめよう。");
      return;
    }
    if (result === "unmarked_remaining") {
      setNote("チェックリストに、まだ記入していない項目がある。");
      return;
    }
    if (result === "marks_wrong") {
      const wrong = SPOTS.filter((s) => (marks[s.id] === "ng") !== isDefect(s.id));
      setNote(`チェックと現場が合っていないところが ${wrong.length}か所ある。もう一度、形をよく見てみよう。`);
      return;
    }
    setPhase("instruct");
  };

  const instruct = (sid: SpotId, i: number) => {
    const f = FIXES[sid][i];
    if (isGoodFix(sid, i)) {
      setNote(null);
      setInstructed((x) => [...x, sid]);
      setInstructing(null);
      if (instructed.length + 1 === defects.length) setPhase("recheck");
    } else {
      setNote(f.bounce!);
    }
  };

  // ---------- E ----------
  if (cleared) {
    return (
      <div className="game board-game">
        <p className="game-line center-line">🎉 営業許可が出た。開店できる！</p>
        <div className="sched-issues ok-issues">
          <p>見つけて直したところ：</p>
          <p>・奥の古い手洗い → 手でさわらず止められる水栓に交換</p>
          <p>{drawn === "bin" ? "・フタのなかったゴミ箱 → フタ付きに交換" : "・扉のなかった食器棚 → 扉を取り付け"}</p>
        </div>
        <p className="game-line center-line">
          ハルさん「開店日、間に合いますか…？」<br />
          「直せば、間に合わせられます」— そのとおりになった。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          許可証をわたす
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="mission-bar">
        <span className="mission-bar-title">
          {phase === "inspect" ? "現場を見て回り、○✗を自分で記入しよう"
            : phase === "instruct" ? "見つけた不備に、改善の指示を出そう"
            : phase === "recheck" ? "数日後 — 再検査で、直ったかをたしかめよう"
            : "最後に、書類をたしかめよう"}
        </span>
        <div className="mission-chips">
          <span className={`mchip ${visited.length === SPOTS.length ? "ok" : ""}`}>見た {visited.length}/{SPOTS.length}</span>
          <span className="mchip">記入 {SPOTS.filter((s) => marks[s.id]).length}/{SPOTS.length}</span>
        </div>
      </div>

      {/* C: the standards, always at hand */}
      <div className="tool-panel slim">
        <p className="doc-label">📋 検査チェックリスト（施設基準）</p>
        <p>・厨房と客席の区画　・手洗いは「手でさわらずに止められる」水栓</p>
        <p>・2槽シンク　・フタ付きゴミ箱　・扉付き食器棚　・トイレ専用の手洗い</p>
      </div>

      {/* the venue, by area */}
      {phase === "inspect" && (
        <>
          <div className="audit-list">
            {SPOTS.map((s) => (
              <div key={s.id} className={`audit-row ${visited.includes(s.id) ? "seen" : ""}`}>
                <button className="audit-spot" onClick={() => { setViewing(s.id); setNote(null); if (!visited.includes(s.id)) setVisited((v) => [...v, s.id]); }}>
                  {s.emoji} <span>{s.area}｜{s.label}</span> {visited.includes(s.id) ? "" : "👀"}
                </button>
                <span className="audit-marks">
                  <button
                    className={`mark-btn ${marks[s.id] === "ok" ? "on" : ""}`}
                    onClick={() => { if (!visited.includes(s.id)) { setNote("まず自分の目で見てから記入しよう。"); return; } setMarks((m) => ({ ...m, [s.id]: "ok" })); }}
                  >○</button>
                  <button
                    className={`mark-btn warn ${marks[s.id] === "ng" ? "on" : ""}`}
                    onClick={() => { if (!visited.includes(s.id)) { setNote("まず自分の目で見てから記入しよう。"); return; } setMarks((m) => ({ ...m, [s.id]: "ng" })); }}
                  >✗</button>
                </span>
              </div>
            ))}
          </div>
          {viewing && (
            <p className="talk-bubble">
              🔍 {SPOTS.find((s) => s.id === viewing)!.label}：{spotSeen(SPOTS.find((s) => s.id === viewing)!)}
            </p>
          )}
          <button className="btn primary big" onClick={judge}>
            📝 この記入で判定する
          </button>
        </>
      )}

      {phase === "instruct" && (
        <>
          <p className="game-line">✗を付けた {defects.length}か所に、改善の指示を出そう。</p>
          <div className="choice-row wrap">
            {defects.map((d) => (
              <button
                key={d}
                className={`choice-card ${instructed.includes(d) ? "soft-done" : ""}`}
                disabled={instructed.includes(d)}
                onClick={() => { setInstructing(d); setNote(null); }}
              >
                <span className="choice-emoji">{SPOTS.find((s) => s.id === d)!.emoji}</span>
                <span className="choice-name">{SPOTS.find((s) => s.id === d)!.label}</span>
                <small>{instructed.includes(d) ? "指示ずみ ✓" : "指示を出す"}</small>
              </button>
            ))}
          </div>
        </>
      )}

      {phase === "recheck" && (
        <>
          <p className="game-line">🗓 数日後。直った場所を、もう一度自分の目でたしかめよう。</p>
          <div className="audit-list">
            {defects.map((d) => {
              const s = SPOTS.find((x) => x.id === d)!;
              const done = rechecked.includes(d);
              return (
                <div key={d} className={`audit-row ${done ? "seen" : ""}`}>
                  <button
                    className="audit-spot"
                    onClick={() => {
                      setNote(null);
                      if (!done) setRechecked((r) => [...r, d]);
                      setViewing(d);
                    }}
                  >
                    {s.emoji} <span>{s.area}｜{s.label}</span> {done ? "○" : "👀"}
                  </button>
                </div>
              );
            })}
          </div>
          {viewing && rechecked.includes(viewing) && (
            <p className="talk-bubble">🔍 {SPOTS.find((s) => s.id === viewing)!.fixedSeen}</p>
          )}
          {rechecked.length === defects.length && (
            <button className="btn primary big" onClick={() => setPhase("papers")}>
              ぜんぶ直った。書類の確認へ
            </button>
          )}
        </>
      )}

      {phase === "papers" && (
        <>
          <p className="game-line">最後にひとつ。お店には「食品衛生責任者」を置く決まりがある。</p>
          {!paperSeen ? (
            <button className="btn primary big" onClick={() => setPaperSeen(true)}>
              📂 書類フォルダをひらく
            </button>
          ) : (
            <>
              <div className="tool-panel">
                <p>🪪 食品衛生責任者・講習修了証（ハルさん名義）— ある。</p>
              </div>
              <button className="btn primary big" onClick={() => setCleared(true)}>
                ✅ 合格。許可の手続きへ
              </button>
            </>
          )}
        </>
      )}

      {note && <div className="sched-issues"><p>{note}</p></div>}

      {/* ---------- improvement-instruction dialog ---------- */}
      {instructing && (
        <div className="modal-veil">
          <div className="modal-card">
            <p className="modal-title">
              {SPOTS.find((s) => s.id === instructing)!.emoji} {SPOTS.find((s) => s.id === instructing)!.label} — なんと伝える？
            </p>
            {note && <p className="karte-memo">{note}</p>}
            <div className="stack">
              {FIXES[instructing].map((f, i) => (
                <button key={f.text} className="btn card-line" onClick={() => instruct(instructing, i)}>
                  {f.text}
                </button>
              ))}
              <button className="btn ghost" onClick={() => { setInstructing(null); setNote(null); }}>
                あとで考える（基準を見直す）
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
