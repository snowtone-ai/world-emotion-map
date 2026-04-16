/**
 * scripts/detect-anomaly.ts
 * emotion_snapshots から異常を検知し、anomaly_posts_log に記録する。
 *
 * 5つのトリガー:
 *   T1: Spike     — G20国で2h以内に単一感情 +0.20 以上
 *   T2: Flip      — G20国で3h以内に支配的感情が逆転
 *   T3: Sync      — 5カ国以上で同一感情 +0.15 以上（2h以内）
 *   T4: Sector    — グローバルセクターの fear or anger > 0.75
 *   T5: Extreme   — 国×感情の観測史上最大/最小
 *
 * Usage:
 *   pnpm detect-anomaly
 *
 * 環境変数 (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

// ──────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "❌  Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const G20_COUNTRIES = [
  "US", "GB", "FR", "DE", "IT", "JP", "CA", "AU", "BR", "AR",
  "MX", "KR", "IN", "CN", "RU", "SA", "TR", "ID", "ZA",
];

const EMOTIONS = [
  "joy", "trust", "fear", "anger", "sadness", "surprise", "optimism", "uncertainty",
] as const;

type EmotionKey = (typeof EMOTIONS)[number];

/** Lower number = higher priority */
const TRIGGER_PRIORITY: Record<string, number> = {
  T5: 1, T3: 2, T1: 3, T2: 4, T4: 5,
};

const COOLDOWN_HOURS = 24;

/** Max anomaly posts per 24h period (global, across all triggers) */
const DAILY_POST_CAP = 1;

// Thresholds (DB stores 0.0–1.0 scale)
// Tuned for ≤1 firing/day: only truly dramatic shifts should trigger
const T1_SPIKE_THRESHOLD = 0.40;
const T2_FLIP_MIN_MARGIN = 0.15;
const T3_SYNC_THRESHOLD = 0.30;
const T3_MIN_COUNTRIES = 8;
const T4_CRISIS_THRESHOLD = 0.90;
const T5_MIN_SNAPSHOTS = 168; // ~1 week of hourly snapshots

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

type AnomalyCandidate = {
  trigger_id: string;
  country_code: string | null;
  description: string;
  magnitude: number;
};

type SnapshotRow = {
  timestamp: string;
  country_code: string | null;
  sector_slug: string | null;
  joy: number;
  trust: number;
  fear: number;
  anger: number;
  sadness: number;
  surprise: number;
  optimism: number;
  uncertainty: number;
  article_count: number;
};

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function getEmotionScores(row: SnapshotRow): Record<EmotionKey, number> {
  return {
    joy: row.joy,
    trust: row.trust,
    fear: row.fear,
    anger: row.anger,
    sadness: row.sadness,
    surprise: row.surprise,
    optimism: row.optimism,
    uncertainty: row.uncertainty,
  };
}

function getDominantEmotion(row: SnapshotRow): { emotion: EmotionKey; score: number } {
  const scores = getEmotionScores(row);
  let best: EmotionKey = "joy";
  let bestScore = -1;
  for (const e of EMOTIONS) {
    if (scores[e] > bestScore) {
      bestScore = scores[e];
      best = e;
    }
  }
  return { emotion: best, score: bestScore };
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
}

// ──────────────────────────────────────────────
// Data fetching
// ──────────────────────────────────────────────

async function fetchRecentSnapshots(hours: number): Promise<SnapshotRow[]> {
  const since = hoursAgo(hours);
  const { data, error } = await supabase
    .from("emotion_snapshots")
    .select(
      "timestamp, country_code, sector_slug, joy, trust, fear, anger, sadness, surprise, optimism, uncertainty, article_count",
    )
    .gte("timestamp", since)
    .order("timestamp", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch recent snapshots: ${error.message}`);
  }
  return (data ?? []) as SnapshotRow[];
}

async function fetchCooldowns(): Promise<Set<string>> {
  const since = hoursAgo(COOLDOWN_HOURS);
  const { data, error } = await supabase
    .from("anomaly_posts_log")
    .select("trigger_id, country_code")
    .gte("fired_at", since);

  if (error) {
    throw new Error(`Failed to fetch cooldowns: ${error.message}`);
  }

  const set = new Set<string>();
  for (const row of data ?? []) {
    set.add(`${row.trigger_id}|${row.country_code ?? ""}`);
  }
  return set;
}

// ──────────────────────────────────────────────
// T1: Spike — G20国で2h以内に単一感情 +0.20
// ──────────────────────────────────────────────

function detectT1(snapshots: SnapshotRow[]): AnomalyCandidate[] {
  const candidates: AnomalyCandidate[] = [];
  const countryRows = snapshots.filter(
    (r) => r.country_code && r.sector_slug === null,
  );

  // Group by country
  const byCountry = new Map<string, SnapshotRow[]>();
  for (const row of countryRows) {
    const cc = row.country_code!;
    if (!G20_COUNTRIES.includes(cc)) continue;
    const arr = byCountry.get(cc) ?? [];
    arr.push(row);
    byCountry.set(cc, arr);
  }

  const twoHoursAgo = hoursAgo(2);

  for (const [cc, rows] of byCountry) {
    // rows are sorted by timestamp DESC
    const latest = rows[0];
    if (!latest) continue;

    // Find the oldest snapshot within the 2h window
    const older = rows.filter((r) => r.timestamp <= twoHoursAgo);
    const baseline = older[0]; // most recent one before 2h ago
    if (!baseline) continue;

    const latestScores = getEmotionScores(latest);
    const baselineScores = getEmotionScores(baseline);

    for (const e of EMOTIONS) {
      const delta = latestScores[e] - baselineScores[e];
      if (delta >= T1_SPIKE_THRESHOLD) {
        candidates.push({
          trigger_id: "T1",
          country_code: cc,
          description: `${e} surged +${(delta * 100).toFixed(0)}pt in ${cc} in 2h`,
          magnitude: delta,
        });
      }
    }
  }

  return candidates;
}

// ──────────────────────────────────────────────
// T2: Flip — G20国で3h以内に支配的感情が逆転
// ──────────────────────────────────────────────

function detectT2(snapshots: SnapshotRow[]): AnomalyCandidate[] {
  const candidates: AnomalyCandidate[] = [];
  const countryRows = snapshots.filter(
    (r) => r.country_code && r.sector_slug === null,
  );

  const byCountry = new Map<string, SnapshotRow[]>();
  for (const row of countryRows) {
    const cc = row.country_code!;
    if (!G20_COUNTRIES.includes(cc)) continue;
    const arr = byCountry.get(cc) ?? [];
    arr.push(row);
    byCountry.set(cc, arr);
  }

  const threeHoursAgo = hoursAgo(3);

  for (const [cc, rows] of byCountry) {
    const latest = rows[0];
    if (!latest) continue;

    const older = rows.filter((r) => r.timestamp <= threeHoursAgo);
    const baseline = older[0];
    if (!baseline) continue;

    const currentDom = getDominantEmotion(latest);
    const prevDom = getDominantEmotion(baseline);

    if (currentDom.emotion !== prevDom.emotion && currentDom.score >= T2_FLIP_MIN_MARGIN) {
      candidates.push({
        trigger_id: "T2",
        country_code: cc,
        description: `${cc} flipped from ${prevDom.emotion} to ${currentDom.emotion} in 3h`,
        magnitude: currentDom.score,
      });
    }
  }

  return candidates;
}

// ──────────────────────────────────────────────
// T3: Global sync — 5カ国以上で同一感情 +0.15（2h以内）
// ──────────────────────────────────────────────

function detectT3(snapshots: SnapshotRow[]): AnomalyCandidate[] {
  const candidates: AnomalyCandidate[] = [];
  const countryRows = snapshots.filter(
    (r) => r.country_code && r.sector_slug === null,
  );

  // Group by country, get latest and ~2h-ago
  const byCountry = new Map<string, SnapshotRow[]>();
  for (const row of countryRows) {
    const cc = row.country_code!;
    const arr = byCountry.get(cc) ?? [];
    arr.push(row);
    byCountry.set(cc, arr);
  }

  const twoHoursAgo = hoursAgo(2);

  // Per emotion, count countries with +threshold increase
  const spikeCounts: Record<EmotionKey, string[]> = {} as Record<EmotionKey, string[]>;
  for (const e of EMOTIONS) {
    spikeCounts[e] = [];
  }

  for (const [cc, rows] of byCountry) {
    const latest = rows[0];
    if (!latest) continue;

    const older = rows.filter((r) => r.timestamp <= twoHoursAgo);
    const baseline = older[0];
    if (!baseline) continue;

    const latestScores = getEmotionScores(latest);
    const baselineScores = getEmotionScores(baseline);

    for (const e of EMOTIONS) {
      if (latestScores[e] - baselineScores[e] >= T3_SYNC_THRESHOLD) {
        spikeCounts[e].push(cc);
      }
    }
  }

  for (const e of EMOTIONS) {
    if (spikeCounts[e].length >= T3_MIN_COUNTRIES) {
      candidates.push({
        trigger_id: "T3",
        country_code: null,
        description: `${spikeCounts[e].length} countries show ${e} spike: ${spikeCounts[e].slice(0, 10).join(",")}`,
        magnitude: spikeCounts[e].length,
      });
    }
  }

  return candidates;
}

// ──────────────────────────────────────────────
// T4: Sector crisis — グローバルセクター fear or anger > 0.75
// ──────────────────────────────────────────────

function detectT4(snapshots: SnapshotRow[]): AnomalyCandidate[] {
  const candidates: AnomalyCandidate[] = [];

  // Global sector rows = country_code IS NULL, sector_slug IS NOT NULL
  // Get latest timestamp's rows only
  const sectorRows = snapshots.filter(
    (r) => r.country_code === null && r.sector_slug !== null,
  );

  if (sectorRows.length === 0) return [];

  // Latest timestamp
  const latestTs = sectorRows[0]!.timestamp;
  const latestSectorRows = sectorRows.filter((r) => r.timestamp === latestTs);

  for (const row of latestSectorRows) {
    if (row.fear > T4_CRISIS_THRESHOLD) {
      candidates.push({
        trigger_id: "T4",
        country_code: null,
        description: `Global ${row.sector_slug} Fear at ${(row.fear * 100).toFixed(0)}/100`,
        magnitude: row.fear,
      });
    }
    if (row.anger > T4_CRISIS_THRESHOLD) {
      candidates.push({
        trigger_id: "T4",
        country_code: null,
        description: `Global ${row.sector_slug} Anger at ${(row.anger * 100).toFixed(0)}/100`,
        magnitude: row.anger,
      });
    }
  }

  return candidates;
}

// ──────────────────────────────────────────────
// T5: Historic extreme — 国×感情の全時間最大/最小
// ──────────────────────────────────────────────

async function detectT5(latestSnapshots: SnapshotRow[]): Promise<AnomalyCandidate[]> {
  const candidates: AnomalyCandidate[] = [];

  // Get latest country-level, no-sector snapshots
  const latestCountryRows = latestSnapshots.filter(
    (r) => r.country_code && r.sector_slug === null,
  );
  if (latestCountryRows.length === 0) return [];

  const latestTs = latestCountryRows[0]!.timestamp;
  const currentRows = latestCountryRows.filter((r) => r.timestamp === latestTs);

  // For each country in the current batch, check historical extremes
  const countryCodes = [...new Set(currentRows.map((r) => r.country_code!))];

  // Fetch historical stats: count, max, min per country per emotion
  // Use RPC or raw query — Supabase JS doesn't support GROUP BY natively,
  // so we fetch all historical data for these countries and compute in JS.
  // This is acceptable because we only check countries present in the latest batch.

  for (const cc of countryCodes) {
    const { data: history, error } = await supabase
      .from("emotion_snapshots")
      .select(
        "joy, trust, fear, anger, sadness, surprise, optimism, uncertainty",
      )
      .eq("country_code", cc)
      .is("sector_slug", null)
      .order("timestamp", { ascending: false })
      .limit(500);

    if (error || !history) continue;
    if (history.length < T5_MIN_SNAPSHOTS) continue;

    const current = currentRows.find((r) => r.country_code === cc);
    if (!current) continue;

    const currentScores = getEmotionScores(current);

    for (const e of EMOTIONS) {
      const values = history.map((r) => {
        const scores = getEmotionScores(r as SnapshotRow);
        return scores[e];
      });
      const maxVal = Math.max(...values);
      const minVal = Math.min(...values);
      const currentVal = currentScores[e];

      if (currentVal >= maxVal && currentVal > 0) {
        candidates.push({
          trigger_id: "T5",
          country_code: cc,
          description: `${cc} ${e} hit all-time high: ${(currentVal * 100).toFixed(1)}/100`,
          magnitude: currentVal,
        });
      }
      if (currentVal <= minVal) {
        candidates.push({
          trigger_id: "T5",
          country_code: cc,
          description: `${cc} ${e} hit all-time low: ${(currentVal * 100).toFixed(1)}/100`,
          magnitude: 1 - currentVal,
        });
      }
    }
  }

  return candidates;
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────

async function main() {
  console.error("[detect-anomaly] Starting anomaly detection...");

  // 1. Fetch recent data (4h covers all trigger lookbacks)
  const snapshots = await fetchRecentSnapshots(4);
  console.error(`[detect-anomaly] Loaded ${snapshots.length} snapshots (last 4h)`);

  if (snapshots.length === 0) {
    console.error("[detect-anomaly] No data — skipping");
    return;
  }

  // 2. Run all trigger detectors
  const allCandidates: AnomalyCandidate[] = [
    ...detectT1(snapshots),
    ...detectT2(snapshots),
    ...detectT3(snapshots),
    ...detectT4(snapshots),
    ...(await detectT5(snapshots)),
  ];

  console.error(`[detect-anomaly] Raw candidates: ${allCandidates.length}`);
  for (const c of allCandidates) {
    console.error(`  ${c.trigger_id} | ${c.country_code ?? "GLOBAL"} | ${c.description}`);
  }

  if (allCandidates.length === 0) {
    console.error("[detect-anomaly] No anomalies detected");
    return;
  }

  // 3. Cooldown check (per trigger+country, 24h window)
  const cooldowns = await fetchCooldowns();
  const filtered = allCandidates.filter((c) => {
    const key = `${c.trigger_id}|${c.country_code ?? ""}`;
    if (cooldowns.has(key)) {
      console.error(`  [cooldown] skip: ${c.trigger_id} ${c.country_code ?? "GLOBAL"}`);
      return false;
    }
    return true;
  });

  console.error(`[detect-anomaly] After cooldown filter: ${filtered.length}`);

  if (filtered.length === 0) {
    console.error("[detect-anomaly] All candidates in cooldown — done");
    return;
  }

  // 3b. Daily cap check — skip posting if already posted today
  const { count: dailyCount, error: countError } = await supabase
    .from("anomaly_posts_log")
    .select("id", { count: "exact", head: true })
    .gte("fired_at", hoursAgo(24))
    .not("post_id", "is", null);

  if (countError) {
    console.error(`[detect-anomaly] Warning: daily cap check failed: ${countError.message}`);
  }

  const postsToday = dailyCount ?? 0;
  const capReached = postsToday >= DAILY_POST_CAP;

  if (capReached) {
    console.error(
      `[detect-anomaly] Daily cap reached (${postsToday}/${DAILY_POST_CAP}) — logging only, no PENDING`,
    );
  }

  // 4. Insert all into anomaly_posts_log (for historical record)
  const rows = filtered.map((c) => ({
    trigger_id: c.trigger_id,
    country_code: c.country_code,
    description: c.description,
  }));

  const { data: inserted, error: insertError } = await supabase
    .from("anomaly_posts_log")
    .insert(rows)
    .select("id, trigger_id, country_code");

  if (insertError) {
    throw new Error(`Failed to insert anomaly log: ${insertError.message}`);
  }

  console.error(`[detect-anomaly] Inserted ${inserted?.length ?? 0} anomaly records`);

  // 5. Mark the highest-priority candidate for posting (only if under daily cap)
  if (capReached) {
    console.error("[detect-anomaly] Skipping PENDING mark due to daily cap");
  } else {
    const ranked = filtered
      .map((c, i) => ({ ...c, dbId: inserted?.[i]?.id as string }))
      .sort((a, b) => {
        const pa = TRIGGER_PRIORITY[a.trigger_id] ?? 99;
        const pb = TRIGGER_PRIORITY[b.trigger_id] ?? 99;
        if (pa !== pb) return pa - pb;
        return b.magnitude - a.magnitude;
      });

    const top = ranked[0];
    if (top?.dbId) {
      const { error: updateError } = await supabase
        .from("anomaly_posts_log")
        .update({ post_id: "PENDING" })
        .eq("id", top.dbId);

      if (updateError) {
        console.error(`[detect-anomaly] Failed to mark PENDING: ${updateError.message}`);
      } else {
        console.error(
          `[detect-anomaly] ★ Marked for posting: ${top.trigger_id} | ${top.country_code ?? "GLOBAL"} | ${top.description}`,
        );
      }
    }
  }

  console.error("[detect-anomaly] Done");
}

main().catch((err: unknown) => {
  console.error("❌  Unexpected error:", err);
  process.exit(1);
});
