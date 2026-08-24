// Q1: 学校の引率責任者・教員 (gameType: safety_plan)
// B: 100人を、安全に連れていく体制を組む。
// C: 班の名簿・配慮が必要な子の情報。開かないと、どの班に何が
//    必要かが分からない。
// D: 班へ引率の大人をドラッグ（またはタップ）で割りあてる →
//    先頭・最後尾・救急・連絡先の担当を決める → 安全チェック。
import { useState } from "react";
import type { Q1GameProps } from "./gameTypes";
import InfoCards from "./InfoCards";
import { useDragDrop } from "./useDragDrop";
import { BANDS } from "./tripBands";

interface Adult { id: string; name: string; icon: string }
const ADULTS: Adult[] = [
  { id: "homeroom", name: "担任の先生", icon: "🧑‍🏫" },
  { id: "vice", name: "副担任の先生", icon: "👩‍🏫" },
  { id: "head", name: "学年主任の先生", icon: "🧑‍💼" },
  { id: "nurse", name: "養護の先生", icon: "👨‍⚕️" },
  { id: "parent", name: "保護者代表", icon: "👵" },
];

type Step = "assign" | "roles";

export default function SafetyPlanGame({ onComplete }: Q1GameProps) {
  const [placed, setPlaced] = useState<Record<string, string>>({}); // bandId -> adultId
  const [selected, setSelected] = useState<string | null>(null);
  const [openedDocs, setOpenedDocs] = useState<string[]>([]);
  const [step, setStep] = useState<Step>("assign");
  const [head, setHead] = useState<string | null>(null); // 先頭 adultId
  const [tail, setTail] = useState<string | null>(null); // 最後尾 adultId
  const [medic, setMedic] = useState<string | null>(null); // 救急用品 adultId
  const [contact, setContact] = useState<string | null>(null); // 緊急連絡先 adultId
  const [checked, setChecked] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const put = (adultId: string, bandId: string) => {
    setPlaced((p) => {
      const n: Record<string, string> = {};
      for (const [b, a] of Object.entries(p)) if (a !== adultId && b !== bandId) n[b] = a;
      n[bandId] = adultId;
      return n;
    });
    setSelected(null);
    setNote(null);
  };
  const { drag, startDrag, surfaceProps } = useDragDrop(put, (id) =>
    setSelected(selected === id ? null : id),
  );

  const allAssigned = BANDS.every((b) => placed[b.id]);
  const assignedAdults = ADULTS.filter((a) => Object.values(placed).includes(a.id));

  const docs = [
    { id: "hana", icon: "🥜", title: "花組の情報",
      body: <p>1人、卵と乳製品のアレルギーがある。給食・おやつのたびに、成分の確認が必要。</p> },
    { id: "tsuki", icon: "🚌", title: "月組の情報",
      body: <p>1人、バスに酔いやすい。窓側の席、休憩をこまめに、酔い止めの持参を確認。</p> },
    { id: "map", icon: "🗺", title: "点呼をする場所",
      body: <p>駅・見学先・宿。ここに着いたら必ず人数をかぞえる。</p> },
    { id: "weather", icon: "☀️", title: "当日の天気",
      body: <p>晴れ、最高気温24℃の予報（この計画づくりには直接関係ない）。</p> },
  ];

  const issues: string[] = [];
  if (!allAssigned) issues.push("引率の大人がいない班があるよ。");
  if (!head) issues.push("先頭を歩く担当が決まっていないよ。");
  if (!tail) issues.push("最後尾を歩く担当が決まっていないよ。");
  if (head && tail && head === tail) issues.push("先頭と最後尾、同じ人になっているよ。別の人にしよう。");
  if (!medic) issues.push("救急用品の担当が決まっていないよ。");
  if (!contact) issues.push("緊急連絡先の担当が決まっていないよ。");
  if (!openedDocs.includes("hana")) issues.push("🥜アレルギーの情報を確認していないよ。花組の担当と共有しよう。");
  if (!openedDocs.includes("tsuki")) issues.push("🚌乗り物酔いの情報を確認していないよ。月組の担当と共有しよう。");
  const ok = issues.length === 0;

  if (done) {
    return (
      <div className="game board-game">
        <div className="result-card good">
          <span className="result-title">100人の安全体制ができた！</span>
          <div className="result-rows">
            {BANDS.map((b) => (
              <span key={b.id} className="rrow">
                <b>{b.icon} {b.name}</b>
                <span>{ADULTS.find((a) => a.id === placed[b.id])?.name}</span>
              </span>
            ))}
          </div>
        </div>
        <p className="game-line soft center-line">
          全員そろって出発が、みんなの安心につながる。
        </p>
        <button className="btn primary big" onClick={onComplete}>
          この体制で出発する
        </button>
      </div>
    );
  }

  return (
    <div className="game board-game" {...surfaceProps}>
      <div className="task-bar">
        <span className="task-now">
          {step === "assign" ? "班へ、引率の大人を割りあてよう" : "先頭・最後尾・救急・連絡先を決めよう"}
        </span>
        <span className="task-sub">
          {step === "assign" ? "えらんでから班をタップでも割りあてられる" : "割りあてた5人の中からえらぶ"}
        </span>
      </div>

      {step === "assign" && (
        <>
          <div className="trip-board">
            <div className="venue-grid">
              {BANDS.map((b) => {
                const adultId = placed[b.id];
                const a = ADULTS.find((x) => x.id === adultId);
                return (
                  <button
                    key={b.id}
                    className={`venue-cell ${a ? "filled" : ""} ${drag || selected ? "ready" : ""}`}
                    data-drop={b.id}
                    onClick={() => {
                      if (selected) { put(selected, b.id); return; }
                      if (adultId) {
                        setPlaced((p) => { const n = { ...p }; delete n[b.id]; return n; });
                        setSelected(adultId);
                      }
                    }}
                  >
                    <span>{a ? a.icon : b.icon}</span>
                    <small>{b.name}{a ? `・${a.name}` : ""}</small>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="choice-row wrap">
            {ADULTS.filter((a) => !Object.values(placed).includes(a.id)).map((a) => (
              <button
                key={a.id}
                className={`venue-item drag-item ${selected === a.id ? "selected" : ""}`}
                onPointerDown={startDrag(a.id)}
              >
                <span className="choice-emoji">{a.icon}</span>
                <span className="choice-name">{a.name}</span>
              </button>
            ))}
          </div>
          {note && <p className="game-note">{note}</p>}
          <InfoCards cards={docs} label="こまったら見る資料" onOpen={(id) => setOpenedDocs((o) => (o.includes(id) ? o : [...o, id]))} />
          <button
            className="btn primary big"
            disabled={!allAssigned}
            onClick={() => setStep("roles")}
          >
            {allAssigned ? "つぎへ：役割を決める" : "5つの班へ、大人を割りあてよう"}
          </button>
        </>
      )}

      {step === "roles" && (
        <>
          <div className="stack">
            {([
              ["先頭を歩く", head, setHead, "🚩"],
              ["最後尾を歩く", tail, setTail, "🔚"],
              ["救急用品を持つ", medic, setMedic, "🩹"],
              ["緊急連絡先を持つ", contact, setContact, "☎️"],
            ] as const).map(([label, val, setter, icon]) => (
              <div key={label} className="trip-role-row">
                <span className="trip-role-label">{icon} {label}</span>
                <div className="choice-row wrap">
                  {assignedAdults.map((a) => (
                    <button
                      key={a.id}
                      className={`btn choice ${val === a.id ? "on" : ""}`}
                      onClick={() => setter(val === a.id ? null : a.id)}
                    >
                      <span className="tweak-check">{val === a.id ? "✓" : "＋"}</span>
                      <span className="tweak-body"><b>{a.icon} {a.name}</b></span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {checked && issues.length > 0 && (
            <div className="sched-issues">{issues.map((i) => <p key={i}>{i}</p>)}</div>
          )}
          <InfoCards cards={docs} label="こまったら見る資料" onOpen={(id) => setOpenedDocs((o) => (o.includes(id) ? o : [...o, id]))} />
          {!ok ? (
            <button
              className="btn primary big"
              onClick={() => setChecked(true)}
            >
              ▶ 安全チェックをする
            </button>
          ) : (
            <button className="btn primary big" onClick={() => setDone(true)}>
              この体制で出発する！
            </button>
          )}
        </>
      )}

      {drag && (
        <div className="drag-ghost" style={{ left: drag.x, top: drag.y }}>
          {ADULTS.find((a) => a.id === drag.id)?.icon}
        </div>
      )}
    </div>
  );
}
