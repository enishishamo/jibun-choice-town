// Q1: デジタルアーカイブ登録 (gameType: digi_archive)
// 核: 「保存用と閲覧用はちがう。わからないことは、わからないと書く」—
// 仕様×確度ラベル×公開判断の3点セット。libraryLogicが機械強制。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import { withRuby } from "../lib/ruby";
import { ARCHIVE_ITEMS, ARCHIVE_MISTAKE_LIMIT, newArchiveState, archiveAct } from "./libraryLogic";
import type { ArchiveState, Spec, MetaLabel } from "./libraryLogic";

type Step = "work" | "failed" | "done";

const LABEL_TEXT: Record<MetaLabel, string> = { confirmed: "確定", probable: "推定", unknown_place: "ふめい" };
const LABEL_SHELF: Record<MetaLabel, string> = { confirmed: "撮影地：確定", probable: "撮影地：推定", unknown_place: "撮影地ふめい" };

export default function DigiArchiveGame({ onComplete }: Q1GameProps) {
  const [as_, setAs] = useState<ArchiveState>(() => newArchiveState());
  const [step, setStep] = useState<Step>("work");
  const [note, setNote] = useState<string | null>("スキャンの仕様から決めよう。");
  const [spec, setSpec] = useState<Spec | null>(null);
  const [label, setLabel] = useState<MetaLabel | null>(null);
  const [publish, setPublish] = useState<boolean | null>(null);
  const [registered, setRegistered] = useState<{ label: MetaLabel; publish: boolean }[]>([]);
  const [bouncedNow, setBouncedNow] = useState(false); // the current slot's ticket came back
  const [attempts, setAttempts] = useState(1);

  const restart = () => {
    setAs(newArchiveState());
    setSpec(null); setLabel(null); setPublish(null);
    setRegistered([]);
    setBouncedNow(false);
    setNote("スキャンの仕様から決めよう。");
    setStep("work");
    setAttempts((a) => a + 1);
  };

  const item = as_.idx < ARCHIVE_ITEMS ? as_.items[as_.idx] : null;

  // the archive shelf IS the world: registered thumbnails with honest labels
  const shelf = (
    <div style={{ margin: "6px 14px", background: "#2c3440", borderRadius: 14, padding: "8px 10px", color: "#dfe6ee" }}>
      <div style={{ fontSize: 11, marginBottom: 6 }}>🖥 まちのデジタルアーカイブ（公開だな）</div>
      <div style={{ display: "flex", gap: 8 }}>
        {as_.items.map((it, i) => {
          const reg = registered[i];
          return (
            <div key={it.id} style={{ flex: 1, borderRadius: 8, padding: "6px 4px", textAlign: "center", background: reg ? "#3c4a5c" : "#333b46", border: reg ? "2px solid #7fa8d0" : bouncedNow && i === as_.idx ? "2px solid #c9857a" : "1.5px dashed #55606e", opacity: reg ? 1 : i === as_.idx ? 0.85 : 0.55 }}>
              <div style={{ fontSize: 20 }}>{reg ? "🖼" : bouncedNow && i === as_.idx ? "📄↩" : "⬜"}</div>
              <div style={{ fontSize: 10.5 }}>{it.label}</div>
              {reg && (
                <div style={{ fontSize: 10, marginTop: 2, color: "#b8cbe0" }}>
                  {LABEL_SHELF[reg.label]}
                  <br />
                  {reg.publish ? "🌐 公開" : "🔒 公開ほりゅう"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  if (step === "failed") {
    return (
      <div className="game board-game">
        <div className="result-card"><span className="result-title">登録は、担当がひきついだ</span></div>
        {shelf}
        <p className="game-line center-line">登録票はベテランの机へ。仕様書と見くらべながら、直してくれるそうだ。</p>
        <p className="game-line soft center-line">用途で仕様がきまり、根拠でラベルがきまる。（資料は毎回ちがう）</p>
        <button className="btn primary big" onClick={restart}>🔁 別の登録で</button>
      </div>
    );
  }

  if (step === "done") {
    const perfect = as_.mistakes === 0 && attempts === 1;
    return (
      <div className="game board-game">
        <div className="result-card good"><span className="result-title">3点、アーカイブに登録できた！</span></div>
        {shelf}
        <p className="game-line soft center-line">
          {perfect ? "仕様もラベルも、ひとつも差し戻しなし。" : "登録できた。「わからない」も、大切な記録。"}
        </p>
        <p className="game-line soft center-line">
          {withRuby("100年後のだれかが、この｜メタデータ《めたでーた》（資料の説明がき）をたよりに、写真とまた出会う。")}
        </p>
        <button className="btn primary big" onClick={onComplete}>登録を終える</button>
      </div>
    );
  }

  const ready = spec && label && publish !== null;

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">写真をデジタル化して、登録する（{as_.idx + 1}/{ARCHIVE_ITEMS}）</span>
        <span className="task-sub">まちがえられるのは あと{ARCHIVE_MISTAKE_LIMIT - as_.mistakes - 1}回</span>
      </div>

      {shelf}

      {item && (
        <div style={{ margin: "4px 14px", padding: "7px 10px", borderRadius: 10, background: "#f6f1e3", border: "1.5px solid #d8c9a8", fontSize: 15 }}>
          <b>🖼 {item.label}</b>
          <br />
          用途：{item.purpose === "master" ? "保存用（100年のこす原本データ）" : "閲覧用（ホームページで見せる）"}
          <br />
          調査メモ：{withRuby(item.evidence >= 3 ? "場所の根拠3つ（確定ずみ）" : item.evidence === 2 ? "場所の根拠2つ（｜推定《すいてい》どまり）" : "場所の根拠なし")}
          {item.peopleVisible && <><br />⚠ 人の顔が大きく写っている</>}
        </div>
      )}

      <InfoCards
        label="しごとの資料"
        cards={[{
          id: "rule", icon: "📋", title: "デジタル化の手引き",
          body: (
            <>
              <p>保存用は<strong>TIFF・高dpi</strong>（画質を落とさない）。閲覧用は軽いJPEG。</p>
              <p>ラベルは根拠のぶんだけ。根拠3つ=確定、2つ=推定、なし=ふめい。</p>
              <p>人の顔が大きく写る写真は、すぐ公開しない（公開ほりゅう）。</p>
            </>
          ),
        }]}
      />

      {note && <p className="game-note">{note}</p>}

      <p className="pick-title">① スキャン仕様</p>
      <div className="choice-row">
        {([["tiff_400", "TIFF", "保存用・画質を落とさない"], ["jpeg_light", "JPEG", "閲覧用・軽くて表示がはやい"]] as const).map(([id, l, sub]) => (
          <button key={id} className={`choice-card ${spec === id ? "selected" : ""}`} onClick={() => { setSpec(spec === id ? null : id); setNote(null); }}>
            <span className="choice-name" style={{ fontSize: 13 }}>{l}</span>
            <small style={{ opacity: 0.7 }}>{sub}</small>
          </button>
        ))}
      </div>

      <p className="pick-title">② 撮影地のラベル</p>
      <div className="choice-row">
        {(["confirmed", "probable", "unknown_place"] as const).map((lb) => (
          <button key={lb} className={`choice-card ${label === lb ? "selected" : ""}`} onClick={() => { setLabel(label === lb ? null : lb); setNote(null); }}>
            <span className="choice-name">{LABEL_TEXT[lb]}</span>
            <small style={{ opacity: 0.7 }}>{lb === "confirmed" ? "根拠3つ以上" : lb === "probable" ? "根拠2つ" : "根拠なし"}</small>
          </button>
        ))}
      </div>

      <p className="pick-title">③ 公開する？</p>
      <div className="choice-row">
        {([[true, "🌐 公開"], [false, "🔒 ほりゅう"]] as const).map(([v, l]) => (
          <button key={String(v)} className={`choice-card ${publish === v ? "selected" : ""}`} onClick={() => { setPublish(publish === v ? null : v); setNote(null); }}>
            <span className="choice-name" style={{ fontSize: 13 }}>{l}</span>
          </button>
        ))}
      </div>

      <button
        className="btn primary big"
        disabled={!ready}
        style={ready ? undefined : { opacity: 0.5 }}
        onClick={() => {
          if (!spec || !label || publish === null) return;
          const r = archiveAct(as_, { spec, label, publish });
          setAs(r.state);
          if (r.state.outcome === "mentor_fail") { setStep("failed"); return; }
          if (r.ok) {
            setRegistered((rg) => [...rg, { label, publish }]);
            setSpec(null); setLabel(null); setPublish(null);
            setBouncedNow(false);
            if (r.state.outcome === "done") { setStep("done"); return; }
            setNote(null);
          } else {
            setBouncedNow(true);
            setNote("…登録票が、だまって戻ってきた。");
          }
        }}
      >
        ✅ 登録する
      </button>
    </div>
  );
}
