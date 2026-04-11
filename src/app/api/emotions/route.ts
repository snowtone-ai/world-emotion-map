import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { CountryEmotionRaw, Emotion } from "@/lib/emotions";

const EMOTIONS: Emotion[] = [
  "joy", "trust", "fear", "anger", "sadness", "surprise", "optimism", "uncertainty",
];

/**
 * GET /api/emotions
 * Client-side fallback: fetches emotion data directly via Supabase REST
 * (bypasses Server Component cookie-based client).
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("[/api/emotions] Missing SUPABASE_URL or anon key");
    return NextResponse.json(
      { error: "Missing Supabase config", envKeys: { url: !!url, key: !!key } },
      { status: 500 }
    );
  }

  try {
    // Use plain supabase-js client (no cookie dependency)
    const supabase = createClient(url, key, {
      auth: { persistSession: false },
    });

    // Try with sector_slug IS NULL first
    let { data, error } = await supabase
      .from("emotion_snapshots")
      .select(
        "country_code, joy, trust, fear, anger, sadness, surprise, optimism, uncertainty, timestamp"
      )
      .is("sector_slug", null)
      .not("country_code", "is", null)
      .order("timestamp", { ascending: false })
      .limit(1000);

    // Fallback: without sector_slug filter
    if (!error && (!data || data.length === 0)) {
      console.warn("[/api/emotions] No rows with sector_slug IS NULL, trying without filter");
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

    if (error) {
      console.error("[/api/emotions] Supabase error:", error.message, error.code);
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 502 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { data: [], message: "No emotion data found in database" },
        { status: 200 }
      );
    }

    // Deduplicate: keep latest snapshot per country
    const seen = new Set<string>();
    const result: CountryEmotionRaw[] = [];

    for (const row of data) {
      const code = row.country_code as string | null;
      if (!code || seen.has(code)) continue;
      seen.add(code);

      const scores = {} as Record<Emotion, number>;
      for (const emotion of EMOTIONS) {
        scores[emotion] = (row[emotion] as number | null) ?? 0;
      }
      result.push({ countryCode: code, scores });
    }

    return NextResponse.json(
      { data: result, count: result.length },
      {
        status: 200,
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
      }
    );
  } catch (err) {
    console.error("[/api/emotions] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
