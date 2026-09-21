// JIBUN CHOICE Ver.2 (PLAY FIRST) — root.
//
// The overall MAP / 「パカッ」 entry is owned by the TOP lane. Until it lands,
// this root opens straight into the 給食 WORLD, so every path a child can take
// is finished product — there is no development scaffold in front of the game.
// Ver.2 never touches Ver.1's localStorage key.
import LunchWorldApp from "./lunch/LunchWorldApp";

export default function V2App() {
  return <LunchWorldApp />;
}
