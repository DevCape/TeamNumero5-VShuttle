import type { Decision } from "../core/types";

const DECISION_CONFIG: Record<Decision, { label: string; bg: string; text: string; ring: string }> = {
  PROCEDI:          { label: "PROCEDI",           bg: "bg-green-600",  text: "text-white", ring: "ring-green-400" },
  RALLENTA:         { label: "RALLENTA",          bg: "bg-yellow-500", text: "text-black", ring: "ring-yellow-300" },
  STOP:             { label: "STOP",              bg: "bg-red-600",    text: "text-white", ring: "ring-red-400" },
  INTERVENTO_UMANO: { label: "INTERVENTO UMANO",  bg: "bg-purple-600", text: "text-white", ring: "ring-purple-400" },
};

interface DecisionBadgeProps {
  decision: Decision | null;
  large?: boolean;
}

export function DecisionBadge({ decision, large = false }: DecisionBadgeProps) {
  if (!decision) {
    return (
      <div className={`
        inline-flex items-center justify-center rounded-xl
        bg-gray-700 text-gray-300 ring-2 ring-gray-500
        ${large ? "px-8 py-4 text-2xl font-bold" : "px-4 py-2 text-sm font-semibold"}
      `}>
        IN ATTESA
      </div>
    );
  }

  const config = DECISION_CONFIG[decision];

  return (
    <div className={`
      inline-flex items-center justify-center rounded-xl ring-4
      ${config.bg} ${config.text} ${config.ring}
      ${large ? "px-8 py-4 text-2xl font-bold min-w-[200px]" : "px-4 py-2 text-sm font-semibold"}
      transition-all duration-300
    `}>
      {config.label}
    </div>
  );
}
