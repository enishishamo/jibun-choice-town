// 栄養教諭 Job Vertical Slice:
//   MAP → こんだて PLAY → EVENT → CLEAR → JOB REVEAL → KNOW THE JOB
//        → (CAREER PATH, optional) → 好きの種 → MAP RETURN
// Self-contained (own screen state) so the TOP / overall-map lane can mount it
// as a single unit later. Progress: src/v2/state/progress.ts (Ver.2 key only).
import { useMemo, useState } from "react";
import "./screens/screens.css";
import LunchWorldMap from "./world/LunchWorldMap";
import LunchMenuPlay from "./play/LunchMenuPlay";
import { LUNCH_ASSETS } from "./assets";
import JobReveal from "./screens/JobReveal";
import KnowTheJob from "./screens/KnowTheJob";
import CareerPath from "./screens/CareerPath";
import SeedPick from "./screens/SeedPick";
import { loadProgress, markSolved, recordSeed, saveProgress, type V2Progress } from "../state/progress";
import { worldView } from "./worldView";
import type { LunchScreen, SpotId } from "./types";

export default function LunchWorldApp() {
  const [progress, setProgress] = useState<V2Progress>(loadProgress);
  const [screen, setScreen] = useState<LunchScreen>({ name: "world" });
  const [justReturned, setJustReturned] = useState(false);

  const view = useMemo(() => worldView(progress, justReturned), [progress, justReturned]);
  const update = (p: V2Progress) => { setProgress(p); saveProgress(p); };

  // Only こんだて is playable in this slice. Every other spot still reacts to a
  // tap (the map nudges it) — the child is never left wondering if it is broken.
  const tapSpot = (id: SpotId) => {
    if (id !== "menu") return;
    setJustReturned(false);
    setScreen({ name: "play", spot: "menu" });
  };

  switch (screen.name) {
    case "play":
      return <LunchMenuPlay assets={LUNCH_ASSETS} onCleared={() => setScreen({ name: "reveal" })} />;
    case "reveal":
      return <JobReveal art={LUNCH_ASSETS.school} onNext={() => setScreen({ name: "know" })} />;
    case "know":
      return (
        <KnowTheJob
          scenes={LUNCH_ASSETS.scenes}
          onCareer={() => setScreen({ name: "career" })}
          onNext={() => setScreen({ name: "seed" })}
        />
      );
    case "career":
      return <CareerPath onBack={() => setScreen({ name: "know" })} />;
    case "seed":
      return (
        <SeedPick
          onDone={(seedId) => {
            update(recordSeed(markSolved(progress, "menu"), "menu", seedId));
            setJustReturned(true);
            setScreen({ name: "world" });
          }}
        />
      );
    default:
      return <LunchWorldMap view={view} onTapSpot={tapSpot} assets={LUNCH_ASSETS.map} />;
  }
}
