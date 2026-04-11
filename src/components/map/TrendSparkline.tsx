"use client";

import type { TrendSnapshot } from "@/hooks/useTrend";
import type { Emotion } from "@/lib/emotions";

const EMOTION_COLORS: Record<string, string> = {
  joy: "var(--color-emotion-joy)",
  trust: "var(--color-emotion-trust)",
  fear: "var(--color-emotion-fear)",
  anger: "var(--color-emotion-anger)",
  sadness: "var(--color-emotion-sadness)",
  surprise: "var(--color-emotion-surprise)",
  optimism: "var(--color-emotion-optimism)",
  uncertainty: "var(--color-emotion-uncertainty)",
};

const SIX_EMOTIONS: Emotion[] = [
  "joy",
  "trust",
  "fear",
  "anger",
  "sadness",
  "optimism",
];

function dominantEmotion(snap: TrendSnapshot): Emotion {
  let best: Emotion = "joy";
  let bestScore = -Infinity;
  for (const e of SIX_EMOTIONS) {
    const score = snap[e];
    if (score > bestScore) {
      bestScore = score;
      best = e;
    }
  }
  return best;
}

function mostFrequent(items: Emotion[]): Emotion {
  const counts: Partial<Record<Emotion, number>> = {};
  for (const item of items) {
    counts[item] = (counts[item] ?? 0) + 1;
  }
  let best: Emotion = items[0] ?? "joy";
  let bestCount = 0;
  for (const [k, v] of Object.entries(counts) as [Emotion, number][]) {
    if (v > bestCount) {
      bestCount = v;
      best = k;
    }
  }
  return best;
}

type Props = { snapshots: TrendSnapshot[] };

const W = 280;
const H = 56;
const PAD = 4;

export function TrendSparkline({ snapshots }: Props) {
  if (snapshots.length < 2) {
    return (
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} aria-label="24h trend">
        <text
          x={W / 2}
          y={H / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="10"
          fill="var(--wem-text-muted)"
        >
          Not enough data
        </text>
      </svg>
    );
  }

  const dominants = snapshots.map(dominantEmotion);
  const color = EMOTION_COLORS[mostFrequent(dominants)] ?? "var(--wem-accent)";

  const rawScores = snapshots.map((s, i) => s[dominants[i]!]);
  const yMin = Math.min(...rawScores);
  const yMax = Math.max(...rawScores);
  const yRange = yMax === yMin ? 1 : yMax - yMin;

  const chartH = H - PAD * 2;
  const n = snapshots.length;

  const points = rawScores.map((score, i) => {
    const x = (i / (n - 1)) * W;
    const y = PAD + chartH - ((score - yMin) / yRange) * chartH;
    return [x, y] as [number, number];
  });

  const polylineStr = points.map(([x, y]) => `${x},${y}`).join(" ");

  // Closed path for area fill
  const areaPath = [
    `M ${points[0]![0]},${H}`,
    ...points.map(([x, y]) => `L ${x},${y}`),
    `L ${points[n - 1]![0]},${H}`,
    "Z",
  ].join(" ");

  return (
    <svg
      width="100%"
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      aria-label="24h emotion trend sparkline"
    >
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((frac) => {
        const y = PAD + chartH * (1 - frac);
        return (
          <line
            key={frac}
            x1={0}
            y1={y}
            x2={W}
            y2={y}
            stroke="var(--wem-border)"
            strokeWidth={0.5}
          />
        );
      })}

      {/* Area fill */}
      <path d={areaPath} fill={color} fillOpacity={0.15} />

      {/* Line */}
      <polyline
        points={polylineStr}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
