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
    const { data, error } = await supabase
      .from("emotion_snapshots")
      .select(
        "country_code, joy, trust, fear, anger, sadness, surprise, optimism, uncertainty, timestamp"
      )
      .is("sector_slug", null)
      .not("country_code", "is", null)
      .order("timestamp", { ascending: false })
      .limit(1000);

    if (error || !data || data.length === 0) return [];

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

    return result;
  } catch {
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

  const emotionData = await getEmotionData();

  return (
    <Suspense>
      <MapSection data={emotionData} />
    </Suspense>
  );
}
