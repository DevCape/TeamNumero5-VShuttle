import type { ParsedSign, GiornoSettimana } from "../types";

/**
 * Converte una stringa "HH:MM" in minuti dall'inizio del giorno.
 */
function timeToMinutes(hour: number, minute: number): number {
  return hour * 60 + minute;
}

/**
 * Parsa l'orario di rilevamento "HH:MM" in ore e minuti.
 */
function parseOrario(orario: string): { hour: number; minute: number } {
  const [h, m] = orario.split(":");
  return { hour: parseInt(h!, 10), minute: parseInt(m!, 10) };
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

  // Controlla vincolo giornaliero
  if (sign.dayConstraint) {
    dayActive = sign.dayConstraint.activeDays.includes(giorno);
  }

  return timeActive && dayActive;
}
