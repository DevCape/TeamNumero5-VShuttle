import type { NormalizedReading, SensorWeights } from "../types";
import { DEFAULT_WEIGHTS } from "../types";

/**
 * Raggruppa le letture normalizzate per testo identico e calcola
 * il punteggio aggregato per ogni variante testuale.
 *
 * Il punteggio di ogni variante è la somma dei (peso_sensore * confidenza)
 * di tutte le letture che producono lo stesso testo normalizzato.
 */
interface TextCandidate {
  text: string;
  totalWeightedScore: number;
  contributingReadings: NormalizedReading[];
}

/**
 * Seleziona il testo fuso migliore tra le letture normalizzate.
 *
 * Strategia:
 * 1. Filtra le letture con testo e confidenza validi
 * 2. Raggruppa per testo normalizzato identico
 * 3. Per ogni gruppo calcola: Σ(peso_sensore × confidenza_sensore)
 * 4. Sceglie il candidato con punteggio più alto
 *
 * Se nessun sensore ha dati validi, ritorna null.
 */
export function selectBestText(
  readings: NormalizedReading[],
  weights: SensorWeights = DEFAULT_WEIGHTS,
): TextCandidate | null {
  const validReadings = readings.filter(
    (r): r is NormalizedReading & { normalizedText: string; confidence: number } =>
      r.normalizedText != null && r.confidence != null,
  );

  if (validReadings.length === 0) {
    return null;
  }

  // Raggruppa per testo normalizzato
  const candidates = new Map<string, TextCandidate>();

  for (const reading of validReadings) {
    const key = reading.normalizedText;
    const weight = weights[reading.sensorId];
    const score = weight * reading.confidence;

    const existing = candidates.get(key);
    if (existing) {
      existing.totalWeightedScore += score;
      existing.contributingReadings.push(reading);
    } else {
      candidates.set(key, {
        text: key,
        totalWeightedScore: score,
        contributingReadings: [reading],
      });
    }
  }

  // Seleziona il candidato con lo score più alto
  let best: TextCandidate | null = null;
  for (const candidate of candidates.values()) {
    if (best === null || candidate.totalWeightedScore > best.totalWeightedScore) {
      best = candidate;
    }
  }

  return best;
}

/**
 * Calcola la confidenza aggregata pesata di un insieme di letture.
 *
 * Formula: Σ(peso_i × confidenza_i) / Σ(pesi_attivi)
 * dove "attivi" sono i sensori con dati validi (non null).
 *
 * Se nessun sensore ha dati validi, ritorna 0.
 */
export function computeWeightedConfidence(
  readings: NormalizedReading[],
  weights: SensorWeights = DEFAULT_WEIGHTS,
): number {
  let totalWeighted = 0;
  let totalWeight = 0;

  for (const reading of readings) {
    if (reading.confidence != null) {
      const w = weights[reading.sensorId];
      totalWeighted += w * reading.confidence;
      totalWeight += w;
    }
  }

  if (totalWeight === 0) {
    return 0;
  }

  return totalWeighted / totalWeight;
}
