"use client";

import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { computeColorMap } from "@/lib/emotions";
import type { ColorMode, CountryEmotionRaw } from "@/lib/emotions";
import { EmotionLegend } from "./EmotionLegend";
import { CountryDetailPanel } from "./CountryDetailPanel";

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

function parseMode(raw: string | null | undefined): ColorMode {
  if (raw === "2") return 2;
  if (raw === "6") return 6;
  return 4; // default
}

export function MapSection({ data, userId }: { data: CountryEmotionRaw[]; userId: string | null }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Derive colorMode directly from URL — no useState needed.
  // URL is the single source of truth; router.replace triggers re-render automatically.
  const colorMode = parseMode(searchParams?.get("mode"));

  const colorMap = useMemo(
    () => computeColorMap(data, colorMode),
    [data, colorMode]
  );

  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  function handleModeChange(mode: ColorMode) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("mode", String(mode));
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function handleCountrySelect(code: string) {
    // Toggle: clicking the same country again closes the panel
    setSelectedCountry((prev) => (prev === code ? null : code));
  }

  return (
    <div className="relative flex-1 flex flex-row">
      <div className="relative flex-1 flex flex-col">
        <WorldMap
          colorMap={colorMap}
          onCountrySelect={handleCountrySelect}
          selectedCountry={selectedCountry}
        />
        <EmotionLegend colorMode={colorMode} onModeChange={handleModeChange} />
      </div>

      {/* Mobile backdrop — tap outside to close */}
      {selectedCountry && (
        <div
          className="fixed inset-0 z-20 sm:hidden"
          onClick={() => setSelectedCountry(null)}
          aria-hidden="true"
        />
      )}

      {selectedCountry && (
        <CountryDetailPanel
          key={selectedCountry}
          countryCode={selectedCountry}
          allData={data}
          userId={userId}
          onClose={() => setSelectedCountry(null)}
        />
      )}
    </div>
  );
}
