// JOB REVEAL — shown only after CLEAR (spec §11). Text from copy.ts only.
// TEMP_IMPLEMENTATION_ONLY layout; visual + final wording are DESIGN_NEEDED (DN-08).
import { COPY } from "../copy";

export default function JobReveal({ onNext }: { onNext: () => void }) {
  return (
    <section className="lsc lsc-reveal" aria-label="job reveal">
      <p className="lmp-temp">TEMP_IMPLEMENTATION_ONLY</p>
      <div className="lsc-visual lmp-ph">DESIGN_NEEDED DN-08</div>
      <p className="lsc-lead">{COPY.reveal.lead}</p>
      <p className="lsc-line">{COPY.reveal.line}</p>
      <h2 className="lsc-job">{COPY.reveal.jobName}</h2>
      <button type="button" className="lsc-next" onClick={onNext}>{COPY.reveal.next}</button>
    </section>
  );
}
