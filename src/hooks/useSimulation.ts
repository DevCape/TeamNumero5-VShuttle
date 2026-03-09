import { useState, useCallback, useRef, useEffect } from "react";
import type { Scenario, FusionResult, ParserResult, Decision } from "../core/types";
import { processScenario } from "../core/fusion";
import { parseScenario } from "../core/parser";

const SCENARIO_INTERVAL_MS = 4000;
const HUMAN_OVERRIDE_MS = 2000;

export interface SimulationState {
  /** Indice dello scenario corrente nell'array */
  currentIndex: number;
  /** Scenario raw corrente */
  scenario: Scenario | null;
  /** Risultato del Fusion Engine */
  fusionResult: FusionResult | null;
  /** Risultato del Semantic Parser */
  parserResult: ParserResult | null;
  /** Decisione finale (potrebbe essere sovrascritta dall'operatore o dal fallback) */
  finalDecision: Decision | null;
  /** true se la simulazione è in corso */
  isRunning: boolean;
  /** true se è in attesa di override umano */
  isWaitingHuman: boolean;
  /** Millisecondi rimanenti per l'override umano */
  humanTimerMs: number;
  /** Motivazione della decisione finale */
  reason: string;
  /** true se la decisione è stata sovrascritta dall'operatore */
  wasOverridden: boolean;
  /** Contatore scenari completati */
  completedCount: number;
  /** Totale scenari */
  totalCount: number;
}

export interface UseSimulationReturn extends SimulationState {
  start: () => void;
  stop: () => void;
  reset: () => void;
  humanOverride: (decision: Decision) => void;
}

export function useSimulation(scenarios: Scenario[]): UseSimulationReturn {
  const [state, setState] = useState<SimulationState>({
    currentIndex: -1,
    scenario: null,
    fusionResult: null,
    parserResult: null,
    finalDecision: null,
    isRunning: false,
    isWaitingHuman: false,
    humanTimerMs: HUMAN_OVERRIDE_MS,
    reason: "",
    wasOverridden: false,
    completedCount: 0,
    totalCount: scenarios.length,
  });

  const scenarioTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const humanTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const clearAllTimers = useCallback(() => {
    if (scenarioTimerRef.current) {
      clearTimeout(scenarioTimerRef.current);
      scenarioTimerRef.current = null;
    }
    if (humanTimerRef.current) {
      clearInterval(humanTimerRef.current);
      humanTimerRef.current = null;
    }
  }, []);

  // Processa uno scenario e decide se serve override umano
  const processAndShow = useCallback((index: number) => {
    if (index >= scenarios.length) {
      // Simulazione completata
      setState((prev) => ({
        ...prev,
        isRunning: false,
        isWaitingHuman: false,
      }));
      clearAllTimers();
      return;
    }

    const scenario = scenarios[index]!;

    let fusionResult: FusionResult;
    let parserResult: ParserResult;
    try {
      fusionResult = processScenario(scenario);
      parserResult = parseScenario(fusionResult);
    } catch {
      // Se il processing fallisce, imposta STOP di sicurezza e avanza
      setState((prev) => ({
        ...prev,
        currentIndex: index,
        scenario,
        fusionResult: null,
        parserResult: null,
        finalDecision: "STOP",
        isWaitingHuman: false,
        humanTimerMs: 0,
        reason: "Errore nell'elaborazione dello scenario, impostato STOP di sicurezza",
        wasOverridden: false,
        completedCount: prev.completedCount + 1,
      }));
      scenarioTimerRef.current = setTimeout(() => {
        processAndShow(index + 1);
      }, SCENARIO_INTERVAL_MS);
      return;
    }

    const needsHuman = parserResult.decision === "INTERVENTO_UMANO";

    setState((prev) => ({
      ...prev,
      currentIndex: index,
      scenario,
      fusionResult,
      parserResult,
      finalDecision: needsHuman ? null : parserResult.decision,
      isWaitingHuman: needsHuman,
      humanTimerMs: HUMAN_OVERRIDE_MS,
      reason: parserResult.reason,
      wasOverridden: false,
    }));

    if (needsHuman) {
      // Avvia countdown per override umano
      const startTime = Date.now();
      humanTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, HUMAN_OVERRIDE_MS - elapsed);

        if (remaining <= 0) {
          // Safety Fallback: tempo scaduto → STOP
          if (humanTimerRef.current) {
            clearInterval(humanTimerRef.current);
            humanTimerRef.current = null;
          }
          setState((prev) => ({
            ...prev,
            finalDecision: "STOP",
            isWaitingHuman: false,
            humanTimerMs: 0,
            reason: "Safety Fallback: tempo di override scaduto, impostato STOP automatico",
            wasOverridden: false,
            completedCount: prev.completedCount + 1,
          }));
          // Avanza allo scenario successivo dopo un breve delay
          scenarioTimerRef.current = setTimeout(() => {
            processAndShow(index + 1);
          }, SCENARIO_INTERVAL_MS);
        } else {
          setState((prev) => ({ ...prev, humanTimerMs: remaining }));
        }
      }, 50);
    } else {
      // Avanza automaticamente dopo 4 secondi
      scenarioTimerRef.current = setTimeout(() => {
        setState((prev) => ({ ...prev, completedCount: prev.completedCount + 1 }));
        processAndShow(index + 1);
      }, SCENARIO_INTERVAL_MS);
    }
  }, [scenarios, clearAllTimers]);

  // Override manuale dell'operatore
  const humanOverride = useCallback((decision: Decision) => {
    if (!stateRef.current.isWaitingHuman) return;

    clearAllTimers();

    const reasonMap: Record<Decision, string> = {
      PROCEDI: "Override operatore: PROCEDI",
      STOP: "Override operatore: STOP",
      RALLENTA: "Override operatore: RALLENTA",
      INTERVENTO_UMANO: "Override operatore: richiesta ulteriore valutazione",
    };

    setState((prev) => ({
      ...prev,
      finalDecision: decision,
      isWaitingHuman: false,
      reason: reasonMap[decision],
      wasOverridden: true,
      completedCount: prev.completedCount + 1,
    }));

    // Avanza allo scenario successivo
    scenarioTimerRef.current = setTimeout(() => {
      processAndShow(stateRef.current.currentIndex + 1);
    }, SCENARIO_INTERVAL_MS);
  }, [clearAllTimers, processAndShow]);

  const start = useCallback(() => {
    clearAllTimers();
    const startIndex = stateRef.current.currentIndex < 0 ? 0 : stateRef.current.currentIndex;
    setState((prev) => ({ ...prev, isRunning: true }));
    processAndShow(startIndex);
  }, [clearAllTimers, processAndShow]);

  const stop = useCallback(() => {
    clearAllTimers();
    setState((prev) => ({ ...prev, isRunning: false, isWaitingHuman: false }));
  }, [clearAllTimers]);

  const reset = useCallback(() => {
    clearAllTimers();
    setState({
      currentIndex: -1,
      scenario: null,
      fusionResult: null,
      parserResult: null,
      finalDecision: null,
      isRunning: false,
      isWaitingHuman: false,
      humanTimerMs: HUMAN_OVERRIDE_MS,
      reason: "",
      wasOverridden: false,
      completedCount: 0,
      totalCount: scenarios.length,
    });
  }, [clearAllTimers, scenarios.length]);

  // Cleanup al dismount
  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  return {
    ...state,
    start,
    stop,
    reset,
    humanOverride,
  };
}
