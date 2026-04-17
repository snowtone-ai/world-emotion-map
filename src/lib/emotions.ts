/**
 * Dominant-emotion selection for World Emotion Map.
 *
 * Three display modes:
 *   2 — Positive / Negative
 *   4 — Quadrant  (joy-cluster / fear-cluster / anger / sadness)
 *   8 — Full spectrum (all 8 GCAM emotions)
 *
 * ── The scoring rule (same for every mode) ────────────────────────────────
 *
 *   For each candidate emotion (or group) e, we compute:
 *
 *       share(e)       = score(e) / Σ score                // within-country share
 *       mean_share(e)  = mean over countries of share(e)
 *       excess_lift(e) = max(0, share(e) / mean_share(e) − 1) // above-baseline lift only
 *       dominance(e)   = share(e) × excess_lift(e)
 *
 *   The winner is argmax_e dominance(e).
 *
 * ── Why this works ────────────────────────────────────────────────────────
 *
 *   • share(e) = 0  ⇒  dominance = 0.  An emotion the country shows 0 of
 *     can NEVER win. Map colour and breakdown panel can never contradict.
 *
 *   • excess_lift = 0 when share ≤ mean: an emotion at or below its global
 *     baseline contributes nothing. This eliminates GCAM's structural joy
 *     dominance — countries where joy is merely "average" show their
 *     actually-elevated emotion instead (e.g., Iran → fear, not joy).
 *
 *   • Countries genuinely above baseline in joy still show joy: a country
 *     with joy share well above the global mean gets a large excess_lift,
 *     so truly happy countries are not erased.
 *
 *   • share × excess_lift keeps raw magnitude in the picture (noise
 *     protection): a trace emotion at 10× baseline but 0.1% share loses
 *     to a moderate emotion at 2× baseline with 8% share.
 *
 *   • No standard deviation, no fallbacks, no special cases. One formula.
 *
 * Fallback: when fewer than 5 countries have data, we cannot estimate
 * a meaningful global mean, so we return the raw within-country argmax.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type ColorMode = 2 | 4 | 8;

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
 * Positive = joy + trust + optimism + surprise
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
 */
const PALETTE_4: Record<string, string> = {
  joy: "#FFD166", // Amber
  fear: "#A78BFA", // Violet
  anger: "#FF6B6B", // Coral
  sadness: "#4EA8DE", // Sky Blue
};

/** Mode 8: all 8 GCAM emotions. */
const PALETTE_8: Record<string, string> = {
  joy: "#FFD166", // Amber
  trust: "#06D6A0", // Teal
  fear: "#A78BFA", // Violet
  anger: "#FF6B6B", // Coral
  sadness: "#4EA8DE", // Sky Blue
  surprise: "#FF9F1C", // Orange
  optimism: "#84CC16", // Lime
  uncertainty: "#94A3B8", // Slate
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
  8: [
    { key: "joy", label: "Joy", color: PALETTE_8.joy },
    { key: "trust", label: "Trust", color: PALETTE_8.trust },
    { key: "fear", label: "Fear", color: PALETTE_8.fear },
    { key: "anger", label: "Anger", color: PALETTE_8.anger },
    { key: "sadness", label: "Sadness", color: PALETTE_8.sadness },
    { key: "surprise", label: "Surprise", color: PALETTE_8.surprise },
    { key: "optimism", label: "Optimism", color: PALETTE_8.optimism },
    { key: "uncertainty", label: "Uncertainty", color: PALETTE_8.uncertainty },
  ],
};

// ── Score extractors ───────────────────────────────────────────────────────

function positiveScore(s: Record<Emotion, number>): number {
  return s.joy + s.trust + s.optimism + s.surprise;
}

function negativeScore(s: Record<Emotion, number>): number {
  return s.fear + s.anger + s.sadness + s.uncertainty;
}

function mode4Groups(s: Record<Emotion, number>): {
  joy: number;
  fear: number;
  anger: number;
  sadness: number;
} {
  return {
    joy: Math.max(s.joy, s.trust, s.optimism),
    fear: Math.max(s.fear, s.uncertainty),
    anger: s.anger,
    sadness: s.sadness,
  };
}

const MODE8_KEYS: readonly Emotion[] = [
  "joy", "trust", "fear", "anger", "sadness", "surprise", "optimism", "uncertainty",
] as const;

// ── Core: within-country shares, cross-country mean, lift² selection ───────

/**
 * Given per-country scores for a set of keys, return the mean of each key's
 * within-country SHARE across all countries. Countries with Σ score = 0 are
 * skipped (they contribute no signal).
 */
function meanShares<K extends string>(
  data: { scores: Record<Emotion, number> }[],
  keys: readonly K[],
  extract: (s: Record<Emotion, number>, k: K) => number,
): Record<K, number> {
  const sums = Object.fromEntries(keys.map((k) => [k, 0])) as Record<K, number>;
  let n = 0;
  for (const { scores } of data) {
    const total = keys.reduce((acc, k) => acc + extract(scores, k), 0);
    if (total <= 0) continue;
    for (const k of keys) sums[k] += extract(scores, k) / total;
    n += 1;
  }
  const out = {} as Record<K, number>;
  for (const k of keys) out[k] = n > 0 ? sums[k] / n : 0;
  return out;
}

/**
 * Pick the winning key by maximising `share² / mean_share`.
 * Ties are broken by raw share (so the visually larger bar wins).
 *
 * If every candidate has share = 0 (no data), returns `defaultKey`.
 */
function pickDominant<K extends string>(
  scores: Record<Emotion, number>,
  keys: readonly K[],
  extract: (s: Record<Emotion, number>, k: K) => number,
  means: Record<K, number>,
  defaultKey: K,
): K {
  const total = keys.reduce((acc, k) => acc + extract(scores, k), 0);
  if (total <= 0) return defaultKey;

  let bestKey: K = defaultKey;
  let bestScore = -Infinity;
  let bestShare = -Infinity;

  for (const k of keys) {
    const share = extract(scores, k) / total;
    // Guard: if an emotion never appears globally (mean=0) we cannot
    // compute a meaningful lift, so treat its dominance as 0. A zero-share
    // emotion also has dominance 0. Either way it cannot win over any
    // positive-share, positive-mean candidate.
    const mean = means[k];
    // share × max(0, lift − 1): only above-baseline share earns dominance.
    // Guarantees share=0 → dominance=0 AND baseline joy cannot beat elevated fear/sadness.
    const dominance = mean > 0 ? share * Math.max(0, share / mean - 1) : 0;

    if (
      dominance > bestScore ||
      (dominance === bestScore && share > bestShare)
    ) {
      bestScore = dominance;
      bestShare = share;
      bestKey = k;
    }
  }

  return bestKey;
}

/** Raw-max fallback when we don't have enough countries for global stats. */
function pickRawMax<K extends string>(
  scores: Record<Emotion, number>,
  keys: readonly K[],
  extract: (s: Record<Emotion, number>, k: K) => number,
  defaultKey: K,
): K {
  let bestKey: K = defaultKey;
  let bestVal = -Infinity;
  for (const k of keys) {
    const v = extract(scores, k);
    if (v > bestVal) {
      bestVal = v;
      bestKey = k;
    }
  }
  return bestVal > 0 ? bestKey : defaultKey;
}

// ── Public: colour map builder ─────────────────────────────────────────────

/**
 * Converts raw per-country emotion scores into a country → fill-colour map.
 * See the module header for the dominance rule. O(n·keys) per mode switch.
 */
export function computeColorMap(
  data: CountryEmotionRaw[],
  mode: ColorMode,
): Record<string, string> {
  const map: Record<string, string> = {};
  const enoughData = data.length >= 5;

  // ── Mode 2 ────────────────────────────────────────────────────────────
  if (mode === 2) {
    const keys = ["positive", "negative"] as const;
    const extract = (s: Record<Emotion, number>, k: (typeof keys)[number]) =>
      k === "positive" ? positiveScore(s) : negativeScore(s);

    const means = enoughData ? meanShares(data, keys, extract) : null;

    for (const { countryCode, scores } of data) {
      const key = means
        ? pickDominant(scores, keys, extract, means, "positive")
        : pickRawMax(scores, keys, extract, "positive");
      map[countryCode] = PALETTE_2[key] ?? "#1a1a2e";
    }
    return map;
  }

  // ── Mode 4 ────────────────────────────────────────────────────────────
  if (mode === 4) {
    const keys = ["joy", "fear", "anger", "sadness"] as const;
    const extract = (s: Record<Emotion, number>, k: (typeof keys)[number]) =>
      mode4Groups(s)[k];

    const means = enoughData ? meanShares(data, keys, extract) : null;

    for (const { countryCode, scores } of data) {
      const key = means
        ? pickDominant(scores, keys, extract, means, "joy")
        : pickRawMax(scores, keys, extract, "joy");
      map[countryCode] = PALETTE_4[key] ?? "#1a1a2e";
    }
    return map;
  }

  // ── Mode 8 ────────────────────────────────────────────────────────────
  const keys = MODE8_KEYS;
  const extract = (s: Record<Emotion, number>, k: Emotion) => s[k];

  const means = enoughData ? meanShares(data, keys, extract) : null;

  for (const { countryCode, scores } of data) {
    const key = means
      ? pickDominant(scores, keys, extract, means, "joy")
      : pickRawMax(scores, keys, extract, "joy");
    map[countryCode] = PALETTE_8[key] ?? "#1a1a2e";
  }
  return map;
}

// ── Sector dominant emotion (cross-sector, same rule) ──────────────────────

export type SectorDominant = { key: Emotion; color: string };

/**
 * Compute the dominant emotion of each sector using the same dominance rule
 * as the map (share² / mean_share), this time with means taken across
 * sectors rather than countries. Falls back to raw argmax when fewer than 3
 * sectors have data.
 */
export function computeSectorDominants(
  scoresArray: (Record<Emotion, number> | null)[],
): (SectorDominant | null)[] {
  const valid = scoresArray.filter(
    (s): s is Record<Emotion, number> => s !== null,
  );

  const keys = MODE8_KEYS;
  const extract = (s: Record<Emotion, number>, k: Emotion) => s[k];

  if (valid.length < 3) {
    return scoresArray.map((scores) => {
      if (!scores) return null;
      const key = pickRawMax(scores, keys, extract, "joy");
      return { key, color: PALETTE_8[key] };
    });
  }

  const wrapped = valid.map((scores) => ({ scores }));
  const means = meanShares(wrapped, keys, extract);

  return scoresArray.map((scores) => {
    if (!scores) return null;
    const key = pickDominant(scores, keys, extract, means, "joy");
    return { key, color: PALETTE_8[key] };
  });
}
