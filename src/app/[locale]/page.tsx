import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { MapSection } from "@/components/map/MapSection";
import type { CountryEmotionRaw, Emotion } from "@/lib/emotions";

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

    // First try: sector_slug IS NULL (seed data format)
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
      console.error("[getEmotionData] Supabase query error:", error.message, error.code, error.details);
    }

    // Fallback: if sector_slug IS NULL returned nothing, try without the filter
    if (!error && (!data || data.length === 0)) {
      console.warn("[getEmotionData] No rows with sector_slug IS NULL, trying without filter");
      const fallback = await supabase
        .from("emotion_snapshots")
        .select(
          "country_code, joy, trust, fear, anger, sadness, surprise, optimism, uncertainty, timestamp"
        )
        .not("country_code", "is", null)
        .order("timestamp", { ascending: false })
        .limit(1000);

      if (fallback.error) {
        console.error("[getEmotionData] Fallback query error:", fallback.error.message);
      }
      data = fallback.data;
      error = fallback.error;
    }

    if (error || !data || data.length === 0) {
      console.warn("[getEmotionData] No data returned. data length:", data?.length ?? 0);
      return [];
    }

    console.info(`[getEmotionData] Fetched ${data.length} rows`);

    // Deduplicate: keep latest snapshot per country
    const seen = new Set<string>();
    const result: CountryEmotionRaw[] = [];

    for (const row of data) {
      if (!row.country_code || seen.has(row.country_code)) continue;
      seen.add(row.country_code);

      const scores = {} as Record<Emotion, number>;
      for (const emotion of EMOTIONS) {
        scores[emotion] = (row[emotion] as number | null) ?? 0;
      }

      result.push({ countryCode: row.country_code, scores });
    }

    console.info(`[getEmotionData] Deduplicated to ${result.length} countries`);
    return result;
  } catch (err) {
    console.error("[getEmotionData] Unexpected error:", err);
    return [];
  }
}

// ── Page ───────────────────────────────────────────────────────────────────
export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const emotionData = await getEmotionData();

  return (
    <Suspense>
      <MapSection data={emotionData} userId={user?.id ?? null} />
    </Suspense>
  );
}
