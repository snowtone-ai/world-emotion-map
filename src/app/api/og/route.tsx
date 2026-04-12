/**
 * src/app/api/og/route.tsx
 * Dynamic Open Graph image — 1200×630 branded card showing the current dominant emotion.
 * Runs on Edge Runtime; revalidates every hour.
 */

import { ImageResponse } from "next/og";

export const runtime = "edge";
export const revalidate = 3600;

// ── Emotion palette ──────────────────────────────────────────────
const EMOTION_COLORS: Record<string, string> = {
  joy: "#FFD166",
  trust: "#06D6A0",
  fear: "#A78BFA",
  anger: "#FF6B6B",
  sadness: "#4EA8DE",
  surprise: "#FBBF24",
  optimism: "#34D399",
  uncertainty: "#8888A8",
};

type EmotionRow = {
  joy: number;
  trust: number;
  fear: number;
  anger: number;
  sadness: number;
  surprise: number;
  optimism: number;
  uncertainty: number;
};

// ── Fetch latest global snapshot from Supabase REST ──────────────
async function fetchTopEmotion(): Promise<{
  emotion: string;
  score: number;
} | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  try {
    const res = await fetch(
      `${url}/rest/v1/emotion_snapshots` +
        `?select=joy,trust,fear,anger,sadness,surprise,optimism,uncertainty` +
        `&country_code=is.null` +
        `&sector_slug=is.null` +
        `&order=timestamp.desc` +
        `&limit=1`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        // Edge fetch cache
        next: { revalidate: 3600 },
      },
    );
    if (!res.ok) return null;

    const rows = (await res.json()) as EmotionRow[];
    const row = rows[0];
    if (!row) return null;

    const [emotion, score] = (
      Object.entries(row) as [string, number][]
    ).sort((a, b) => b[1] - a[1])[0]!;

    return { emotion, score };
  } catch {
    return null;
  }
}

// ── Route handler ────────────────────────────────────────────────
export async function GET() {
  const top = await fetchTopEmotion();

  const emotion = top?.emotion ?? "joy";
  const score = top?.score ?? 0;
  const color = EMOTION_COLORS[emotion] ?? "#7C6EF5";
  const scoreInt = Math.round(score * 100);
  const emotionLabel = emotion.charAt(0).toUpperCase() + emotion.slice(1);
  const hasData = top !== null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#06060F",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Helvetica, sans-serif",
        }}
      >
        {/* ── Top accent bar ── */}
        <div
          style={{
            width: "100%",
            height: 6,
            background:
              "linear-gradient(90deg, #FF4B8B 0%, #FF7BAA 50%, #FFAB6B 100%)",
            display: "flex",
          }}
        />

        {/* ── Main body ── */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            padding: "48px 72px",
            gap: 60,
          }}
        >
          {/* Left — branding */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 0,
            }}
          >
            {/* Globe icon */}
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                border: "3px solid #FF4B8B",
                backgroundColor: "rgba(255, 75, 139, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 28,
              }}
            >
              {/* GeoHeart — world expressed as emotion */}
              <svg
                viewBox="0 0 100 100"
                width="52"
                height="52"
                style={{ display: "flex" }}
              >
                <defs>
                  <linearGradient id="gh-og" x1="14" y1="44" x2="86" y2="71" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FF4B8B" />
                    <stop offset="100%" stopColor="#FFAB6B" />
                  </linearGradient>
                </defs>
                <path
                  d="M 50 71 C 32 65, 14 55, 14 44 A 18 18 0 0 1 50 44 A 18 18 0 0 1 86 44 C 86 55, 68 65, 50 71 Z"
                  fill="url(#gh-og)"
                />
                <path
                  d="M 22 51 Q 50 61 78 51"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.55"
                />
                <line
                  x1="50" y1="44" x2="50" y2="71"
                  stroke="white"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  opacity="0.35"
                />
              </svg>
            </div>

            {/* Title */}
            <div
              style={{
                fontSize: 54,
                fontWeight: 700,
                color: "#EEEEF5",
                lineHeight: 1.1,
                display: "flex",
                marginBottom: 14,
              }}
            >
              World Emotion Map
            </div>

            {/* Tagline */}
            <div
              style={{
                fontSize: 24,
                color: "#8888A8",
                display: "flex",
                marginBottom: 44,
              }}
            >
              Feel What the World Feels
            </div>

            {/* 6 emotion color dots */}
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              {Object.entries(EMOTION_COLORS)
                .slice(0, 6)
                .map(([em, col]) => (
                  <div
                    key={em}
                    style={{
                      width: em === emotion ? 18 : 12,
                      height: em === emotion ? 18 : 12,
                      borderRadius: "50%",
                      backgroundColor: col,
                      opacity: em === emotion ? 1 : 0.35,
                      display: "flex",
                    }}
                  />
                ))}
            </div>
          </div>

          {/* Right — emotion card */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 20,
              minWidth: 320,
            }}
          >
            {/* Label */}
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#55556A",
                letterSpacing: 2,
                textTransform: "uppercase",
                display: "flex",
              }}
            >
              {hasData ? "DOMINANT EMOTION" : "LOADING DATA"}
            </div>

            {/* Emotion name */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  backgroundColor: color,
                  boxShadow: `0 0 16px ${color}80`,
                  display: "flex",
                }}
              />
              <div
                style={{
                  fontSize: 72,
                  fontWeight: 700,
                  color: color,
                  display: "flex",
                  lineHeight: 1,
                }}
              >
                {emotionLabel}
              </div>
            </div>

            {/* Score bar */}
            {hasData && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 10,
                  width: "100%",
                }}
              >
                {/* Bar track */}
                <div
                  style={{
                    width: 300,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: "#1A1A2E",
                    display: "flex",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${scoreInt}%`,
                      height: "100%",
                      backgroundColor: color,
                      borderRadius: 5,
                      display: "flex",
                    }}
                  />
                </div>

                {/* Score number */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      fontSize: 40,
                      fontWeight: 700,
                      color: "#EEEEF5",
                      display: "flex",
                    }}
                  >
                    {scoreInt}
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      color: "#8888A8",
                      marginBottom: 5,
                      display: "flex",
                    }}
                  >
                    / 100
                  </div>
                </div>
              </div>
            )}

            {/* Data source note */}
            <div
              style={{
                fontSize: 15,
                color: "#55556A",
                display: "flex",
              }}
            >
              Updated hourly · GDELT news analysis
            </div>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 72px",
            borderTop: "1px solid #2A2A40",
          }}
        >
          <div
            style={{
              fontSize: 18,
              color: "#8888A8",
              display: "flex",
            }}
          >
            worldemomap.com
          </div>
          <div
            style={{
              fontSize: 16,
              color: "#FF4B8B",
              display: "flex",
            }}
          >
            Real-time global news sentiment
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
