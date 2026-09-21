// CAREER PATH — optional, reached only from KNOW THE JOB, never forced into the
// main flow. Three stepping stones plus the two things that are genuinely easy
// to get wrong. Source: src/data/careerPaths.ts "nutrition" (文部科学省 中教審
// 「栄養教諭免許制度の概要」ほか). The detailed institutional differences stay
// in that data file, not on a child's screen.
import { COPY } from "../copy";
import { useScreenFocus } from "../useScreenFocus";

export default function CareerPath({ onBack }: { onBack: () => void }) {
  const focusRef = useScreenFocus<HTMLElement>();
  return (
    <section ref={focusRef} tabIndex={-1} className="v2s v2s-career" aria-label={COPY.career.title}>
      <h1 className="v2s-career-title">{COPY.career.title}</h1>
      <ol className="v2s-steps">
        {COPY.career.steps.map((step, i) => (
          <li key={step.id} className="v2s-step" style={{ animationDelay: `${i * 120}ms` }}>
            <span className="v2s-step-stone" aria-hidden="true" />
            <span className="v2s-step-body">
              <b>{step.label}</b>
              <span>{step.line}</span>
            </span>
          </li>
        ))}
      </ol>
      <div className="v2s-notes">
        {COPY.career.notes.map((n) => <p key={n}>{n}</p>)}
      </div>
      <button type="button" className="v2s-btn" onClick={onBack}>{COPY.career.back}</button>
    </section>
  );
}
