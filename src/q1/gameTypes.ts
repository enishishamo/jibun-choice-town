import type { Q1Experience } from "../data/types";

/**
 * Props every Q1 game receives from the shell.
 * A game is only the interactive C+D part; intro (A+B), resolution (E)
 * and the discovery card are handled by the shared Q1 shell.
 */
export interface Q1GameProps {
  experience: Q1Experience;
  /** Call when the challenge is solved -> shell shows the E (discovery)
   * screen with success framing. UNCHANGED signature — many games use
   * this directly as `onClick={onComplete}`, so it must stay `() => void`. */
  onComplete: () => void;
  /** 2026-09-07 (Q1 First-Play Standard Gate H "HONEST OUTCOME"): call
   * this INSTEAD of onComplete when the child did NOT correctly solve it
   * but the game still needs to let them move on (no permanent block, per
   * this project's retry/QA conventions). The shell shows the SAME Job
   * Reveal (profession name, discoveryEcho, Zukan add — exposure to the
   * job always happens regardless of performance, per principles.md's A->E
   * flow) but an honestly different top framing chip instead of the
   * success one, so a wrong answer never renders identically to a correct
   * one. Optional — most games never call this and can ignore it entirely. */
  onPartialComplete?: () => void;
  /** Lets a game react to the child's past journey (社会のつながり演出). */
  hasCompleted: (experienceId: string) => boolean;
}
