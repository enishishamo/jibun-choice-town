// Q1: 動物栄養担当・餌づくり (gameType: feed_prep)
// 核: 「表は規則、日誌は今日のデータ」— 日量表の規則を今朝の体重・授乳メモに
// 当てはめて量を導き、在庫の競合は授乳中の母を優先して組み立てる。
// ルールは src/q1/zooLogic.ts（規則×データ導出・パンはデコイ・提供は状態機械）。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import { FEED_REDO_LIMIT, SIZE_COST, BABY_MILK_LINE, newFeedState, feedServe, feedExpected, feedValidate } from "./zooLogic";
import type { FeedState, FeedAnimal, FeedItem, FeedSize, FeedTrays } from "./zooLogic";

const ANIMAL_LABEL: Record<FeedAnimal, string> = { mother: "🐼 母（じゅにゅう中）", baby: "🍼 赤ちゃん", goat: "🐐 ヤギ" };
const ITEM_LABEL: Record<FeedItem, string> = { bamboo: "🎋 竹", milk: "🍼 特別ミルク", hay: "🌾 干し草", veg: "🥬 野菜", pellet: "🟤 ペレット", bread: "🍞 パン" };
const SLOTS: Record<FeedAnimal, number> = { mother: 2, baby: 1, goat: 2 };

type Step = "work" | "failed" | "done";
const emptyTrays = (): FeedTrays => ({
  mother: [{ item: null, size: null }, { item: null, size: null }],
  baby: [{ item: null, size: null }],
  goat: [{ item: null, size: null }, { item: null, size: null }],
});

export default function FeedPrepGame({ onComplete }: Q1GameProps) {
  const [fs, setFs] = useState<FeedState>(() => newFeedState());
  const [trays, setTrays] = useState<FeedTrays>(emptyTrays);
  const [sel, setSel] = useState<{ animal: FeedAnimal; slot: number } | null>(null);
  const [step, setStep] = useState<Step>("work");
  const [note, setNote] = useState<string | null>("トレイを選んで、食材をのせよう。");
  const [faultTray, setFaultTray] = useState<FeedAnimal | null>(null);
  const [attempts, setAttempts] = useState(1);
  const c = fs.c;

  const restart = () => {
    setFs(newFeedState());
    setTrays(emptyTrays());
    setSel(null);
    setNote("トレイを選んで、食材をのせよう。");
    setFaultTray(null);
    setStep("work");
    setAttempts((a) => a + 1);
  };

  // Staged feedback (SHOW, don't explain): on a rejection the senior silently
  // POINTS at one tray — which tray is wrong, never why. Found by validating
  // each tray in isolation against a board where the others are correct.
  const findFaultTray = (t: FeedTrays): FeedAnimal | null => {
    const exp = feedExpected(fs.c);
    for (const a of ["mother", "baby", "goat"] as FeedAnimal[]) {
      const probe = { ...exp, [a]: t[a] } as FeedTrays;
      if (feedValidate(fs.c, probe) !== null) return a;
    }
    return null;
  };

  const usedUnits = (item: FeedItem) =>
    (Object.keys(trays) as FeedAnimal[]).flatMap((a) => trays[a]).filter((s) => s.item === item).reduce((sum, s) => sum + (s.size ? SIZE_COST[s.size] : 0), 0);

  if (step === "failed") {
    return (
      <div className="game board-game">
        <div className="result-card"><span className="result-title">今朝は、先輩と作り直し</span></div>
        <p className="game-line center-line">差し戻しが続いたので、先輩と一緒に「規則を今日のデータに当てはめる」ところからやり直したよ。</p>
        <p className="game-line soft center-line">表の規則 × 今朝の日誌 × 在庫、の3点で組むのがコツ。（体重も授乳メモも毎朝ちがう）</p>
        <button className="btn primary big" onClick={restart}>🔁 明日の朝にもう一度</button>
      </div>
    );
  }

  if (step === "done") {
    const perfect = fs.redos === 0 && attempts === 1;
    return (
      <div className="game board-game">
        <div className="result-card good"><span className="result-title">3にんぶんの朝ごはん、提供完了！</span></div>
        <p className="game-line soft center-line">
          {perfect
            ? "一発合格。規則を今日のデータに当てはめ、在庫の競合まで読めていた。"
            : `差し戻し${fs.redos}回${attempts > 1 ? `・${attempts}朝目で完成` : ""}。提供前の自分の照合が最後の砦。`}
        </p>
        <p className="game-line soft center-line">
          動物園には人間の給食のような「飼料日量表」がある。餌づくりは料理だけじゃなく、
          計量・在庫・備蓄まで扱う<strong>食の管理者</strong>の仕事なんだ。
        </p>
        <button className="btn primary big" onClick={onComplete}>台車で配りに行く</button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">朝の餌づくり：3にんぶん</span>
        <span className="task-sub">差し戻しにできるのは あと{FEED_REDO_LIMIT - fs.redos - 1}回</span>
      </div>

      <p className="game-note" style={{ margin: "4px 14px" }}>
        📔 今朝の日誌：赤ちゃんの体重 <strong>{c.cond.babyWeighin}g</strong> ・ 母の授乳は
        {c.cond.motherNursing === "strong" ? "「よく飲ませている（多め）」" : "「ふつう」"}
        （野菜が全員ぶん足りるかは、<strong>在庫の数字を自分で数えて</strong>）
      </p>

      {(Object.keys(trays) as FeedAnimal[]).map((a) => (
        <div
          key={a}
          style={{
            margin: "6px 14px", display: "flex", alignItems: "center", gap: 8,
            borderRadius: 10, padding: "2px 4px",
            border: faultTray === a ? "2px solid #d9744a" : "2px solid transparent",
            boxShadow: faultTray === a ? "0 0 10px rgba(217,116,74,0.55)" : "none",
            transition: "box-shadow 0.4s",
          }}
        >
          <span style={{ fontSize: 13, width: 132 }}>{faultTray === a ? "👉 " : ""}{ANIMAL_LABEL[a]}</span>
          {trays[a].slice(0, SLOTS[a]).map((s, i) => (
            <button
              key={i}
              onClick={() => { setSel({ animal: a, slot: i }); setNote(null); setFaultTray(null); }}
              style={{
                minWidth: 84, height: 44, borderRadius: 10,
                border: sel && sel.animal === a && sel.slot === i ? "3px solid #4a90d9" : "2px dashed #c9bfa8",
                background: s.item ? "#fdf6e5" : "#f4efe2", fontSize: 12,
              }}
            >
              {s.item ? `${ITEM_LABEL[s.item]} ${s.size}` : "＋のせる"}
            </button>
          ))}
        </div>
      ))}

      <p className="pick-title">{sel ? `${ANIMAL_LABEL[sel.animal]} のトレイへ` : "トレイを選んでから、食材を"}</p>
      <div className="choice-row wrap">
        {(Object.keys(ITEM_LABEL) as FeedItem[]).flatMap((item) =>
          (["S", "M"] as FeedSize[]).map((size) => {
            const left = c.stock[item] - usedUnits(item);
            return (
              <button
                key={item + size}
                className="choice-card"
                style={{ opacity: sel ? 1 : 0.5, minWidth: 96 }}
                onClick={() => {
                  if (!sel) { setNote("先にトレイを選ぼう。"); return; }
                  if (left < SIZE_COST[size]) { setNote("その量をのせる在庫が残っていない。"); return; }
                  setTrays((t) => ({ ...t, [sel.animal]: t[sel.animal].map((x, k) => (k === sel.slot ? { item, size } : x)) }));
                  setSel(null);
                }}
              >
                <span className="choice-name">{ITEM_LABEL[item]} {size}</span>
                <small style={{ opacity: 0.65 }}>在庫のこり {Math.max(0, left)}</small>
              </button>
            );
          }),
        )}
      </div>

      <InfoCards
        label="しごとの資料"
        cards={[{
          id: "table", icon: "📋", title: "飼料日量表（規則）",
          body: (
            <>
              <p><strong>🐼 母：</strong>竹M ＋ 野菜。<strong>「よく飲ませている」メモの朝は野菜M、ふつうならS</strong>（授乳は増量が必要）。</p>
              <p><strong>🍼 赤ちゃん：</strong>特別ミルクのみ。<strong>今朝の体重が{BABY_MILK_LINE}g以上ならM、未満ならS</strong>。</p>
              <p><strong>🐐 ヤギ：</strong>干し草M ＋ 野菜S。<strong>野菜が足りない朝だけ</strong>ペレットSで代わりにできる。</p>
              <p><strong>きまり：</strong>足りない食材は<strong>じゅにゅう中の母を優先</strong>。足りているのに代わりを使わない。
                表にないもの（パンなど）は出さない。</p>
            </>
          ),
        }]}
      />

      {note && <p className="game-note">{note}</p>}

      <button
        className="btn primary big"
        onClick={() => {
          const { state } = feedServe(fs, trays);
          setFs(state);
          if (state.outcome === "done") { setStep("done"); return; }
          if (state.outcome === "mentor_fail") { setStep("failed"); return; }
          // staged: the senior shakes their head and points at ONE tray.
          // The reason is never spoken — re-derive it from the table & diary.
          setFaultTray(findFaultTray(trays));
          setNote("先輩は首を横にふって、トレイをひとつ指さした。理由は言ってくれない。");
        }}
      >
        ✅ 自分で見直して、提供する
      </button>
    </div>
  );
}
