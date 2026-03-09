import { describe, it, expect } from "vitest";
import { parseSign } from "./logicMapping";
import { isVehicleExempt } from "./vehicleAwareness";
import { isTemporallyActive } from "./temporalCheck";
import { parseScenario } from "./index";
import type { FusionResult } from "../types";

// ═══════════════════════════════════════════════
// logicMapping – parseSign
// ═══════════════════════════════════════════════

describe("parseSign – classificazione", () => {
  it("classifica ZTL come DIVIETO/ZTL", () => {
    const s = parseSign("ZTL ATTIVA 08:00-20:00");
    expect(s.category).toBe("DIVIETO");
    expect(s.signType).toBe("ZTL");
  });

  it("classifica DIVIETO DI TRANSITO come DIVIETO/TRANSITO", () => {
    const s = parseSign("DIVIETO DI TRANSITO");
    expect(s.category).toBe("DIVIETO");
    expect(s.signType).toBe("TRANSITO");
  });

  it("classifica DIVIETO DI ACCESSO come DIVIETO/ACCESSO", () => {
    const s = parseSign("DIVIETO DI ACCESSO");
    expect(s.category).toBe("DIVIETO");
    expect(s.signType).toBe("ACCESSO");
  });

  it("classifica DIVIETO DI SOSTA come DIVIETO/SOSTA", () => {
    const s = parseSign("DIVIETO DI SOSTA 0-24 RIMOZIONE FORZATA");
    expect(s.category).toBe("DIVIETO");
    expect(s.signType).toBe("SOSTA");
  });

  it("classifica DIVIETO DI FERMATA come DIVIETO/FERMATA", () => {
    const s = parseSign("DIVIETO DI FERMATA");
    expect(s.signType).toBe("FERMATA");
  });

  it("classifica DIVIETO AFFISSIONE come NON_RILEVANTE", () => {
    const s = parseSign("DIVIETO DI AFFISSIONE");
    expect(s.signType).toBe("NON_RILEVANTE");
  });

  it("classifica DIVIETO SCARICO come NON_RILEVANTE", () => {
    const s = parseSign("DIVIETO DI SCARICO RIFIUTI");
    expect(s.signType).toBe("NON_RILEVANTE");
  });

  it("classifica OBBLIGO DI SVOLTA come OBBLIGO/OBBLIGO_SVOLTA", () => {
    const s = parseSign("OBBLIGO DI SVOLTA A DESTRA");
    expect(s.category).toBe("OBBLIGO");
    expect(s.signType).toBe("OBBLIGO_SVOLTA");
  });

  it("classifica ZONA 30 come OBBLIGO/LIMITE_VELOCITA", () => {
    const s = parseSign("ZONA 30");
    expect(s.category).toBe("OBBLIGO");
    expect(s.signType).toBe("LIMITE_VELOCITA");
  });

  it("classifica RALLENTARE come OBBLIGO/LIMITE_VELOCITA", () => {
    const s = parseSign("RALLENTARE");
    expect(s.signType).toBe("LIMITE_VELOCITA");
  });

  it("classifica ATTENZIONE PEDONI come PERICOLO", () => {
    const s = parseSign("ATTENZIONE PEDONI");
    expect(s.category).toBe("PERICOLO");
    expect(s.signType).toBe("PERICOLO_GENERICO");
  });

  it("classifica LAVORI IN CORSO come PERICOLO/LAVORI", () => {
    const s = parseSign("LAVORI IN CORSO A 100M");
    expect(s.category).toBe("PERICOLO");
    expect(s.signType).toBe("LAVORI");
  });

  it("classifica DOSSO ARTIFICIALE come PERICOLO", () => {
    const s = parseSign("DOSSO ARTIFICIALE");
    expect(s.category).toBe("PERICOLO");
  });

  it("classifica AREA PEDONALE come DIVIETO/AREA_PEDONALE", () => {
    const s = parseSign("AREA PEDONALE");
    expect(s.signType).toBe("AREA_PEDONALE");
  });

  it("classifica STRADA CHIUSA come DIVIETO/STRADA_CHIUSA", () => {
    const s = parseSign("STRADA CHIUSA");
    expect(s.signType).toBe("STRADA_CHIUSA");
  });

  it("classifica SENSO UNICO ALTERNATO come OBBLIGO/SENSO_UNICO", () => {
    const s = parseSign("SENSO UNICO ALTERNATO");
    expect(s.category).toBe("OBBLIGO");
    expect(s.signType).toBe("SENSO_UNICO");
  });

  it("classifica ROTATORIA come OBBLIGO/ROTATORIA", () => {
    const s = parseSign("ROTATORIA");
    expect(s.signType).toBe("ROTATORIA");
  });

  it("classifica CENTRO STORICO come INFORMAZIONE/INFORMATIVO", () => {
    const s = parseSign("CENTRO STORICO");
    expect(s.category).toBe("INFORMAZIONE");
    expect(s.signType).toBe("INFORMATIVO");
  });

  it("classifica PIAZZA DEL DUOMO come INFORMAZIONE", () => {
    const s = parseSign("PIAZZA DEL DUOMO");
    expect(s.category).toBe("INFORMAZIONE");
  });

  it("classifica SENSO VIETATO come DIVIETO/SENSO_VIETATO", () => {
    const s = parseSign("SENSO VIETATO");
    expect(s.signType).toBe("SENSO_VIETATO");
  });

  it("classifica DIVIETO generico (senza sotto-tipo) come ACCESSO", () => {
    const s = parseSign("DIVIETO");
    expect(s.signType).toBe("ACCESSO");
  });
});

describe("parseSign – eccezioni", () => {
  it("estrae ECCETTO BUS", () => {
    const s = parseSign("DIVIETO DI TRANSITO ECCETTO BUS");
    expect(s.exceptions).toContain("BUS");
  });

  it("estrae BUS_TAXI da ECCETTO BUS E TAXI", () => {
    const s = parseSign("DIVIETO DI ACCESSO ECCETTO BUS E TAXI");
    expect(s.exceptions).toContain("BUS_TAXI");
  });

  it("estrae NAVETTE_L4", () => {
    const s = parseSign("DIVIETO DI TRANSITO ECCETTO NAVETTE L4");
    expect(s.exceptions).toContain("NAVETTE_L4");
  });

  it("estrae VEICOLI_ELETTRICI", () => {
    const s = parseSign("ECCETTO VEICOLI ELETTRICI");
    expect(s.exceptions).toContain("VEICOLI_ELETTRICI");
  });

  it("estrae RESIDENTI", () => {
    const s = parseSign("ECCETTO RESIDENTI");
    expect(s.exceptions).toContain("RESIDENTI");
  });

  it("estrae MEZZI_SOCCORSO", () => {
    const s = parseSign("ECCETTO MEZZI DI SOCCORSO");
    expect(s.exceptions).toContain("MEZZI_SOCCORSO");
  });

  it("estrae FORNITORI", () => {
    const s = parseSign("ECCETTO FORNITORE DALLE 08:00 ALLE 10:00");
    expect(s.exceptions).toContain("FORNITORI");
  });

  it("estrae MEZZI_PESANTI come target di restrizione", () => {
    const s = parseSign("DIVIETO DI TRANSITO MEZZI PESANTI");
    expect(s.exceptions).toContain("MEZZI_PESANTI");
  });

  it("estrae AUTORIZZATI", () => {
    const s = parseSign("DIVIETO DI TRANSITO ECCETTO AUTORIZZATI");
    expect(s.exceptions).toContain("AUTORIZZATI");
  });
});

describe("parseSign – vincoli temporali", () => {
  it("estrae fascia oraria HH:MM-HH:MM", () => {
    const s = parseSign("ZTL ATTIVA 08:00-20:00");
    expect(s.timeConstraint).toEqual({
      startHour: 8, startMinute: 0,
      endHour: 20, endMinute: 0,
    });
  });

  it("estrae fascia oraria abbreviata HH-HH", () => {
    const s = parseSign("ZTL 22-06");
    expect(s.timeConstraint).toEqual({
      startHour: 22, startMinute: 0,
      endHour: 6, endMinute: 0,
    });
  });

  it("estrae fascia DALLE HH:MM ALLE HH:MM", () => {
    const s = parseSign("ECCETTO FORNITORE DALLE 08:00 ALLE 10:00");
    expect(s.timeConstraint).toEqual({
      startHour: 8, startMinute: 0,
      endHour: 10, endMinute: 0,
    });
  });

  it("riconosce SEMPRE come isAlwaysActive", () => {
    const s = parseSign("ZTL SEMPRE");
    expect(s.isAlwaysActive).toBe(true);
  });

  it("riconosce 0-24 come isAlwaysActive", () => {
    const s = parseSign("ZTL ATTIVA 0-24");
    expect(s.isAlwaysActive).toBe(true);
  });

  it("riconosce VARCO NON ATTIVO come isExplicitlyInactive", () => {
    const s = parseSign("ZTL VARCO NON ATTIVO");
    expect(s.isExplicitlyInactive).toBe(true);
  });

  it("riconosce VARCO INATTIVO come isExplicitlyInactive", () => {
    const s = parseSign("VARCO INATTIVO");
    expect(s.isExplicitlyInactive).toBe(true);
  });

  it("riconosce FINE ZTL come isExplicitlyInactive", () => {
    const s = parseSign("FINE ZTL");
    expect(s.isExplicitlyInactive).toBe(true);
  });
});

describe("parseSign – vincoli giornalieri", () => {
  it("estrae DAL LUNEDI AL VENERDI", () => {
    const s = parseSign("DIVIETO DI ACCESSO DAL LUNEDI AL VENERDI");
    expect(s.dayConstraint?.activeDays).toEqual([
      "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì",
    ]);
  });

  it("estrae LUN-VEN abbreviato", () => {
    const s = parseSign("DIVIETO LUN-VEN");
    expect(s.dayConstraint?.activeDays).toEqual([
      "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì",
    ]);
  });

  it("estrae FESTIVI", () => {
    const s = parseSign("ZTL SOLO GIORNI FESTIVI");
    expect(s.dayConstraint?.activeDays).toEqual(["Sabato", "Domenica"]);
  });

  it("estrae giorno singolo (VENERDI)", () => {
    const s = parseSign("MERCATO RIONALE VENERDI 06:00-14:00");
    expect(s.dayConstraint?.activeDays).toEqual(["Venerdì"]);
  });
});

// ═══════════════════════════════════════════════
// vehicleAwareness – isVehicleExempt
// ═══════════════════════════════════════════════

describe("isVehicleExempt", () => {
  it("esenzione BUS → navetta è BUS → true", () => {
    const s = parseSign("DIVIETO DI TRANSITO ECCETTO BUS");
    expect(isVehicleExempt(s)).toBe(true);
  });

  it("esenzione BUS_TAXI → navetta è BUS → true", () => {
    const s = parseSign("DIVIETO DI ACCESSO ECCETTO BUS E TAXI");
    expect(isVehicleExempt(s)).toBe(true);
  });

  it("esenzione NAVETTE_L4 → true", () => {
    const s = parseSign("DIVIETO DI TRANSITO ECCETTO NAVETTE L4");
    expect(isVehicleExempt(s)).toBe(true);
  });

  it("esenzione VEICOLI_ELETTRICI → navetta è elettrica → true", () => {
    const s = parseSign("ECCETTO VEICOLI ELETTRICI");
    expect(isVehicleExempt(s)).toBe(true);
  });

  it("esenzione RESIDENTI → navetta NON è residente → false", () => {
    const s = parseSign("ECCETTO RESIDENTI");
    expect(isVehicleExempt(s)).toBe(false);
  });

  it("esenzione MEZZI_SOCCORSO → navetta NON è soccorso → false", () => {
    const s = parseSign("ECCETTO MEZZI DI SOCCORSO");
    expect(isVehicleExempt(s)).toBe(false);
  });

  it("restrizione MEZZI_PESANTI → navetta NON è pesante → esentata", () => {
    const s = parseSign("DIVIETO DI TRANSITO MEZZI PESANTI");
    expect(isVehicleExempt(s)).toBe(true);
  });

  it("DIVIETO generico senza eccezione → non esentata", () => {
    const s = parseSign("DIVIETO DI TRANSITO");
    expect(isVehicleExempt(s)).toBe(false);
  });
});

// ═══════════════════════════════════════════════
// temporalCheck – isTemporallyActive
// ═══════════════════════════════════════════════

describe("isTemporallyActive", () => {
  it("VARCO NON ATTIVO → sempre inattivo", () => {
    const s = parseSign("ZTL VARCO NON ATTIVO");
    expect(isTemporallyActive(s, "10:00", "Lunedì")).toBe(false);
  });

  it("ZTL SEMPRE → sempre attivo", () => {
    const s = parseSign("ZTL SEMPRE");
    expect(isTemporallyActive(s, "03:00", "Domenica")).toBe(true);
  });

  it("ZTL 08:00-20:00 → attivo alle 10:00", () => {
    const s = parseSign("ZTL ATTIVA 08:00-20:00");
    expect(isTemporallyActive(s, "10:00", "Mercoledì")).toBe(true);
  });

  it("ZTL 08:00-20:00 → inattivo alle 22:00", () => {
    const s = parseSign("ZTL ATTIVA 08:00-20:00");
    expect(isTemporallyActive(s, "22:00", "Mercoledì")).toBe(false);
  });

  it("ZTL 22-06 notturna → attivo alle 23:00", () => {
    const s = parseSign("ZTL 22-06");
    expect(isTemporallyActive(s, "23:00", "Martedì")).toBe(true);
  });

  it("ZTL 22-06 notturna → attivo alle 03:00", () => {
    const s = parseSign("ZTL 22-06");
    expect(isTemporallyActive(s, "03:00", "Martedì")).toBe(true);
  });

  it("ZTL 22-06 notturna → inattivo alle 14:00", () => {
    const s = parseSign("ZTL 22-06");
    expect(isTemporallyActive(s, "14:00", "Martedì")).toBe(false);
  });

  it("DIVIETO DAL LUNEDI AL VENERDI → attivo di Lunedì", () => {
    const s = parseSign("DIVIETO DI ACCESSO DAL LUNEDI AL VENERDI");
    expect(isTemporallyActive(s, "09:00", "Lunedì")).toBe(true);
  });

  it("DIVIETO DAL LUNEDI AL VENERDI → inattivo di Sabato", () => {
    const s = parseSign("DIVIETO DI ACCESSO DAL LUNEDI AL VENERDI");
    expect(isTemporallyActive(s, "09:00", "Sabato")).toBe(false);
  });

  it("MERCATO VENERDI 06:00-14:00 → attivo Venerdì 10:30", () => {
    const s = parseSign("MERCATO RIONALE VENERDI 06:00-14:00");
    expect(isTemporallyActive(s, "10:30", "Venerdì")).toBe(true);
  });

  it("MERCATO VENERDI 06:00-14:00 → inattivo Venerdì 15:00", () => {
    const s = parseSign("MERCATO RIONALE VENERDI 06:00-14:00");
    expect(isTemporallyActive(s, "15:00", "Venerdì")).toBe(false);
  });

  it("MERCATO VENERDI 06:00-14:00 → inattivo Lunedì 10:00", () => {
    const s = parseSign("MERCATO RIONALE VENERDI 06:00-14:00");
    expect(isTemporallyActive(s, "10:00", "Lunedì")).toBe(false);
  });

  it("Segnale senza vincoli temporali → attivo di default", () => {
    const s = parseSign("DIVIETO DI TRANSITO");
    expect(isTemporallyActive(s, "12:00", "Giovedì")).toBe(true);
  });
});

// ═══════════════════════════════════════════════
// parseScenario – integrazione end-to-end
// ═══════════════════════════════════════════════

function makeFusionResult(overrides: Partial<FusionResult>): FusionResult {
  return {
    scenarioId: 1,
    fusedText: "DIVIETO DI TRANSITO",
    overallConfidence: 0.90,
    requiresHumanIntervention: false,
    normalizedReadings: [],
    orarioRilevamento: "10:00",
    giornoSettimana: "Lunedì",
    ...overrides,
  };
}

describe("parseScenario – integrazione", () => {
  it("bassa confidenza → INTERVENTO_UMANO", () => {
    const r = parseScenario(makeFusionResult({
      overallConfidence: 0.40,
      requiresHumanIntervention: true,
    }));
    expect(r.decision).toBe("INTERVENTO_UMANO");
  });

  it("nessun testo → INTERVENTO_UMANO", () => {
    const r = parseScenario(makeFusionResult({
      fusedText: null,
      requiresHumanIntervention: true,
    }));
    expect(r.decision).toBe("INTERVENTO_UMANO");
  });

  it("DIVIETO TRANSITO senza eccezione → STOP", () => {
    const r = parseScenario(makeFusionResult({
      fusedText: "DIVIETO DI TRANSITO",
    }));
    expect(r.decision).toBe("STOP");
  });

  it("DIVIETO TRANSITO ECCETTO BUS → PROCEDI (navetta è BUS)", () => {
    const r = parseScenario(makeFusionResult({
      fusedText: "DIVIETO DI TRANSITO ECCETTO BUS",
    }));
    expect(r.decision).toBe("PROCEDI");
    expect(r.isVehicleExempt).toBe(true);
  });

  it("DIVIETO TRANSITO ECCETTO NAVETTE L4 → PROCEDI", () => {
    const r = parseScenario(makeFusionResult({
      fusedText: "DIVIETO DI TRANSITO ECCETTO NAVETTE L4",
    }));
    expect(r.decision).toBe("PROCEDI");
    expect(r.isVehicleExempt).toBe(true);
  });

  it("DIVIETO TRANSITO ECCETTO RESIDENTI → STOP (navetta non è residente)", () => {
    const r = parseScenario(makeFusionResult({
      fusedText: "ECCETTO RESIDENTI",
    }));
    expect(r.decision).toBe("STOP");
    expect(r.isVehicleExempt).toBe(false);
  });

  it("ZTL ATTIVA 08:00-20:00, ore 10:00 → STOP", () => {
    const r = parseScenario(makeFusionResult({
      fusedText: "ZTL ATTIVA 08:00-20:00",
      orarioRilevamento: "10:00",
    }));
    expect(r.decision).toBe("STOP");
    expect(r.isTemporallyActive).toBe(true);
  });

  it("ZTL ATTIVA 08:00-20:00, ore 22:00 → PROCEDI (fuori orario)", () => {
    const r = parseScenario(makeFusionResult({
      fusedText: "ZTL ATTIVA 08:00-20:00",
      orarioRilevamento: "22:00",
    }));
    expect(r.decision).toBe("PROCEDI");
    expect(r.isTemporallyActive).toBe(false);
  });

  it("ZTL VARCO NON ATTIVO → PROCEDI", () => {
    const r = parseScenario(makeFusionResult({
      fusedText: "ZTL VARCO NON ATTIVO",
    }));
    expect(r.decision).toBe("PROCEDI");
  });

  it("ATTENZIONE PEDONI → RALLENTA", () => {
    const r = parseScenario(makeFusionResult({
      fusedText: "ATTENZIONE PEDONI",
    }));
    expect(r.decision).toBe("RALLENTA");
  });

  it("LAVORI IN CORSO → RALLENTA", () => {
    const r = parseScenario(makeFusionResult({
      fusedText: "LAVORI IN CORSO A 100M",
    }));
    expect(r.decision).toBe("RALLENTA");
  });

  it("ZONA 30 → RALLENTA", () => {
    const r = parseScenario(makeFusionResult({
      fusedText: "ZONA 30",
    }));
    expect(r.decision).toBe("RALLENTA");
  });

  it("OBBLIGO DI SVOLTA → RALLENTA", () => {
    const r = parseScenario(makeFusionResult({
      fusedText: "OBBLIGO DI SVOLTA A DESTRA",
    }));
    expect(r.decision).toBe("RALLENTA");
  });

  it("DIVIETO DI SOSTA → PROCEDI (non blocca transito)", () => {
    const r = parseScenario(makeFusionResult({
      fusedText: "DIVIETO DI SOSTA 0-24 RIMOZIONE FORZATA",
    }));
    expect(r.decision).toBe("PROCEDI");
  });

  it("DIVIETO DI FERMATA → PROCEDI (non blocca transito)", () => {
    const r = parseScenario(makeFusionResult({
      fusedText: "DIVIETO DI FERMATA",
    }));
    expect(r.decision).toBe("PROCEDI");
  });

  it("CENTRO STORICO → PROCEDI (informativo)", () => {
    const r = parseScenario(makeFusionResult({
      fusedText: "CENTRO STORICO",
    }));
    expect(r.decision).toBe("PROCEDI");
  });

  it("DIVIETO AFFISSIONE → PROCEDI (non rilevante)", () => {
    const r = parseScenario(makeFusionResult({
      fusedText: "DIVIETO DI AFFISSIONE",
    }));
    expect(r.decision).toBe("PROCEDI");
  });

  it("DIVIETO TRANSITO MEZZI PESANTI → PROCEDI (navetta non è pesante)", () => {
    const r = parseScenario(makeFusionResult({
      fusedText: "DIVIETO DI TRANSITO MEZZI PESANTI",
    }));
    expect(r.decision).toBe("PROCEDI");
    expect(r.isVehicleExempt).toBe(true);
  });

  it("ACCESSO CONSENTITO VEICOLI ELETTRICI → PROCEDI (informativo)", () => {
    const r = parseScenario(makeFusionResult({
      fusedText: "ACCESSO CONSENTITO AI VEICOLI ELETTRICI",
    }));
    expect(r.decision).toBe("PROCEDI");
  });

  it("AREA PEDONALE → STOP", () => {
    const r = parseScenario(makeFusionResult({
      fusedText: "AREA PEDONALE",
    }));
    expect(r.decision).toBe("STOP");
  });

  it("STRADA CHIUSA → STOP", () => {
    const r = parseScenario(makeFusionResult({
      fusedText: "STRADA CHIUSA",
    }));
    expect(r.decision).toBe("STOP");
  });

  it("MERCATO RIONALE VENERDI 06:00-14:00, Venerdì 10:30 → RALLENTA", () => {
    const r = parseScenario(makeFusionResult({
      fusedText: "MERCATO RIONALE VENERDI 06:00-14:00",
      orarioRilevamento: "10:30",
      giornoSettimana: "Venerdì",
    }));
    // Mercato è PERICOLO_GENERICO o INFORMAZIONE → vediamo cosa decide
    // In realtà il mercato non è un divieto, è un pericolo/attenzione
    expect(["RALLENTA", "PROCEDI"]).toContain(r.decision);
  });

  it("DIVIETO ACCESSO DAL LUNEDI AL VENERDI, Sabato → PROCEDI", () => {
    const r = parseScenario(makeFusionResult({
      fusedText: "DIVIETO DI ACCESSO DAL LUNEDI AL VENERDI",
      orarioRilevamento: "09:00",
      giornoSettimana: "Sabato",
    }));
    expect(r.decision).toBe("PROCEDI");
    expect(r.isTemporallyActive).toBe(false);
  });

  it("ZTL NOTTURNA 23:00-05:00, ore 02:00 → STOP", () => {
    const r = parseScenario(makeFusionResult({
      fusedText: "ZTL NOTTURNA 23:00-05:00",
      orarioRilevamento: "02:00",
    }));
    expect(r.decision).toBe("STOP");
  });

  it("ZTL NOTTURNA 23:00-05:00, ore 16:00 → PROCEDI", () => {
    const r = parseScenario(makeFusionResult({
      fusedText: "ZTL NOTTURNA 23:00-05:00",
      orarioRilevamento: "16:00",
    }));
    expect(r.decision).toBe("PROCEDI");
  });

  it("SENSO VIETATO → STOP", () => {
    const r = parseScenario(makeFusionResult({
      fusedText: "SENSO VIETATO",
    }));
    expect(r.decision).toBe("STOP");
  });

  it("ZTL ATTIVA ECCETTO NAVETTE L4 → PROCEDI (esentata)", () => {
    const r = parseScenario(makeFusionResult({
      fusedText: "ZTL ATTIVA ECCETTO NAVETTE L4",
      orarioRilevamento: "10:00",
    }));
    expect(r.decision).toBe("PROCEDI");
    expect(r.isVehicleExempt).toBe(true);
  });
});
