"use client";

import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { computeColorMap } from "@/lib/emotions";
import type { ColorMode, CountryEmotionRaw } from "@/lib/emotions";
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

function parseMode(raw: string | null): ColorMode {
  if (raw === "2") return 2;
  if (raw === "6") return 6;
  return 4; // default
}

export function MapSection({ data }: { data: CountryEmotionRaw[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [colorMode, setColorMode] = useState<ColorMode>(() =>
    parseMode(searchParams.get("mode"))
  );

  // Keep state in sync if URL is changed externally (e.g. browser back/forward)
  useEffect(() => {
    setColorMode(parseMode(searchParams.get("mode")));
  }, [searchParams]);

  const colorMap = useMemo(
    () => computeColorMap(data, colorMode),
    [data, colorMode]
  );

  function handleModeChange(mode: ColorMode) {
    setColorMode(mode);
    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", String(mode));
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="relative flex-1 flex flex-col">
      <WorldMap colorMap={colorMap} />
      <EmotionLegend colorMode={colorMode} onModeChange={handleModeChange} />
    </div>
  );
}
