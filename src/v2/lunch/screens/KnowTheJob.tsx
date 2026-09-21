// KNOW THE JOB — the three sides of the job, as places you touch rather than
// cards you read. Tapping a place opens one sentence about it; nothing is open
// at the start, so the screen is a small world, not an article.
// Content: Ver.1 src/data/content/schoolLunch.ts (frozen) + the Ver.2 facts set.
import { useState } from "react";
import PlaceMark, { type PlaceId } from "../PlaceMark";
import { COPY } from "../copy";
import { useScreenFocus } from "../useScreenFocus";

export default function KnowTheJob({ onCareer, onNext }: {
  onCareer: () => void;
  onNext: () => void;
}) {
  const focusRef = useScreenFocus<HTMLElement>();
  const [open, setOpen] = useState<string | null>(null);
  const [seen, setSeen] = useState<Set<string>>(() => new Set());
  const touch = (id: string) => {
    setOpen((cur) => (cur === id ? null : id));
    setSeen((cur) => new Set(cur).add(id));
  };
  return (
    <section ref={focusRef} tabIndex={-1} className="v2s v2s-know" aria-label={COPY.know.title}>
      <h1 className="v2s-know-title">{COPY.know.title}</h1>
      <p className="v2s-know-hint">{COPY.know.hint}</p>

      <div className="v2s-scenes">
        {COPY.know.sides.map((side) => {
          const isOpen = open === side.id;
          return (
            <div key={side.id} className={`v2s-scene ${isOpen ? "open" : ""} ${seen.has(side.id) ? "seen" : ""}`}>
              <button type="button" className="v2s-scene-tap" aria-expanded={isOpen} aria-controls={`v2s-scene-${side.id}`} onClick={() => touch(side.id)}>
                <span className="v2s-scene-art">
                  <PlaceMark id={side.id as PlaceId} className="v2s-scene-mark" />
                </span>
                <span className="v2s-scene-label">{side.label}</span>
              </button>
              {isOpen && <p className="v2s-scene-line" id={`v2s-scene-${side.id}`}>{side.line}</p>}
            </div>
          );
        })}
      </div>

      <div className="v2s-day" role="group" aria-label={COPY.know.dayTitle}>
        <span className="v2s-day-title">{COPY.know.dayTitle}</span>
        <ol className="v2s-day-steps">
          {COPY.know.day.map((step, i) => (
            <li key={step} style={{ animationDelay: `${i * 90}ms` }}>{step}</li>
          ))}
        </ol>
      </div>

      <div className="v2s-know-foot">
        <button type="button" className="v2s-btn v2s-btn-quiet" onClick={onCareer}>{COPY.know.career}</button>
        <button type="button" className="v2s-btn" onClick={onNext}>{COPY.know.next}</button>
      </div>
    </section>
  );
}
