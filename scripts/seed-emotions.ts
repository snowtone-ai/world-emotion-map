/**
 * scripts/seed-emotions.ts
 * Seed emotion_snapshots with 24 h of realistic sample data for ~40 countries.
 *
 * Usage:
 *   pnpm seed-emotions
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Score range: 0–1 (EmotionBarChart multiplies ×100 → %).
 * Each country gets 25 hourly rows (now-24h … now), sector_slug = null.
 */

import { createClient } from "@supabase/supabase-js";

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

// ── Types ──────────────────────────────────────────────────────────────────

type EmotionProfile = {
  joy: number;
  trust: number;
  fear: number;
  anger: number;
  sadness: number;
  surprise: number;
  optimism: number;
  uncertainty: number;
};

type CountryDef = {
  code: string;
  continent: string;
  profile: EmotionProfile;
  urls: string[];
};

// ── Continent lookup ───────────────────────────────────────────────────────

const CONTINENT: Record<string, string> = {
  US: "NA", CA: "NA", MX: "NA",
  BR: "SA", AR: "SA", CL: "SA", CO: "SA", PE: "SA",
  GB: "EU", DE: "EU", FR: "EU", IT: "EU", ES: "EU",
  PL: "EU", UA: "EU", NL: "EU", SE: "EU", CH: "EU",
  RU: "EU",
  CN: "AS", JP: "AS", KR: "AS", IN: "AS", ID: "AS",
  TH: "AS", VN: "AS", PH: "AS", PK: "AS", TR: "AS",
  SA: "AS", IL: "AS", IR: "AS", AE: "AS",
  NG: "AF", ZA: "AF", EG: "AF", KE: "AF", ET: "AF",
  AU: "OC", NZ: "OC",
};

// ── Emotion profiles per country ───────────────────────────────────────────
// Values are 0–1 base scores (mid-range ≈ 0.3, strong ≈ 0.55, weak ≈ 0.1)

const COUNTRIES: CountryDef[] = [
  // North America
  {
    code: "US", continent: "NA",
    profile: { joy: 0.28, trust: 0.22, fear: 0.38, anger: 0.42, sadness: 0.25, surprise: 0.18, optimism: 0.20, uncertainty: 0.35 },
    urls: [
      "https://www.nytimes.com/2024/01/15/us/politics/congress-debate.html",
      "https://www.washingtonpost.com/nation/2024/01/15/economy-report/",
      "https://www.reuters.com/world/us/federal-reserve-decision-2024/",
    ],
  },
  {
    code: "CA", continent: "NA",
    profile: { joy: 0.32, trust: 0.35, fear: 0.20, anger: 0.22, sadness: 0.18, surprise: 0.15, optimism: 0.30, uncertainty: 0.22 },
    urls: [
      "https://www.cbc.ca/news/canada/housing-crisis-update",
      "https://globalnews.ca/news/climate-policy-canada/",
    ],
  },
  {
    code: "MX", continent: "NA",
    profile: { joy: 0.30, trust: 0.20, fear: 0.40, anger: 0.38, sadness: 0.30, surprise: 0.20, optimism: 0.22, uncertainty: 0.40 },
    urls: [
      "https://www.eluniversal.com.mx/nacion/seguridad-publica",
      "https://www.reforma.com/economia-mexico",
    ],
  },
  // South America
  {
    code: "BR", continent: "SA",
    profile: { joy: 0.50, trust: 0.30, fear: 0.25, anger: 0.30, sadness: 0.20, surprise: 0.35, optimism: 0.45, uncertainty: 0.28 },
    urls: [
      "https://www.folha.uol.com.br/esporte/futebol/",
      "https://g1.globo.com/economia/noticia/crescimento-2024/",
    ],
  },
  {
    code: "AR", continent: "SA",
    profile: { joy: 0.28, trust: 0.18, fear: 0.30, anger: 0.45, sadness: 0.35, surprise: 0.22, optimism: 0.20, uncertainty: 0.48 },
    urls: [
      "https://www.lanacion.com.ar/economia/inflacion",
      "https://www.infobae.com/economia/2024/crisis/",
    ],
  },
  {
    code: "CL", continent: "SA",
    profile: { joy: 0.35, trust: 0.28, fear: 0.22, anger: 0.30, sadness: 0.20, surprise: 0.18, optimism: 0.32, uncertainty: 0.25 },
    urls: ["https://www.latercera.com/politica/"],
  },
  {
    code: "CO", continent: "SA",
    profile: { joy: 0.38, trust: 0.25, fear: 0.30, anger: 0.28, sadness: 0.22, surprise: 0.20, optimism: 0.35, uncertainty: 0.30 },
    urls: ["https://www.eltiempo.com/colombia/"],
  },
  // Europe
  {
    code: "GB", continent: "EU",
    profile: { joy: 0.28, trust: 0.30, fear: 0.28, anger: 0.32, sadness: 0.25, surprise: 0.20, optimism: 0.25, uncertainty: 0.38 },
    urls: [
      "https://www.bbc.co.uk/news/uk-politics",
      "https://www.theguardian.com/politics/2024/economy",
      "https://www.thetimes.co.uk/article/uk-economy",
    ],
  },
  {
    code: "DE", continent: "EU",
    profile: { joy: 0.25, trust: 0.40, fear: 0.30, anger: 0.25, sadness: 0.22, surprise: 0.15, optimism: 0.28, uncertainty: 0.35 },
    urls: [
      "https://www.spiegel.de/wirtschaft/",
      "https://www.faz.net/aktuell/wirtschaft/",
      "https://www.zeit.de/politik/",
    ],
  },
  {
    code: "FR", continent: "EU",
    profile: { joy: 0.25, trust: 0.22, fear: 0.28, anger: 0.48, sadness: 0.28, surprise: 0.22, optimism: 0.20, uncertainty: 0.38 },
    urls: [
      "https://www.lemonde.fr/politique/",
      "https://www.lefigaro.fr/actualite-france/",
    ],
  },
  {
    code: "IT", continent: "EU",
    profile: { joy: 0.30, trust: 0.25, fear: 0.28, anger: 0.35, sadness: 0.28, surprise: 0.22, optimism: 0.25, uncertainty: 0.35 },
    urls: [
      "https://www.corriere.it/economia/",
      "https://www.repubblica.it/politica/",
    ],
  },
  {
    code: "ES", continent: "EU",
    profile: { joy: 0.35, trust: 0.28, fear: 0.22, anger: 0.32, sadness: 0.22, surprise: 0.20, optimism: 0.30, uncertainty: 0.28 },
    urls: [
      "https://elpais.com/espana/politica/",
      "https://www.elmundo.es/economia/",
    ],
  },
  {
    code: "PL", continent: "EU",
    profile: { joy: 0.28, trust: 0.32, fear: 0.32, anger: 0.30, sadness: 0.25, surprise: 0.18, optimism: 0.28, uncertainty: 0.35 },
    urls: ["https://wyborcza.pl/kraj/"],
  },
  {
    code: "UA", continent: "EU",
    profile: { joy: 0.18, trust: 0.25, fear: 0.55, anger: 0.48, sadness: 0.52, surprise: 0.20, optimism: 0.22, uncertainty: 0.50 },
    urls: [
      "https://www.pravda.com.ua/eng/news/war/",
      "https://kyivindependent.com/war/",
      "https://www.bbc.co.uk/news/world-europe-ukraine",
    ],
  },
  {
    code: "RU", continent: "EU",
    profile: { joy: 0.20, trust: 0.30, fear: 0.38, anger: 0.45, sadness: 0.35, surprise: 0.15, optimism: 0.18, uncertainty: 0.40 },
    urls: [
      "https://tass.com/world/",
      "https://rt.com/russia/",
    ],
  },
  {
    code: "SE", continent: "EU",
    profile: { joy: 0.38, trust: 0.45, fear: 0.18, anger: 0.20, sadness: 0.18, surprise: 0.15, optimism: 0.40, uncertainty: 0.20 },
    urls: ["https://www.svt.se/nyheter/"],
  },
  {
    code: "NL", continent: "EU",
    profile: { joy: 0.35, trust: 0.38, fear: 0.22, anger: 0.25, sadness: 0.20, surprise: 0.18, optimism: 0.35, uncertainty: 0.25 },
    urls: ["https://www.nu.nl/"],
  },
  // Asia
  {
    code: "CN", continent: "AS",
    profile: { joy: 0.32, trust: 0.45, fear: 0.20, anger: 0.22, sadness: 0.18, surprise: 0.20, optimism: 0.40, uncertainty: 0.22 },
    urls: [
      "https://www.xinhuanet.com/english/economy",
      "https://www.chinadaily.com.cn/a/business/",
    ],
  },
  {
    code: "JP", continent: "AS",
    profile: { joy: 0.32, trust: 0.42, fear: 0.20, anger: 0.18, sadness: 0.28, surprise: 0.22, optimism: 0.30, uncertainty: 0.25 },
    urls: [
      "https://www3.nhk.or.jp/nhkworld/en/news/",
      "https://www.japantimes.co.jp/news/economy/",
      "https://mainichi.jp/english/",
    ],
  },
  {
    code: "KR", continent: "AS",
    profile: { joy: 0.30, trust: 0.35, fear: 0.25, anger: 0.30, sadness: 0.22, surprise: 0.25, optimism: 0.32, uncertainty: 0.28 },
    urls: [
      "https://www.koreaherald.com/",
      "https://en.yna.co.kr/",
    ],
  },
  {
    code: "IN", continent: "AS",
    profile: { joy: 0.35, trust: 0.30, fear: 0.28, anger: 0.38, sadness: 0.25, surprise: 0.28, optimism: 0.35, uncertainty: 0.30 },
    urls: [
      "https://www.thehindu.com/news/national/",
      "https://indianexpress.com/section/india/",
      "https://timesofindia.indiatimes.com/india/",
    ],
  },
  {
    code: "ID", continent: "AS",
    profile: { joy: 0.40, trust: 0.32, fear: 0.20, anger: 0.22, sadness: 0.18, surprise: 0.28, optimism: 0.38, uncertainty: 0.22 },
    urls: ["https://www.kompas.com/"],
  },
  {
    code: "PH", continent: "AS",
    profile: { joy: 0.42, trust: 0.28, fear: 0.25, anger: 0.28, sadness: 0.22, surprise: 0.30, optimism: 0.38, uncertainty: 0.25 },
    urls: ["https://www.philstar.com/"],
  },
  {
    code: "TH", continent: "AS",
    profile: { joy: 0.38, trust: 0.30, fear: 0.22, anger: 0.25, sadness: 0.20, surprise: 0.25, optimism: 0.35, uncertainty: 0.22 },
    urls: ["https://www.bangkokpost.com/"],
  },
  {
    code: "PK", continent: "AS",
    profile: { joy: 0.22, trust: 0.20, fear: 0.40, anger: 0.42, sadness: 0.35, surprise: 0.18, optimism: 0.18, uncertainty: 0.45 },
    urls: ["https://www.dawn.com/news/"],
  },
  {
    code: "TR", continent: "AS",
    profile: { joy: 0.28, trust: 0.25, fear: 0.32, anger: 0.38, sadness: 0.28, surprise: 0.20, optimism: 0.25, uncertainty: 0.40 },
    urls: ["https://www.hurriyet.com.tr/"],
  },
  {
    code: "SA", continent: "AS",
    profile: { joy: 0.32, trust: 0.40, fear: 0.25, anger: 0.22, sadness: 0.18, surprise: 0.18, optimism: 0.38, uncertainty: 0.25 },
    urls: ["https://arab.news/"],
  },
  {
    code: "IL", continent: "AS",
    profile: { joy: 0.20, trust: 0.22, fear: 0.50, anger: 0.48, sadness: 0.45, surprise: 0.22, optimism: 0.18, uncertainty: 0.50 },
    urls: [
      "https://www.haaretz.com/israel-news/",
      "https://www.timesofisrael.com/",
    ],
  },
  {
    code: "IR", continent: "AS",
    profile: { joy: 0.18, trust: 0.22, fear: 0.45, anger: 0.42, sadness: 0.38, surprise: 0.15, optimism: 0.15, uncertainty: 0.48 },
    urls: ["https://www.tehrantimes.com/"],
  },
  {
    code: "AE", continent: "AS",
    profile: { joy: 0.38, trust: 0.42, fear: 0.18, anger: 0.15, sadness: 0.15, surprise: 0.20, optimism: 0.45, uncertainty: 0.18 },
    urls: ["https://www.thenationalnews.com/"],
  },
  // Africa
  {
    code: "NG", continent: "AF",
    profile: { joy: 0.30, trust: 0.20, fear: 0.35, anger: 0.40, sadness: 0.32, surprise: 0.22, optimism: 0.28, uncertainty: 0.40 },
    urls: [
      "https://punchng.com/",
      "https://www.vanguardngr.com/",
    ],
  },
  {
    code: "ZA", continent: "AF",
    profile: { joy: 0.28, trust: 0.25, fear: 0.32, anger: 0.38, sadness: 0.30, surprise: 0.20, optimism: 0.25, uncertainty: 0.38 },
    urls: [
      "https://www.dailymaverick.co.za/",
      "https://www.news24.com/",
    ],
  },
  {
    code: "EG", continent: "AF",
    profile: { joy: 0.28, trust: 0.28, fear: 0.32, anger: 0.35, sadness: 0.28, surprise: 0.18, optimism: 0.25, uncertainty: 0.35 },
    urls: ["https://english.ahram.org.eg/"],
  },
  {
    code: "KE", continent: "AF",
    profile: { joy: 0.35, trust: 0.28, fear: 0.28, anger: 0.30, sadness: 0.25, surprise: 0.22, optimism: 0.32, uncertainty: 0.30 },
    urls: ["https://www.nation.africa/kenya/"],
  },
  {
    code: "ET", continent: "AF",
    profile: { joy: 0.25, trust: 0.22, fear: 0.38, anger: 0.35, sadness: 0.38, surprise: 0.15, optimism: 0.20, uncertainty: 0.42 },
    urls: ["https://addisstandard.com/"],
  },
  // Oceania
  {
    code: "AU", continent: "OC",
    profile: { joy: 0.38, trust: 0.40, fear: 0.20, anger: 0.22, sadness: 0.18, surprise: 0.20, optimism: 0.38, uncertainty: 0.22 },
    urls: [
      "https://www.abc.net.au/news/",
      "https://www.smh.com.au/",
    ],
  },
  {
    code: "NZ", continent: "OC",
    profile: { joy: 0.40, trust: 0.42, fear: 0.15, anger: 0.18, sadness: 0.15, surprise: 0.18, optimism: 0.42, uncertainty: 0.18 },
    urls: ["https://www.rnz.co.nz/news/"],
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────

/** Seeded deterministic jitter based on index to keep repeated runs stable */
function jitter(base: number, seed: number, amplitude = 0.08): number {
  // simple deterministic oscillation
  const delta = amplitude * Math.sin(seed * 1.7 + base * 31.4);
  return Math.max(0, Math.min(1, base + delta));
}

type SnapshotRow = {
  timestamp: string;
  country_code: string;
  region_code: null;
  continent: string;
  sector_slug: null;
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

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}

// ── Build rows ─────────────────────────────────────────────────────────────

function buildRows(): SnapshotRow[] {
  const rows: SnapshotRow[] = [];
  const now = new Date();
  // Align to current hour boundary
  now.setMinutes(0, 0, 0);

  for (const country of COUNTRIES) {
    const { code, continent, profile, urls } = country;

    for (let h = 24; h >= 0; h--) {
      const ts = new Date(now.getTime() - h * 60 * 60 * 1000);
      const hourSeed = h + code.charCodeAt(0) + code.charCodeAt(1);

      rows.push({
        timestamp: ts.toISOString(),
        country_code: code,
        region_code: null,
        continent,
        sector_slug: null,
        joy: round6(jitter(profile.joy, hourSeed)),
        trust: round6(jitter(profile.trust, hourSeed + 3)),
        fear: round6(jitter(profile.fear, hourSeed + 7)),
        anger: round6(jitter(profile.anger, hourSeed + 11)),
        sadness: round6(jitter(profile.sadness, hourSeed + 13)),
        surprise: round6(jitter(profile.surprise, hourSeed + 17)),
        optimism: round6(jitter(profile.optimism, hourSeed + 19)),
        uncertainty: round6(jitter(profile.uncertainty, hourSeed + 23)),
        article_count: 50 + (hourSeed % 150),
        sample_urls: urls,
      });
    }
  }

  return rows;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  // Delete existing seed data to keep idempotent
  console.log("🗑️  Clearing existing seed data…");
  const countryCodes = COUNTRIES.map((c) => c.code);
  const { error: delError } = await supabase
    .from("emotion_snapshots")
    .delete()
    .in("country_code", countryCodes)
    .is("sector_slug", null);

  if (delError) {
    console.error("❌  Delete failed:", delError.message);
    process.exit(1);
  }
  console.log("  ✓ Cleared");

  const rows = buildRows();
  console.log(`📥  Inserting ${rows.length} rows for ${COUNTRIES.length} countries…`);

  const BATCH = 500;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase.from("emotion_snapshots").insert(batch);
    if (error) {
      console.error(`❌  Insert failed (batch ${Math.floor(i / BATCH) + 1}):`, error.message);
      process.exit(1);
    }
    inserted += batch.length;
    process.stdout.write(`\r  ✓ ${inserted}/${rows.length}`);
  }

  console.log(`\n✅  Done — ${inserted} rows inserted`);
  console.log(`   Countries: ${COUNTRIES.length} | Hours: 25 per country`);
}

main().catch((err: unknown) => {
  console.error("❌  Unexpected error:", err);
  process.exit(1);
});
