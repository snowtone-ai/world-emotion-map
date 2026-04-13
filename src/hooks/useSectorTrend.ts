"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TrendSnapshot } from "@/hooks/useTrend";

type UseSectorTrendResult = {
  snapshots: TrendSnapshot[];
  loading: boolean;
};

export function useSectorTrend(sectorSlug: string | null): UseSectorTrendResult {
  const [result, setResult] = useState<{ slug: string; snapshots: TrendSnapshot[] } | null>(null);

  useEffect(() => {
    if (!sectorSlug) return;
    let cancelled = false;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const supabase = createClient();

    supabase
      .from("emotion_snapshots")
      .select(
        "timestamp, joy, trust, fear, anger, sadness, surprise, optimism, uncertainty",
      )
      .eq("sector_slug", sectorSlug)
      .is("country_code", null)
      .gte("timestamp", since)
      .order("timestamp", { ascending: true })
      .limit(48)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setResult({ slug: sectorSlug, snapshots: [] });
          return;
        }
        setResult({
          slug: sectorSlug,
          snapshots: data.map((row) => ({
            timestamp: row.timestamp as string,
            joy: (row.joy as number) ?? 0,
            trust: (row.trust as number) ?? 0,
            fear: (row.fear as number) ?? 0,
            anger: (row.anger as number) ?? 0,
            sadness: (row.sadness as number) ?? 0,
            surprise: (row.surprise as number) ?? 0,
            optimism: (row.optimism as number) ?? 0,
            uncertainty: (row.uncertainty as number) ?? 0,
            sample_urls: [],
          })),
        });
      });

    return () => { cancelled = true; };
  }, [sectorSlug]);

  const loading = result?.slug !== sectorSlug;
  return {
    snapshots: loading ? [] : (result?.snapshots ?? []),
    loading,
  };
}
