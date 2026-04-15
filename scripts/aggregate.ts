/**
 * scripts/aggregate.ts
 * GdeltArticle[] (JSON from stdin) を感情スコアに集計し、
 * Supabase の emotion_snapshots テーブルに INSERT する。
 *
 * Usage:
 *   pnpm fetch-gdelt | pnpm aggregate
 *   cat articles.json | pnpm aggregate
 *
 * 環境変数 (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * WEM 感情 ← GCAM マッピング:
 *   joy         ← c7.5
 *   trust       ← c7.10
 *   fear        ← c7.4
 *   anger       ← c7.1
 *   sadness     ← c7.8
 *   surprise    ← c7.9
 *   optimism    ← c7.2 (anticipation)
 *   uncertainty ← fear / (fear + trust)  [fear比率; 0=完全に安心, 1=恐怖のみ]
 */

import { createClient } from "@supabase/supabase-js";
import type { GdeltArticle } from "./fetch-gdelt.ts";
import { FIPS_TO_ISO } from "../src/lib/fips-to-iso";

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
// Continent lookup (ISO 3166-1 alpha-2 → continent code)
// ──────────────────────────────────────────────

const COUNTRY_CONTINENT: Record<string, string> = {
  // North America
  US: "NA", CA: "NA", MX: "NA", CU: "NA", JM: "NA", HT: "NA", DO: "NA",
  GT: "NA", BZ: "NA", HN: "NA", SV: "NA", NI: "NA", CR: "NA", PA: "NA",
  PR: "NA", TT: "NA", BB: "NA", LC: "NA", VC: "NA", GD: "NA", AG: "NA",
  DM: "NA", KN: "NA", BS: "NA",
  // South America
  BR: "SA", AR: "SA", CL: "SA", CO: "SA", PE: "SA", VE: "SA", EC: "SA",
  BO: "SA", PY: "SA", UY: "SA", GY: "SA", SR: "SA", GF: "SA",
  // Europe
  GB: "EU", DE: "EU", FR: "EU", IT: "EU", ES: "EU", PT: "EU", NL: "EU",
  BE: "EU", CH: "EU", AT: "EU", SE: "EU", NO: "EU", DK: "EU", FI: "EU",
  PL: "EU", CZ: "EU", SK: "EU", HU: "EU", RO: "EU", BG: "EU", HR: "EU",
  RS: "EU", SI: "EU", BA: "EU", MK: "EU", AL: "EU", ME: "EU", XK: "EU",
  GR: "EU", CY: "EU", MT: "EU", LU: "EU", IE: "EU", IS: "EU", LI: "EU",
  MC: "EU", SM: "EU", VA: "EU", AD: "EU", EE: "EU", LV: "EU", LT: "EU",
  BY: "EU", UA: "EU", MD: "EU", RU: "EU",
  // Asia
  CN: "AS", JP: "AS", KR: "AS", IN: "AS", PK: "AS", BD: "AS", LK: "AS",
  NP: "AS", MM: "AS", TH: "AS", VN: "AS", KH: "AS", LA: "AS", MY: "AS",
  ID: "AS", PH: "AS", SG: "AS", BN: "AS", TL: "AS", MN: "AS", KZ: "AS",
  UZ: "AS", TM: "AS", KG: "AS", TJ: "AS", AF: "AS", IR: "AS", IQ: "AS",
  SY: "AS", LB: "AS", JO: "AS", IL: "AS", PS: "AS", SA: "AS", AE: "AS",
  KW: "AS", QA: "AS", BH: "AS", OM: "AS", YE: "AS", TR: "AS", AZ: "AS",
  AM: "AS", GE: "AS", HK: "AS", TW: "AS", MO: "AS", KP: "AS",
  // Africa
  EG: "AF", MA: "AF", DZ: "AF", TN: "AF", LY: "AF", SD: "AF", SS: "AF",
  ET: "AF", ER: "AF", DJ: "AF", SO: "AF", KE: "AF", UG: "AF", TZ: "AF",
  RW: "AF", BI: "AF", MZ: "AF", ZM: "AF", ZW: "AF", BW: "AF", NA: "AF",
  ZA: "AF", LS: "AF", SZ: "AF", MG: "AF", MU: "AF", SC: "AF", KM: "AF",
  NG: "AF", GH: "AF", CI: "AF", SN: "AF", ML: "AF", BF: "AF", NE: "AF",
  MR: "AF", GM: "AF", GW: "AF", GN: "AF", SL: "AF", LR: "AF", TG: "AF",
  BJ: "AF", CM: "AF", CF: "AF", CD: "AF", CG: "AF", GA: "AF", GQ: "AF",
  AO: "AF", TD: "AF", ST: "AF", CV: "AF",
  // Oceania
  AU: "OC", NZ: "OC", PG: "OC", FJ: "OC", SB: "OC", VU: "OC", WS: "OC",
  TO: "OC", FM: "OC", PW: "OC", MH: "OC", NR: "OC", KI: "OC", TV: "OC",
  CK: "OC",
};

// GDELT は FIPS 10-4 国コードも使う。ISO 3166 と異なる主要コードを補完
// (ISO と重複するコードは COUNTRY_CONTINENT 側が優先)
const FIPS_TO_CONTINENT: Record<string, string> = {
  // Europe (FIPS code → ISO code)
  UK: "EU", // United Kingdom (ISO: GB)
  EI: "EU", // Ireland (ISO: IE)
  SP: "EU", // Spain (ISO: ES)
  DA: "EU", // Denmark (ISO: DK)
  UP: "EU", // Ukraine (ISO: UA)
  PO: "EU", // Portugal (ISO: PT)
  GM: "EU", // Germany (ISO: DE)
  SW: "EU", // Sweden (ISO: SE)
  EZ: "EU", // Czech Republic (ISO: CZ)
  LH: "EU", // Lithuania (ISO: LT)
  LG: "EU", // Latvia (ISO: LV)
  EN: "EU", // Estonia (ISO: EE)
  // Asia
  JA: "AS", // Japan (ISO: JP)
  RP: "AS", // Philippines (ISO: PH)
  KS: "AS", // South Korea (ISO: KR)
  VM: "AS", // Vietnam (ISO: VN)
  LE: "AS", // Lebanon (ISO: LB)
  IZ: "AS", // Iraq (ISO: IQ)
  KU: "AS", // Kuwait (ISO: KW)
  CE: "AS", // Sri Lanka (ISO: LK)
  CB: "AS", // Cambodia (ISO: KH)
  BM: "AS", // Myanmar (ISO: MM)
  AJ: "AS", // Azerbaijan (ISO: AZ)
  GG: "AS", // Georgia (ISO: GE)
  // Africa
  SF: "AF", // South Africa (ISO: ZA)
  ZI: "AF", // Zimbabwe (ISO: ZW)
  SU: "AF", // Sudan (ISO: SD)
  IV: "AF", // Ivory Coast (ISO: CI)
  // Oceania
  AS: "OC", // Australia (ISO: AU; FIPS AS も OC なので OK)
  PP: "OC", // Papua New Guinea (ISO: PG)
};

const UNKNOWN_CONTINENT = "XX"; // 不明な国コード用

// ──────────────────────────────────────────────
// FIPS → ISO normalization (ingestion-time, full mapping)
// ──────────────────────────────────────────────

/**
 * At ingestion time ALL location codes from GDELT are FIPS 10-4.
 * We apply the full mapping including "collision" cases that the frontend
 * whitelist (FIPS_TO_ISO) intentionally excludes (e.g. GM = Germany in FIPS
 * but GM = Gambia in ISO — safe to override here because the source is always FIPS).
 */
const FIPS_COLLISION_OVERRIDES: Record<string, string> = {
  GM: "DE", // Germany     (FIPS GM; ISO GM = Gambia)
  CH: "CN", // China       (FIPS CH; ISO CH = Switzerland)
  SZ: "CH", // Switzerland (FIPS SZ; ISO SZ = Eswatini)
  AS: "AU", // Australia   (FIPS AS; ISO AS = American Samoa)
  RS: "RU", // Russia      (FIPS RS; ISO RS = Serbia)
  BM: "MM", // Myanmar     (FIPS BM; ISO BM = Bermuda)
  GG: "GE", // Georgia     (FIPS GG; ISO GG = Guernsey)
};

const FIPS_TO_ISO_FULL: Readonly<Record<string, string>> = {
  ...FIPS_TO_ISO,
  ...FIPS_COLLISION_OVERRIDES,
};

function normalizeCountryCode(code: string): string {
  return FIPS_TO_ISO_FULL[code] ?? code;
}

function getContinent(countryCode: string): string {
  // countryCode is already ISO-normalized before this is called
  return COUNTRY_CONTINENT[countryCode] ?? FIPS_TO_CONTINENT[countryCode] ?? UNKNOWN_CONTINENT;
}

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

type EmotionScores = {
  joy: number;
  trust: number;
  fear: number;
  anger: number;
  sadness: number;
  surprise: number;
  optimism: number;
  uncertainty: number;
};

type SectorDef = {
  slug: string;
  gdelt_themes: string[];
};

type AggBucket = {
  timestamp: string;       // ISO 8601 hour boundary, e.g. "2025-01-15T12:00:00Z"
  country_code: string | null;
  continent: string;
  sector_slug: string | null;
  sumEmotions: EmotionScores;
  totalWeight: number;
  article_count: number;
  sample_urls: string[];   // up to 5 article URLs (highest-weight first)
  sample_weights: number[]; // parallel array for reservoir selection
};

type SnapshotInsert = {
  timestamp: string;
  country_code: string | null;
  region_code: null;
  continent: string;
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
  sample_urls: string[];
};

const SAMPLE_URL_LIMIT = 5;

// ──────────────────────────────────────────────
// GCAM → WEM emotion extraction
// ──────────────────────────────────────────────

function extractEmotions(
  article: GdeltArticle,
): { scores: EmotionScores; weight: number } | null {
  const { gcam } = article;
  if (gcam.wordCount === 0) return null;

  // wordCount で正規化 → 単語あたりの感情密度 (0〜1 の小数値)
  const wc = gcam.wordCount;
  const weight = wc;
  const norm = (x: number | null) => (x !== null ? x / wc : 0);

  const fear = norm(gcam.fear);
  const trust = norm(gcam.trust);
  const joy = norm(gcam.joy);
  const optimism = norm(gcam.anticipation);

  // uncertainty: fear を、安心・ポジティブ感情（trust, joy, optimism）を含む分母で割る。
  // 旧式: fear / (fear + trust) → news negativity bias により全国で高くなる構造的問題あり
  // 新式: joy と optimism を分母に加えることで、明るいニュースが多い国ほど下がる
  const uncertaintyDenom = fear + trust + joy * 0.5 + optimism * 0.5;

  const scores: EmotionScores = {
    joy,
    trust,
    fear,
    anger: norm(gcam.anger),
    sadness: norm(gcam.sadness),
    surprise: norm(gcam.surprise),
    optimism,
    uncertainty: uncertaintyDenom > 0 ? fear / uncertaintyDenom : 0,
  };

  return { scores, weight };
}

// ──────────────────────────────────────────────
// Sector matching
// ──────────────────────────────────────────────

function articleMatchesSector(
  articleThemes: string[],
  sectorThemes: string[],
): boolean {
  for (const at of articleThemes) {
    for (const st of sectorThemes) {
      if (at === st || at.startsWith(st + "_")) return true;
    }
  }
  return false;
}

// ──────────────────────────────────────────────
// Timestamp helpers
// ──────────────────────────────────────────────

/** GDELT YYYYMMDDHHMMSS → ISO 8601 時刻境界 "YYYY-MM-DDTHH:00:00Z" */
function gdeltToIsoHour(date: string): string {
  const y = date.slice(0, 4);
  const mo = date.slice(4, 6);
  const d = date.slice(6, 8);
  const h = date.slice(8, 10);
  return `${y}-${mo}-${d}T${h}:00:00Z`;
}

// ──────────────────────────────────────────────
// Bucket helpers
// ──────────────────────────────────────────────

type BucketMap = Map<string, AggBucket>;

function bucketKey(
  timestamp: string,
  country_code: string | null,
  sector_slug: string | null,
): string {
  return `${timestamp}|${country_code ?? ""}|${sector_slug ?? ""}`;
}

function getOrCreate(
  map: BucketMap,
  key: string,
  timestamp: string,
  country_code: string | null,
  continent: string,
  sector_slug: string | null,
): AggBucket {
  let bucket = map.get(key);
  if (!bucket) {
    bucket = {
      timestamp,
      country_code,
      continent,
      sector_slug,
      sumEmotions: {
        joy: 0, trust: 0, fear: 0, anger: 0,
        sadness: 0, surprise: 0, optimism: 0, uncertainty: 0,
      },
      totalWeight: 0,
      article_count: 0,
      sample_urls: [],
      sample_weights: [],
    };
    map.set(key, bucket);
  }
  return bucket;
}

function accumulateToBucket(
  bucket: AggBucket,
  scores: EmotionScores,
  weight: number,
  url: string,
): void {
  // 加重和を累積
  for (const k of Object.keys(scores) as (keyof EmotionScores)[]) {
    bucket.sumEmotions[k] += scores[k] * weight;
  }
  bucket.totalWeight += weight;
  bucket.article_count += 1;

  // 重み上位 SAMPLE_URL_LIMIT 件を保持（最小ヒープ相当の簡易実装）
  if (url) {
    if (bucket.sample_urls.length < SAMPLE_URL_LIMIT) {
      bucket.sample_urls.push(url);
      bucket.sample_weights.push(weight);
    } else {
      // 最小重みの位置を探して、より重い記事と交換
      const minIdx = bucket.sample_weights.reduce(
        (mi, w, i) => (w < bucket.sample_weights[mi]! ? i : mi),
        0,
      );
      if (weight > (bucket.sample_weights[minIdx] ?? 0)) {
        bucket.sample_urls[minIdx] = url;
        bucket.sample_weights[minIdx] = weight;
      }
    }
  }
}

function bucketToInsert(bucket: AggBucket): SnapshotInsert {
  const w = bucket.totalWeight || 1;
  const avg = (k: keyof EmotionScores) =>
    Math.round((bucket.sumEmotions[k] / w) * 1e6) / 1e6;

  return {
    timestamp: bucket.timestamp,
    country_code: bucket.country_code,
    region_code: null,
    continent: bucket.continent,
    sector_slug: bucket.sector_slug,
    joy: avg("joy"),
    trust: avg("trust"),
    fear: avg("fear"),
    anger: avg("anger"),
    sadness: avg("sadness"),
    surprise: avg("surprise"),
    optimism: avg("optimism"),
    uncertainty: avg("uncertainty"),
    article_count: bucket.article_count,
    sample_urls: bucket.sample_urls,
  };
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────

async function main() {
  // 1. stdin から JSON を読み込む
  const raw = await new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    process.stdin.on("data", (chunk: Buffer) => chunks.push(chunk));
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    process.stdin.on("error", reject);
  });

  let articles: GdeltArticle[];
  try {
    articles = JSON.parse(raw) as GdeltArticle[];
  } catch {
    console.error("❌  stdin is not valid JSON");
    process.exit(1);
  }

  if (articles.length === 0) {
    console.error("[aggregate] no articles received — nothing to insert");
    return;
  }
  console.error(`[aggregate] received ${articles.length} articles`);

  // 2. セクター定義を Supabase から取得
  const { data: sectors, error: sectorError } = await supabase
    .from("sectors")
    .select("slug, gdelt_themes");

  if (sectorError) {
    console.error("❌  Failed to load sectors:", sectorError.message);
    process.exit(1);
  }
  const sectorDefs = (sectors ?? []) as SectorDef[];
  console.error(`[aggregate] loaded ${sectorDefs.length} sectors`);

  // 3. 集計バケット
  const buckets: BucketMap = new Map();

  for (const article of articles) {
    const hourTs = gdeltToIsoHour(article.date);

    // 感情スコアを抽出（wordCount=0 はスキップ）
    const extracted = extractEmotions(article);
    if (!extracted) continue;
    const { scores, weight } = extracted;

    // 記事が対応する国コードを列挙（FIPS→ISO正規化 + 重複除去）
    const countryCodes = [
      ...new Set(article.locations.map((loc) => normalizeCountryCode(loc.countryCode))),
    ];

    // 記事が対応するセクターを特定
    const matchedSectors = sectorDefs.filter((s) =>
      articleMatchesSector(article.themes, s.gdelt_themes),
    );

    for (const countryCode of countryCodes) {
      const continent = getContinent(countryCode);

      // (a) country × hour × null (全セクター)
      const keyAll = bucketKey(hourTs, countryCode, null);
      const bucketAll = getOrCreate(buckets, keyAll, hourTs, countryCode, continent, null);
      accumulateToBucket(bucketAll, scores, weight, article.url);

      // (b) country × hour × sector
      for (const sector of matchedSectors) {
        const keySec = bucketKey(hourTs, countryCode, sector.slug);
        const bucketSec = getOrCreate(buckets, keySec, hourTs, countryCode, continent, sector.slug);
        accumulateToBucket(bucketSec, scores, weight, article.url);
      }
    }

    // (c) global × hour × null
    const keyGlobal = bucketKey(hourTs, null, null);
    const bucketGlobal = getOrCreate(buckets, keyGlobal, hourTs, null, "GL", null);
    accumulateToBucket(bucketGlobal, scores, weight, article.url);

    // (d) global × hour × sector
    for (const sector of matchedSectors) {
      const keyGlobSec = bucketKey(hourTs, null, sector.slug);
      const bucketGlobSec = getOrCreate(buckets, keyGlobSec, hourTs, null, "GL", sector.slug);
      accumulateToBucket(bucketGlobSec, scores, weight, article.url);
    }
  }

  console.error(`[aggregate] buckets: ${buckets.size}`);

  // 4. バケット → INSERT 行に変換
  const rows = [...buckets.values()].map(bucketToInsert);

  // 5. Supabase に INSERT（1000 件ずつバッチ）
  const BATCH = 1000;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase.from("emotion_snapshots").insert(batch);
    if (error) {
      console.error(`❌  Insert failed (batch ${i / BATCH + 1}):`, error.message);
      process.exit(1);
    }
    inserted += batch.length;
    console.error(`[aggregate] inserted ${inserted}/${rows.length} rows`);
  }

  console.error(`[aggregate] ✅  done — ${inserted} rows inserted`);
}

main().catch((err: unknown) => {
  console.error("❌  Unexpected error:", err);
  process.exit(1);
});
