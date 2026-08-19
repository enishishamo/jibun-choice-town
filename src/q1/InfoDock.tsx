// Shared "professional's tools" dock for Q1 games.
// Tapping a tool shows that profession's viewpoint on the current
// situation — judgment material, not a hint button. Games can inject
// situation-dependent lines via `extra`.
import { useState } from "react";
import type { ReactNode } from "react";
import type { ToolInfo } from "../data/types";

export default function InfoDock({
  tools,
  extra,
}: {
  tools: ToolInfo[];
  extra?: (toolId: string) => ReactNode;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const active = tools.find((t) => t.id === open);
  return (
    <div className="infodock">
      <div className="tool-dock">
        {tools.map((t) => (
          <button
            key={t.id}
            className={`dock-btn ${open === t.id ? "active" : ""}`}
            onClick={() => setOpen(open === t.id ? null : t.id)}
          >
            {t.image ? <img src={t.image} alt="" /> : <span>{t.emoji}</span>}
            <small>{t.name}</small>
          </button>
        ))}
      </div>
      {active && (
        <div className="tool-panel">
          <p>
            {active.emoji ?? "🔧"} <strong>{active.name}</strong>
          </p>
          <p>{active.desc}</p>
          {extra?.(active.id)}
        </div>
      )}
    </div>
  );
}
