/**
 * Color mode logic for World Emotion Map.
 *
 * Three display modes for progressive disclosure:
 *   2 — Positive / Negative (instant gestalt)
 *   4 — Quadrant (joy cluster, fear cluster, anger, sadness)
 *   6 — Detailed (business-relevant breakdown)
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type ColorMode = 2 | 4 | 6;

export type Emotion =
  | "joy"
  | "trust"
  | "fear"
  | "anger"
  | "sadness"
  | "surprise"
  | "optimism"
  | "uncertainty";

export type CountryEmotionRaw = {
  countryCode: string; // ISO 3166-1 alpha-2
  scores: Record<Emotion, number>;
};

// ── Palettes ───────────────────────────────────────────────────────────────

/**
 * Mode 2: Positive vs Negative
 * Positive = joy + trust + optimism + surprise (news-context surprise skews positive)
 * Negative = fear + anger + sadness + uncertainty
 */
const PALETTE_2: Record<string, string> = {
  positive: "#34D399", // Emerald
  negative: "#FF6B6B", // Coral
};

/**
 * Mode 4: Quadrant
 * Joy group  = max(joy, trust, optimism)
 * Fear group = max(fear, uncertainty)
 * Anger      = solo
 * Sadness    = solo
 * (surprise excluded — absorbed into Joy group context)
 */
const PALETTE_4: Record<string, string> = {
  joy: "#FFD166", // Amber — joy/trust/optimism cluster
  fear: "#A78BFA", // Violet — fear/uncertainty cluster
  anger: "#FF6B6B", // Coral
  sadness: "#4EA8DE", // Sky Blue
};

/**
 * Mode 6: Detailed (business-relevant)
 * Covers the 6 emotions with clearest business signal.
 * (surprise and uncertainty excluded: ambiguous / redundant at this level)
 */
const PALETTE_6: Record<string, string> = {
  joy: "#FFD166", // Amber
  trust: "#06D6A0", // Teal
  fear: "#A78BFA", // Violet
  anger: "#FF6B6B", // Coral
  sadness: "#4EA8DE", // Sky Blue
  optimism: "#84CC16", // Lime
};

// ── Legend entries (label + color per mode) ────────────────────────────────

export type LegendEntry = { key: string; label: string; color: string };

export const LEGEND: Record<ColorMode, LegendEntry[]> = {
  2: [
    { key: "positive", label: "Positive", color: PALETTE_2.positive },
    { key: "negative", label: "Negative", color: PALETTE_2.negative },
  ],
  4: [
    { key: "joy", label: "Joy / Trust", color: PALETTE_4.joy },
    { key: "fear", label: "Fear / Uncertainty", color: PALETTE_4.fear },
    { key: "anger", label: "Anger", color: PALETTE_4.anger },
    { key: "sadness", label: "Sadness", color: PALETTE_4.sadness },
  ],
  6: [
    { key: "joy", label: "Joy", color: PALETTE_6.joy },
    { key: "trust", label: "Trust", color: PALETTE_6.trust },
    { key: "fear", label: "Fear", color: PALETTE_6.fear },
    { key: "anger", label: "Anger", color: PALETTE_6.anger },
    { key: "sadness", label: "Sadness", color: PALETTE_6.sadness },
    { key: "optimism", label: "Optimism", color: PALETTE_6.optimism },
  ],
};

// ── Color computation ──────────────────────────────────────────────────────

function dominantKey2(scores: Record<Emotion, number>): string {
  const positive =
    scores.joy + scores.trust + scores.optimism + scores.surprise;
  const negative =
    scores.fear + scores.anger + scores.sadness + scores.uncertainty;
  return positive >= negative ? "positive" : "negative";
}

function dominantKey4(scores: Record<Emotion, number>): string {
  const joyGroup = Math.max(scores.joy, scores.trust, scores.optimism);
  const fearGroup = Math.max(scores.fear, scores.uncertainty);
  const angerScore = scores.anger;
  const sadnessScore = scores.sadness;

  const best = Math.max(joyGroup, fearGroup, angerScore, sadnessScore);
  if (best === joyGroup) return "joy";
  if (best === fearGroup) return "fear";
  if (best === angerScore) return "anger";
  return "sadness";
}

function dominantKey6(scores: Record<Emotion, number>): string {
  const candidates: [string, number][] = [
    ["joy", scores.joy],
    ["trust", scores.trust],
    ["fear", scores.fear],
    ["anger", scores.anger],
    ["sadness", scores.sadness],
    ["optimism", scores.optimism],
  ];
  candidates.sort((a, b) => b[1] - a[1]);
  return candidates[0]![0];
}

/**
 * Converts raw score data to a country → fill-color map for Mapbox.
 * Called client-side; O(n) per mode switch.
 */
export function computeColorMap(
  data: CountryEmotionRaw[],
  mode: ColorMode
): Record<string, string> {
  const map: Record<string, string> = {};

  for (const { countryCode, scores } of data) {
    let key: string;
    let palette: Record<string, string>;

    switch (mode) {
      case 2:
        key = dominantKey2(scores);
        palette = PALETTE_2;
        break;
      case 4:
        key = dominantKey4(scores);
        palette = PALETTE_4;
        break;
      case 6:
      default:
        key = dominantKey6(scores);
        palette = PALETTE_6;
        break;
    }

    map[countryCode] = palette[key] ?? "#1a1a2e";
  }

  return map;
}
