import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { MapSection } from "@/components/map/MapSection";
import { SectorSection } from "@/components/map/SectorSection";
import type { CountryEmotionRaw, Emotion } from "@/lib/emotions";
import type { SectorDataItem } from "@/app/api/sectors/route";
import { normalizeCountryCode } from "@/lib/fips-to-iso";

// ── Emotion keys ───────────────────────────────────────────────────────────
const EMOTIONS: Emotion[] = [
  "joy",
  "trust",
  "fear",
  "anger",
  "sadness",
  "surprise",
  "optimism",
  "uncertainty",
];

// ── Fetch latest emotion snapshot per country ──────────────────────────────
async function getEmotionData(): Promise<CountryEmotionRaw[]> {
  try {
    const supabase = await createClient();

    let { data, error } = await supabase
      .from("emotion_snapshots")
      .select(
        "country_code, joy, trust, fear, anger, sadness, surprise, optimism, uncertainty, timestamp"
      )
      .is("sector_slug", null)
      .not("country_code", "is", null)
      .order("timestamp", { ascending: false })
      .limit(1000);

    if (error) {
      console.error("[getEmotionData] Supabase query error:", error.message);
    }

    if (!error && (!data || data.length === 0)) {
      const fallback = await supabase
        .from("emotion_snapshots")
        .select(
          "country_code, joy, trust, fear, anger, sadness, surprise, optimism, uncertainty, timestamp"
        )
        .not("country_code", "is", null)
        .order("timestamp", { ascending: false })
        .limit(1000);

      data = fallback.data;
      error = fallback.error;
    }

    if (error || !data || data.length === 0) return [];

    const seen = new Set<string>();
    const result: CountryEmotionRaw[] = [];

    for (const row of data) {
      if (!row.country_code) continue;
      const isoCode = normalizeCountryCode(row.country_code);
      if (seen.has(isoCode)) continue;
      seen.add(isoCode);

      const scores = {} as Record<Emotion, number>;
      for (const emotion of EMOTIONS) {
        scores[emotion] = (row[emotion] as number | null) ?? 0;
      }
      result.push({ countryCode: isoCode, scores });
    }

    return result;
  } catch (err) {
    console.error("[getEmotionData] Unexpected error:", err);
    return [];
  }
}

// ── Fetch sector emotion data ──────────────────────────────────────────────
async function getSectorData(): Promise<SectorDataItem[]> {
  try {
    const supabase = await createClient();

    const { data: defs, error: defErr } = await supabase
      .from("sectors")
      .select("slug, name_en, name_ja, parent_slug")
      .order("slug");

    if (defErr || !defs || defs.length === 0) return [];

    const { data: snaps, error: snapErr } = await supabase
      .from("emotion_snapshots")
      .select(
        "sector_slug, joy, trust, fear, anger, sadness, surprise, optimism, uncertainty, article_count, timestamp",
      )
      .is("country_code", null)
      .not("sector_slug", "is", null)
      .order("timestamp", { ascending: false })
      .limit(500);

    if (snapErr) return defs.map((d) => ({
      slug: d.slug as string,
      nameEn: d.name_en as string,
      nameJa: d.name_ja as string,
      parentSlug: d.parent_slug as string | null,
      scores: null,
      articleCount: 0,
      timestamp: null,
    }));

    const latestBySlug = new Map<string, typeof snaps[0]>();
    for (const snap of snaps ?? []) {
      const slug = snap.sector_slug as string;
      if (slug && !latestBySlug.has(slug)) latestBySlug.set(slug, snap);
    }

    return defs.map((def) => {
      const snap = latestBySlug.get(def.slug as string);
      return {
        slug: def.slug as string,
        nameEn: def.name_en as string,
        nameJa: def.name_ja as string,
        parentSlug: def.parent_slug as string | null,
        scores: snap
          ? {
              joy: snap.joy as number,
              trust: snap.trust as number,
              fear: snap.fear as number,
              anger: snap.anger as number,
              sadness: snap.sadness as number,
              surprise: snap.surprise as number,
              optimism: snap.optimism as number,
              uncertainty: snap.uncertainty as number,
            }
          : null,
        articleCount: (snap?.article_count as number) ?? 0,
        timestamp: (snap?.timestamp as string) ?? null,
      };
    });
  } catch (err) {
    console.error("[getSectorData] Unexpected error:", err);
    return [];
  }
}

// ── Page ───────────────────────────────────────────────────────────────────
export default async function Home({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const [{ locale }, { view }] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (view === "sector") {
    const sectorData = await getSectorData();
    return (
      <Suspense>
        <SectorSection sectorData={sectorData} locale={locale} />
      </Suspense>
    );
  }

  const emotionData = await getEmotionData();
  return (
    <Suspense>
      <MapSection data={emotionData} userId={user?.id ?? null} />
    </Suspense>
  );
}
