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

// ─── Tipi del Semantic Parser ────────────────

/** Categoria del segnale stradale */
export type SignCategory = "DIVIETO" | "OBBLIGO" | "PERICOLO" | "INFORMAZIONE";

/** Sotto-tipo specifico del segnale */
export type SignType =
  | "TRANSITO"
  | "ACCESSO"
  | "SOSTA"
  | "FERMATA"
  | "ZTL"
  | "OBBLIGO_SVOLTA"
  | "LIMITE_VELOCITA"
  | "SENSO_UNICO"
  | "SENSO_VIETATO"
  | "PERICOLO_GENERICO"
  | "LAVORI"
  | "AREA_PEDONALE"
  | "STRADA_CHIUSA"
  | "ROTATORIA"
  | "INFORMATIVO"
  | "NON_RILEVANTE";

/** Eccezioni riconosciute nel testo del segnale */
export type ExceptionType =
  | "BUS"
  | "BUS_TAXI"
  | "NAVETTE_L4"
  | "VEICOLI_ELETTRICI"
  | "RESIDENTI"
  | "MEZZI_SOCCORSO"
  | "FORNITORI"
  | "AUTORIZZATI"
  | "MEZZI_PESANTI"
  | "VEICOLI_MOTORE";

/** Vincolo temporale estratto dal testo */
export interface TimeConstraint {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

/** Vincolo su giorno della settimana */
export interface DayConstraint {
  activeDays: GiornoSettimana[];
}

/** Risultato della classificazione del segnale (Logic Mapping) */
export interface ParsedSign {
  category: SignCategory;
  signType: SignType;
  exceptions: ExceptionType[];
  timeConstraint: TimeConstraint | null;
  dayConstraint: DayConstraint | null;
  isExplicitlyInactive: boolean;
  isAlwaysActive: boolean;
  rawText: string;
}

/** Decisione finale del sistema per uno scenario */
export type Decision = "PROCEDI" | "STOP" | "RALLENTA" | "INTERVENTO_UMANO";

/** Risultato completo del Semantic Parser */
export interface ParserResult {
  scenarioId: number;
  parsedSign: ParsedSign | null;
  isVehicleExempt: boolean;
  isTemporallyActive: boolean;
  decision: Decision;
  reason: string;
}

// ─── Caratteristiche del veicolo (navetta) ────────────────

export const VEHICLE_PROPERTIES = {
  isBus: true,
  isTaxi: false,
  isNavettaL4: true,
  isElettrico: true,
  isResidente: false,
  isMezzoSoccorso: false,
  isFornitore: false,
  isAutorizzato: true,
  isMezzoPesante: false,
} as const;

// ─── Soglie di sistema ────────────────

export const CONFIDENCE_THRESHOLD = 0.60;

export const DEFAULT_WEIGHTS: SensorWeights = {
  camera_frontale: 0.50,
  camera_laterale: 0.30,
  V2I_receiver: 0.20,
};
