import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { MapSection } from "@/components/map/MapSection";
import type { CountryEmotion, Emotion } from "@/components/map/WorldMap";

// ── Emotion keys ───────────────────────────────────────────────────────────
const EMOTIONS = [
  "joy",
  "trust",
  "fear",
  "anger",
  "sadness",
  "surprise",
  "optimism",
  "uncertainty",
] as const;

// ── Fetch latest emotion snapshot per country ──────────────────────────────
async function getEmotionData(): Promise<CountryEmotion[]> {
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
    const result: CountryEmotion[] = [];

    for (const row of data) {
      if (!row.country_code || seen.has(row.country_code)) continue;
      seen.add(row.country_code);

      let dominant: Emotion = EMOTIONS[0];
      let maxScore = -1;
      for (const emotion of EMOTIONS) {
        const score = (row[emotion] as number | null) ?? 0;
        if (score > maxScore) {
          maxScore = score;
          dominant = emotion;
        }
      }

      result.push({ countryCode: row.country_code, dominant });
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

  return <MapSection data={emotionData} />;
}
