"use client";

import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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

export function MapSection({ data: serverData, userId }: { data: CountryEmotionRaw[]; userId: string | null }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Client-side fallback: if server provided no data, fetch from API route
  const [clientData, setClientData] = useState<CountryEmotionRaw[] | null>(null);

  useEffect(() => {
    if (serverData.length > 0) return; // Server data is fine, no fallback needed

    let cancelled = false;
    fetch("/api/emotions")
      .then((res) => res.json())
      .then((json: { data?: CountryEmotionRaw[] }) => {
        if (!cancelled && json.data && json.data.length > 0) {
          setClientData(json.data);
        }
      })
      .catch((err) => console.error("[MapSection] Fallback fetch failed:", err));

    return () => { cancelled = true; };
  }, [serverData]);

  const data = useMemo(
    () => (serverData.length > 0 ? serverData : (clientData ?? [])),
    [serverData, clientData]
  );

  // Derive colorMode directly from URL — no useState needed.
  // URL is the single source of truth; router.replace triggers re-render automatically.
  const colorMode = parseMode(searchParams?.get("mode"));

  const colorMap = useMemo(
    () => computeColorMap(data, colorMode),
    [data, colorMode]
  );

  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  // ── Debug overlay (enabled via ?debug=1) ─────────────────────────────────
  const debugMode = searchParams?.get("debug") === "1";
  const [probeInfo, setProbeInfo] = useState<{
    featureCount: number;
    sampleProperties: Record<string, unknown> | null;
    matchedCodes: string[];
    unmatchedCodes: string[];
  } | null>(null);

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
          onDebugProbe={debugMode ? setProbeInfo : undefined}
        />
        {debugMode && (
          <div className="absolute top-2 left-2 z-30 max-w-[420px] max-h-[80vh] overflow-auto rounded bg-black/85 text-white text-[11px] font-mono p-3 leading-snug">
            <div className="font-bold mb-1">WEM Debug (?debug=1)</div>
            <div>serverData: {serverData.length}</div>
            <div>clientData: {clientData?.length ?? "null"}</div>
            <div>data (used): {data.length}</div>
            <div>colorMode: {colorMode}</div>
            <div>colorMap entries: {Object.keys(colorMap).length}</div>
            <div className="mt-1 opacity-80">
              first 8 colorMap:{" "}
              {Object.entries(colorMap)
                .slice(0, 8)
                .map(([k, v]) => `${k}=${v}`)
                .join(", ") || "(empty)"}
            </div>
            <hr className="my-2 border-white/20" />
            {probeInfo ? (
              <>
                <div>rendered features: {probeInfo.featureCount}</div>
                <div>matched: {probeInfo.matchedCodes.length}</div>
                <div>unmatched: {probeInfo.unmatchedCodes.length}</div>
                <div className="mt-1 opacity-80">
                  unmatched sample: {probeInfo.unmatchedCodes.slice(0, 10).join(", ") || "(none)"}
                </div>
                <div className="mt-1 opacity-80 break-all">
                  sample feature props:{" "}
                  {probeInfo.sampleProperties
                    ? JSON.stringify(probeInfo.sampleProperties)
                    : "(null)"}
                </div>
              </>
            ) : (
              <div className="opacity-60">waiting for Mapbox probe…</div>
            )}
          </div>
        )}
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
