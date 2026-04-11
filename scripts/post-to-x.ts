/**
 * scripts/post-to-x.ts
 * X (Twitter) への投稿スクリプト。
 *
 * Modes:
 *   tsx --env-file .env.local scripts/post-to-x.ts --mode scheduled
 *   tsx --env-file .env.local scripts/post-to-x.ts --mode anomaly
 *
 * scheduled: config/x-post-template.yaml のテンプレートから6h定期投稿を生成
 * anomaly:   anomaly_posts_log の PENDING エントリを取得し異常投稿
 *
 * 環境変数 (.env.local / GitHub Secrets):
 *   X_API_KEY               — Consumer Key
 *   X_API_SECRET            — Consumer Secret
 *   X_ACCESS_TOKEN          — Access Token
 *   X_ACCESS_TOKEN_SECRET   — Access Token Secret
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { TwitterApi } from "twitter-api-v2";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import yaml from "js-yaml";

// ──────────────────────────────────────────────
// Bootstrap
// ──────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MODE: string = (() => {
  const idx = process.argv.indexOf("--mode");
  return idx !== -1 ? (process.argv[idx + 1] ?? "scheduled") : "scheduled";
})();

if (MODE !== "scheduled" && MODE !== "anomaly") {
  console.error("❌  --mode must be 'scheduled' or 'anomaly'");
  process.exit(1);
}

const REQUIRED_ENV = [
  "X_API_KEY",
  "X_API_SECRET",
  "X_ACCESS_TOKEN",
  "X_ACCESS_TOKEN_SECRET",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`❌  Missing env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const WEM_URL = "https://worldemotionmap.com";

const xClient = new TwitterApi({
  appKey: process.env.X_API_KEY!,
  appSecret: process.env.X_API_SECRET!,
  accessToken: process.env.X_ACCESS_TOKEN!,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET!,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function loadYaml<T>(filename: string): T {
  const path = join(__dirname, "../config", filename);
  return yaml.load(readFileSync(path, "utf-8")) as T;
}

/** {{var}} → value substitution */
function applyVars(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? `{{${key}}}`);
}

/** Post to X with one retry on failure. Returns post ID. */
async function postToX(text: string): Promise<string> {
  const preview = text.slice(0, 100).replace(/\n/g, " ");
  console.log(`[post-to-x] Posting: "${preview}..."`);

  try {
    const { data } = await xClient.v2.tweet(text);
    console.log(`[post-to-x] ✓ Posted. id=${data.id}`);
    return data.id;
  } catch (err) {
    console.error("[post-to-x] First attempt failed, retrying in 5s...", err);
    await new Promise((r) => setTimeout(r, 5_000));
    const { data } = await xClient.v2.tweet(text);
    console.log(`[post-to-x] ✓ Posted (retry). id=${data.id}`);
    return data.id;
  }
}

// ──────────────────────────────────────────────
// Scheduled mode — 6h regular post
// ──────────────────────────────────────────────

type ScheduledTemplate = {
  texts: string[];
};

type SnapshotRow = {
  timestamp: string;
  country_code: string | null;
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

async function postScheduled(): Promise<void> {
  const template = loadYaml<ScheduledTemplate>("x-post-template.yaml");

  if (!Array.isArray(template.texts) || template.texts.length === 0) {
    throw new Error("x-post-template.yaml: 'texts' must be a non-empty array");
  }

  // Latest global aggregate snapshot (country_code IS NULL, sector_slug IS NULL)
  const { data: globalRow, error: globalErr } = await supabase
    .from("emotion_snapshots")
    .select(
      "timestamp, joy, trust, fear, anger, sadness, surprise, optimism, uncertainty",
    )
    .is("country_code", null)
    .is("sector_slug", null)
    .order("timestamp", { ascending: false })
    .limit(1)
    .single();

  if (globalErr || !globalRow) {
    throw new Error(
      "No global snapshot available yet. Has the data pipeline run?",
    );
  }

  const emotionScores: Record<string, number> = {
    joy: globalRow.joy,
    trust: globalRow.trust,
    fear: globalRow.fear,
    anger: globalRow.anger,
    sadness: globalRow.sadness,
    surprise: globalRow.surprise,
    optimism: globalRow.optimism,
    uncertainty: globalRow.uncertainty,
  };

  const [topEmotion, topScore] = Object.entries(emotionScores).sort(
    (a, b) => b[1] - a[1],
  )[0]!;

  // Highest-coverage country in the latest 2h batch
  const since2h = new Date(
    new Date(globalRow.timestamp).getTime() - 2 * 60 * 60 * 1000,
  ).toISOString();

  const { data: countryRows, error: countryErr } = await supabase
    .from("emotion_snapshots")
    .select("country_code, article_count")
    .not("country_code", "is", null)
    .is("sector_slug", null)
    .gte("timestamp", since2h)
    .order("article_count", { ascending: false })
    .limit(1);

  if (countryErr) {
    throw new Error(`Failed to fetch country data: ${countryErr.message}`);
  }

  const topCountry = (countryRows as SnapshotRow[])[0]?.country_code ?? "??";
  const scoreStr = (topScore * 100).toFixed(0);

  // Round-robin template selection: 6h window index
  const windowIdx = Math.floor(Date.now() / (6 * 60 * 60 * 1000));
  const tmpl = template.texts[windowIdx % template.texts.length]!;

  const now = new Date();
  const timestampUtc = now.toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");

  const vars: Record<string, string> = {
    top_emotion: topEmotion,
    top_country: topCountry,
    score: scoreStr,
    change_summary: `Global ${topEmotion} at ${scoreStr}/100`,
    timestamp_utc: timestampUtc,
    wem_url: WEM_URL,
    news_url: WEM_URL,
  };

  const text = applyVars(tmpl, vars).trim();
  await postToX(text);
}

// ──────────────────────────────────────────────
// Anomaly mode — post PENDING anomaly
// ──────────────────────────────────────────────

type AnomalyTemplate = {
  prefix: Record<string, string>;
  suffix: string;
};

type AnomalyLogRow = {
  id: string;
  trigger_id: string;
  country_code: string | null;
  description: string | null;
};

async function postAnomaly(): Promise<void> {
  // Find the most recent PENDING entry
  const { data: pending, error } = await supabase
    .from("anomaly_posts_log")
    .select("id, trigger_id, country_code, description")
    .eq("post_id", "PENDING")
    .order("fired_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch PENDING anomaly: ${error.message}`);

  if (!pending) {
    console.log("[post-to-x] No PENDING anomaly — nothing to post.");
    return;
  }

  const row = pending as AnomalyLogRow;
  const template = loadYaml<AnomalyTemplate>("x-post-anomaly-template.yaml");

  const prefix =
    template.prefix?.[row.trigger_id] ??
    template.prefix?.["default"] ??
    "⚠️ ALERT:";

  const suffixVars: Record<string, string> = { wem_url: WEM_URL };
  const suffix = applyVars(template.suffix ?? "", suffixVars).trim();

  const description = row.description ?? `${row.trigger_id} anomaly detected`;
  const text = `${prefix} ${description}\n\n${suffix}`.trim();

  const postId = await postToX(text);

  // Persist the actual post ID
  const { error: updateErr } = await supabase
    .from("anomaly_posts_log")
    .update({ post_id: postId })
    .eq("id", row.id);

  if (updateErr) {
    console.error(
      `[post-to-x] Warning: failed to update post_id in log: ${updateErr.message}`,
    );
  } else {
    console.log(`[post-to-x] anomaly_posts_log updated: id=${row.id}`);
  }
}

// ──────────────────────────────────────────────
// Entry point
// ──────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`[post-to-x] Starting. mode=${MODE}`);
  if (MODE === "scheduled") {
    await postScheduled();
  } else {
    await postAnomaly();
  }
  console.log("[post-to-x] Done.");
}

main().catch((err: unknown) => {
  console.error("❌  Unexpected error:", err);
  process.exit(1);
});
