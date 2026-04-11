"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export type TrendSnapshot = {
  timestamp: string;
  joy: number;
  trust: number;
  fear: number;
  anger: number;
  sadness: number;
  surprise: number;
  optimism: number;
  uncertainty: number;
  sample_urls: string[];
};

type FetchResult = {
  countryCode: string;
  snapshots: TrendSnapshot[];
  error: string | null;
};

type UseTrendResult = {
  snapshots: TrendSnapshot[];
  loading: boolean;
  error: string | null;
};

export function useTrend(countryCode: string): UseTrendResult {
  const [result, setResult] = useState<FetchResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const supabase = createClient();

    supabase
      .from("emotion_snapshots")
      .select(
        "timestamp, joy, trust, fear, anger, sadness, surprise, optimism, uncertainty, sample_urls"
      )
      .eq("country_code", countryCode)
      .is("sector_slug", null)
      .gte("timestamp", since)
      .order("timestamp", { ascending: true })
      .limit(48)
      .then(({ data, error: err }) => {
        if (cancelled) return;
        const snapshots: TrendSnapshot[] = (data ?? []).map((row) => ({
          timestamp: row.timestamp as string,
          joy: (row.joy as number) ?? 0,
          trust: (row.trust as number) ?? 0,
          fear: (row.fear as number) ?? 0,
          anger: (row.anger as number) ?? 0,
          sadness: (row.sadness as number) ?? 0,
          surprise: (row.surprise as number) ?? 0,
          optimism: (row.optimism as number) ?? 0,
          uncertainty: (row.uncertainty as number) ?? 0,
          sample_urls: Array.isArray(row.sample_urls)
            ? (row.sample_urls as string[])
            : [],
        }));
        setResult({
          countryCode,
          snapshots: err ? [] : snapshots,
          error: err?.message ?? null,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [countryCode]);

  // loading = fetch not yet returned for the current countryCode
  const loading = result?.countryCode !== countryCode;

  return {
    snapshots: loading ? [] : (result?.snapshots ?? []),
    loading,
    error: loading ? null : (result?.error ?? null),
  };
}
