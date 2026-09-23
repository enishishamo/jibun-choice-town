// Derives what the 給食 WORLD MAP shows from Ver.2 progress alone (never stored raw).
import { isSolved, type V2Progress } from "../state/progress";
import type { LunchWorldView } from "./types";

export function worldView(p: V2Progress, justReturned: boolean): LunchWorldView {
  const menuDone = isSolved(p, "menu");
  return {
    spots: {
      grow: "muted",
      carry: menuDone ? "trouble" : "muted",
      cook: "muted",
      menu: menuDone ? "solved" : "trouble",
      serve: "muted",
    },
    roads: {
      "grow-carry": "off",
      "carry-cook": "off",
      "cook-serve": "off",
      "menu-cook": "off",
      "menu-serve": menuDone ? "partial" : "off",
    },
    // the next 異変 (carry) plays its entrance only on the return right after CLEAR
    newTrouble: menuDone && justReturned ? "carry" : null,
  };
}
