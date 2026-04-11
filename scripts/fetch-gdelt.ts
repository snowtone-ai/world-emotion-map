/**
 * scripts/fetch-gdelt.ts
 * GDELT GKG 2.0 の CSV ファイルを直接ダウンロードして解析する差分フェッチスクリプト。
 *
 * - BigQuery 不要・無料・認証不要
 * - GDELT は15分ごとに CSV を公開 → 15分おきに実行可能
 * - 差分: scripts/.gdelt-state.json で前回取得時刻を管理
 *
 * Usage:
 *   pnpm fetch-gdelt             # 前回取得以降のデータを取得し JSON を stdout へ出力
 *   pnpm fetch-gdelt --dry-run   # ダウンロード対象 URL だけ表示して終了
 *
 * 環境変数: 不要（GCP/BigQuery 不要）
 *
 * GCAM 感情次元 (NRC Word-Emotion Association Lexicon, dictionary c14):
 *   実測値: c14.1〜c14.10 が8感情+正負の10次元、c14.11 は未定義の追加次元
 *   c14.1  anger        c14.5  joy       c14.9  surprise
 *   c14.2  anticipation c14.6  negative  c14.10 trust
 *   c14.3  disgust      c14.7  positive
 *   c14.4  fear         c14.8  sadness
 *
 * WEM 感情 → GCAM マッピング（Task 4 で使用）:
 *   joy        → c14.5
 *   trust      → c14.10
 *   fear       → c14.4
 *   anger      → c14.1
 *   sadness    → c14.8
 *   surprise   → c14.9
 *   optimism   → c14.2 (anticipation)
 *   uncertainty → Task 4 で導出 (low trust + high fear のプロキシ)
 */

import AdmZip from "adm-zip";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// ──────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STATE_FILE = join(__dirname, ".gdelt-state.json");
const GDELT_BASE = "http://data.gdeltproject.org/gdeltv2";
const DRY_RUN = process.argv.includes("--dry-run");

// GKG 2.0 TSV 列インデックス (0-based, タブ区切り)
const COL = {
  DATE: 1,
  DOCUMENT_ID: 4,
  V2_THEMES: 8,
  V2_LOCATIONS: 10,
  V2_TONE: 15,
  GCAM: 17,
} as const;

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
};

export type GdeltTone = {
  tone: number; // overall -100〜+100
  positive: number;
  negative: number;
  polarity: number;
  activityDensity: number;
  selfGroupDensity: number;
};

export type GcamScores = {
  wordCount: number;
  anger: number | null; // c7.1
  anticipation: number | null; // c7.2 → optimism
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
      const p = entry.split("#");
      return {
        type: parseInt(p[0] ?? "0", 10),
        fullName: p[1] ?? "",
        countryCode: (p[2] ?? "").toUpperCase(),
        adm1Code: p[3] ?? "",
        lat: p[4] ? parseFloat(p[4]) : null,
        lon: p[5] ? parseFloat(p[5]) : null,
      };
    })
    .filter((loc) => loc.countryCode.length === 2);
}

function parseThemes(raw: string): string[] {
  if (!raw) return [];
  // "THEME,charOffset;THEME,charOffset;..."
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
  if (!raw) {
    return {
      wordCount: 0, anger: null, anticipation: null, disgust: null,
      fear: null, joy: null, negative: null, positive: null,
      sadness: null, surprise: null, trust: null,
    };
  }
  const extract = (id: string): number | null => {
    // GCAM フィールドのセパレータはカンマ (wc:N,c1.2:N,c7.1:N,...)
    const m = new RegExp(`(?:^|,)${id}:([\\d.]+)`).exec(raw);
    return m ? parseFloat(m[1]!) : null;
  };
  const wcMatch = /(?:^|,)wc:(\d+)/.exec(raw);
  return {
    wordCount: wcMatch ? parseInt(wcMatch[1]!, 10) : 0,
    // c14 = NRC Word-Emotion Association Lexicon (実測値で確認済み)
    anger: extract("c14\\.1"),
    anticipation: extract("c14\\.2"),
    disgust: extract("c14\\.3"),
    fear: extract("c14\\.4"),
    joy: extract("c14\\.5"),
    negative: extract("c14\\.6"),
    positive: extract("c14\\.7"),
    sadness: extract("c14\\.8"),
    surprise: extract("c14\\.9"),
    trust: extract("c14\\.10"),
  };
}

// ──────────────────────────────────────────────
// GDELT タイムスタンプ生成
// ──────────────────────────────────────────────

/** JS Date → GDELT YYYYMMDDHHMMSS 文字列 */
function toGdeltTs(d: Date): string {
  const p = (n: number, len = 2) => String(n).padStart(len, "0");
  return (
    `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `${p(d.getUTCHours())}${p(d.getUTCMinutes())}00`
  );
}

/**
 * from〜to 間に存在しうる 15分刻みのタイムスタンプ一覧を返す
 * GDELT は HH:00, HH:15, HH:30, HH:45 に更新
 */
function get15MinTimestamps(from: Date, to: Date): string[] {
  const result: string[] = [];
  const cur = new Date(from);

  // from の次の 15分境界から開始
  const mins = cur.getUTCMinutes();
  const nextBoundary = Math.ceil((mins + 1) / 15) * 15;
  cur.setUTCMinutes(nextBoundary, 0, 0);

  while (cur <= to) {
    result.push(toGdeltTs(cur));
    cur.setUTCMinutes(cur.getUTCMinutes() + 15);
  }
  return result;
}

// ──────────────────────────────────────────────
// Download & parse
// ──────────────────────────────────────────────

async function downloadAndParse(ts: string): Promise<GdeltArticle[]> {
  const url = `${GDELT_BASE}/${ts}.gkg.csv.zip`;
  const res = await fetch(url);

  if (res.status === 404) {
    console.error(`[fetch-gdelt]   skip (not found): ${ts}`);
    return [];
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  const zip = new AdmZip(buffer);
  const entry = zip.getEntries().find((e) => e.entryName.endsWith(".csv"));
  if (!entry) {
    console.error(`[fetch-gdelt]   skip (no CSV in ZIP): ${ts}`);
    return [];
  }

  const csv = entry.getData().toString("utf-8");
  const articles: GdeltArticle[] = [];

  for (const line of csv.split("\n")) {
    if (!line.trim()) continue;
    const cols = line.split("\t");

    const locations = parseLocations(cols[COL.V2_LOCATIONS] ?? "");
    if (locations.length === 0) continue; // 位置情報なしは除外

    articles.push({
      date: cols[COL.DATE] ?? ts,
      url: cols[COL.DOCUMENT_ID] ?? "",
      locations,
      themes: parseThemes(cols[COL.V2_THEMES] ?? ""),
      tone: parseTone(cols[COL.V2_TONE] ?? ""),
      gcam: parseGcam(cols[COL.GCAM] ?? ""),
    });
  }

  console.error(`[fetch-gdelt]   ${ts}: ${articles.length} articles`);
  return articles;
}

// ──────────────────────────────────────────────
// State management
// ──────────────────────────────────────────────

function readState(): FetchState {
  if (existsSync(STATE_FILE)) {
    try {
      return JSON.parse(readFileSync(STATE_FILE, "utf-8")) as FetchState;
    } catch { /* ignore corrupt state */ }
  }
  // デフォルト: 1時間前
  return { lastFetchedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() };
}

function writeState(state: FetchState): void {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────

async function main() {
  const state = readState();
  const startTime = new Date(state.lastFetchedAt);
  const endTime = new Date();

  const timestamps = get15MinTimestamps(startTime, endTime);

  console.error(
    `[fetch-gdelt] window: ${state.lastFetchedAt} → ${endTime.toISOString()}`,
  );
  console.error(`[fetch-gdelt] files to fetch: ${timestamps.length}`);
  console.error(`[fetch-gdelt] URLs:`);
  for (const ts of timestamps) {
    console.error(`  ${GDELT_BASE}/${ts}.gkg.csv.zip`);
  }

  if (DRY_RUN) {
    console.error("[fetch-gdelt] --dry-run mode: skipping download");
    return;
  }

  if (timestamps.length === 0) {
    console.error("[fetch-gdelt] no new files to fetch");
    console.log("[]");
    return;
  }

  const allArticles: GdeltArticle[] = [];
  for (const ts of timestamps) {
    const articles = await downloadAndParse(ts);
    allArticles.push(...articles);
  }

  console.error(`[fetch-gdelt] total: ${allArticles.length} articles`);
  console.log(JSON.stringify(allArticles, null, 2));

  writeState({ lastFetchedAt: endTime.toISOString() });
  console.error("[fetch-gdelt] state updated");
}

main().catch((err: unknown) => {
  console.error("❌  Unexpected error:", err);
  process.exit(1);
});
