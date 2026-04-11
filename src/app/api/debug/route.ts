import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Same query as getEmotionData() in page.tsx
    const { data, error } = await supabase
      .from("emotion_snapshots")
      .select("country_code, joy, sector_slug, timestamp")
      .is("sector_slug", null)
      .not("country_code", "is", null)
      .order("timestamp", { ascending: false })
      .limit(5);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code });
    }

    return NextResponse.json({
      ok: true,
      rowCount: data?.length ?? 0,
      sample: data?.slice(0, 3) ?? [],
      env: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "MISSING",
        publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? "set" : "MISSING",
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, exception: String(e) });
  }
}
