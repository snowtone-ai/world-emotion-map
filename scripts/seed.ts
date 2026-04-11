/**
 * scripts/seed.ts
 * Seed the sectors table with 8 parent + 22 child sectors.
 *
 * Usage:
 *   pnpm seed
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (bypasses RLS for write access)
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

// ──────────────────────────────────────────────
// Sector definitions
// ──────────────────────────────────────────────

type SectorRow = {
  slug: string;
  name_en: string;
  name_ja: string;
  parent_slug: string | null;
  gdelt_themes: string[];
};

const sectors: SectorRow[] = [
  // ── 大分類 (parent_slug = null) ──────────────
  {
    slug: "economy",
    name_en: "Economy",
    name_ja: "経済",
    parent_slug: null,
    gdelt_themes: [
      "ECON",
      "ECON_INFLATION",
      "ECON_STOCKMARKET",
      "ECON_RECESSION",
      "ECON_TRADE",
      "ECON_UNEMPLOYMENT",
    ],
  },
  {
    slug: "politics",
    name_en: "Politics",
    name_ja: "政治",
    parent_slug: null,
    gdelt_themes: ["GOV", "POLITICAL_TURMOIL", "LEADER", "GOV_LEGISLATION"],
  },
  {
    slug: "technology",
    name_en: "Technology",
    name_ja: "テクノロジー",
    parent_slug: null,
    gdelt_themes: ["SOC_TECHNOLOGY", "CYBER_ATTACK", "CYBERSECURITY"],
  },
  {
    slug: "environment",
    name_en: "Environment",
    name_ja: "環境",
    parent_slug: null,
    gdelt_themes: [
      "ENV",
      "ENV_CLIMATECHANGE",
      "ENV_GLOBALWARMING",
      "NATURAL_DISASTER",
    ],
  },
  {
    slug: "health",
    name_en: "Health",
    name_ja: "健康・医療",
    parent_slug: null,
    gdelt_themes: ["HEALTH", "TAX_DISEASE", "MED_PUBLICHEALTH"],
  },
  {
    slug: "security",
    name_en: "Security",
    name_ja: "安全保障",
    parent_slug: null,
    gdelt_themes: ["MILITARY", "TERROR", "CRIME", "WAR"],
  },
  {
    slug: "society",
    name_en: "Society",
    name_ja: "社会",
    parent_slug: null,
    gdelt_themes: ["SOC_EDUCATION", "HUMAN_RIGHTS", "MIGRATION", "REFUGEES"],
  },
  {
    slug: "energy",
    name_en: "Energy",
    name_ja: "エネルギー",
    parent_slug: null,
    gdelt_themes: ["ENV_OIL", "ENV_NATURALGAS", "ENV_RENEWABLES", "ENERGY"],
  },

  // ── Economy 小分類 ────────────────────────────
  {
    slug: "economy-markets",
    name_en: "Markets",
    name_ja: "マーケット",
    parent_slug: "economy",
    gdelt_themes: [
      "ECON_STOCKMARKET",
      "ECON_BANKUNREST",
      "ECON_CAPITALMARKETS",
      "ECON_PRICESOFGOODS",
    ],
  },
  {
    slug: "economy-trade",
    name_en: "Trade",
    name_ja: "貿易",
    parent_slug: "economy",
    gdelt_themes: ["ECON_TRADE", "ECON_TARIFF", "ECON_SANCTIONS"],
  },
  {
    slug: "economy-employment",
    name_en: "Employment",
    name_ja: "雇用",
    parent_slug: "economy",
    gdelt_themes: [
      "ECON_UNEMPLOYMENT",
      "ECON_LABORREFORM",
      "ECON_WAGEGAP",
      "ECON_STRIKE",
    ],
  },

  // ── Politics 小分類 ───────────────────────────
  {
    slug: "politics-domestic",
    name_en: "Domestic",
    name_ja: "国内政治",
    parent_slug: "politics",
    gdelt_themes: [
      "GOV_GOVERNMENT",
      "POLITICAL_TURMOIL",
      "GOV_LEGISLATION",
      "GOV_PROTEST",
    ],
  },
  {
    slug: "politics-diplomacy",
    name_en: "Diplomacy",
    name_ja: "外交",
    parent_slug: "politics",
    gdelt_themes: [
      "DIPLOMATIC_INCIDENT",
      "GOV_UNITED_NATIONS",
      "GOV_INTERNATIONAL_AGREEMENT",
      "GOV_SUMMIT",
    ],
  },
  {
    slug: "politics-elections",
    name_en: "Elections",
    name_ja: "選挙",
    parent_slug: "politics",
    gdelt_themes: ["ELECTION", "GOV_ELECTION", "GOV_ELECTORAL"],
  },

  // ── Technology 小分類 ─────────────────────────
  {
    slug: "technology-ai",
    name_en: "AI/ML",
    name_ja: "AI・機械学習",
    parent_slug: "technology",
    gdelt_themes: [
      "SOC_TECHNOLOGY",
      "TAX_TECHNOLOGY_ARTIFICIAL_INTELLIGENCE",
      "TAX_TECHNOLOGY_MACHINE_LEARNING",
    ],
  },
  {
    slug: "technology-cybersecurity",
    name_en: "Cybersecurity",
    name_ja: "サイバーセキュリティ",
    parent_slug: "technology",
    gdelt_themes: ["CYBER_ATTACK", "CYBERSECURITY", "HACKING", "DATA_BREACH"],
  },
  {
    slug: "technology-innovation",
    name_en: "Innovation",
    name_ja: "イノベーション",
    parent_slug: "technology",
    gdelt_themes: [
      "SOC_TECHNOLOGY",
      "TAX_TECHNOLOGY_INNOVATION",
      "TAX_TECHNOLOGY_STARTUP",
    ],
  },

  // ── Environment 小分類 ────────────────────────
  {
    slug: "environment-climate",
    name_en: "Climate",
    name_ja: "気候変動",
    parent_slug: "environment",
    gdelt_themes: [
      "ENV_CLIMATECHANGE",
      "ENV_GLOBALWARMING",
      "ENV_DEFORESTATION",
      "ENV_POLLUTION",
    ],
  },
  {
    slug: "environment-disasters",
    name_en: "Disasters",
    name_ja: "自然災害",
    parent_slug: "environment",
    gdelt_themes: [
      "NATURAL_DISASTER",
      "ENV_FLOODING",
      "ENV_EARTHQUAKE",
      "ENV_HURRICANE",
    ],
  },

  // ── Health 小分類 ─────────────────────────────
  {
    slug: "health-public",
    name_en: "Public Health",
    name_ja: "公衆衛生",
    parent_slug: "health",
    gdelt_themes: [
      "HEALTH",
      "TAX_DISEASE",
      "MED_PUBLICHEALTH",
      "CRISISLEX_C07_DISEASE_SICK",
    ],
  },
  {
    slug: "health-pharma",
    name_en: "Pharma",
    name_ja: "製薬",
    parent_slug: "health",
    gdelt_themes: [
      "MED_PHARMA",
      "TAX_DISEASE_VACCINE",
      "HEALTH_DRUG",
      "HEALTH_VACCINATION",
    ],
  },

  // ── Security 小分類 ───────────────────────────
  {
    slug: "security-military",
    name_en: "Military",
    name_ja: "軍事",
    parent_slug: "security",
    gdelt_themes: ["MILITARY", "WAR", "LEADER_MILITARY", "WB_ARMS_AND_AMMUNIT"],
  },
  {
    slug: "security-terrorism",
    name_en: "Terrorism",
    name_ja: "テロ",
    parent_slug: "security",
    gdelt_themes: ["TERROR", "CRISISLEX_CRISISLEXREC", "EXTREMISM"],
  },
  {
    slug: "security-crime",
    name_en: "Crime",
    name_ja: "犯罪",
    parent_slug: "security",
    gdelt_themes: ["CRIME", "CRISISLEX_C02_CRIME_VIOLENCE", "CORRUPTION"],
  },

  // ── Society 小分類 ────────────────────────────
  {
    slug: "society-education",
    name_en: "Education",
    name_ja: "教育",
    parent_slug: "society",
    gdelt_themes: ["SOC_EDUCATION", "WB_715_EDUCATION"],
  },
  {
    slug: "society-human-rights",
    name_en: "Human Rights",
    name_ja: "人権",
    parent_slug: "society",
    gdelt_themes: [
      "HUMAN_RIGHTS",
      "HUMAN_RIGHTS_ABUSES",
      "DISCRIMINATION",
      "SOC_INEQUALITY",
    ],
  },
  {
    slug: "society-migration",
    name_en: "Migration",
    name_ja: "移民・難民",
    parent_slug: "society",
    gdelt_themes: ["MIGRATION", "REFUGEES", "SOC_IMMIGRATION"],
  },

  // ── Energy 小分類 ─────────────────────────────
  {
    slug: "energy-oil-gas",
    name_en: "Oil/Gas",
    name_ja: "石油・ガス",
    parent_slug: "energy",
    gdelt_themes: [
      "ENV_OIL",
      "ECON_OIL_PRICE",
      "ENV_NATURALGAS",
      "ENV_FOSSIL_FUELS",
    ],
  },
  {
    slug: "energy-renewables",
    name_en: "Renewables",
    name_ja: "再生可能エネルギー",
    parent_slug: "energy",
    gdelt_themes: [
      "ENV_RENEWABLES",
      "ENV_WIND_POWER",
      "ENV_SOLAR_POWER",
      "ENV_GREEN_ENERGY",
    ],
  },
];

// ──────────────────────────────────────────────
// Insert / upsert
// ──────────────────────────────────────────────

async function seed() {
  console.log(`Seeding ${sectors.length} sectors…`);

  // Parents first, then children (FK constraint on parent_slug)
  const parents = sectors.filter((s) => s.parent_slug === null);
  const children = sectors.filter((s) => s.parent_slug !== null);

  const { error: parentError } = await supabase
    .from("sectors")
    .upsert(parents, { onConflict: "slug" });

  if (parentError) {
    console.error("❌  Failed to insert parent sectors:", parentError.message);
    process.exit(1);
  }
  console.log(`  ✓ ${parents.length} parent sectors inserted`);

  const { error: childError } = await supabase
    .from("sectors")
    .upsert(children, { onConflict: "slug" });

  if (childError) {
    console.error("❌  Failed to insert child sectors:", childError.message);
    process.exit(1);
  }
  console.log(`  ✓ ${children.length} child sectors inserted`);

  // Verify
  const { count, error: countError } = await supabase
    .from("sectors")
    .select("*", { count: "exact", head: true });

  if (countError) {
    console.error("❌  Count query failed:", countError.message);
    process.exit(1);
  }

  console.log(`\n✅  sectors table now has ${count} rows (expected 29)`);
  if (count !== 29) {
    console.warn("⚠️  Row count mismatch — check for duplicates or missing rows");
  }
}

seed().catch((err: unknown) => {
  console.error("❌  Unexpected error:", err);
  process.exit(1);
});
