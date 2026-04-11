"use client";

import { LEGEND } from "@/lib/emotions";
import type { ColorMode } from "@/lib/emotions";

type Props = {
  colorMode: ColorMode;
  onModeChange: (mode: ColorMode) => void;
};

const MODES: { value: ColorMode; label: string }[] = [
  { value: 2, label: "2" },
  { value: 4, label: "4" },
  { value: 6, label: "Detailed" },
];

export function EmotionLegend({ colorMode, onModeChange }: Props) {
  const entries = LEGEND[colorMode];

  return (
    <div className="absolute bottom-6 right-4 glass rounded-lg px-3 py-2 z-10">
      {/* Mode toggle */}
      <div className="flex items-center gap-0.5 mb-2">
        {MODES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onModeChange(value)}
            className={[
              "px-2 py-0.5 rounded text-[10px] font-medium transition-colors",
              colorMode === value
                ? "bg-white/20 text-white"
                : "text-[var(--wem-text-muted)] hover:text-white hover:bg-white/10",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Legend swatches */}
      <p className="text-[10px] font-medium text-[var(--wem-text-secondary)] mb-1.5 uppercase tracking-wide">
        Emotion
      </p>
      <ul className="flex flex-col gap-1">
        {entries.map(({ key, label, color }) => (
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
