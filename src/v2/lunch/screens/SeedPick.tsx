// 好きの種 — pick ONE 行為 that felt fun (spec §12). Never an aptitude question.
// Strings from ../copy.ts only. TEMP_IMPLEMENTATION_ONLY layout; icons + wording DESIGN_NEEDED (DN-09).
import { useState } from "react";
import { COPY } from "../copy";

export default function SeedPick({ onDone }: { onDone: (seedId: string) => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <section className="lsc lsc-seed">
      <p className="lmp-temp">{COPY.dev.temp}</p>
      <p className="lsc-lead">{COPY.seed.question}</p>
      <div className="lsc-seeds">
        {COPY.seed.options.map((o) => (
          <button key={o.id} type="button" className={`lsc-seed-btn ${picked === o.id ? "on" : ""}`} onClick={() => setPicked(o.id)}>
            <span className="lsc-seed-icon lmp-ph">{COPY.dev.needed("DN-09")}</span>
            {o.label}
          </button>
        ))}
      </div>
      <button type="button" className="lsc-next" disabled={!picked} onClick={() => picked && onDone(picked)}>
        {COPY.seed.done}
      </button>
    </section>
  );
}
