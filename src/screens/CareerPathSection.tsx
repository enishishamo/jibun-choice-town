// "どうやってなるの？" — Career Path section of Job Reveal (2026-09-04
// directive). Functional SVG/CSS only — this draws a PATH DIAGRAM (a
// process/state visualization), not a scene or a person; per the Art
// Ownership rule adopted the same day, illustrations of places/people/scenes
// are GPT's job, and this component is explicitly NOT that (see
// factory/state/art/art-ownership-audit-2026-09-04.md for the boundary).
//
// Principles enforced here (not just in the data): never a single forced
// route (routes[] renders as separate tracks, tab-switched); required vs
// common-but-optional steps are visually distinct; canStartLater is always
// shown as reassurance, never omitted; no route is silently truncated.
import { useState } from "react";
import { withRuby } from "../lib/ruby";
import type { CareerPath, CareerPathStep } from "../data/types";

const STEP_ICON: Record<CareerPathStep["requirementType"], string> = {
  education: "🏫",
  license: "📜",
  training: "🛠",
  experience: "💼",
  exam: "📝",
};

export default function CareerPathSection({ careerPath }: { careerPath: CareerPath }) {
  const [routeIdx, setRouteIdx] = useState(0);
  const route = careerPath.routes[routeIdx];
  const multi = careerPath.routes.length > 1;

  return (
    <div className="career-path">
      <h3 className="career-path-title">どうやってなるの？</h3>

      {careerPath.qualificationName && (
        <p className="career-path-qual">
          {careerPath.qualificationRequired ? "🔑 " : "💡 "}
          {withRuby(careerPath.qualificationName)}
        </p>
      )}
      <p className="career-path-summary">{withRuby(careerPath.pathSummary)}</p>

      {multi && (
        <div className="career-path-tabs">
          {careerPath.routes.map((r, i) => (
            <button
              key={r.routeName}
              className={`career-path-tab ${i === routeIdx ? "active" : ""}`}
              onClick={() => setRouteIdx(i)}
            >
              {r.routeName}
            </button>
          ))}
        </div>
      )}

      {/* the path itself: a functional state-diagram, not an illustration */}
      <div className="career-path-track">
        <div className="career-path-node here">
          <span className="career-path-dot">📍</span>
          <span className="career-path-node-body">
            <b>いま</b>
          </span>
        </div>
        {route.steps.map((step, i) => (
          <div key={i} className={`career-path-node ${step.required ? "required" : "optional"}`}>
            <span className="career-path-connector" aria-hidden="true" />
            <span className="career-path-dot">{STEP_ICON[step.requirementType]}</span>
            <span className="career-path-node-body">
              <b>{withRuby(step.stage)}</b>
              {!step.required && <span className="career-path-tag">よくある道（必須ではない）</span>}
              <span className="career-path-desc">{withRuby(step.description)}</span>
            </span>
          </div>
        ))}
      </div>

      {careerPath.canStartLater && (
        <p className="career-path-later">🕊 大人になってから、この仕事を目指す人もいるよ。今すぐ決めなくても大丈夫。</p>
      )}
      {careerPath.alternatives && (
        <p className="career-path-note">{withRuby(careerPath.alternatives)}</p>
      )}
      {careerPath.importantNotes && (
        <p className="career-path-note soft">{withRuby(careerPath.importantNotes)}</p>
      )}
    </div>
  );
}
