// JOB REVEAL — shown only after CLEAR (spec §11). Strings from ../copy.ts only.
// TEMP_IMPLEMENTATION_ONLY layout; visual + final wording are DESIGN_NEEDED (DN-08).
import { COPY } from "../copy";

export default function JobReveal({ onNext }: { onNext: () => void }) {
  return (
    <section className="lsc lsc-reveal">
      <p className="lmp-temp">{COPY.dev.temp}</p>
      <div className="lsc-visual lmp-ph">{COPY.dev.revealVisual}</div>
      <p className="lsc-lead">{COPY.reveal.lead}</p>
      <p className="lsc-line">{COPY.reveal.line}</p>
      <h2 className="lsc-job">{COPY.reveal.jobName}</h2>
      <button type="button" className="lsc-next" onClick={onNext}>{COPY.reveal.next}</button>
    </section>
  );
}
