// Shared C-layer component: openable "work documents" whose CONTENT is
// what the child needs to make the D decision. Games can track which
// cards were opened (e.g. to unlock ideas) via onOpen.
import { useState } from "react";
import type { ReactNode } from "react";

export interface InfoCard {
  id: string;
  icon: string;
  title: string;
  body: ReactNode;
}

export default function InfoCards({
  cards,
  onOpen,
  label = "しごとの資料",
}: {
  cards: InfoCard[];
  onOpen?: (id: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="doc-stack">
      <span className="doc-label">📚 {label}（タップでひらく）</span>
      {cards.map((c) => {
        const isOpen = open === c.id;
        return (
          <div key={c.id} className={`doc-card ${isOpen ? "open" : ""}`}>
            <button
              className="doc-head"
              onClick={() => {
                setOpen(isOpen ? null : c.id);
                if (!isOpen) onOpen?.(c.id);
              }}
            >
              <span className="doc-icon">{c.icon}</span>
              <span className="doc-title">{c.title}</span>
              <span className="doc-toggle">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen && <div className="doc-body">{c.body}</div>}
          </div>
        );
      })}
    </div>
  );
}
