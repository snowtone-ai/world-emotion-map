"use client";

import { useEffect, useState } from "react";
import type { Emotion, SectorDominant } from "@/lib/emotions";
import type { SectorDataItem } from "@/app/api/sectors/route";
import { useSectorTrend } from "@/hooks/useSectorTrend";
import { EmotionBarChart } from "./EmotionBarChart";
import { TrendSparkline } from "./TrendSparkline";

type Props = {
  sectorSlug: string;
  allData: SectorDataItem[];
  dominantsMap: Map<string, SectorDominant>;
  locale: string;
  onClose: () => void;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--wem-text-muted)] mb-2">
      {children}
    </p>
  );
}

// ── Sub-sector drill-down view ─────────────────────────────────────────────
function ChildSectorView({
  child,
  parentName,
  locale,
  onBack,
}: {
  child: SectorDataItem;
  parentName: string;
  locale: string;
  onBack: () => void;
}) {
  const { snapshots, loading } = useSectorTrend(child.slug);
  const name = locale === "ja" ? child.nameJa : child.nameEn;

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[11px] text-[var(--wem-text-muted)]
                   hover:text-[var(--wem-text)] transition-colors w-fit"
      >
        <span>←</span>
        <span className="font-mono uppercase tracking-wide">{parentName}</span>
      </button>

      {/* Child name */}
      <div>
        <span className="text-[10px] font-mono tracking-widest uppercase text-[var(--wem-text-muted)]">
          {child.slug}
        </span>
        <h3 className="text-base font-bold text-[var(--wem-text)] leading-tight">{name}</h3>
        {child.timestamp && (
          <p className="text-[10px] text-[var(--wem-text-muted)] mt-0.5">
            {new Date(child.timestamp).toLocaleString(locale === "ja" ? "ja-JP" : "en-US", {
              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
            })}
          </p>
        )}
      </div>

      {/* Emotion scores */}
      <section>
        <SectionLabel>Current Emotions</SectionLabel>
        {child.scores ? (
          <EmotionBarChart scores={child.scores as Record<Emotion, number>} />
        ) : (
          <p className="text-xs text-[var(--wem-text-muted)]">
            No data yet — will appear after next pipeline run
          </p>
        )}
      </section>

      {/* 24h Trend */}
      <section>
        <SectionLabel>24h Trend</SectionLabel>
        {loading ? (
          <div className="h-14 rounded bg-[var(--wem-surface-raised)] animate-pulse" />
        ) : (
          <TrendSparkline snapshots={snapshots} />
        )}
      </section>
    </div>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────
export function SectorDetailPanel({ sectorSlug, allData, dominantsMap, locale, onClose }: Props) {
  const [selectedChildSlug, setSelectedChildSlug] = useState<string | null>(null);

  const sector = allData.find((s) => s.slug === sectorSlug);
  const children = allData.filter((s) => s.parentSlug === sectorSlug);
  const selectedChild = children.find((c) => c.slug === selectedChildSlug) ?? null;

  const { snapshots, loading: trendLoading } = useSectorTrend(sectorSlug);

  const name = locale === "ja" ? sector?.nameJa : sector?.nameEn;

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (selectedChildSlug) setSelectedChildSlug(null);
        else onClose();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, selectedChildSlug]);

  if (!sector) return null;

  return (
    <aside
      role="complementary"
      aria-label={`Emotion details for ${name}`}
      className="
        animate-slide-in-up
        fixed inset-x-0 bottom-0 z-30 max-h-[65vh] rounded-t-2xl
        sm:animate-slide-in-right
        sm:static sm:inset-auto sm:rounded-none sm:z-20
        sm:w-[360px] lg:sm:w-[400px] sm:h-full sm:max-h-none sm:flex-shrink-0
        glass
        border-t sm:border-t-0 sm:border-l border-[var(--wem-glass-border)]
        flex flex-col overflow-y-auto
      "
    >
      {/* Drag handle — mobile only */}
      <div className="flex justify-center pt-3 pb-1 flex-shrink-0 sm:hidden">
        <div className="w-10 h-1 rounded-full bg-white/20" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-3 sm:pt-5 pb-3 flex-shrink-0">
        <div>
          <span className="text-[10px] font-mono tracking-widest uppercase text-[var(--wem-text-muted)]">
            {sector.slug}
          </span>
          <h2 className="text-lg font-bold text-[var(--wem-text)] leading-tight">
            {name}
          </h2>
          {sector.timestamp && !selectedChild && (
            <p className="text-[10px] text-[var(--wem-text-muted)] mt-0.5">
              {new Date(sector.timestamp).toLocaleString(locale === "ja" ? "ja-JP" : "en-US", {
                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close panel"
          className="mt-1 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
                     text-[var(--wem-text-muted)] hover:text-[var(--wem-text)]
                     hover:bg-white/10 transition-colors text-sm"
        >
          ✕
        </button>
      </div>

      <div className="px-5 flex flex-col gap-6 pb-8">
        {selectedChild ? (
          // ── Drill-down: child sector view ──
          <ChildSectorView
            child={selectedChild}
            parentName={(locale === "ja" ? sector.nameJa : sector.nameEn)}
            locale={locale}
            onBack={() => setSelectedChildSlug(null)}
          />
        ) : (
          // ── Parent sector view ──
          <>
            {/* Emotion Scores */}
            <section>
              <SectionLabel>Current Emotions</SectionLabel>
              {sector.scores ? (
                <EmotionBarChart scores={sector.scores as Record<Emotion, number>} />
              ) : (
                <p className="text-xs text-[var(--wem-text-muted)]">
                  No data yet — will appear after next pipeline run
                </p>
              )}
            </section>

            {/* 24h Trend */}
            <section>
              <SectionLabel>24h Trend</SectionLabel>
              {trendLoading ? (
                <div className="h-14 rounded bg-[var(--wem-surface-raised)] animate-pulse" />
              ) : (
                <TrendSparkline snapshots={snapshots} />
              )}
            </section>

            {/* Sub-sectors — clickable */}
            {children.length > 0 && (
              <section>
                <SectionLabel>Sub-sectors</SectionLabel>
                <ul className="flex flex-col gap-1.5">
                  {children.map((child) => {
                    const childName = locale === "ja" ? child.nameJa : child.nameEn;
                    const dominant = dominantsMap.get(child.slug) ?? null;
                    return (
                      <li key={child.slug}>
                        <button
                          onClick={() => setSelectedChildSlug(child.slug)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg
                                     hover:bg-white/8 transition-colors text-left group"
                        >
                          <span className="text-xs text-[var(--wem-text-secondary)] group-hover:text-[var(--wem-text)] transition-colors">
                            {childName}
                          </span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {dominant && child.scores && (
                              <>
                                <span
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: dominant.color }}
                                />
                                <span className="text-[10px] font-mono text-[var(--wem-text-muted)] capitalize">
                                  {dominant.key} {Math.round((child.scores[dominant.key as Emotion] ?? 0) * 100)}
                                </span>
                              </>
                            )}
                            {!child.scores && (
                              <span className="text-[10px] text-[var(--wem-text-muted)]">—</span>
                            )}
                            <span className="text-[10px] text-[var(--wem-text-muted)] group-hover:text-[var(--wem-text-secondary)] transition-colors">›</span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
