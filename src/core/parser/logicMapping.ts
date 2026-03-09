import type {
  ParsedSign,
  SignCategory,
  SignType,
  ExceptionType,
  TimeConstraint,
  DayConstraint,
  GiornoSettimana,
} from "../types";

// ──────────────────────────────────────────────
// Estrazione eccezioni
// ──────────────────────────────────────────────

function extractExceptions(text: string): ExceptionType[] {
  const exceptions: ExceptionType[] = [];

  // Ordine: pattern più specifici prima
  if (/ECCETTO\s+(BUS\s+E\s+TAXI|BUS\s+TAXI)|BUS\s+TAXI\s+OK/.test(text)) {
    exceptions.push("BUS_TAXI");
  } else if (/ECCETTO\s+(BUS|NAVETTE(?!\s*L4))|ECCETTO\s+BUS/.test(text)) {
    // "ECCETTO BUS" ma non "ECCETTO NAVETTE L4"
    if (/ECCETTO\s+BUS/.test(text) && !exceptions.includes("BUS_TAXI")) {
      exceptions.push("BUS");
    }
  }

  if (/NAVETTE?\s*L4|TRANSITO\s+L4\s+OK|ZTL.*ECCETTO\s+NAVETTE\s*L4|NAVETTE\s+L4\s+OK/.test(text)) {
    exceptions.push("NAVETTE_L4");
  }

  if (/ECCETTO\s+VEICOLI\s+ELETTRICI|ECCETTO\s+ELETTRICI|OK\s+ELETTRICI|ACCESSO\s+(CONSENTITO\s+AI\s+)?VEICOLI\s+ELETTRICI|ACCESSO\s+ELETTRICI/.test(text)) {
    exceptions.push("VEICOLI_ELETTRICI");
  }

  if (/ECCETTO\s+RESIDENTI/.test(text)) {
    exceptions.push("RESIDENTI");
  }

  if (/ECCETTO\s+(MEZZI\s+DI\s+)?SOCCORSO/.test(text)) {
    exceptions.push("MEZZI_SOCCORSO");
  }

  if (/ECCETTO\s+FORNITORE/.test(text)) {
    exceptions.push("FORNITORI");
  }

  if (/ECCETTO\s+AUTORIZZATI/.test(text)) {
    exceptions.push("AUTORIZZATI");
  }

  // Restrizioni specifiche per categoria di veicolo (non sono eccezioni
  // per la navetta, ma indicano il target della restrizione)
  if (/MEZZI\s+PESANTI/.test(text) && !text.includes("ECCETTO")) {
    exceptions.push("MEZZI_PESANTI");
  }

  if (/VEICOLI\s+A\s+MOTORE/.test(text) && !text.includes("ECCETTO")) {
    exceptions.push("VEICOLI_MOTORE");
  }

  return exceptions;
}

// ──────────────────────────────────────────────
// Estrazione vincoli temporali
// ──────────────────────────────────────────────

function parseTime(h: string, m?: string): { hour: number; minute: number } {
  return { hour: parseInt(h, 10), minute: m ? parseInt(m, 10) : 0 };
}

function extractTimeConstraint(text: string): TimeConstraint | null {
  // Pattern "HH:MM-HH:MM" o "HH:MM - HH:MM"
  let match = text.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (match) {
    return {
      startHour: parseInt(match[1]!, 10),
      startMinute: parseInt(match[2]!, 10),
      endHour: parseInt(match[3]!, 10),
      endMinute: parseInt(match[4]!, 10),
    };
  }

  // Pattern "HH-HH" abbreviato (es. "08-20", "22-06", "06-14")
  // Richiede che entrambi i numeri siano ore valide (0-24)
  match = text.match(/\b(2[0-4]|1\d|0?\d)-(2[0-4]|1\d|0?\d)\b/);
  if (match) {
    const h1 = parseInt(match[1]!, 10);
    const h2 = parseInt(match[2]!, 10);
    if (h1 <= 24 && h2 <= 24) {
      return {
        startHour: h1,
        startMinute: 0,
        endHour: h2,
        endMinute: 0,
      };
    }
  }

  // Pattern "0-24" (sempre attivo)
  // → gestito dal flag isAlwaysActive, non come TimeConstraint

  // Pattern "DALLE HH:MM ALLE HH:MM"
  match = text.match(/DALLE?\s+(\d{1,2}):?(\d{2})?\s+ALLE?\s+(\d{1,2}):?(\d{2})?/);
  if (match) {
    const start = parseTime(match[1]!, match[2]);
    const end = parseTime(match[3]!, match[4]);
    return {
      startHour: start.hour,
      startMinute: start.minute,
      endHour: end.hour,
      endMinute: end.minute,
    };
  }

  // Pattern singolo orario "DALLE 20" / "ATTIVA 20" (→ dalle 20 a fine giornata)
  match = text.match(/(?:DALLE?|ATTIVA)\s+(\d{1,2})(?::(\d{2}))?(?:\s|$)/);
  if (match) {
    const start = parseTime(match[1]!, match[2]);
    return {
      startHour: start.hour,
      startMinute: start.minute,
      endHour: 24,
      endMinute: 0,
    };
  }

  return null;
}

// ──────────────────────────────────────────────
// Estrazione vincoli su giorno della settimana
// ──────────────────────────────────────────────

const GIORNI_FERIALI: GiornoSettimana[] = [
  "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì",
];
const GIORNI_FESTIVI: GiornoSettimana[] = ["Sabato", "Domenica"];

const GIORNO_MAP: Record<string, GiornoSettimana> = {
  "LUNEDI": "Lunedì",
  "MARTEDI": "Martedì",
  "MERCOLEDI": "Mercoledì",
  "GIOVEDI": "Giovedì",
  "VENERDI": "Venerdì",
  "SABATO": "Sabato",
  "DOMENICA": "Domenica",
};

function extractDayConstraint(text: string): DayConstraint | null {
  // "DAL LUNEDI AL VENERDI" / "LUN-VEN"
  if (/\bLUN(?:EDI)?\s*-\s*VEN(?:ERDI)?\b/i.test(text) || /\bDAL\s+LUN(?:EDI)?.*AL\s+VEN(?:ERDI)?\b/i.test(text)) {
    return { activeDays: GIORNI_FERIALI };
  }

  // "FESTIVI" / "GIORNI FESTIVI" — ma NON "PREFESTIVO" / "PREFESTIVI"
  if (/(?<![A-Z])FESTIV[IO]/i.test(text) && !/PREFESTIV/i.test(text)) {
    return { activeDays: GIORNI_FESTIVI };
  }

  // Giorni multipli o singoli (es. "SABATO E DOMENICA", "LUNEDI MERCOLEDI VENERDI")
  const matchedDays: GiornoSettimana[] = [];
  for (const [key, value] of Object.entries(GIORNO_MAP)) {
    if (text.includes(key)) {
      matchedDays.push(value);
    }
  }
  if (matchedDays.length > 0) {
    return { activeDays: matchedDays };
  }

  // "NOTTE" / "NOTTURNA" → tutti i giorni (il vincolo orario è separato)
  // "SERA" → tutti i giorni
  // Non restituiamo day constraint, solo time constraint
  return null;
}

// ──────────────────────────────────────────────
// Classificazione principale del segnale
// ──────────────────────────────────────────────

function classifySign(text: string): { category: SignCategory; signType: SignType } {
  // ── ZTL (ha priorità, anche "ZTL ATTIVA ECCETTO..." è una ZTL) ──
  if (/\bZTL\b|VARCO|USCITA\s+ZTL|FINE\s+ZTL/.test(text)) {
    return { category: "DIVIETO", signType: "ZTL" };
  }

  // ── DIVIETO ──
  if (/DIVIETO/.test(text) || /^NO\s/.test(text) || /SENSO\s+VIETATO/.test(text)) {
    if (/AFFISSIONE|SCARICO/.test(text)) {
      return { category: "DIVIETO", signType: "NON_RILEVANTE" };
    }
    // Priorità: i divieti bloccanti (TRANSITO, SENSO VIETATO) hanno precedenza
    // su quelli non-bloccanti (SOSTA, FERMATA), per gestire segnali combinati
    // come "DIVIETO DI TRANSITO E SOSTA"
    if (/SENSO\s+VIETATO/.test(text)) {
      return { category: "DIVIETO", signType: "SENSO_VIETATO" };
    }
    if (/TRANSITO/.test(text)) {
      return { category: "DIVIETO", signType: "TRANSITO" };
    }
    if (/ACCESSO/.test(text)) {
      return { category: "DIVIETO", signType: "ACCESSO" };
    }
    if (/SOSTA/.test(text)) {
      return { category: "DIVIETO", signType: "SOSTA" };
    }
    if (/FERMATA/.test(text)) {
      return { category: "DIVIETO", signType: "FERMATA" };
    }
    // Divieto generico senza sotto-tipo → trattato come ACCESSO
    return { category: "DIVIETO", signType: "ACCESSO" };
  }

  // ── STRADA CHIUSA ──
  if (/STRADA\s+CHIUSA/.test(text)) {
    return { category: "DIVIETO", signType: "STRADA_CHIUSA" };
  }

  // ── AREA PEDONALE ──
  if (/AREA\s+PEDONALE/.test(text)) {
    return { category: "DIVIETO", signType: "AREA_PEDONALE" };
  }

  // ── OBBLIGO ──
  if (/OBBLIGO/.test(text)) {
    return { category: "OBBLIGO", signType: "OBBLIGO_SVOLTA" };
  }

  // ── LIMITE DI VELOCITÀ ──
  if (/ZONA\s+30|LIMITE.*KM|LIMIT\s+\d+|RALLENTARE/.test(text)) {
    return { category: "OBBLIGO", signType: "LIMITE_VELOCITA" };
  }

  // ── PERICOLI ──
  if (/ATTENZIONE|PERICOLO/.test(text)) {
    return { category: "PERICOLO", signType: "PERICOLO_GENERICO" };
  }
  if (/LAVORI/.test(text)) {
    return { category: "PERICOLO", signType: "LAVORI" };
  }
  if (/DOSSO|STRADA\s+DISSESTATA|STRADA\s+SDISSESTATA/.test(text)) {
    return { category: "PERICOLO", signType: "PERICOLO_GENERICO" };
  }
  if (/PASSAGGIO\s+A\s+LIVELLO/.test(text)) {
    return { category: "PERICOLO", signType: "PERICOLO_GENERICO" };
  }

  // ── SENSO UNICO ──
  if (/SENSO\s+UNICO/.test(text)) {
    return { category: "OBBLIGO", signType: "SENSO_UNICO" };
  }

  // ── ROTATORIA ──
  if (/ROTATORIA/.test(text)) {
    return { category: "OBBLIGO", signType: "ROTATORIA" };
  }

  // ── ECCEZIONI standalone (es. "ECCETTO RESIDENTI" senza prefisso DIVIETO) ──
  if (/^ECCETTO/.test(text)) {
    return { category: "DIVIETO", signType: "ACCESSO" };
  }

  // ── ACCESSO CONSENTITO (es. "ACCESSO CONSENTITO AI VEICOLI ELETTRICI") ──
  if (/ACCESSO\s+CONSENTITO|ACCESSO\s+ELETTRICI|TRANSITO\s+L4\s+OK/.test(text)) {
    return { category: "INFORMAZIONE", signType: "INFORMATIVO" };
  }

  // ── INFORMAZIONE generica ──
  return { category: "INFORMAZIONE", signType: "INFORMATIVO" };
}

// ──────────────────────────────────────────────
// Entry point: classifica il testo fuso in ParsedSign
// ──────────────────────────────────────────────

export function parseSign(text: string): ParsedSign {
  const upper = text.toUpperCase();
  const { category, signType } = classifySign(upper);
  const exceptions = extractExceptions(upper);
  const timeConstraint = extractTimeConstraint(upper);
  const dayConstraint = extractDayConstraint(upper);

  const isExplicitlyInactive =
    /VARCO\s+(NON\s+ATTIVO|INATTIVO)|FINE\s+ZTL|USCITA\s+ZTL/.test(upper);

  const isAlwaysActive =
    /\b0-24\b|SEMPRE/.test(upper);

  return {
    category,
    signType,
    exceptions,
    timeConstraint,
    dayConstraint,
    isExplicitlyInactive,
    isAlwaysActive,
    rawText: text,
  };
}
