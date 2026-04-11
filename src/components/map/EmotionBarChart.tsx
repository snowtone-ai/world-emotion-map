"use client";

import type { Emotion } from "@/lib/emotions";

const EMOTION_ORDER: Emotion[] = [
  "joy",
  "trust",
  "optimism",
  "surprise",
  "fear",
  "uncertainty",
  "anger",
  "sadness",
];

const EMOTION_COLORS: Record<Emotion, string> = {
  joy: "var(--color-emotion-joy)",
  trust: "var(--color-emotion-trust)",
  fear: "var(--color-emotion-fear)",
  anger: "var(--color-emotion-anger)",
  sadness: "var(--color-emotion-sadness)",
  surprise: "var(--color-emotion-surprise)",
  optimism: "var(--color-emotion-optimism)",
  uncertainty: "var(--color-emotion-uncertainty)",
};

type Props = { scores: Record<Emotion, number> };

export function EmotionBarChart({ scores }: Props) {
  return (
    <ul className="flex flex-col gap-2.5" aria-label="Emotion scores">
      {EMOTION_ORDER.map((emotion) => {
        const pct = Math.round((scores[emotion] ?? 0) * 100);
        const color = EMOTION_COLORS[emotion];
        return (
          <li key={emotion}>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs capitalize text-[var(--wem-text-secondary)]">
                {emotion}
              </span>
              <span
                className="text-xs font-semibold font-mono text-[var(--wem-text)]"
                aria-label={`${pct} out of 100`}
              >
                {pct}
              </span>
            </div>
            <div
              className="h-1.5 w-full rounded-full bg-[var(--wem-surface-raised)]"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: color,
                  boxShadow: `0 0 6px ${color}99`,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
