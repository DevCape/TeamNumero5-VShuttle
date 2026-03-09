import type { FusionResult, ParserResult, Decision, ParsedSign } from "../types";
import { parseSign } from "./logicMapping";
import { isVehicleExempt } from "./vehicleAwareness";
import { isTemporallyActive } from "./temporalCheck";

// ──────────────────────────────────────────────
// Segnali di tipo DIVIETO che bloccano il transito
// ──────────────────────────────────────────────
const BLOCKING_SIGN_TYPES = new Set([
  "TRANSITO",
  "ACCESSO",
  "ZTL",
  "SENSO_VIETATO",
  "AREA_PEDONALE",
  "STRADA_CHIUSA",
]);

// Segnali che richiedono rallentamento
const SLOWDOWN_SIGN_TYPES = new Set([
  "PERICOLO_GENERICO",
  "LAVORI",
  "LIMITE_VELOCITA",
]);

/**
 * Determina la decisione finale e la motivazione a partire
 * dal segnale classificato, esenzione veicolo e stato temporale.
 */
function computeDecision(
  sign: ParsedSign,
  exempt: boolean,
  temporallyActive: boolean,
): { decision: Decision; reason: string } {
  // ── Segnale esplicitamente inattivo ──
  if (sign.isExplicitlyInactive) {
    return {
      decision: "PROCEDI",
      reason: `Varco/ZTL non attivo (${sign.rawText})`,
    };
  }

  // ── Segnali non rilevanti per la circolazione ──
  if (sign.signType === "NON_RILEVANTE") {
    return {
      decision: "PROCEDI",
      reason: `Segnale non rilevante per la circolazione (${sign.rawText})`,
    };
  }

  // ── Segnali informativi ──
  if (sign.category === "INFORMAZIONE") {
    return {
      decision: "PROCEDI",
      reason: `Segnale informativo: ${sign.rawText}`,
    };
  }

  // ── Obblighi (svolta, rotatoria, senso unico) ── sempre attivi
  if (sign.category === "OBBLIGO") {
    if (sign.signType === "LIMITE_VELOCITA") {
      return {
        decision: "RALLENTA",
        reason: `Limite di velocità: ${sign.rawText}`,
      };
    }
    return {
      decision: "RALLENTA",
      reason: `Obbligo: ${sign.rawText}`,
    };
  }

  // ── Pericoli → rallentare sempre ──
  if (sign.category === "PERICOLO" || SLOWDOWN_SIGN_TYPES.has(sign.signType)) {
    return {
      decision: "RALLENTA",
      reason: `Pericolo/Attenzione: ${sign.rawText}`,
    };
  }

  // ── Divieti (sosta/fermata) → non bloccano il transito ──
  if (sign.signType === "SOSTA" || sign.signType === "FERMATA") {
    return {
      decision: "PROCEDI",
      reason: `Divieto di ${sign.signType === "SOSTA" ? "sosta" : "fermata"}, transito consentito`,
    };
  }

  // ── Divieti bloccanti (TRANSITO, ACCESSO, ZTL, ecc.) ──
  if (BLOCKING_SIGN_TYPES.has(sign.signType)) {
    // Veicolo esentato?
    if (exempt) {
      return {
        decision: "PROCEDI",
        reason: `Navetta esentata dal divieto (${sign.exceptions.join(", ")})`,
      };
    }

    // Restrizione non attiva in questo momento?
    if (!temporallyActive) {
      return {
        decision: "PROCEDI",
        reason: `Restrizione non attiva nell'orario/giorno corrente`,
      };
    }

    // Divieto attivo e non esentato → STOP
    return {
      decision: "STOP",
      reason: `Divieto attivo: ${sign.rawText}`,
    };
  }

  // ── Fallback ──
  return {
    decision: "RALLENTA",
    reason: `Segnale non classificato con certezza: ${sign.rawText}`,
  };
}

/**
 * Processa un FusionResult attraverso il Semantic Parser.
 *
 * Pipeline:
 * 1. Se la fusione richiede intervento umano → INTERVENTO_UMANO
 * 2. Se nessun testo fuso → INTERVENTO_UMANO
 * 3. Logic Mapping → classifica il segnale
 * 4. Vehicle Awareness → controlla esenzioni
 * 5. Temporal Check → verifica vincoli temporali
 * 6. Decisione finale
 */
export function parseScenario(fusion: FusionResult): ParserResult {
  // Bassa confidenza → intervento umano
  if (fusion.requiresHumanIntervention) {
    const conf = fusion.overallConfidence;
    const confStr = conf != null && isFinite(conf) ? (conf * 100).toFixed(0) : "N/A";
    return {
      scenarioId: fusion.scenarioId,
      parsedSign: null,
      isVehicleExempt: false,
      isTemporallyActive: false,
      decision: "INTERVENTO_UMANO",
      reason: `Confidenza insufficiente (${confStr}%), richiesto intervento operatore`,
    };
  }

  // Nessun testo fuso disponibile o testo vuoto
  if (fusion.fusedText == null || fusion.fusedText.trim() === "") {
    return {
      scenarioId: fusion.scenarioId,
      parsedSign: null,
      isVehicleExempt: false,
      isTemporallyActive: false,
      decision: "INTERVENTO_UMANO",
      reason: "Nessuna lettura disponibile dai sensori",
    };
  }

  // 1. Logic Mapping
  const parsedSign = parseSign(fusion.fusedText);

  // 2. Vehicle Awareness
  const exempt = isVehicleExempt(parsedSign);

  // 3. Temporal Check
  const temporally = isTemporallyActive(
    parsedSign,
    fusion.orarioRilevamento,
    fusion.giornoSettimana,
  );

  // 4. Decisione
  const { decision, reason } = computeDecision(parsedSign, exempt, temporally);

  return {
    scenarioId: fusion.scenarioId,
    parsedSign,
    isVehicleExempt: exempt,
    isTemporallyActive: temporally,
    decision,
    reason,
  };
}

/**
 * Processa un array di FusionResult.
 */
export function parseAllScenarios(fusions: FusionResult[]): ParserResult[] {
  return fusions.map(parseScenario);
}

// Re-export dei sotto-moduli
export { parseSign } from "./logicMapping";
export { isVehicleExempt } from "./vehicleAwareness";
export { isTemporallyActive } from "./temporalCheck";
