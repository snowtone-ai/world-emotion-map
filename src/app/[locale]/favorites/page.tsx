import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import type { Emotion } from "@/lib/emotions";
import { removeFavorite } from "./actions";

// ── Constants ──────────────────────────────────────────────────────────────

const EMOTIONS: Emotion[] = [
  "joy",
  "trust",
  "fear",
  "anger",
  "sadness",
  "surprise",
  "optimism",
  "uncertainty",
];

const EMOTION_COLORS: Record<string, string> = {
  joy: "#FFD166",
  trust: "#06D6A0",
  fear: "#A78BFA",
  anger: "#FF6B6B",
  sadness: "#4EA8DE",
  surprise: "#FB923C",
  optimism: "#84CC16",
  uncertainty: "#94A3B8",
};

// ── Helpers ────────────────────────────────────────────────────────────────

function dominantEmotion(scores: Record<Emotion, number>): {
  key: string;
  label: string;
  color: string;
} {
  let max = -1;
  let key = "uncertainty";
  for (const e of EMOTIONS) {
    if (scores[e] > max) {
      max = scores[e];
      key = e;
    }
  }
  return {
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
    color: EMOTION_COLORS[key] ?? "#94A3B8",
  };
}

function countryName(code: string): string {
  try {
    return (
      new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code
    );
  } catch {
    return code;
  }
}

// ── Remove button (client boundary) ───────────────────────────────────────

function RemoveButton({
  favoriteId,
  locale,
}: {
  favoriteId: string;
  locale: string;
}) {
  return (
    <form
      action={async () => {
        "use server";
        await removeFavorite(favoriteId, locale);
      }}
    >
      <button
        type="submit"
        aria-label="Remove from favorites"
        title="Remove from favorites"
        className="text-amber-400 hover:text-[var(--wem-text-muted)] transition-colors text-base leading-none"
      >
        ★
      </button>
    </form>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function FavoritesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}`);
  }

  // Fetch country favorites ordered newest first
  const { data: favRows } = await supabase
    .from("favorites")
    .select("id, country_code, created_at")
    .eq("user_id", user.id)
    .eq("type", "country")
    .order("created_at", { ascending: false });

  const favorites = (favRows ?? []).filter(
    (f): f is { id: string; country_code: string; created_at: string } =>
      typeof f.country_code === "string"
  );

  const countryCodes = favorites.map((f) => f.country_code);

  // Fetch latest emotion snapshot per country
  const emotionMap: Record<string, Record<Emotion, number>> = {};
  if (countryCodes.length > 0) {
    const { data: snapshots } = await supabase
      .from("emotion_snapshots")
      .select(
        "country_code, joy, trust, fear, anger, sadness, surprise, optimism, uncertainty"
      )
      .in("country_code", countryCodes)
      .is("sector_slug", null)
      .order("timestamp", { ascending: false })
      .limit(countryCodes.length * 5);

    for (const row of snapshots ?? []) {
      if (!row.country_code || emotionMap[row.country_code]) continue;
      const scores = {} as Record<Emotion, number>;
      for (const e of EMOTIONS) {
        scores[e] = (row[e as keyof typeof row] as number | null) ?? 0;
      }
      emotionMap[row.country_code] = scores;
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 w-full">
      {/* Page header */}
      <div className="mb-8">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--wem-text-muted)] mb-1">
          Saved
        </p>
        <h1 className="text-2xl font-bold text-[var(--wem-text)]">
          Favorites
        </h1>
      </div>

      {favorites.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <p className="text-4xl mb-4">☆</p>
          <p className="text-sm text-[var(--wem-text-secondary)]">
            No favorites yet.
          </p>
          <p className="text-xs text-[var(--wem-text-muted)] mt-1">
            Click ☆ on any country panel to save it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((fav) => {
            const scores = emotionMap[fav.country_code];
            const dom = scores
              ? dominantEmotion(scores)
              : null;

            return (
              <div
                key={fav.id}
                className="glass rounded-xl p-5 flex flex-col gap-4"
              >
                {/* Card header: country + remove */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono tracking-widest uppercase text-[var(--wem-text-muted)]">
                      {fav.country_code}
                    </span>
                    <h2 className="text-sm font-semibold text-[var(--wem-text)] leading-tight mt-0.5">
                      {countryName(fav.country_code)}
                    </h2>
                  </div>
                  <RemoveButton favoriteId={fav.id} locale={locale} />
                </div>

                {/* Dominant emotion badge */}
                {dom && (
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: dom.color }}
                    />
                    <span className="text-xs text-[var(--wem-text-secondary)]">
                      {dom.label}
                    </span>
                  </div>
                )}

                {/* Mini emotion bars */}
                {scores ? (
                  <div className="flex flex-col gap-1">
                    {EMOTIONS.filter(
                      (e) =>
                        !["surprise", "uncertainty"].includes(e)
                    ).map((e) => (
                      <div key={e} className="flex items-center gap-2">
                        <span className="text-[9px] font-mono w-16 text-[var(--wem-text-muted)] capitalize">
                          {e}
                        </span>
                        <div className="flex-1 h-1.5 rounded-full bg-[var(--wem-surface-raised)] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.round(scores[e] * 100)}%`,
                              background: EMOTION_COLORS[e] ?? "#94A3B8",
                            }}
                          />
                        </div>
                        <span className="text-[9px] font-mono w-6 text-right text-[var(--wem-text-muted)]">
                          {Math.round(scores[e] * 100)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-[var(--wem-text-muted)]">
                    No data
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
