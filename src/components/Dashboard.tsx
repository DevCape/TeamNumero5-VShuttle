import type { Scenario } from "../core/types";
import { useSimulation } from "../hooks/useSimulation";
import { ScenarioView } from "./ScenarioView";

interface DashboardProps {
  scenarios: Scenario[];
}

export function Dashboard({ scenarios }: DashboardProps) {
  const sim = useSimulation(scenarios);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-950 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-xl font-bold tracking-tight">V-SHUTTLE HMI</h1>
            <p className="text-xs text-gray-500">Decision Support System — Navetta Autonoma L4</p>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-4">
            <div className="text-right text-sm">
              <span className="text-gray-400">Scenario </span>
              <span className="font-mono font-bold text-white">
                {sim.currentIndex >= 0 ? sim.currentIndex + 1 : 0}
              </span>
              <span className="text-gray-400"> / {sim.totalCount}</span>
            </div>

            {/* Controlli simulazione - bottoni Fat Finger 44x44px */}
            <div className="flex gap-2">
              {!sim.isRunning ? (
                <button
                  onClick={sim.start}
                  className="min-h-[44px] min-w-[44px] px-5 py-2 rounded-xl
                    bg-blue-600 hover:bg-blue-500 active:bg-blue-700
                    text-white font-bold text-sm
                    transition-colors duration-150
                    focus:outline-none focus:ring-4 focus:ring-blue-400"
                >
                  {sim.currentIndex < 0 ? "Avvia" : "Riprendi"}
                </button>
              ) : (
                <button
                  onClick={sim.stop}
                  className="min-h-[44px] min-w-[44px] px-5 py-2 rounded-xl
                    bg-gray-600 hover:bg-gray-500 active:bg-gray-700
                    text-white font-bold text-sm
                    transition-colors duration-150
                    focus:outline-none focus:ring-4 focus:ring-gray-400"
                >
                  Pausa
                </button>
              )}
              <button
                onClick={sim.reset}
                className="min-h-[44px] min-w-[44px] px-5 py-2 rounded-xl
                  bg-gray-700 hover:bg-gray-600 active:bg-gray-800
                  text-gray-300 font-bold text-sm
                  transition-colors duration-150
                  focus:outline-none focus:ring-4 focus:ring-gray-500"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="w-full bg-gray-800 h-1">
        <div
          className="h-1 bg-blue-500 transition-all duration-300"
          style={{ width: `${sim.totalCount > 0 ? ((sim.completedCount) / sim.totalCount) * 100 : 0}%` }}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <ScenarioView state={sim} onHumanOverride={sim.humanOverride} />
      </main>
    </div>
  );
}
