import type { Q1Experience } from "../data/types";

/**
 * Props every Q1 game receives from the shell.
 * A game is only the interactive C+D part; intro (A+B), resolution (E)
 * and the discovery card are handled by the shared Q1 shell.
 */
export interface Q1GameProps {
  experience: Q1Experience;
  /** Call when the challenge is solved -> shell shows the E screen. */
  onComplete: () => void;
  /** Lets a game react to the child's past journey (社会のつながり演出). */
  hasCompleted: (experienceId: string) => boolean;
}
