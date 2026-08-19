// App-wide state: current screen + the child's journey so far.
// Progress is persisted to localStorage so discovered professions stay
// in the zukan, and past experiences can change small moments later
// (e.g. the recycle ending mentions "the farm you visited").
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

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
}

interface GameStateValue {
  screen: Screen;
  navigate: (s: Screen) => void;
  progress: Progress;
  /** Called by the Q1 shell when an experience is finished. */
  completeExperience: (experienceId: string, professionId: string) => void;
  hasCompleted: (experienceId: string) => boolean;
  hasDiscovered: (professionId: string) => boolean;
  resetProgress: () => void;
}

const STORAGE_KEY = "jibun-choice-progress-v1";

const load = (): Progress => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (Array.isArray(p.completed) && Array.isArray(p.discovered)) return p;
    }
  } catch {
    /* corrupted storage -> start fresh */
  }
  return { completed: [], discovered: [] };
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
        window.scrollTo(0, 0);
      },
      progress,
      completeExperience: (experienceId, professionId) =>
        setProgress((p) => ({
          completed: p.completed.includes(experienceId)
            ? p.completed
            : [...p.completed, experienceId],
          discovered: p.discovered.includes(professionId)
            ? p.discovered
            : [...p.discovered, professionId],
        })),
      hasCompleted: (id) => progress.completed.includes(id),
      hasDiscovered: (id) => progress.discovered.includes(id),
      resetProgress: () => setProgress({ completed: [], discovered: [] }),
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
