// 好きの種 — what was interesting, phrased as an ACTION, never as a job and
// never as a verdict about the child. Nothing here is scored or classified.
import { useState } from "react";
import { COPY } from "../copy";

export default function SeedPick({ onDone }: { onDone: (seedId: string) => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <section className="v2s v2s-seed" aria-label={COPY.seed.question}>
      <h1 className="v2s-seed-q">{COPY.seed.question}</h1>
      <div className="v2s-seed-list" role="radiogroup" aria-label={COPY.seed.question}>
        {COPY.seed.options.map((o, i) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={picked === o.id}
            className={`v2s-seed-opt ${picked === o.id ? "on" : ""}`}
            style={{ animationDelay: `${i * 90}ms` }}
            onClick={() => setPicked(o.id)}
          >
            <span className="v2s-seed-sprout" aria-hidden="true" />
            {o.label}
          </button>
        ))}
      </div>
      <button type="button" className="v2s-btn" disabled={!picked} onClick={() => picked && onDone(picked)}>
        {COPY.seed.done}
      </button>
    </section>
  );
}
