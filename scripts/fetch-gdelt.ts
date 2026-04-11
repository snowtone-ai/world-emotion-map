/**
 * scripts/fetch-gdelt.ts
 * Fetches GDELT GKG 2.0 data from BigQuery for the last hour (diff query).
 *
 * Usage:
 *   pnpm fetch-gdelt             # query last hour, print JSON to stdout
 *   pnpm fetch-gdelt --dry-run   # estimate bytes only, no actual query
 *
 * Required env vars in .env.local:
 *   GOOGLE_CLOUD_PROJECT              GCP project ID that owns BigQuery billing
 *   GOOGLE_APPLICATION_CREDENTIALS    path to service account JSON file
 *     OR
 *   GOOGLE_SERVICE_ACCOUNT_KEY        inline service account JSON (for CI)
 *
 * State file (gitignored):
 *   scripts/.gdelt-state.json   stores lastFetchedAt between runs
 *
 * GCAM emotion dimensions (NRC Word-Emotion Association Lexicon, dictionary c7):
 *   c7.1  anger        c7.5  joy       c7.9  surprise
 *   c7.2  anticipation c7.6  negative  c7.10 trust
 *   c7.3  disgust      c7.7  positive
 *   c7.4  fear         c7.8  sadness
 *
 * Emotion → GCAM mapping used by Task 4:
 *   joy        → c7.5
 *   trust      → c7.10
 *   fear       → c7.4
 *   anger      → c7.1
 *   sadness    → c7.8
 *   surprise   → c7.9
 *   optimism   → c7.2 (anticipation)
 *   uncertainty → derived in Task 4 (low trust + high fear proxy)
 *
 * Cost note:
 *   gkg_partitioned is partitioned by day. An hourly query scans ~1 day of data
 *   (~5-10 GB). At 24 runs/day × 10 GB ≈ 240 GB/day — well within the 1 TB/month
 *   BigQuery free tier (≈ 7.5 GB/day budget). Monitor with --dry-run if cost drifts.
 */

import { BigQuery, type BigQueryOptions } from "@google-cloud/bigquery";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// ──────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STATE_FILE = join(__dirname, ".gdelt-state.json");
const GDELT_TABLE = "gdelt-bq.gdeltv2.gkg_partitioned";
const MAX_ROWS = 10_000; // safety cap per fetch
const DRY_RUN = process.argv.includes("--dry-run");

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export type GdeltLocation = {
  type: number; // 1=country 2=us_state 3=us_city 4=world_city 5=world_state
  fullName: string;
  countryCode: string; // ISO 3166-1 alpha-2
  adm1Code: string;
  lat: number | null;
  lon: number | null;
  featureId: string;
};

export type GdeltTone = {
  tone: number; // overall -100 to +100
  positive: number;
  negative: number;
  polarity: number;
  activityDensity: number;
  selfGroupDensity: number;
};

export type GcamScores = {
  wordCount: number;
  anger: number | null; // c7.1
  anticipation: number | null; // c7.2 (→ optimism)
  disgust: number | null; // c7.3
  fear: number | null; // c7.4
  joy: number | null; // c7.5
  negative: number | null; // c7.6
  positive: number | null; // c7.7
  sadness: number | null; // c7.8
  surprise: number | null; // c7.9
  trust: number | null; // c7.10
};

export type GdeltArticle = {
  date: string; // YYYYMMDDHHMMSS
  url: string;
  locations: GdeltLocation[];
  themes: string[];
  tone: GdeltTone | null;
  gcam: GcamScores;
};

type FetchState = { lastFetchedAt: string };

// ──────────────────────────────────────────────
// Parsers
// ──────────────────────────────────────────────

function parseLocations(raw: string): GdeltLocation[] {
  if (!raw) return [];
  return raw
    .split(";")
    .filter(Boolean)
    .map((entry) => {
      const parts = entry.split("#");
      return {
        type: parseInt(parts[0] ?? "0", 10),
        fullName: parts[1] ?? "",
        countryCode: (parts[2] ?? "").toUpperCase(),
        adm1Code: parts[3] ?? "",
        lat: parts[4] ? parseFloat(parts[4]) : null,
        lon: parts[5] ? parseFloat(parts[5]) : null,
        featureId: parts[6] ?? "",
      };
    })
    .filter((loc) => loc.countryCode.length === 2);
}

function parseThemes(raw: string): string[] {
  if (!raw) return [];
  // V2Themes format: "THEME,charOffset;THEME,charOffset;..."
  return raw
    .split(";")
    .filter(Boolean)
    .map((t) => t.split(",")[0] ?? "")
    .filter(Boolean);
}

function parseTone(raw: string): GdeltTone | null {
  if (!raw) return null;
  const parts = raw.split(",").map(Number);
  if (parts.length < 6 || parts.some(isNaN)) return null;
  return {
    tone: parts[0]!,
    positive: parts[1]!,
    negative: parts[2]!,
    polarity: parts[3]!,
    activityDensity: parts[4]!,
    selfGroupDensity: parts[5]!,
  };
}

function parseGcam(raw: string): GcamScores {
  const extract = (id: string): number | null => {
    const m = new RegExp(`(?:^|;)${id}:([\\d.]+)`).exec(raw);
    return m ? parseFloat(m[1]!) : null;
  };

  const wcMatch = /(?:^|;)wc:(\d+)/.exec(raw);
  return {
    wordCount: wcMatch ? parseInt(wcMatch[1]!, 10) : 0,
    anger: extract("c7\\.1"),
    anticipation: extract("c7\\.2"),
    disgust: extract("c7\\.3"),
    fear: extract("c7\\.4"),
    joy: extract("c7\\.5"),
    negative: extract("c7\\.6"),
    positive: extract("c7\\.7"),
    sadness: extract("c7\\.8"),
    surprise: extract("c7\\.9"),
    trust: extract("c7\\.10"),
  };
}

// ──────────────────────────────────────────────
// GDELT date helpers
// ──────────────────────────────────────────────

/** Convert JS Date to GDELT YYYYMMDDHHmmSS integer string */
function toGdeltDate(d: Date): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`
  );
}

// ──────────────────────────────────────────────
// BigQuery init
// ──────────────────────────────────────────────

function createBigQueryClient(): BigQuery {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) {
    console.error("❌  GOOGLE_CLOUD_PROJECT env var is required");
    process.exit(1);
  }

  const opts: BigQueryOptions = { projectId };

  // Inline JSON key (for CI/GitHub Actions)
  const inlineKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (inlineKey) {
    try {
      opts.credentials = JSON.parse(inlineKey) as BigQueryOptions["credentials"];
    } catch {
      console.error("❌  GOOGLE_SERVICE_ACCOUNT_KEY is not valid JSON");
      process.exit(1);
    }
  }
  // Otherwise fall back to GOOGLE_APPLICATION_CREDENTIALS path or ADC

  return new BigQuery(opts);
}

// ──────────────────────────────────────────────
// State management
// ──────────────────────────────────────────────

function readState(): FetchState {
  if (existsSync(STATE_FILE)) {
    try {
      return JSON.parse(readFileSync(STATE_FILE, "utf-8")) as FetchState;
    } catch {
      // ignore corrupt state
    }
  }
  // Default: 1 hour ago
  return { lastFetchedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() };
}

function writeState(state: FetchState): void {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────

async function main() {
  const bq = createBigQueryClient();
  const state = readState();
  const startTime = new Date(state.lastFetchedAt);
  const endTime = new Date();

  const startPartition = new Date(startTime);
  startPartition.setUTCHours(0, 0, 0, 0);
  const endPartition = new Date(endTime);
  endPartition.setUTCHours(0, 0, 0, 0);

  const startDateStr = toGdeltDate(startTime);
  const endDateStr = toGdeltDate(endTime);

  const query = `
    SELECT
      DATE,
      DocumentIdentifier,
      V2Locations,
      V2Themes,
      V2Tone,
      GCAM
    FROM \`${GDELT_TABLE}\`
    WHERE
      _PARTITIONTIME >= TIMESTAMP('${startPartition.toISOString().slice(0, 10)}')
      AND _PARTITIONTIME <= TIMESTAMP('${endPartition.toISOString().slice(0, 10)}')
      AND DATE >= '${startDateStr}'
      AND DATE < '${endDateStr}'
      AND LENGTH(V2Locations) > 1
    LIMIT ${MAX_ROWS}
  `;

  console.error(`[fetch-gdelt] window: ${state.lastFetchedAt} → ${endTime.toISOString()}`);
  console.error(`[fetch-gdelt] table:  ${GDELT_TABLE}`);

  // Dry run: estimate cost
  const [dryRunJob] = await bq.createQueryJob({
    query,
    dryRun: true,
    useLegacySql: false,
  });
  const bytesProcessed = parseInt(
    (dryRunJob.metadata as { statistics?: { totalBytesProcessed?: string } })
      .statistics?.totalBytesProcessed ?? "0",
  );
  const gbProcessed = (bytesProcessed / 1e9).toFixed(2);
  console.error(`[fetch-gdelt] estimated: ${gbProcessed} GB`);

  if (DRY_RUN) {
    console.error("[fetch-gdelt] --dry-run mode: skipping actual query");
    return;
  }

  // Actual query
  const [rows] = await bq.query({ query, useLegacySql: false });

  const articles: GdeltArticle[] = (
    rows as Array<{
      DATE: { value: string } | string;
      DocumentIdentifier: string;
      V2Locations: string;
      V2Themes: string;
      V2Tone: string;
      GCAM: string;
    }>
  ).map((row) => ({
    date: typeof row.DATE === "object" ? row.DATE.value : String(row.DATE),
    url: row.DocumentIdentifier,
    locations: parseLocations(row.V2Locations),
    themes: parseThemes(row.V2Themes),
    tone: parseTone(row.V2Tone),
    gcam: parseGcam(row.GCAM ?? ""),
  }));

  console.error(`[fetch-gdelt] fetched ${articles.length} articles`);

  // Output JSON to stdout (piped to file by caller or GitHub Actions)
  console.log(JSON.stringify(articles, null, 2));

  // Update state
  writeState({ lastFetchedAt: endTime.toISOString() });
  console.error("[fetch-gdelt] state updated");
}

main().catch((err: unknown) => {
  console.error("❌  Unexpected error:", err);
  process.exit(1);
});
