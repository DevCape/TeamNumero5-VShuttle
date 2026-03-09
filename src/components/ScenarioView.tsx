import type { SimulationState } from "../hooks/useSimulation";
import type { Decision } from "../core/types";
import { DecisionBadge } from "./DecisionBadge";
import { SensorPanel } from "./SensorPanel";
import { HumanOverride } from "./HumanOverride";

interface ScenarioViewProps {
  state: SimulationState;
  onHumanOverride: (decision: Decision) => void;
}

export function ScenarioView({ state, onHumanOverride }: ScenarioViewProps) {
  const { scenario, fusionResult, parserResult, finalDecision, isWaitingHuman, humanTimerMs, reason, wasOverridden } = state;

  if (!scenario || !fusionResult) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-lg">
        Premi Avvia per iniziare la simulazione
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Colonna sinistra: sensori */}
      <div className="lg:col-span-1">
        <SensorPanel readings={fusionResult.normalizedReadings} />
      </div>

      {/* Colonna centrale: decisione + info scenario */}
      <div className="lg:col-span-1 space-y-6">
        {/* Header scenario */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
              Scenario #{scenario.id_scenario}
            </h3>
            <div className="flex gap-2 text-xs text-gray-400">
              <span className="bg-gray-700 px-2 py-1 rounded">{scenario.orario_rilevamento}</span>
              <span className="bg-gray-700 px-2 py-1 rounded">{scenario.giorno_settimana}</span>
            </div>
          </div>

          {/* Testo fuso */}
          <div className="mb-4">
            <span className="text-xs text-gray-500 block mb-1">Testo Fuso</span>
            <div className="text-lg font-bold text-white">
              {fusionResult.fusedText ?? <span className="text-gray-500 italic">Nessuna lettura</span>}
            </div>
          </div>

          {/* Confidenza aggregata */}
          <div>
            <span className="text-xs text-gray-500 block mb-1">Confidenza Aggregata</span>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    fusionResult.overallConfidence >= 0.8 ? "bg-green-500" :
                    fusionResult.overallConfidence >= 0.6 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                  style={{ width: `${Math.round(fusionResult.overallConfidence * 100)}%` }}
                />
              </div>
              <span className="text-sm font-mono text-gray-300">
                {(fusionResult.overallConfidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Decisione grande al centro */}
        <div className="flex flex-col items-center gap-3">
          <DecisionBadge decision={finalDecision} large />
          {wasOverridden && (
            <span className="text-xs text-purple-300 font-medium">
              Sovrascritta dall'operatore
            </span>
          )}
        </div>

        {/* Motivazione */}
        <div className="bg-gray-800 rounded-lg p-4">
          <span className="text-xs text-gray-500 block mb-1">Motivazione</span>
          <p className="text-sm text-gray-300">{reason}</p>
        </div>
      </div>

      {/* Colonna destra: dettagli parser + human override */}
      <div className="lg:col-span-1 space-y-4">
        {/* Human override panel */}
        {isWaitingHuman && (
          <HumanOverride timerMs={humanTimerMs} onOverride={onHumanOverride} />
        )}

        {/* Dettagli classificazione */}
        {parserResult?.parsedSign && (
          <div className="bg-gray-800 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
              Classificazione
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-xs text-gray-500">Categoria</span>
                <div className="text-white font-medium">{parserResult.parsedSign.category}</div>
              </div>
              <div>
                <span className="text-xs text-gray-500">Tipo</span>
                <div className="text-white font-medium">{parserResult.parsedSign.signType}</div>
              </div>
              <div>
                <span className="text-xs text-gray-500">Esenzione navetta</span>
                <div className={`font-medium ${parserResult.isVehicleExempt ? "text-green-400" : "text-gray-400"}`}>
                  {parserResult.isVehicleExempt ? "Si" : "No"}
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500">Restrizione attiva</span>
                <div className={`font-medium ${parserResult.isTemporallyActive ? "text-red-400" : "text-gray-400"}`}>
                  {parserResult.isTemporallyActive ? "Si" : "No"}
                </div>
              </div>
            </div>
            {parserResult.parsedSign.exceptions.length > 0 && (
              <div>
                <span className="text-xs text-gray-500">Eccezioni</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {parserResult.parsedSign.exceptions.map((e) => (
                    <span key={e} className="bg-gray-700 text-xs text-gray-300 px-2 py-0.5 rounded">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
