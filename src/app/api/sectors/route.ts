import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { Emotion } from "@/lib/emotions";

export const revalidate = 300; // 5 min cache

type SectorDef = {
  slug: string;
  name_en: string;
  name_ja: string;
  parent_slug: string | null;
};

type SnapshotRow = {
  sector_slug: string;
  joy: number;
  trust: number;
  fear: number;
  anger: number;
  sadness: number;
  surprise: number;
  optimism: number;
  uncertainty: number;
  article_count: number;
  timestamp: string;
};

export type SectorDataItem = {
  slug: string;
  nameEn: string;
  nameJa: string;
  parentSlug: string | null;
  scores: Record<Emotion, number> | null;
  articleCount: number;
  timestamp: string | null;
};

export async function GET() {
  const supabase = await createClient();

  const { data: defs, error: defErr } = await supabase
    .from("sectors")
    .select("slug, name_en, name_ja, parent_slug")
    .order("slug");

  if (defErr) {
    return NextResponse.json({ error: defErr.message }, { status: 500 });
  }

  if (!defs || defs.length === 0) {
    return NextResponse.json({ data: [] });
  }

  // Fetch latest global (country_code IS NULL) snapshot per sector
  const { data: snaps, error: snapErr } = await supabase
    .from("emotion_snapshots")
    .select(
      "sector_slug, joy, trust, fear, anger, sadness, surprise, optimism, uncertainty, article_count, timestamp",
    )
    .is("country_code", null)
    .not("sector_slug", "is", null)
    .order("timestamp", { ascending: false })
    .limit(500);

  if (snapErr) {
    return NextResponse.json({ error: snapErr.message }, { status: 500 });
  }

  // Keep only the latest snapshot per sector slug
  const latestBySlug = new Map<string, SnapshotRow>();
  for (const snap of (snaps ?? []) as SnapshotRow[]) {
    if (snap.sector_slug && !latestBySlug.has(snap.sector_slug)) {
      latestBySlug.set(snap.sector_slug, snap);
    }
  }

  const data: SectorDataItem[] = (defs as SectorDef[]).map((def) => {
    const snap = latestBySlug.get(def.slug);
    return {
      slug: def.slug,
      nameEn: def.name_en,
      nameJa: def.name_ja,
      parentSlug: def.parent_slug,
      scores: snap
        ? {
            joy: snap.joy,
            trust: snap.trust,
            fear: snap.fear,
            anger: snap.anger,
            sadness: snap.sadness,
            surprise: snap.surprise,
            optimism: snap.optimism,
            uncertainty: snap.uncertainty,
          }
        : null,
      articleCount: snap?.article_count ?? 0,
      timestamp: snap?.timestamp ?? null,
    };
  });

  return NextResponse.json({ data });
}
