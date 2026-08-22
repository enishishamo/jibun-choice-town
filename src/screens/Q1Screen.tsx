// Shared Q1 shell: intro (A+B) -> game (C+D, from registry) ->
// discovery (E + 行為→仕事の接続 + 「好きの種」1問).
// The A-E letters are never shown to the child.
// This outer flow (event -> Q1 -> discovery -> seed -> Q2) is common to
// every profession; only the game inside differs.
import { useState } from "react";
import { getEvent, getExperience, getProfession } from "../data";
import { gameRegistry } from "../q1/registry";
import { useGame } from "../state/GameState";

const A = (n: string) => `${import.meta.env.BASE_URL}assets/${n}.png`;

type Phase = "intro" | "game" | "discovery";

export default function Q1Screen({ experienceId }: { experienceId: string }) {
  const { navigate, completeExperience, hasCompleted, hasDiscovered, recordSeed } = useGame();
  const [phase, setPhase] = useState<Phase>("intro");
  // Remember whether this profession was new BEFORE we record completion,
  // so the discovery card can still show its NEW! moment.
  const [wasNew, setWasNew] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [seedDone, setSeedDone] = useState(false);

  const exp = getExperience(experienceId);
  const profession = exp && getProfession(exp.professionId);
  const event = exp && getEvent(exp.eventId);
  if (!exp || !profession || !event) return null;

  const Game = gameRegistry[exp.gameType];
  const rediscovery = !wasNew && hasDiscovered(profession.id);

  if (phase === "intro") {
    return (
      <div className="screen world-screen">
        <div className="q1-intro-scene">
          <button className="back-chip" onClick={() => navigate({ name: "area", eventId: exp.eventId })}>
            ← もどる
          </button>
          {exp.place.image && (
            <div className="q1-place-stage">
              <img
                className="q1-place-img"
                src={exp.place.image}
                alt={exp.place.name}
                style={{
                  objectFit: exp.place.fit ?? "cover",
                  objectPosition: exp.place.focus ?? "center",
                }}
              />
              <span className="place-tag">{exp.place.name}</span>
            </div>
          )}
          <div className="mission-card">
            <img className="mission-fire" src={A("ui-fire")} alt="" />
            <h2 className="mission-title">{exp.mission.title}</h2>
            {exp.mission.lines.map((l) => (
              <p key={l} className="mission-line">{l}</p>
            ))}
          </div>
          <button className="btn primary big" onClick={() => setPhase("game")}>
            やってみる！
          </button>
        </div>
      </div>
    );
  }

  if (phase === "game") {
    return (
      <div className="screen q1">
        <button className="back-link" onClick={() => setPhase("intro")}>← もどる</button>
        <Game
          experience={exp}
          hasCompleted={hasCompleted}
          onComplete={() => {
            setWasNew(!hasDiscovered(profession.id));
            completeExperience(exp.id, profession.id);
            setPhase("discovery");
          }}
        />
      </div>
    );
  }

  // ---------- discovery: E → きみがやったこと → 職業名 → 好きの種 ----------
  return (
    <div className="screen discovery-stage">
      <div className="discovery-glow" />
      <img className="discovery-sparkle s1" src={A("ui-sparkle")} alt="" />
      <img className="discovery-sparkle s2" src={A("ui-sparkle")} alt="" />

      <span className="e-chip">
        🎉 {exp.resolution.clock && `${exp.resolution.clock}　`}
        {exp.resolution.title}
      </span>

      <div className="discovery-hero-wrap">
        {!rediscovery && <img className="discovery-new" src={A("ui-new")} alt="NEW!" />}
        <img className="discovery-hero" src={profession.image} alt="" />
      </div>

      <p className="discovery-echo">{exp.discoveryEcho}</p>
      <p className="discovery-lead">きみが今やっていたのは……</p>
      <h2 className="discovery-name-big">{profession.name}</h2>
      {!rediscovery && <p className="discovery-zukan">📖 しごと図鑑に追加された！</p>}

      <div className="seed-box">
        <span className="seed-title">どこが、ちょっと面白かった？</span>
        {!seedDone ? (
          <>
            <span className="seed-sub">いくつでもえらべるよ</span>
            <div className="seed-chips">
              {exp.seeds.map((s) => (
                <button
                  key={s}
                  className={`seed-chip ${picked.includes(s) ? "on" : ""}`}
                  onClick={() =>
                    setPicked((p) =>
                      p.includes(s) ? p.filter((x) => x !== s) : [...p, s],
                    )
                  }
                >
                  {picked.includes(s) ? "✓ " : ""}
                  {s}
                </button>
              ))}
            </div>
            <button
              className="btn primary seed-done"
              disabled={picked.length === 0}
              onClick={() => {
                recordSeed(exp.id, picked);
                setSeedDone(true);
              }}
            >
              えらんだ
            </button>
          </>
        ) : (
          <p className="seed-reply">
            {picked.length === 1 && picked[0] === "特にない"
              ? "OK！また今度、べつの場所ものぞいてみてね。"
              : `「${picked.filter((p) => p !== "特にない").join("」「")}」が気になったんだね。おぼえておくね。`}
          </p>
        )}
      </div>

      {seedDone && (
        <div className="stack discovery-actions">
          <button
            className="btn primary"
            onClick={() =>
              navigate({
                name: "profession",
                professionId: profession.id,
                back: { name: "area", eventId: exp.eventId },
              })
            }
          >
            もっと知る
          </button>
          <button className="btn" onClick={() => navigate({ name: "area", eventId: exp.eventId })}>
            この場所をもう少し探す
          </button>
          <button className="btn ghost" onClick={() => navigate({ name: "home" })}>
            街にもどる
          </button>
        </div>
      )}
    </div>
  );
}
