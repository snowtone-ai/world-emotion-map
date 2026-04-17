"use client";

import { useMemo, useState } from "react";
import { computeSectorDominants } from "@/lib/emotions";
import type { Emotion, SectorDominant } from "@/lib/emotions";
import type { SectorDataItem } from "@/app/api/sectors/route";
import { SectorDetailPanel } from "./SectorDetailPanel";

// ── Sector icons ────────────────────────────────────────────────────────────
const SECTOR_ICONS: Record<string, string> = {
  economy: "📈",
  politics: "🏛️",
  technology: "💻",
  environment: "🌿",
  health: "🏥",
  security: "🛡️",
  society: "👥",
  energy: "⚡",
};

// ── SectorCard ──────────────────────────────────────────────────────────────
function SectorCard({
  sector,
  dominant,
  selected,
  locale,
  onClick,
}: {
  sector: SectorDataItem;
  dominant: SectorDominant | null;
  selected: boolean;
  locale: string;
  onClick: () => void;
}) {
  const name = locale === "ja" ? sector.nameJa : sector.nameEn;
  const icon = SECTOR_ICONS[sector.slug] ?? "📊";

  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={[
        "relative p-4 rounded-xl text-left transition-all duration-200",
        "glass border border-[var(--wem-glass-border)] hover:border-[var(--wem-accent)]",
        selected ? "border-[var(--wem-accent)] ring-1 ring-[var(--wem-accent)]/40" : "",
      ].join(" ")}
    >
      {/* Dominant emotion glow indicator */}
      {dominant && (
        <span
          className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full"
          style={{
            backgroundColor: dominant.color,
            boxShadow: `0 0 8px ${dominant.color}88`,
          }}
          title={dominant.key}
        />
      )}

      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-sm font-semibold text-[var(--wem-text)] leading-tight">{name}</div>

      {dominant ? (
        <div className="mt-1.5 flex items-center gap-1.5">
          <span
            className="text-[10px] capitalize font-mono"
            style={{ color: dominant.color }}
          >
            {dominant.key}
          </span>
          <span className="text-[10px] text-[var(--wem-text-muted)]">
            {Math.round((sector.scores![dominant.key as Emotion] ?? 0) * 100)}
          </span>
        </div>
      ) : (
        <div className="mt-1.5 text-[10px] text-[var(--wem-text-muted)]">No data yet</div>
      )}

      {sector.articleCount > 0 && (
        <div className="mt-1 text-[9px] text-[var(--wem-text-muted)]">
          {sector.articleCount.toLocaleString()} articles
        </div>
      )}
    </button>
  );
}

// ── SectorSection ───────────────────────────────────────────────────────────
type Props = {
  sectorData: SectorDataItem[];
  locale: string;
};

export function SectorSection({ sectorData, locale }: Props) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  // Compute cross-sector dominants (share × lift) once for all sectors
  const dominantsMap = useMemo(() => {
    const results = computeSectorDominants(sectorData.map((s) => s.scores));
    const map = new Map<string, SectorDominant>();
    results.forEach((r, i) => {
      if (r) map.set(sectorData[i]!.slug, r);
    });
    return map;
  }, [sectorData]);

  // Only show parent sectors in the grid
  const parents = sectorData.filter((s) => s.parentSlug === null);
  const hasAnyData = parents.some((s) => s.scores !== null);

  function handleSelect(slug: string) {
    setSelectedSlug((prev) => (prev === slug ? null : slug));
  }

  return (
    <div className="relative flex-1 flex flex-row">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {parents.length === 0 ? (
          // sectors table is empty — seed not yet run
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <span className="text-3xl">📊</span>
            <p className="text-sm font-medium text-[var(--wem-text)]">Sector data not yet configured</p>
            <p className="text-xs text-[var(--wem-text-muted)] max-w-xs">
              Run <code className="font-mono bg-[var(--wem-surface-raised)] px-1 rounded">supabase/seed_sectors.sql</code> in the Supabase SQL editor to enable sector-level tracking.
            </p>
          </div>
        ) : !hasAnyData ? (
          // sectors are defined but pipeline hasn't produced data yet
          <div className="flex flex-col gap-4">
            <p className="text-xs text-[var(--wem-text-muted)] text-center">
              Sector data will appear after the next hourly pipeline run
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto w-full">
              {parents.map((sector) => (
                <SectorCard
                  key={sector.slug}
                  sector={sector}
                  dominant={dominantsMap.get(sector.slug) ?? null}
                  selected={selectedSlug === sector.slug}
                  locale={locale}
                  onClick={() => handleSelect(sector.slug)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto w-full">
            {parents.map((sector) => (
              <SectorCard
                key={sector.slug}
                sector={sector}
                dominant={dominantsMap.get(sector.slug) ?? null}
                selected={selectedSlug === sector.slug}
                locale={locale}
                onClick={() => handleSelect(sector.slug)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mobile backdrop */}
      {selectedSlug && (
        <div
          className="fixed inset-0 z-20 sm:hidden"
          onClick={() => setSelectedSlug(null)}
          aria-hidden="true"
        />
      )}

      {selectedSlug && (
        <SectorDetailPanel
          key={selectedSlug}
          sectorSlug={selectedSlug}
          allData={sectorData}
          dominantsMap={dominantsMap}
          locale={locale}
          onClose={() => setSelectedSlug(null)}
        />
      )}
    </div>
  );
}
