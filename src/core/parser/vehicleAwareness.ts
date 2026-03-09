import type { ParsedSign, ExceptionType } from "../types";
import { VEHICLE_PROPERTIES } from "../types";

/**
 * Mappa eccezione → proprietà del veicolo che la soddisfa.
 *
 * Se l'eccezione è presente nel segnale E la proprietà corrispondente
 * è true per la navetta → il veicolo è esentato.
 */
const EXCEPTION_TO_VEHICLE: Record<ExceptionType, keyof typeof VEHICLE_PROPERTIES | null> = {
  BUS:               "isBus",
  BUS_TAXI:          "isBus",         // navetta è BUS → soddisfa "BUS E TAXI"
  NAVETTE_L4:        "isNavettaL4",
  VEICOLI_ELETTRICI: "isElettrico",
  RESIDENTI:         "isResidente",
  MEZZI_SOCCORSO:    "isMezzoSoccorso",
  FORNITORI:         "isFornitore",
  AUTORIZZATI:       "isAutorizzato",
  MEZZI_PESANTI:     null,            // gestito separatamente
  VEICOLI_MOTORE:    null,            // gestito separatamente
};

/**
 * Determina se la navetta è esentata dal segnale.
 *
 * Regole:
 * - Se il segnale ha un'eccezione che corrisponde a una proprietà
 *   true del veicolo → esentato (es. "ECCETTO BUS" e navetta è BUS)
 * - Se il segnale è rivolto SOLO a MEZZI_PESANTI → la navetta NON è
 *   un mezzo pesante, quindi non è coinvolta (= esentata)
 * - Se il segnale è rivolto a VEICOLI_MOTORE → la navetta è elettrica
 *   ma è comunque un veicolo a motore elettrico → NON esentata
 */
export function isVehicleExempt(sign: ParsedSign): boolean {
  // Se restrizione rivolta solo a mezzi pesanti → navetta non coinvolta
  if (
    sign.exceptions.includes("MEZZI_PESANTI") &&
    !VEHICLE_PROPERTIES.isMezzoPesante
  ) {
    return true;
  }

  // Controlla eccezioni esplicite
  for (const exception of sign.exceptions) {
    const vehicleKey = EXCEPTION_TO_VEHICLE[exception];
    if (vehicleKey !== null && VEHICLE_PROPERTIES[vehicleKey]) {
      return true;
    }
  }

  return false;
}
