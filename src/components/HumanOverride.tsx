import type { Decision } from "../core/types";

interface HumanOverrideProps {
  timerMs: number;
  onOverride: (decision: Decision) => void;
}

const MAX_TIMER_MS = 2000;

export function HumanOverride({ timerMs, onOverride }: HumanOverrideProps) {
  const pct = (timerMs / MAX_TIMER_MS) * 100;
  const seconds = (timerMs / 1000).toFixed(1);

  return (
    <div className="bg-purple-900/50 border-2 border-purple-500 rounded-2xl p-6 space-y-4 animate-pulse-slow">
      <div className="text-center">
        <h3 className="text-lg font-bold text-purple-200 uppercase tracking-wide">
          Intervento Richiesto
        </h3>
        <p className="text-sm text-purple-300 mt-1">
          Confidenza insufficiente. Scegli un'azione o il sistema imposterà STOP.
        </p>
      </div>

      {/* Countdown bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-purple-300">
          <span>Tempo rimanente</span>
          <span className="font-mono font-bold">{seconds}s</span>
        </div>
        <div className="w-full bg-purple-950 rounded-full h-3">
          <div
            className="h-3 rounded-full bg-purple-400 transition-all duration-100"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Bottoni Fat Finger: min 44x44px */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => onOverride("PROCEDI")}
          className="min-h-[44px] min-w-[44px] px-4 py-3 rounded-xl
            bg-green-600 hover:bg-green-500 active:bg-green-700
            text-white font-bold text-base
            transition-colors duration-150
            focus:outline-none focus:ring-4 focus:ring-green-400"
        >
          PROCEDI
        </button>
        <button
          onClick={() => onOverride("RALLENTA")}
          className="min-h-[44px] min-w-[44px] px-4 py-3 rounded-xl
            bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600
            text-black font-bold text-base
            transition-colors duration-150
            focus:outline-none focus:ring-4 focus:ring-yellow-300"
        >
          RALLENTA
        </button>
        <button
          onClick={() => onOverride("STOP")}
          className="min-h-[44px] min-w-[44px] px-4 py-3 rounded-xl
            bg-red-600 hover:bg-red-500 active:bg-red-700
            text-white font-bold text-base
            transition-colors duration-150
            focus:outline-none focus:ring-4 focus:ring-red-400"
        >
          STOP
        </button>
      </div>
    </div>
  );
}
