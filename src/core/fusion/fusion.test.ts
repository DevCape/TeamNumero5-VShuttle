import { describe, it, expect } from "vitest";
import { normalizeOcrText, normalizeSensorReading } from "./normalizer";
import { selectBestText, computeWeightedConfidence } from "./weightedFusion";
import { assessConfidence } from "./confidenceScoring";
import { processScenario } from "./index";
import type { Scenario, NormalizedReading } from "../types";
import { CONFIDENCE_THRESHOLD } from "../types";

// ─── normalizeOcrText ───────────────────────────

describe("normalizeOcrText", () => {
  it("ritorna null per input null", () => {
    expect(normalizeOcrText(null)).toBeNull();
  });

  it("ritorna null per stringa vuota", () => {
    expect(normalizeOcrText("")).toBeNull();
    expect(normalizeOcrText("   ")).toBeNull();
  });

  it("converte leet-speak: D1V1ET0 D1 ACCE550", () => {
    expect(normalizeOcrText("D1V1ET0 D1 ACCE550")).toBe("DIVIETO DI ACCESSO");
  });

  it("converte leet-speak: R0T4T0R14", () => {
    expect(normalizeOcrText("R0T4T0R14")).toBe("ROTATORIA");
  });

  it("converte leet-speak: S3NS0 UN1C0 4LT3RN4T0", () => {
    expect(normalizeOcrText("S3NS0 UN1C0 4LT3RN4T0")).toBe("SENSO UNICO ALTERNATO");
  });

  it("converte leet-speak: Z0N4 30 (preserva numeri puri)", () => {
    expect(normalizeOcrText("Z0N4 30")).toBe("ZONA 30");
  });

  it("converte leet-speak: 5T4Z10N3 F3RR0V14R14", () => {
    expect(normalizeOcrText("5T4Z10N3 F3RR0V14R14")).toBe("STAZIONE FERROVIARIA");
  });

  it("converte leet-speak: 4R3A P3D0NAL3", () => {
    expect(normalizeOcrText("4R3A P3D0NAL3")).toBe("AREA PEDONALE");
  });

  it("rimuove spaziature tra caratteri: D I V I E T O   D I   T R A N S I T O", () => {
    expect(normalizeOcrText("D I V I E T O   D I   T R A N S I T O")).toBe("DIVIETO DI TRANSITO");
  });

  it("rimuove spaziature tra caratteri: Z T L", () => {
    expect(normalizeOcrText("Z T L")).toBe("ZTL");
  });

  it("rimuove punti da abbreviazioni: V.A.R.C.O.", () => {
    expect(normalizeOcrText("ZTL V.A.R.C.O. NON ATTIVO")).toBe("ZTL VARCO NON ATTIVO");
  });

  it("normalizza fasce orarie: 08:00 20:00 → 08:00-20:00", () => {
    expect(normalizeOcrText("ZTL ATTIVA 8:00 20:00")).toBe("ZTL ATTIVA 8:00-20:00");
  });

  it("non altera testo già pulito", () => {
    expect(normalizeOcrText("DIVIETO DI TRANSITO ECCETTO BUS")).toBe("DIVIETO DI TRANSITO ECCETTO BUS");
  });
});

// ─── selectBestText ─────────────────────────────

describe("selectBestText", () => {
  it("ritorna null se tutte le letture sono null", () => {
    const readings: NormalizedReading[] = [
      { sensorId: "camera_frontale", originalText: null, normalizedText: null, confidence: null },
      { sensorId: "camera_laterale", originalText: null, normalizedText: null, confidence: null },
      { sensorId: "V2I_receiver", originalText: null, normalizedText: null, confidence: null },
    ];
    expect(selectBestText(readings)).toBeNull();
  });

  it("sceglie il testo con consenso maggiore", () => {
    const readings: NormalizedReading[] = [
      { sensorId: "camera_frontale", originalText: "ZTL", normalizedText: "ZTL", confidence: 0.99 },
      { sensorId: "camera_laterale", originalText: "ZTL", normalizedText: "ZTL", confidence: 0.98 },
      { sensorId: "V2I_receiver", originalText: "ZTL", normalizedText: "ZTL", confidence: 0.97 },
    ];
    const result = selectBestText(readings);
    expect(result?.text).toBe("ZTL");
    expect(result?.contributingReadings).toHaveLength(3);
  });

  it("preferisce il candidato con score pesato più alto anche con meno sensori", () => {
    const readings: NormalizedReading[] = [
      { sensorId: "camera_frontale", originalText: "A", normalizedText: "A", confidence: 0.95 },
      { sensorId: "camera_laterale", originalText: "B", normalizedText: "B", confidence: 0.90 },
      { sensorId: "V2I_receiver", originalText: "B", normalizedText: "B", confidence: 0.85 },
    ];
    const result = selectBestText(readings);
    // A: 0.50*0.95 = 0.475
    // B: 0.30*0.90 + 0.20*0.85 = 0.27 + 0.17 = 0.44
    expect(result?.text).toBe("A");
  });
});

// ─── computeWeightedConfidence ──────────────────

describe("computeWeightedConfidence", () => {
  it("ritorna 0 se nessun sensore ha dati", () => {
    const readings: NormalizedReading[] = [
      { sensorId: "camera_frontale", originalText: null, normalizedText: null, confidence: null },
      { sensorId: "camera_laterale", originalText: null, normalizedText: null, confidence: null },
      { sensorId: "V2I_receiver", originalText: null, normalizedText: null, confidence: null },
    ];
    expect(computeWeightedConfidence(readings)).toBe(0);
  });

  it("calcola correttamente con tutti i sensori attivi", () => {
    const readings: NormalizedReading[] = [
      { sensorId: "camera_frontale", originalText: "ZTL", normalizedText: "ZTL", confidence: 0.99 },
      { sensorId: "camera_laterale", originalText: "ZTL", normalizedText: "ZTL", confidence: 0.98 },
      { sensorId: "V2I_receiver", originalText: "ZTL", normalizedText: "ZTL", confidence: 0.97 },
    ];
    // (0.50*0.99 + 0.30*0.98 + 0.20*0.97) / (0.50+0.30+0.20) = 0.983
    const result = computeWeightedConfidence(readings);
    expect(result).toBeCloseTo(0.983, 2);
  });

  it("esclude sensori null dal calcolo", () => {
    const readings: NormalizedReading[] = [
      { sensorId: "camera_frontale", originalText: "ZTL", normalizedText: "ZTL", confidence: 0.90 },
      { sensorId: "camera_laterale", originalText: "ZTL", normalizedText: "ZTL", confidence: 0.80 },
      { sensorId: "V2I_receiver", originalText: null, normalizedText: null, confidence: null },
    ];
    // (0.50*0.90 + 0.30*0.80) / (0.50+0.30) = (0.45+0.24)/0.80 = 0.8625
    const result = computeWeightedConfidence(readings);
    expect(result).toBeCloseTo(0.8625, 3);
  });
});

// ─── assessConfidence ───────────────────────────

describe("assessConfidence", () => {
  it("richiede intervento umano se nessun sensore ha dati", () => {
    const readings: NormalizedReading[] = [
      { sensorId: "camera_frontale", originalText: null, normalizedText: null, confidence: null },
      { sensorId: "camera_laterale", originalText: null, normalizedText: null, confidence: null },
      { sensorId: "V2I_receiver", originalText: null, normalizedText: null, confidence: null },
    ];
    const result = assessConfidence(readings, null);
    expect(result.requiresHumanIntervention).toBe(true);
    expect(result.activeSensorCount).toBe(0);
  });

  it("non richiede intervento umano con alta confidenza", () => {
    const readings: NormalizedReading[] = [
      { sensorId: "camera_frontale", originalText: "ZTL", normalizedText: "ZTL", confidence: 0.99 },
      { sensorId: "camera_laterale", originalText: "ZTL", normalizedText: "ZTL", confidence: 0.98 },
      { sensorId: "V2I_receiver", originalText: "ZTL", normalizedText: "ZTL", confidence: 0.97 },
    ];
    const result = assessConfidence(readings, "ZTL");
    expect(result.requiresHumanIntervention).toBe(false);
    expect(result.agreementCount).toBe(3);
  });

  it("richiede intervento umano con bassa confidenza", () => {
    const readings: NormalizedReading[] = [
      { sensorId: "camera_frontale", originalText: "X", normalizedText: "X", confidence: 0.44 },
      { sensorId: "camera_laterale", originalText: "Y", normalizedText: "Y", confidence: 0.51 },
      { sensorId: "V2I_receiver", originalText: null, normalizedText: null, confidence: null },
    ];
    const result = assessConfidence(readings, "Y");
    expect(result.requiresHumanIntervention).toBe(true);
    expect(result.overallConfidence).toBeLessThan(CONFIDENCE_THRESHOLD);
  });
});

// ─── processScenario (integrazione) ─────────────

describe("processScenario", () => {
  it("processa scenario con tutti i 3 sensori concordi (ZTL)", () => {
    const scenario: Scenario = {
      id_scenario: 70,
      sensori: {
        camera_frontale: { testo: "ZTL", confidenza: 0.99 },
        camera_laterale: { testo: "ZTL", confidenza: 0.98 },
        V2I_receiver: { testo: "ZTL", confidenza: 0.97 },
      },
      orario_rilevamento: "09:25",
      giorno_settimana: "Venerdì",
    };
    const result = processScenario(scenario);
    expect(result.fusedText).toBe("ZTL");
    expect(result.overallConfidence).toBeGreaterThan(0.95);
    expect(result.requiresHumanIntervention).toBe(false);
  });

  it("processa scenario con OCR corrotto (D1V1ET0)", () => {
    const scenario: Scenario = {
      id_scenario: 79,
      sensori: {
        camera_frontale: { testo: "D1V1ET0 D1 ACCE550", confidenza: 0.62 },
        camera_laterale: { testo: "DIVIETO DI ACCESSO", confidenza: 0.69 },
        V2I_receiver: { testo: null, confidenza: null },
      },
      orario_rilevamento: "16:40",
      giorno_settimana: "Giovedì",
    };
    const result = processScenario(scenario);
    expect(result.fusedText).toBe("DIVIETO DI ACCESSO");
    expect(result.normalizedReadings[0]?.normalizedText).toBe("DIVIETO DI ACCESSO");
  });

  it("processa scenario con sensori tutti null", () => {
    const scenario: Scenario = {
      id_scenario: 105,
      sensori: {
        camera_frontale: { testo: null, confidenza: null },
        camera_laterale: { testo: null, confidenza: null },
        V2I_receiver: { testo: null, confidenza: null },
      },
      orario_rilevamento: "00:00",
      giorno_settimana: "Lunedì",
    };
    const result = processScenario(scenario);
    expect(result.fusedText).toBeNull();
    expect(result.requiresHumanIntervention).toBe(true);
    expect(result.overallConfidence).toBe(0);
  });

  it("processa scenario con spaziature OCR (D I V I E T O)", () => {
    const scenario: Scenario = {
      id_scenario: 30,
      sensori: {
        camera_frontale: { testo: "D I V I E T O   D I   T R A N S I T O", confidenza: 0.78 },
        camera_laterale: { testo: "DIVIETO DI TRANSITO", confidenza: 0.82 },
        V2I_receiver: { testo: null, confidenza: null },
      },
      orario_rilevamento: "09:35",
      giorno_settimana: "Mercoledì",
    };
    const result = processScenario(scenario);
    expect(result.fusedText).toBe("DIVIETO DI TRANSITO");
  });

  it("processa scenario con ZTL e fascia oraria", () => {
    const scenario: Scenario = {
      id_scenario: 3,
      sensori: {
        camera_frontale: { testo: "ZTL ATTIVA 08:00 - 20:00", confidenza: 0.95 },
        camera_laterale: { testo: "ZTL ATTIVA 8:00 20:00", confidenza: 0.81 },
        V2I_receiver: { testo: "ZTL 08-20", confidenza: 0.91 },
      },
      orario_rilevamento: "10:00",
      giorno_settimana: "Mercoledì",
    };
    const result = processScenario(scenario);
    expect(result.fusedText).not.toBeNull();
    expect(result.overallConfidence).toBeGreaterThan(CONFIDENCE_THRESHOLD);
  });
});
