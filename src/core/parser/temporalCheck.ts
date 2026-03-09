import type { ParsedSign, GiornoSettimana } from "../types";

/**
 * Converte una stringa "HH:MM" in minuti dall'inizio del giorno.
 */
function timeToMinutes(hour: number, minute: number): number {
  return hour * 60 + minute;
}

/**
 * Parsa l'orario di rilevamento "HH:MM" in ore e minuti.
 * Gestisce formati malformati restituendo valori di default sicuri.
 */
function parseOrario(orario: string): { hour: number; minute: number } {
  if (orario == null || typeof orario !== "string") {
    return { hour: 12, minute: 0 }; // Default: mezzogiorno (safety fallback)
  }
  const parts = orario.split(":");
  const h = parseInt(parts[0] ?? "", 10);
  const m = parseInt(parts[1] ?? "0", 10);
  // Se il parsing fallisce (NaN) o produce valori fuori range, usa default sicuri
  const hour = isNaN(h) || h < 0 || h > 23 ? 12 : h;
  const minute = isNaN(m) || m < 0 || m > 59 ? 0 : m;
  return { hour, minute };
}

/**
 * Verifica se l'orario corrente cade dentro la fascia oraria.
 * Gestisce anche fasce notturne che attraversano la mezzanotte
 * (es. 22:00-06:00, 23:00-05:00).
 */
function isTimeInRange(
  currentHour: number,
  currentMinute: number,
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number,
): boolean {
  const current = timeToMinutes(currentHour, currentMinute);
  const start = timeToMinutes(startHour, startMinute);
  const end = timeToMinutes(endHour, endMinute);

  if (start <= end) {
    // Fascia diurna normale (es. 08:00-20:00)
    return current >= start && current < end;
  } else {
    // Fascia notturna che attraversa la mezzanotte (es. 22:00-06:00)
    return current >= start || current < end;
  }
}

/**
 * Normalizza un nome di giorno rimuovendo accenti e convertendo in lowercase
 * per confronti robusti.
 */
function normalizeDay(day: string): string {
  return day.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/**
 * Determina se la restrizione del segnale è attualmente attiva
 * rispetto all'orario e al giorno correnti.
 *
 * Regole:
 * - Se il segnale è esplicitamente inattivo (VARCO NON ATTIVO) → false
 * - Se è segnato come "sempre" attivo (0-24, SEMPRE) → true
 * - Se ha vincolo orario → verifica fascia
 * - Se ha vincolo giornaliero → verifica giorno
 * - Se non ha vincoli temporali → true (attivo di default)
 */
export function isTemporallyActive(
  sign: ParsedSign,
  orario: string,
  giorno: GiornoSettimana,
): boolean {
  // Varco esplicitamente non attivo → sempre inattivo
  if (sign.isExplicitlyInactive) {
    return false;
  }

  // Sempre attivo → non serve controllare orario/giorno
  if (sign.isAlwaysActive) {
    return true;
  }

  const { hour, minute } = parseOrario(orario);
  let timeActive = true;
  let dayActive = true;

  // Controlla vincolo orario
  if (sign.timeConstraint) {
    timeActive = isTimeInRange(
      hour,
      minute,
      sign.timeConstraint.startHour,
      sign.timeConstraint.startMinute,
      sign.timeConstraint.endHour,
      sign.timeConstraint.endMinute,
    );
  }

  // Controlla vincolo giornaliero (confronto robusto: accent/case insensitive)
  if (sign.dayConstraint) {
    const normalizedGiorno = normalizeDay(giorno);
    dayActive = sign.dayConstraint.activeDays.some(
      (d) => normalizeDay(d) === normalizedGiorno,
    );
  }

  return timeActive && dayActive;
}
