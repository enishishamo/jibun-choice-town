// 給食 WORLD vertical slice: MAP → こんだて PLAY → JOB REVEAL → 好きの種 → MAP.
// Self-contained (own screen state) so the TOP / overall-map task can mount
// it as a single unit later. Progress: src/v2/state/progress.ts (Ver.2 key).
import { useMemo, useState } from "react";
import "./screens/screens.css";
import LunchWorldMap from "./world/LunchWorldMap";
import LunchMenuPlay from "./play/LunchMenuPlay";
import { LUNCH_ASSETS } from "./assets";
import JobReveal from "./screens/JobReveal";
import SeedPick from "./screens/SeedPick";
import { loadProgress, markSolved, recordSeed, saveProgress, type V2Progress } from "../state/progress";
import { worldView } from "./worldView";
import type { LunchScreen, SpotId } from "./types";

export default function LunchWorldApp() {
  const [progress, setProgress] = useState<V2Progress>(loadProgress);
  const [screen, setScreen] = useState<LunchScreen>({ name: "world" });
  const [justReturned, setJustReturned] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);

  const view = useMemo(() => worldView(progress, justReturned), [progress, justReturned]);

  const update = (p: V2Progress) => { setProgress(p); saveProgress(p); };

  const tapSpot = (id: SpotId) => {
    if (id === "menu") { setJustReturned(false); setScreen({ name: "play", spot: "menu" }); }
    // other spots: no PLAY yet (DESIGN_NEEDED DN-12 decides the reaction)
  };

  if (screen.name === "play") {
    return (
      <LunchMenuPlay
        assets={LUNCH_ASSETS}
        onCleared={(score) => { setLastScore(score); setScreen({ name: "reveal" }); }}
      />
    );
  }
  if (screen.name === "reveal") {
    return <JobReveal onNext={() => setScreen({ name: "seed" })} />;
  }
  if (screen.name === "seed") {
    return (
      <SeedPick
        onDone={(seedId) => {
          let p = markSolved(progress, "menu", lastScore ?? 0);
          p = recordSeed(p, "menu", seedId);
          update(p);
          setJustReturned(true);
          setScreen({ name: "world" });
        }}
      />
    );
  }
  return <LunchWorldMap view={view} onTapSpot={tapSpot} />;
}
