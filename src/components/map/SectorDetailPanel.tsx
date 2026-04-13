"use client";

import { useEffect } from "react";
import type { Emotion } from "@/lib/emotions";
import type { SectorDataItem } from "@/app/api/sectors/route";
import { useSectorTrend } from "@/hooks/useSectorTrend";
import { EmotionBarChart } from "./EmotionBarChart";
import { TrendSparkline } from "./TrendSparkline";

type Props = {
  sectorSlug: string;
  allData: SectorDataItem[];
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

export function SectorDetailPanel({ sectorSlug, allData, locale, onClose }: Props) {
  const sector = allData.find((s) => s.slug === sectorSlug);
  const children = allData.filter((s) => s.parentSlug === sectorSlug && s.scores !== null);
  const { snapshots, loading: trendLoading } = useSectorTrend(sectorSlug);

  const name = locale === "ja" ? sector?.nameJa : sector?.nameEn;

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

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
          {sector.timestamp && (
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

        {/* Sub-sectors */}
        {children.length > 0 && (
          <section>
            <SectionLabel>Sub-sectors</SectionLabel>
            <ul className="flex flex-col gap-2">
              {children.map((child) => {
                const childName = locale === "ja" ? child.nameJa : child.nameEn;
                const dominant = child.scores
                  ? Object.entries(child.scores).sort((a, b) => b[1] - a[1])[0]
                  : null;
                return (
                  <li key={child.slug} className="flex items-center justify-between">
                    <span className="text-xs text-[var(--wem-text-secondary)]">{childName}</span>
                    {dominant && (
                      <span className="text-[10px] font-mono text-[var(--wem-text-muted)] capitalize">
                        {dominant[0]} {Math.round(dominant[1] * 100)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </aside>
  );
}
