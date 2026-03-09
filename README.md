# Hackaton-Hastega-9-3-2026

# V-SHUTTLE | Autonomous Fleet Human-Machine Interface

[cite_start]Sistema di monitoraggio e supporto decisionale per flotte di navette a guida autonoma di Livello 4 (Waymo LCC)[cite: 7]. [cite_start]Il progetto risolve il distacco tra l'intelligenza artificiale del veicolo e il Safety Driver tramite un'interfaccia reattiva e un motore di fusione dati deterministico[cite: 24].

---

## 🛠 Requisiti di Sistema

* **Runtime:** Node.js v20.x (LTS) o superiore.
* **Gestore Pacchetti:** npm v10+ o pnpm.
* **Linguaggio:** TypeScript 5.x (Strict Mode).
* **Frontend Framework:** React 18+ (Vite).
* [cite_start]**Styling:** Tailwind CSS (ottimizzato per touch target "Fat Finger" [cite: 77]).
* [cite_start]**Testing:** Vitest (per la validazione dell'algoritmo di fusione [cite: 58]).

---

## 🏗 Architettura del Progetto

[cite_start]Il software segue i principi del **Clean Code** e della **Modularità**[cite: 96], separando la logica di elaborazione sensoriale dalla visualizzazione.

### Struttura delle Directory
```text
.
├── src/
[cite_start]│   ├── core/                # Logica di business pura (Deterministica) [cite: 47]
[cite_start]│   │   ├── fusion/          # Algoritmo di fusione pesata dei sensori [cite: 85]
[cite_start]│   │   ├── parser/          # Motore semantico (ZTL, BUS, Orari) [cite: 30, 88]
│   │   └── types/           # Definizioni TypeScript globali
[cite_start]│   ├── components/          # Componenti UI Dashboard [cite: 32]
[cite_start]│   │   ├── shared/          # Pulsanti Override, Timer, Indicatori confidenza [cite: 75, 80]
[cite_start]│   │   └── simulation/      # Logica del ciclo automatico (4s/2s) 
│   ├── hooks/               # State management della simulazione
[cite_start]│   ├── data/                # Dataset JSON (incluso il test segreto T-10) [cite: 28, 50]
│   └── App.tsx              # Entry point dell'interfaccia
├── tests/                   # Unit test per scenari critici e edge cases
└── README.md                # Questo file (Source of Truth)
