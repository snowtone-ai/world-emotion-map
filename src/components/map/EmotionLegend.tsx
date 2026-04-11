"use client";

const DEFAULT_EMOTIONS = [
  { key: "joy", label: "Joy", color: "#FFD166" },
  { key: "trust", label: "Trust", color: "#06D6A0" },
  { key: "fear", label: "Fear", color: "#A78BFA" },
  { key: "anger", label: "Anger", color: "#FF6B6B" },
  { key: "sadness", label: "Sadness", color: "#4EA8DE" },
  { key: "surprise", label: "Surprise", color: "#FF9F1C" },
] as const;

export function EmotionLegend() {
  return (
    <div className="absolute bottom-6 right-4 glass rounded-lg px-3 py-2 z-10 pointer-events-none">
      <p className="text-[10px] font-medium text-[var(--wem-text-secondary)] mb-1.5 uppercase tracking-wide">
        Emotion
      </p>
      <ul className="flex flex-col gap-1">
        {DEFAULT_EMOTIONS.map(({ key, label, color }) => (
          <li key={key} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-[10px] text-[var(--wem-text-secondary)]">
              {label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
