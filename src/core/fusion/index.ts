import type {
  Scenario,
  FusionResult,
  SensorWeights,
  SensorId,
  NormalizedReading,
} from "../types";
import { DEFAULT_WEIGHTS } from "../types";
import { normalizeSensorReading } from "./normalizer";
import { selectBestText } from "./weightedFusion";
import { assessConfidence } from "./confidenceScoring";

const SENSOR_IDS: SensorId[] = [
  "camera_frontale",
  "camera_laterale",
  "V2I_receiver",
];

/**
 * Processa un singolo scenario attraverso il Data Fusion Engine.
 *
 * Pipeline:
 * 1. Normalizzazione OCR di ogni lettura sensore
 * 2. Fusione pesata → selezione del testo migliore
 * 3. Confidence scoring → decisione intervento umano
 */
export function processScenario(
  scenario: Scenario,
  weights: SensorWeights = DEFAULT_WEIGHTS,
): FusionResult {
  // 1. Normalizza le letture di tutti i sensori
  const normalizedReadings: NormalizedReading[] = SENSOR_IDS.map((id) =>
    normalizeSensorReading(id, scenario.sensori[id]),
  );

  // 2. Selezione testo fuso migliore
  const bestCandidate = selectBestText(normalizedReadings, weights);
  const fusedText = bestCandidate?.text ?? null;

  // 3. Valutazione confidenza
  const assessment = assessConfidence(normalizedReadings, fusedText, weights);

  return {
    scenarioId: scenario.id_scenario,
    fusedText,
    overallConfidence: assessment.overallConfidence,
    requiresHumanIntervention: assessment.requiresHumanIntervention,
    normalizedReadings,
    orarioRilevamento: scenario.orario_rilevamento,
    giornoSettimana: scenario.giorno_settimana,
  };
}

/**
 * Processa un array completo di scenari.
 */
export function processAllScenarios(
  scenarios: Scenario[],
  weights: SensorWeights = DEFAULT_WEIGHTS,
): FusionResult[] {
  return scenarios.map((s) => processScenario(s, weights));
}

// Re-export dei sotto-moduli per accesso diretto
export { normalizeOcrText, normalizeSensorReading } from "./normalizer";
export { selectBestText, computeWeightedConfidence } from "./weightedFusion";
export { assessConfidence } from "./confidenceScoring";
export type { ConfidenceAssessment } from "./confidenceScoring";
