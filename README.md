# World Emotion Map (WEM)

**Live → [worldemomap.com](https://worldemomap.com)**

An interactive world map that visualizes the emotional state of each country in real time, derived from global news media analysis.

---

## What It Does

WEM answers the question: *"What is the world feeling right now?"*

Every hour, a data pipeline fetches articles from the [GDELT Global Knowledge Graph](https://www.gdeltproject.org/) via Google BigQuery, aggregates sentiment scores by country, and stores the results in Supabase. The frontend renders those scores as a color-coded Mapbox globe — Joy, Trust, Fear, Anger, Sadness, Surprise — updated automatically without a page reload.

Clicking a country opens a detail panel showing a real-time emotion breakdown, a 24-hour trend sparkline, and the source news articles that drove the scores.

---

## Architecture

```
GDELT GKG (news corpus)
        │
        ▼ every hour (GitHub Actions cron)
Google BigQuery ──► aggregate.ts ──► Supabase (PostgreSQL)
                                          │
                                          ▼
                          Next.js 16 App Router (Vercel)
                                          │
                         ┌────────────────┴──────────────────┐
                         ▼                                   ▼
               Server Components                     API Routes
               (initial render)              (/api/emotions, /api/og)
                         │                                   │
                         └────────────────┬──────────────────┘
                                          ▼
                              Mapbox GL JS (WebGL globe)
                              Country Detail Panel
                              Sector View
```

Key design choices:
- **Server Components by default** — data is fetched and rendered on the server; "use client" is pushed to leaf components only
- **BigQuery partition filters** on every query to stay within the 1 TB/month free tier
- **FIPS-10-4 → ISO 3166-1 conversion** (70+ mappings) because GDELT uses FIPS codes while Mapbox uses ISO
- **Anomaly detection** runs hourly alongside the pipeline, triggering an immediate X post when a country's emotion score deviates significantly from its 7-day baseline

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS v4 |
| Map | Mapbox GL JS v3 |
| Auth | Supabase Auth (Google OAuth) |
| Database | Supabase (PostgreSQL) |
| Data warehouse | Google BigQuery |
| Data source | GDELT Global Knowledge Graph |
| Automation | GitHub Actions (cron pipeline + anomaly detection) |
| Social | X API v2 (scheduled posts + anomaly alerts) |
| Deployment | Vercel |
| i18n | next-intl (EN / JA) |

---

## Features

| Feature | Status |
|---|---|
| Interactive Mapbox globe, emotion color layers | Done |
| Country detail panel — radar chart, 24h trend, source news | Done |
| Google OAuth sign-in | Done |
| Favorites (save countries & sectors) | Done |
| Hourly GDELT → BigQuery → Supabase pipeline | Done |
| X auto-posting — scheduled (6h) + anomaly alerts | Done |
| Anomaly detection (z-score vs 7-day baseline) | Done |
| OG image generation via `/api/og` | Done |
| PWA (offline support, installable) | Done |
| Sector view (Economy, Politics, Tech, …) | In progress |
| Region drill-down (continent → country → region) | In progress |

---

## Data Pipeline

```
scripts/
├── fetch-gdelt.ts       # Pull GKG records from BigQuery (partition-filtered)
├── aggregate.ts         # Compute per-country emotion scores
├── detect-anomaly.ts    # Z-score anomaly detection vs 7-day baseline
├── post-to-x.ts         # Post to X (scheduled or anomaly mode)
└── generate-map-image.ts  # Headless screenshot for X card image
```

The pipeline runs as a GitHub Actions workflow (`.github/workflows/data-pipeline.yml`) on a UTC cron schedule. Each step logs BigQuery usage and X API credit balance to prevent quota overruns.

---

## Local Setup

```bash
# Prerequisites: Node.js 20+, pnpm 10+

git clone https://github.com/souma/world-emotion-map.git
cd world-emotion-map
pnpm install

# Copy and fill in environment variables
cp .env.local.example .env.local
# Required: NEXT_PUBLIC_MAPBOX_TOKEN, NEXT_PUBLIC_SUPABASE_URL,
#           NEXT_PUBLIC_SUPABASE_ANON_KEY, BIGQUERY_PROJECT_ID, ...

pnpm dev        # http://localhost:3000
pnpm lint       # ESLint
pnpm build      # Production build
```

---

## Project Structure

```
src/
├── app/
│   ├── [locale]/           # i18n routes (EN/JA)
│   │   ├── page.tsx        # Home — map + detail panel
│   │   ├── favorites/      # Saved countries & sectors
│   │   └── about/          # About + email subscribe
│   └── api/
│       ├── emotions/       # Emotion data endpoint (client fallback)
│       └── og/             # Dynamic OG image
├── components/
│   └── map/
│       ├── WorldMap.tsx         # Mapbox GL JS wrapper
│       ├── MapSection.tsx       # State orchestration
│       ├── CountryDetailPanel.tsx
│       ├── EmotionBarChart.tsx
│       └── TrendSparkline.tsx
├── lib/
│   ├── emotions.ts         # Score computation + color mapping
│   └── fips-to-iso.ts      # FIPS-10-4 → ISO 3166-1 (70+ entries)
└── hooks/
    ├── useTrend.ts          # 24h emotion history from Supabase
    └── useFavorite.ts       # Favorites CRUD
```

---

## License

MIT
