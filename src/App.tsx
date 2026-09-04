import { GameStateProvider, useGame } from "./state/GameState";
import HomeScreen from "./screens/HomeScreen";
import WorldMapScreen from "./screens/WorldMapScreen";
import AreaScreen from "./screens/AreaScreen";
import Q1Screen from "./screens/Q1Screen";
import ProfessionScreen from "./screens/ProfessionScreen";
import ZukanScreen from "./screens/ZukanScreen";

function Router() {
  const { screen } = useGame();
  switch (screen.name) {
    case "home":
      return <HomeScreen />;
    case "map":
      return <WorldMapScreen />;
    case "area":
      return <AreaScreen eventId={screen.eventId} />;
    case "q1":
      // key resets the shell when moving between experiences
      return <Q1Screen key={screen.experienceId} experienceId={screen.experienceId} />;
    case "profession":
      return <ProfessionScreen professionId={screen.professionId} back={screen.back} />;
    case "zukan":
      return <ZukanScreen />;
  }
}

export default function App() {
  return (
    <GameStateProvider>
      <div className="app-frame">
        <Router />
      </div>
    </GameStateProvider>
  );
}
