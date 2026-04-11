"use client";

import { useMemo, useEffect, useState } from "react";
import type { CountryEmotionRaw, Emotion } from "@/lib/emotions";
import { useTrend } from "@/hooks/useTrend";
import { useFavorite } from "@/hooks/useFavorite";
import { EmotionBarChart } from "./EmotionBarChart";
import { TrendSparkline } from "./TrendSparkline";
import { createClient } from "@/lib/supabase/client";

type Props = {
  countryCode: string;
  allData: CountryEmotionRaw[];
  userId: string | null;
  onClose: () => void;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--wem-text-muted)] mb-2">
      {children}
    </p>
  );
}

function NewsList({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1.5">
      {urls.slice(0, 5).map((url) => {
        let hostname = url;
        try {
          hostname = new URL(url).hostname.replace(/^www\./, "");
        } catch {
          // keep raw url as label
        }
        return (
          <li key={url}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 group"
            >
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 rounded flex-shrink-0
                           bg-[var(--wem-surface-raised)] text-[var(--wem-text-muted)]
                           group-hover:text-[var(--wem-accent)] transition-colors"
              >
                {hostname}
              </span>
              <span className="text-xs text-[var(--wem-text-secondary)] truncate group-hover:text-[var(--wem-accent)] transition-colors">
                {url}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function FavoriteButton({
  countryCode,
  userId,
}: {
  countryCode: string;
  userId: string | null;
}) {
  const { isFavorite, toggle, loading } = useFavorite(countryCode, userId);
  const [showPrompt, setShowPrompt] = useState(false);

  function handleClick() {
    if (!userId) {
      setShowPrompt((prev) => !prev);
      return;
    }
    toggle();
  }

  function handleSignIn() {
    const supabase = createClient();
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={loading}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        className={`mt-1 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
                   transition-colors text-base
                   ${isFavorite
                     ? "text-amber-400 hover:text-amber-300"
                     : "text-[var(--wem-text-muted)] hover:text-amber-400"
                   }
                   hover:bg-white/10`}
      >
        {isFavorite ? "★" : "☆"}
      </button>

      {showPrompt && (
        <>
          {/* backdrop to close */}
          <div
            className="fixed inset-0 z-20"
            onClick={() => setShowPrompt(false)}
          />
          <div className="absolute right-0 top-9 w-48 glass rounded-lg shadow-xl p-3 z-30 border border-[var(--wem-glass-border)]">
            <p className="text-xs text-[var(--wem-text-secondary)] mb-2.5 leading-snug">
              Sign in to save favorites
            </p>
            <button
              onClick={handleSignIn}
              className="w-full text-xs px-3 py-1.5 rounded-md border border-[var(--wem-border)]
                         text-[var(--wem-text-secondary)] hover:text-[var(--wem-text)]
                         hover:border-[var(--wem-accent)] transition-colors text-center"
            >
              Sign in with Google
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function CountryDetailPanel({ countryCode, allData, userId, onClose }: Props) {
  const countryName = useMemo(() => {
    try {
      return (
        new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode) ??
        countryCode
      );
    } catch {
      return countryCode;
    }
  }, [countryCode]);

  const scores = useMemo(
    () =>
      allData.find((d) => d.countryCode === countryCode)?.scores ?? null,
    [allData, countryCode]
  );

  const { snapshots, loading: trendLoading } = useTrend(countryCode);

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const latestUrls = snapshots.length > 0 ? snapshots[snapshots.length - 1]!.sample_urls : [];

  return (
    <aside
      role="complementary"
      aria-label={`Emotion details for ${countryName}`}
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
            {countryCode}
          </span>
          <h2 className="text-lg font-bold text-[var(--wem-text)] leading-tight">
            {countryName}
          </h2>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <FavoriteButton countryCode={countryCode} userId={userId} />
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
                       text-[var(--wem-text-muted)] hover:text-[var(--wem-text)]
                       hover:bg-white/10 transition-colors text-sm"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-6 pb-8">
        {/* Emotion Scores */}
        <section>
          <SectionLabel>Current Emotions</SectionLabel>
          {scores ? (
            <EmotionBarChart scores={scores as Record<Emotion, number>} />
          ) : (
            <p className="text-xs text-[var(--wem-text-muted)]">No data</p>
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

        {/* Sources */}
        {latestUrls.length > 0 && (
          <section>
            <SectionLabel>Sources</SectionLabel>
            <NewsList urls={latestUrls} />
          </section>
        )}
      </div>
    </aside>
  );
}
