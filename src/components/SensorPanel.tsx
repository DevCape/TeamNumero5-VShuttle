import type { NormalizedReading } from "../core/types";

interface SensorPanelProps {
  readings: NormalizedReading[];
}

function confidenceColor(confidence: number | null): string {
  if (confidence === null) return "text-gray-500";
  if (confidence >= 0.8) return "text-green-400";
  if (confidence >= 0.6) return "text-yellow-400";
  return "text-red-400";
}

function confidenceBar(confidence: number | null): string {
  if (confidence === null) return "w-0";
  const pct = Math.round(confidence * 100);
  // Tailwind non supporta valori arbitrari inline per width,
  // usiamo style inline per la barra
  return `${pct}%`;
}

function confidenceBg(confidence: number | null): string {
  if (confidence === null) return "bg-gray-600";
  if (confidence >= 0.8) return "bg-green-500";
  if (confidence >= 0.6) return "bg-yellow-500";
  return "bg-red-500";
}

const SENSOR_LABELS: Record<string, string> = {
  camera_frontale: "Camera Frontale",
  camera_laterale: "Camera Laterale",
  V2I_receiver: "V2I Receiver",
};

export function SensorPanel({ readings }: SensorPanelProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Sensori</h3>
      {readings.map((r) => (
        <div key={r.sensorId} className="bg-gray-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-400">
              {SENSOR_LABELS[r.sensorId] ?? r.sensorId}
            </span>
            <span className={`text-xs font-mono ${confidenceColor(r.confidence)}`}>
              {r.confidence !== null ? `${(r.confidence * 100).toFixed(0)}%` : "N/A"}
            </span>
          </div>
          <div className="text-sm font-medium text-white mb-2 min-h-[20px]">
            {r.normalizedText ?? <span className="text-gray-500 italic">Nessun dato</span>}
          </div>
          {r.originalText && r.originalText !== r.normalizedText && (
            <div className="text-xs text-gray-500 mb-2">
              OCR: <span className="font-mono">{r.originalText}</span>
            </div>
          )}
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${confidenceBg(r.confidence)}`}
              style={{ width: confidenceBar(r.confidence) }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
