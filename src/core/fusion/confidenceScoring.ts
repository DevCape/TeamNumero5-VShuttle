import type { NormalizedReading, SensorWeights } from "../types";
import { CONFIDENCE_THRESHOLD, DEFAULT_WEIGHTS } from "../types";
import { computeWeightedConfidence } from "./weightedFusion";

export interface ConfidenceAssessment {
  /** Confidenza pesata aggregata [0-1] */
  overallConfidence: number;
  /** true se la confidenza è sotto la soglia critica */
  requiresHumanIntervention: boolean;
  /** Numero di sensori con dati validi */
  activeSensorCount: number;
  /** Numero di sensori che concordano sul testo (consensus) */
  agreementCount: number;
}

/**
 * Valuta il livello di confidenza complessivo e determina
 * se è necessario l'intervento umano.
 *
 * Criteri per triggerare intervento umano:
 * - Confidenza pesata aggregata < CONFIDENCE_THRESHOLD (0.60)
 * - Nessun sensore con dati validi
 */
export function assessConfidence(
  readings: NormalizedReading[],
  fusedText: string | null,
  weights: SensorWeights = DEFAULT_WEIGHTS,
): ConfidenceAssessment {
  const activeSensors = readings.filter(
    (r) => r.normalizedText != null && r.confidence != null,
  );

  const activeSensorCount = activeSensors.length;

  // Quanti sensori concordano col testo fuso
  const agreementCount = fusedText != null
    ? activeSensors.filter((r) => r.normalizedText === fusedText).length
    : 0;

  const overallConfidence = computeWeightedConfidence(readings, weights);

  const requiresHumanIntervention =
    activeSensorCount === 0 || overallConfidence < CONFIDENCE_THRESHOLD;

  return {
    overallConfidence,
    requiresHumanIntervention,
    activeSensorCount,
    agreementCount,
  };
}
