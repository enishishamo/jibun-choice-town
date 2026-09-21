// CLEAR → the lunch has arrived at the school. Only now does the game name the
// job (PLAY FIRST: the job name never appears before the child has done it).
// Three beats, paced by timers, never by a wall of text.
import { useEffect, useState } from "react";
import Art from "../Art";
import { COPY } from "../copy";

export default function JobReveal({ art, onNext }: { art?: string; onNext: () => void }) {
  const [beat, setBeat] = useState(-1);
  // beat -1 -> the hook line, 1 -> the job name, 2 -> the line, 3 -> the way on
  useEffect(() => {
    const t = [
      window.setTimeout(() => setBeat(1), 800),
      window.setTimeout(() => setBeat(2), 1700),
      window.setTimeout(() => setBeat(3), 2300),
    ];
    return () => t.forEach(clearTimeout);
  }, []);
  return (
    <section className="v2s v2s-reveal" aria-label={COPY.reveal.job}>
      <div className="v2s-reveal-stage">
        <Art src={art} className="v2s-reveal-art" fallback={<span className="v2s-reveal-ph" aria-hidden="true" />} />
      </div>
      <p className="v2s-reveal-lead in">{COPY.reveal.lead}</p>
      <h1 className={`v2s-reveal-job ${beat >= 1 ? "in" : ""}`}>{COPY.reveal.job}</h1>
      <p className={`v2s-reveal-line ${beat >= 2 ? "in" : ""}`}>{COPY.reveal.line}</p>
      {beat >= 3 && (
        <button type="button" className="v2s-btn v2s-reveal-next in" onClick={onNext}>
          {COPY.reveal.next}
        </button>
      )}
    </section>
  );
}
