import { Dashboard } from "./components/Dashboard";
import scenariosData from "../data/VShuttle-input.json";
import type { Scenario } from "./core/types";

const scenarios = scenariosData as Scenario[];

export default function App() {
  return <Dashboard scenarios={scenarios} />;
}
