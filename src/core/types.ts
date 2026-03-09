// ──────────────────────────────────────────────
// V-SHUTTLE  –  Interfacce e tipi condivisi
// ──────────────────────────────────────────────

/** Lettura di un singolo sensore di bordo */
export interface SensorReading {
  testo: string | null;
  confidenza: number | null;
}

/** Tripletta sensori presente in ogni scenario */
export interface SensorSet {
  camera_frontale: SensorReading;
  camera_laterale: SensorReading;
  V2I_receiver: SensorReading;
}

/** Giorni della settimana (in italiano, come da input) */
export type GiornoSettimana =
  | "Lunedì"
  | "Martedì"
  | "Mercoledì"
  | "Giovedì"
  | "Venerdì"
  | "Sabato"
  | "Domenica";

/** Singolo scenario di input (come dal file VShuttle-input.json) */
export interface Scenario {
  id_scenario: number;
  sensori: SensorSet;
  orario_rilevamento: string; // "HH:MM"
  giorno_settimana: GiornoSettimana;
}

// ─── Tipi del Data Fusion Engine ────────────────

/** Identificatore del sensore con il relativo peso di affidabilità */
export type SensorId = "camera_frontale" | "camera_laterale" | "V2I_receiver";

/** Pesi di affidabilità per la fusione pesata */
export interface SensorWeights {
  camera_frontale: number; // Alta  (es. 0.50)
  camera_laterale: number; // Media (es. 0.30)
  V2I_receiver: number;    // Variabile (es. 0.20)
}

/** Lettura normalizzata di un singolo sensore dopo OCR cleaning */
export interface NormalizedReading {
  sensorId: SensorId;
  originalText: string | null;
  normalizedText: string | null;
  confidence: number | null;
}

/** Risultato della fusione dati dei sensori */
export interface FusionResult {
  scenarioId: number;
  /** Testo fuso finale prodotto dal motore di fusione */
  fusedText: string | null;
  /** Livello di confidenza aggregato [0-1] */
  overallConfidence: number;
  /** Se true, la confidenza è sotto la soglia critica → richiesta intervento umano */
  requiresHumanIntervention: boolean;
  /** Letture normalizzate dei singoli sensori */
  normalizedReadings: NormalizedReading[];
  /** Timestamp del rilevamento */
  orarioRilevamento: string;
  /** Giorno della settimana */
  giornoSettimana: GiornoSettimana;
}

// ─── Soglie di sistema ────────────────

export const CONFIDENCE_THRESHOLD = 0.60;

export const DEFAULT_WEIGHTS: SensorWeights = {
  camera_frontale: 0.50,
  camera_laterale: 0.30,
  V2I_receiver: 0.20,
};
