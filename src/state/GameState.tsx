// App-wide state: current screen + the child's journey so far.
// Progress is persisted to localStorage so discovered professions stay
// in the zukan, and past experiences can change small moments later
// (e.g. the recycle ending mentions "the farm you visited").
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { experiences } from "../data";
import { contentVersion } from "../data/districts";

export type Screen =
  | { name: "home" }
  | { name: "area"; eventId: string }
  | { name: "q1"; experienceId: string }
  | { name: "zukan" }
  | { name: "profession"; professionId: string; back: Screen };

interface Progress {
  /** Q1 experiences the child finished. */
  completed: string[];
  /** Professions revealed on a discovery card (unlocked in the zukan). */
  discovered: string[];
  /** Worlds (event ids) the child has entered at least once. */
  visitedEvents: string[];
  /** content version last seen per world — powers the UPDATED map state */
  seenVersion?: Record<string, number>;
  /**
   * 「好きの種」: which actions the child said felt interesting, per
   * experience (multiple choice). Accumulated quietly for the future —
   * never used to label or diagnose the child.
   */
  seeds: Record<string, string[]>;
}

interface GameStateValue {
  screen: Screen;
  navigate: (s: Screen) => void;
  progress: Progress;
  /** Called by the Q1 shell when an experience is finished. */
  completeExperience: (experienceId: string, professionId: string) => void;
  hasCompleted: (experienceId: string) => boolean;
  hasDiscovered: (professionId: string) => boolean;
  /** Record the child's 「好きの種」 answers (multiple) for an experience. */
  recordSeed: (experienceId: string, seeds: string[]) => void;
  resetProgress: () => void;
  /** Region-map world state (§16): derived from progress, never stored raw. */
  worldState: (eventId: string) => WorldState;
}

/** §16 world states. UNSEEN is decided by the map (foggy district), not here. */
export type WorldState = "DISCOVERED" | "VISITED" | "IN_PROGRESS" | "COMPLETED" | "UPDATED";

const STORAGE_KEY = "jibun-choice-progress-v1";

const load = (): Progress => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (Array.isArray(p.completed) && Array.isArray(p.discovered)) {
        // older saves have no visitedEvents — derive a sensible baseline so a
        // returning child does not see everything reset to "unvisited"
        return { seeds: {}, visitedEvents: [], seenVersion: {}, ...p };
      }
    }
  } catch {
    /* corrupted storage -> start fresh */
  }
  return { completed: [], discovered: [], seeds: {}, visitedEvents: [], seenVersion: {} };
};

const Ctx = createContext<GameStateValue | null>(null);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  const [progress, setProgress] = useState<Progress>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      /* private mode etc. — the app still works without persistence */
    }
  }, [progress]);

  const value = useMemo<GameStateValue>(
    () => ({
      screen,
      navigate: (s) => {
        setScreen(s);
        if (s.name === "area") {
          const id = s.eventId;
          setProgress((p) =>
            p.visitedEvents.includes(id) && (p.seenVersion ?? {})[id] === contentVersion(id)
              ? p
              : {
                  ...p,
                  visitedEvents: p.visitedEvents.includes(id) ? p.visitedEvents : [...p.visitedEvents, id],
                  seenVersion: { ...(p.seenVersion ?? {}), [id]: contentVersion(id) },
                },
          );
        }
        window.scrollTo(0, 0);
      },
      progress,
      completeExperience: (experienceId, professionId) =>
        setProgress((p) => ({
          ...p,
          completed: p.completed.includes(experienceId)
            ? p.completed
            : [...p.completed, experienceId],
          discovered: p.discovered.includes(professionId)
            ? p.discovered
            : [...p.discovered, professionId],
        })),
      hasCompleted: (id) => progress.completed.includes(id),
      hasDiscovered: (id) => progress.discovered.includes(id),
      recordSeed: (experienceId, seeds) =>
        setProgress((p) => ({ ...p, seeds: { ...p.seeds, [experienceId]: seeds } })),
      resetProgress: () => setProgress({ completed: [], discovered: [], seeds: {}, visitedEvents: [], seenVersion: {} }),
      worldState: (eventId) => {
        // a world the player has seen, whose content version moved on, calls
        // them back — UPDATED outranks the resting states (not IN_PROGRESS)
        const seen = (progress.seenVersion ?? {})[eventId];
        const updated = progress.visitedEvents.includes(eventId) && (seen ?? 1) < contentVersion(eventId);
        const xs = experiences.filter((x) => x.eventId === eventId);
        const done = xs.filter((x) => progress.completed.includes(x.id)).length;
        if (xs.length > 0 && done === xs.length) return updated ? "UPDATED" : "COMPLETED";
        if (done > 0) return "IN_PROGRESS";
        if (progress.visitedEvents.includes(eventId)) return updated ? "UPDATED" : "VISITED";
        return "DISCOVERED";
      },
    }),
    [screen, progress],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGame(): GameStateValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useGame must be used inside GameStateProvider");
  return v;
}
