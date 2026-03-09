# Hackaton-Hastega-9-3-2026

# 🛰️ V-SHUTTLE: HMI & Decision Support System (Waymo LCC)

[cite_start]Questo progetto implementa il sistema di bordo per le navette a guida autonoma di Livello 4 operanti nei centri storici toscani[cite: 7, 13]. [cite_start]L'obiettivo è eliminare il fenomeno del "Phantom Braking" fornendo al Safety Driver (Marco) una dashboard decisionale chiara e un motore di fusione dati deterministico che risolva le ambiguità dei sensori[cite: 23, 24].

---

## 🛠️ Stack Tecnologico e Requisiti

[cite_start]Il sistema deve essere leggero, reattivo e totalmente deterministico[cite: 47].

* **Linguaggio:** TypeScript 5.x (Strict Mode). [cite_start]L'uso del tipaggio forte è obbligatorio per garantire la robustezza del backend durante lo stress test[cite: 58].
* **Frontend:** React 18+ con Vite. [cite_start]Scelto per la gestione efficiente dei cicli di simulazione in tempo reale[cite: 34].
* **Styling:** Tailwind CSS. [cite_start]Necessario per implementare rapidamente l'interfaccia "Fat Finger" e la semaforica cromatica[cite: 41, 77].
* **Runtime:** Node.js v20 (LTS).
* [cite_start]**Testing:** Vitest per la validazione dell'algoritmo di fusione e del parser semantico[cite: 83].

---

## 🏗️ Architettura del Sistema

[cite_start]L'architettura è suddivisa in tre moduli principali per garantire la manutenibilità e superare i criteri di "Clean Code" della giuria[cite: 96].

### 1. Data Fusion Engine (`/src/core/fusion`)
[cite_start]Modulo responsabile della "pulizia" e dell'integrazione dei dati provenienti dai tre sensori di bordo[cite: 26]:
* [cite_start]**Normalizzazione OCR:** Trasforma stringhe sporche (es. "D1V1ET0") in testo standard[cite: 87].
* [cite_start]**Fusione Pesata:** Applica un peso differenziato basato sull'affidabilità: Telecamera Frontale (Alta), Laterale (Media), V2I (Variabile)[cite: 26, 85].
* **Confidence Scoring:** Calcola il livello di certezza della lettura. [cite_start]Se inferiore alla soglia critica, triggera la richiesta di intervento umano[cite: 31, 80].

### 2. Semantic Parser (`/src/core/parser`)
[cite_start]Motore di regole deterministico (senza chiamate a LLM esterne)[cite: 46, 94]:
* **Logic Mapping:** Identifica divieti, obblighi e pericoli.
* [cite_start]**Vehicle Awareness:** Applica la regola "Eccetto BUS" poiché la navetta è classificata come tale[cite: 30, 93].
* [cite_start]**Temporal Check:** Incrocia l'orario del sistema con i vincoli ZTL o mercati rionali presenti nel testo[cite: 88, 92].

### 3. Live Dashboard UI (`/src/components`)
[cite_start]Interfaccia ottimizzata per tablet da 12 pollici[cite: 17, 32]:
* [cite_start]**Simulation Loop:** Ciclo automatico di 4 secondi per scenario[cite: 35, 74].
* [cite_start]**Human-in-the-loop:** Timer di 2 secondi per l'override manuale in caso di bassa confidenza[cite: 39, 75].
* [cite_start]**Safety Fallback:** Se il timer scade, il sistema imposta automaticamente lo stato su `STOP`[cite: 40, 76].

---

## 🔄 Workflow del Team (Step-by-Step)

Per coordinare il team di tre persone, seguiamo una metodologia Agile semplificata.

### 1. Inizializzazione e Branching
* **Branch `main`:** Contiene solo codice stabile e testato.
* **Branch `feature/*`:** Ogni membro lavora su un ramo specifico (es. `feature/fusion-logic`, `feature/ui-dashboard`).
* **Convenzione Commit:** `feat:`, `fix:`, `docs:`, `test:`.

### 2. Sviluppo e Integrazione (GitHub Flow)
1.  **Sviluppo Locale:** Codice scritto in VS Code con supporto Copilot per boilerplate e regex[cite: 45].
2.  **Pull Request (PR):** Aperta verso `main`. Richiede la revisione di almeno un altro compagno di team.
3.  **Stress Test Readiness:** Prima del merge, verificare che il sistema carichi correttamente il file `VShuttle-input.json` senza crashare[cite: 51].

### 3. Gestione del "Test Segreto" (T-10)
Negli ultimi 10 minuti[cite: 50]:
1.  Il responsabile DevOps carica il nuovo file JSON nella cartella `/data`.
2.  Si esegue il comando `npm test` per verificare la robustezza algoritmica[cite: 84].
3.  Si avvia la simulazione live per la valutazione della giuria.

---

## 🤖 Guida per Copilot (@workspace)

Per istruire correttamente l'IA durante lo sviluppo:
* **Context:** Fai riferimento sempre al file `src/core/types.ts` per le interfacce dei sensori.
* **Constraint:** Se chiedi di generare logica decisionale, ricorda a Copilot che **è vietato usare API esterne (OpenAI/Claude)**; la logica deve essere contenuta in funzioni pure in `src/core/parser`[cite: 46, 47].
* [cite_start]**UX:** Quando generi componenti CSS, richiedi target di pressione minimi di 44x44px per i pulsanti (regola "Fat Finger")[cite: 77].

---

## 🚀 Comandi Rapidi

### Setup Iniziale
```bash
npm install