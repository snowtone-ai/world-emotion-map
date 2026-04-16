/**
 * Color mode logic for World Emotion Map.
 *
 * Three display modes for progressive disclosure:
 *   2 — Positive / Negative (instant gestalt)
 *   4 — Quadrant (joy cluster, fear cluster, anger, sadness)
 *   6 — Detailed (business-relevant breakdown)
 *
 * Normalization strategy per mode:
 *   Mode 2 — within-country share Z-score: positive/(pos+neg) share vs global
 *             average. Removes absolute coverage-volume bias; gives ~50/50 split.
 *   Mode 4 — within-country share Z-score: each group / (joy+fear+anger+sadness)
 *             share vs global average. Near-zero groups have very low shares,
 *             so map/panel consistency is preserved without a raw fallback.
 *   Mode 6 — within-country share Z-score: each emotion / sum-of-6 vs global
 *             average share. Removes structural joy dominance; always returns
 *             the emotion with the most unusually high share (no raw fallback).
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

// ── Shared stats type ──────────────────────────────────────────────────────

type GroupStats = { mean: number; std: number };

function buildStats<K extends string>(
  data: CountryEmotionRaw[],
  keys: readonly K[],
  extract: (scores: Record<Emotion, number>, k: K) => number,
): Record<K, GroupStats> {
  const sums = Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
  const sqSums = Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
  const n = data.length;

  for (const { scores } of data) {
    for (const k of keys) {
      const v = extract(scores, k);
      sums[k] += v;
      sqSums[k] += v * v;
    }
  }

  const result = {} as Record<K, GroupStats>;
  for (const k of keys) {
    const mean = n > 0 ? sums[k] / n : 0;
    const variance = n > 1 ? sqSums[k] / n - mean * mean : 0;
    result[k] = { mean, std: Math.sqrt(Math.max(0, variance)) };
  }
  return result;
}

function zScore(value: number, stats: GroupStats): number {
  return stats.std > 0 ? (value - stats.mean) / stats.std : 0;
}

// ── Mode 2: Positive / Negative ────────────────────────────────────────────

function positiveScore(scores: Record<Emotion, number>): number {
  return scores.joy + scores.trust + scores.optimism + scores.surprise;
}

function negativeScore(scores: Record<Emotion, number>): number {
  return scores.fear + scores.anger + scores.sadness + scores.uncertainty;
}

/** Raw fallback: simple sum comparison. */
function dominantKey2(scores: Record<Emotion, number>): string {
  return positiveScore(scores) >= negativeScore(scores) ? "positive" : "negative";
}

/**
 * Share-based Z-score for mode 2.
 * Computes positive_share = positive / (positive + negative), then compares
 * Z-score of that share against the global distribution of positive shares.
 * Since positive_share + negative_share = 1, a single Z-score suffices:
 * positive wins when positive_share is above the global mean (Z ≥ 0).
 * Eliminates absolute-coverage-volume bias that caused all-positive maps.
 */
function dominantKey2ZScore(
  scores: Record<Emotion, number>,
  stats: Record<"positive" | "negative", GroupStats>,
): string {
  const pScore = positiveScore(scores);
  const nScore = negativeScore(scores);
  const total = pScore + nScore;
  if (total === 0) return "positive";

  const pShare = pScore / total;
  // stats.positive now holds the distribution of positive shares (not raw scores)
  const pZ = zScore(pShare, stats.positive);
  return pZ >= 0 ? "positive" : "negative";
}

// ── Mode 4: Quadrant ───────────────────────────────────────────────────────

function computeMode4GroupScores(scores: Record<Emotion, number>): {
  joy: number;
  fear: number;
  anger: number;
  sadness: number;
} {
  return {
    joy: Math.max(scores.joy, scores.trust, scores.optimism),
    fear: Math.max(scores.fear, scores.uncertainty),
    anger: scores.anger,
    sadness: scores.sadness,
  };
}

/** Raw fallback for mode 4. */
function dominantKey4Raw(scores: Record<Emotion, number>): string {
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

/**
 * Share-based Z-score for mode 4.
 * Computes each group's share = group / (joy+fear+anger+sadness), then
 * Z-scores against the global distribution of group shares.
 * Eliminates absolute-coverage-volume bias. Near-zero groups have very low
 * shares, so share-based Z-score naturally avoids the map/panel contradiction
 * (e.g. sadness share ≈ 0 → very negative Z → never wins). No raw fallback needed.
 */
function dominantKey4ZScore(
  scores: Record<Emotion, number>,
  stats: Record<"joy" | "fear" | "anger" | "sadness", GroupStats>,
): string {
  const g = computeMode4GroupScores(scores);
  const total = g.joy + g.fear + g.anger + g.sadness;
  const groups = ["joy", "fear", "anger", "sadness"] as const;

  let bestKey: string = "joy";
  let bestZ = -Infinity;

  for (const k of groups) {
    const share = total > 0 ? g[k] / total : 0.25;
    // stats[k] holds the distribution of this group's share across countries
    const z = zScore(share, stats[k]);
    if (z > bestZ) {
      bestZ = z;
      bestKey = k;
    }
  }

  return bestKey;
}

// ── Mode 6: Detailed ───────────────────────────────────────────────────────

type Mode6Key = "joy" | "trust" | "fear" | "anger" | "sadness" | "optimism";
const MODE6_KEYS: readonly Mode6Key[] = [
  "joy", "trust", "fear", "anger", "sadness", "optimism",
] as const;

/** Raw fallback for mode 6. */
function dominantKey6(scores: Record<Emotion, number>): string {
  let bestKey: Mode6Key = "joy";
  let bestVal = -1;
  for (const k of MODE6_KEYS) {
    if (scores[k] > bestVal) {
      bestVal = scores[k];
      bestKey = k;
    }
  }
  return bestKey;
}

/**
 * Share-based Z-score for mode 6.
 * For each country, computes each emotion's share = score / sum_of_6_emotions,
 * then Z-scores that share against the global distribution of per-emotion shares.
 * This eliminates: (a) absolute coverage-volume bias (high-news countries have
 * high everything) and (b) structural GCAM joy dominance.
 * Always returns the emotion with the most unusually high share — no raw fallback
 * needed since share-based scoring is already distribution-neutral.
 */
function dominantKey6ZScore(
  scores: Record<Emotion, number>,
  stats: Record<Mode6Key, GroupStats>,
): string {
  const total = MODE6_KEYS.reduce((sum, k) => sum + scores[k], 0);

  let bestKey: string = "joy";
  let bestZ = -Infinity;

  for (const k of MODE6_KEYS) {
    const share = total > 0 ? scores[k] / total : 1 / MODE6_KEYS.length;
    // stats[k] holds the distribution of this emotion's share across countries
    const z = zScore(share, stats[k]);
    if (z > bestZ) {
      bestZ = z;
      bestKey = k;
    }
  }

  return bestKey;
}

// ── Color computation ──────────────────────────────────────────────────────

/**
 * Converts raw score data to a country → fill-color map for Mapbox.
 *
 * Normalization strategy per mode:
 *   - Mode 2: Z-score of positive SHARE = positive/(pos+neg) vs global mean share.
 *             ~50% positive / ~50% negative regardless of absolute GCAM levels.
 *   - Mode 4: Z-score of group SHARE = group/(joy+fear+anger+sadness) vs global
 *             mean share. Near-zero groups have near-zero shares → won't win.
 *   - Mode 6: Z-score of within-country emotion SHARE = emotion/sum-of-6 vs
 *             global mean share per emotion. Removes GCAM joy-dominance bias;
 *             always returns the most unusually high-share emotion.
 *
 * Called client-side; O(n) per mode switch.
 */
export function computeColorMap(
  data: CountryEmotionRaw[],
  mode: ColorMode,
): Record<string, string> {
  const map: Record<string, string> = {};
  const enoughData = data.length >= 5;

  // Pre-compute cross-country stats per mode.
  // All three modes use within-country share normalization to remove absolute
  // coverage-volume bias (high-news countries score high on all emotions).
  const mode2Stats =
    mode === 2 && enoughData
      ? buildStats(data, ["positive", "negative"] as const, (s, k) => {
          const pScore = positiveScore(s);
          const nScore = negativeScore(s);
          const total = pScore + nScore;
          if (total === 0) return 0.5;
          return k === "positive" ? pScore / total : nScore / total;
        })
      : null;

  const mode4Stats =
    mode === 4 && enoughData
      ? buildStats(data, ["joy", "fear", "anger", "sadness"] as const, (s, k) => {
          const g = computeMode4GroupScores(s);
          const total = g.joy + g.fear + g.anger + g.sadness;
          return total > 0 ? g[k] / total : 0.25;
        })
      : null;

  const mode6Stats =
    mode === 6 && enoughData
      ? buildStats(data, MODE6_KEYS, (s, k) => {
          const total = MODE6_KEYS.reduce((sum, key) => sum + s[key], 0);
          return total > 0 ? s[k] / total : 1 / MODE6_KEYS.length;
        })
      : null;

  for (const { countryCode, scores } of data) {
    let key: string;
    let palette: Record<string, string>;

    switch (mode) {
      case 2:
        key = mode2Stats
          ? dominantKey2ZScore(scores, mode2Stats)
          : dominantKey2(scores);
        palette = PALETTE_2;
        break;
      case 4:
        key = mode4Stats
          ? dominantKey4ZScore(scores, mode4Stats)
          : dominantKey4Raw(scores);
        palette = PALETTE_4;
        break;
      case 6:
      default:
        key = mode6Stats
          ? dominantKey6ZScore(scores, mode6Stats)
          : dominantKey6(scores);
        palette = PALETTE_6;
        break;
    }

    map[countryCode] = palette[key] ?? "#1a1a2e";
  }

  return map;
}
