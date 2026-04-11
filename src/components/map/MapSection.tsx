"use client";

import dynamic from "next/dynamic";
import type { CountryEmotion } from "./WorldMap";
import { EmotionLegend } from "./EmotionLegend";

const WorldMap = dynamic(() => import("./WorldMap"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <span className="text-xs text-[var(--wem-text-muted)] animate-pulse">
        Loading map…
      </span>
    </div>
  ),
});

export function MapSection({ data }: { data: CountryEmotion[] }) {
  return (
    <div className="relative flex-1 flex flex-col">
      <WorldMap data={data} />
      <EmotionLegend />
    </div>
  );
}
