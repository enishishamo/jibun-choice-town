// Q2: know the job. Card-based — open only what looks interesting.
// Also keeps a visible (but quiet) slot for future Q3 "meet a person".
import { withRuby } from "../lib/ruby";
import { useState } from "react";
import { getProfession } from "../data";
import type { Screen } from "../state/GameState";
import { useGame } from "../state/GameState";

export default function ProfessionScreen({
  professionId,
  back,
}: {
  professionId: string;
  back: Screen;
}) {
  const { navigate } = useGame();
  const [open, setOpen] = useState<string | null>(null);
  const profession = getProfession(professionId);
  if (!profession) return null;

  return (
    <div className="screen profession">
      <button className="back-link" onClick={() => navigate(back)}>
        ← もどる
      </button>

      <div className="prof-header">
        <img src={profession.image} alt="" />
        <div>
          <h2>{profession.name}</h2>
          <p className="prof-catch">{profession.catch}</p>
        </div>
      </div>

      <p className="prof-hint">気になるカードだけ、ひらいてみよう。</p>

      <div className="q2-grid">
        {profession.q2.map((card) => {
          const isOpen = open === card.id;
          return (
            <button
              key={card.id}
              className={`q2-card ${isOpen ? "open" : ""}`}
              onClick={() => setOpen(isOpen ? null : card.id)}
            >
              <span className="q2-card-head">
                <span className="q2-icon">{card.icon}</span>
                <span className="q2-title">{card.title}</span>
                <span className="q2-toggle">{isOpen ? "−" : "+"}</span>
              </span>
              {isOpen && (
                <span className="q2-body">
                  {card.body.map((p) => (
                    <span key={p} className="q2-para">{withRuby(p)}</span>
                  ))}
                  {card.flow && (
                    <span className="q2-flow">
                      {card.flow.map((s, i) => (
                        <span key={s} className="q2-flow-step">
                          {i > 0 && <span className="q2-flow-arrow">↓</span>}
                          <span>{s}</span>
                        </span>
                      ))}
                    </span>
                  )}
                  {card.list && (
                    <span className="q2-list">
                      {card.list.map((li) => (
                        <span key={li} className="q2-li">・{li}</span>
                      ))}
                    </span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="related">
        <span className="related-title">似ている仕事</span>
        <div className="related-chips">
          {profession.related.map((r) => (
            <span key={r} className="chip static">{r}</span>
          ))}
        </div>
      </div>

      {/* Q3 placeholder: professions will later link to real people. */}
      <div className="q3-teaser">
        🎤 この仕事の人に話を聞く（じゅんびちゅう）
      </div>
    </div>
  );
}
