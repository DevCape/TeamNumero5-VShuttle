import type { SensorReading, NormalizedReading, SensorId } from "../types";

// ──────────────────────────────────────────────
// Mappa leet-speak → carattere standard
// Copre i pattern OCR osservati nel dataset:
//   1→I, 0→O, 3→E, 4→A, 5→S
// ──────────────────────────────────────────────
const LEET_MAP: Record<string, string> = {
  "0": "O",
  "1": "I",
  "3": "E",
  "4": "A",
  "5": "S",
};

/**
 * Rimuove le spaziature artificiali tra singoli caratteri.
 * "D I V I E T O   D I   T R A N S I T O" → "DIVIETO DI TRANSITO"
 * "Z T L" → "ZTL"
 *
 * Strategia: splitta per 2+ spazi (separatori tra "parole"),
 * poi dentro ogni segmento collassa le sequenze di singoli caratteri.
 */
function removeCharSpacing(text: string): string {
  // Splitta per 2+ spazi (conservando i separatori tra parole)
  const segments = text.split(/\s{2,}/);
  const processed = segments.map((segment) =>
    // Se il segmento è una sequenza di singoli caratteri separati da uno spazio
    /^[A-Z0-9]( [A-Z0-9])+$/.test(segment)
      ? segment.replace(/ /g, "")
      : segment,
  );
  return processed.join(" ");
}

/**
 * Rimuove i punti da abbreviazioni tipo V.A.R.C.O. → VARCO
 */
function removeDotSeparators(text: string): string {
  return text.replace(
    /\b([A-Z])(?:\.([A-Z]))+\.?/g,
    (match) => match.replace(/\./g, ""),
  );
}

/**
 * Sostituisce i caratteri leet-speak con le lettere corrispondenti.
 * "D1V1ET0" → "DIVIETO"
 *
 * Preserva i numeri all'interno di pattern temporali (HH:MM, HH-MM)
 * e numeri che fanno parte di valori numerici reali (es. "30", "100M").
 */
/** Token alfanumerici corti da preservare (sigle di dominio) */
const PRESERVE_TOKENS = new Set(["L4"]);

function deleetify(text: string): string {
  // Strategia: splitta per token e de-leeta solo quelli che sembrano parole OCR corrotte.
  return text.replace(/\b[A-Z0-9]+\b/g, (token) => {
    // Se contiene ':' (orario) → non toccare
    if (token.includes(":")) return token;
    // Se è un numero puro (es. "30", "100") → non toccare
    if (/^\d+$/.test(token)) return token;
    // Se è un token di dominio noto (es. "L4" per navette L4) → non toccare
    if (PRESERVE_TOKENS.has(token)) return token;
    // Altrimenti de-leeta i caratteri (per token come "D1V1ET0", "D1", "ACCE550")
    let result = "";
    for (const char of token) {
      result += LEET_MAP[char] ?? char;
    }
    return result;
  });
}

/**
 * Normalizza il separatore nelle fasce orarie.
 * "08:00 20:00" → "08:00-20:00"
 */
function normalizeTimeRanges(text: string): string {
  return text.replace(
    /(\d{1,2}:\d{2})\s+(\d{1,2}:\d{2})/g,
    "$1-$2",
  );
}

/**
 * Collassa spazi multipli in uno singolo e fa trim.
 */
function collapseSpaces(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Pipeline completa di normalizzazione OCR.
 *
 * Ordine:
 * 1. Uppercase
 * 2. Rimozione spaziature tra caratteri singoli
 * 3. Rimozione punti da abbreviazioni
 * 4. De-leet (numeri → lettere)
 * 5. Normalizzazione fasce orarie
 * 6. Collasso spazi
 */
export function normalizeOcrText(raw: string | null | undefined): string | null {
  if (raw == null || raw.trim() === "") {
    return null;
  }

  let text = raw.toUpperCase();
  text = removeCharSpacing(text);
  text = removeDotSeparators(text);
  text = normalizeTimeRanges(text);
  text = deleetify(text);
  text = collapseSpaces(text);

  return text;
}

/**
 * Normalizza una singola lettura sensore.
 */
export function normalizeSensorReading(
  sensorId: SensorId,
  reading: SensorReading | null | undefined,
): NormalizedReading {
  if (reading == null) {
    return {
      sensorId,
      originalText: null,
      normalizedText: null,
      confidence: null,
    };
  }
  return {
    sensorId,
    originalText: reading.testo ?? null,
    normalizedText: normalizeOcrText(reading.testo),
    confidence: reading.confidenza ?? null,
  };
}
