// Q1: 添乗員・旅程管理担当 (gameType: delay_recover)
// B: 新幹線が遅れて、見学先・バス・宿の予定がつながって崩れそう。
// C: 何がどうつながって崩れるかを見せる影響マップ。学校の最終判断は
//    添乗員がひとりで決めるものではない、という制約もここに含む。
// D: 「状況確認→連絡→変更案→学校の承認→共有」の順で、行動カードを
//    ならべる。安全確認や学校連絡をとばした案は成立しない。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";

interface Action { id: string; name: string; icon: string; must?: boolean }
const ACTIONS: Action[] = [
  { id: "check", name: "状況を確認する", icon: "🔍", must: true },
  { id: "notify_school", name: "学校へ状況を伝える", icon: "🏫", must: true },
  { id: "notify_site", name: "見学先へ連絡する", icon: "⛩️" },
  { id: "notify_bus", name: "バスへ連絡する", icon: "🚌" },
  { id: "notify_hotel", name: "宿へ連絡する", icon: "🏮" },
  { id: "plan_swap", name: "見学の順番を入れかえる", icon: "🔀" },
  { id: "plan_short", name: "自由時間を短くする", icon: "⏱️" },
  { id: "plan_dinner", name: "夕食の時間をずらす", icon: "🍚" },
  { id: "approve", name: "学校の承認を得る", icon: "✅", must: true },
  { id: "share", name: "全員へ確定内容を共有する", icon: "📣", must: true },
];
const PLAN_IDS = ["plan_swap", "plan_short", "plan_dinner"];
const NOTIFY_IDS = ["notify_site", "notify_bus", "notify_hotel"];
const PLAN_LABEL: Record<string, string> = {
  plan_swap: "見学の順番を入れかえて",
  plan_short: "自由時間を短くして",
  plan_dinner: "夕食の時間をずらして",
};

const IMPACTS = [
  { id: "site", icon: "⛩️", name: "見学先", text: "予約していた時間に間に合わない" },
  { id: "bus", icon: "🚌", name: "バス", text: "駅での待ち時間が長くなる" },
  { id: "hotel", icon: "🏮", name: "宿", text: "夕食の時間が後ろにずれこむ" },
];

export default function DelayRecoverGame({ onComplete }: Q1GameProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [line, setLine] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= line.length) return;
    const n = [...line];
    [n[i], n[j]] = [n[j], n[i]];
    setLine(n);
    setNote(null);
  };
  const pool = ACTIONS.filter((a) => !line.includes(a.id));

  if (!confirmed) {
    return (
      <div className="game board-game">
        <div className="task-bar">
          <span className="task-now">新幹線が、30分おくれるという放送があった</span>
          <span className="task-sub">まず、状況を見てみよう</span>
        </div>
        <div className="stack">
          {IMPACTS.map((i) => (
            <div key={i.id} className="trip-impact-row">
              <span className="trip-impact-icon">{i.icon}</span>
              <span className="trip-impact-body">
                <b>{i.name}</b>
                <small>⚠️ {i.text}</small>
              </span>
            </div>
          ))}
        </div>
        <p className="game-line soft center-line">
          1つの遅れが、見学先・バス・宿の予定へつながっている。
        </p>
        <button className="btn primary big" onClick={() => setConfirmed(true)}>
          状況を確認した
        </button>
      </div>
    );
  }

  if (done) {
    const plans = line.filter((id) => PLAN_IDS.includes(id)).map((id) => PLAN_LABEL[id]);
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">予定を、つなぎ直せた！</span>
          <p className="join-conclusion">
            学校の承認のもと、{plans.join("・")}対応した。
          </p>
          <div className="result-rows">
            {line.map((id) => {
              const a = ACTIONS.find((x) => x.id === id)!;
              return <span key={id} className="rrow"><b>{a.icon} {a.name}</b></span>;
            })}
          </div>
        </div>
        <p className="game-line soft center-line">
          添乗員だけでは決めない。学校・見学先・バス・宿、みんなへつなぎ直す仕事。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          みんなに知らせる
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game">
      <div className="task-bar">
        <span className="task-now">やることを、順番にならべよう</span>
        <span className="task-sub">タップで追加、↑↓でならべかえ</span>
      </div>

      <div className="timeline">
        {line.length === 0 && <p className="trip-day-empty">ここに行動カードがならぶ</p>}
        {line.map((id, i) => {
          const a = ACTIONS.find((x) => x.id === id)!;
          return (
            <div key={id} className="tl-item">
              <div className="tl-row">
                <b>{i + 1}</b>
                <span className="tl-name">{a.icon} {a.name}</span>
                <span className="tl-ctrl">
                  <button className="tl-btn" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                  <button className="tl-btn" onClick={() => move(i, 1)} disabled={i === line.length - 1}>↓</button>
                  <button
                    className="tl-btn del"
                    onClick={() => { setLine(line.filter((x) => x !== id)); setNote(null); }}
                  >×</button>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {pool.length > 0 && (
        <div className="act-pool">
          <span className="doc-label">🗂 使える行動カード</span>
          <div className="choice-row wrap">
            {pool.map((a) => (
              <button
                key={a.id}
                className="act-card"
                onClick={() => { setLine([...line, a.id]); setNote(null); }}
              >
                <span className="choice-emoji">{a.icon}</span>
                <span className="act-name">{a.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {note && <p className="game-note">{note}</p>}

      <button
        className="btn primary big"
        onClick={() => {
          if (line[0] !== "check") { setNote("まず状況を確認するところから始めよう。"); return; }
          if (!line.includes("notify_school")) { setNote("学校への連絡が抜けているよ。"); return; }
          const notifyCount = line.filter((id) => NOTIFY_IDS.includes(id)).length;
          if (notifyCount < 2) { setNote("見学先・バス・宿。関係する先へ連絡できているかな？"); return; }
          const planCount = line.filter((id) => PLAN_IDS.includes(id)).length;
          if (planCount < 1) { setNote("このままでは間に合わない。変更案を考えよう。"); return; }
          const approveIdx = line.indexOf("approve");
          const shareIdx = line.indexOf("share");
          if (approveIdx === -1) { setNote("学校の承認を得るところが抜けているよ。"); return; }
          if (shareIdx === -1) { setNote("最後に、みんなへ共有することを忘れずに。"); return; }
          if (shareIdx !== line.length - 1) { setNote("共有する前に、学校の承認を得られているか、順番をたしかめよう。"); return; }
          const lastPlanIdx = Math.max(...line.map((id, i) => (PLAN_IDS.includes(id) ? i : -1)));
          if (approveIdx < lastPlanIdx) { setNote("変更案を決めてから、学校の承認を得よう。"); return; }
          setNote(null);
          setDone(true);
        }}
      >
        ▶ この対応でいく
      </button>
    </div>
  );
}
