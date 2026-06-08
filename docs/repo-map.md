# Repo Map

## Purpose
Next.js web app displaying a world emotion map derived from GDELT news data.
Hourly GitHub Actions pipeline fetches GDELT → aggregates emotion scores per country → stores in Supabase → serves via API routes → renders as an interactive SVG world map.

## AI First-Read Order
1. `docs/state.md` — current execution state
2. `docs/decisions.md` — past architectural decisions
3. `src/lib/emotions.ts` — canonical `Emotion` type + constants shared everywhere
4. `src/app/[locale]/page.tsx` — main page wiring map + data fetching
5. `src/app/api/emotions/route.ts` — primary data API
6. `src/components/map/MapSection.tsx` — map UI entry point

## Architecture Overview
- **UI layer:** `src/components/map/` (WorldMap, MapSection, CountryDetailPanel, SectorSection, EmotionBarChart, TrendSparkline), `src/components/` (Header, UserMenu, Footer, LocaleSwitcher, ViewToggle)
- **Routing / application layer:** `src/app/[locale]/` (Next.js App Router with next-intl locale segments), `src/app/api/` (Route Handlers)
- **Domain logic:** `src/lib/emotions.ts` (emotion types, colors, ordering), `src/lib/fips-to-iso.ts` (country code mapping), `src/lib/utils.ts`
- **Data access:** `src/lib/supabase/client.ts` (browser), `src/lib/supabase/server.ts` (RSC/SSR), `src/lib/supabase/proxy.ts` (session middleware), `src/lib/supabase/pause.ts` (Supabase pause guard)
- **External services:** Supabase (DB + Auth), GDELT BigQuery (data source), X/Twitter API (posting — currently disabled)
- **Config / environment:** `.env.local.example`, `next.config.ts`, `src/i18n/routing.ts`
- **Tests:** None indexed. Verification via `node scripts/verify.mjs`
- **CI pipeline:** `.github/workflows/data-pipeline.yml` — hourly fetch+aggregate; anomaly detection + X posts disabled

## Key Entry Points
| Area | File | Why it matters |
|---|---|---|
| Main page | `src/app/[locale]/page.tsx` | Fetches emotion data, wires map + locale |
| Root layout | `src/app/[locale]/layout.tsx` | Providers, i18n, auth, GA, PWA |
| Emotion API | `src/app/api/emotions/route.ts` | Primary data endpoint (country emotion scores) |
| Sectors API | `src/app/api/sectors/route.ts` | Sector-level emotion breakdown |
| Auth callback | `src/app/auth/callback/route.ts` | Supabase OAuth callback |
| OG image | `src/app/api/og/route.tsx` | Dynamic OG image generation |
| Middleware | `src/proxy.ts` | next-intl + Supabase session proxy |
| Data pipeline | `.github/workflows/data-pipeline.yml` | Hourly GDELT fetch → aggregate → Supabase |
| Emotion types | `src/lib/emotions.ts` | Canonical `Emotion` union type + color/order constants |

## Core Modules
| Module | Responsibility | Key files | Key dependencies |
|---|---|---|---|
| Map UI | SVG world map, country interaction | `src/components/map/WorldMap.tsx`, `MapSection.tsx` | `src/lib/emotions.ts`, `/api/emotions` |
| Detail panels | Country + sector drill-down | `CountryDetailPanel.tsx`, `SectorDetailPanel.tsx`, `SectorSection.tsx` | `/api/sectors`, hooks |
| Trend hooks | Trend sparkline data fetching | `src/hooks/useTrend.ts`, `useSectorTrend.ts`, `useFavorite.ts` | Supabase client |
| Supabase layer | DB access + auth session | `src/lib/supabase/{client,server,proxy,pause}.ts` | `@supabase/ssr` |
| i18n | Locale routing + messages | `src/i18n/{routing,request,navigation}.ts` | `next-intl` |
| GDELT pipeline | Fetch raw data → aggregate emotions | `scripts/fetch-gdelt.ts`, `scripts/aggregate.ts` | Supabase service role, BigQuery |
| Anomaly + X post | Detect spikes, post to X | `scripts/detect-anomaly.ts`, `scripts/post-to-x.ts` | Currently disabled in CI |
| Favorites | Saved countries per user | `src/app/[locale]/favorites/` | Supabase auth + DB |

## Critical Flows

### Flow 1: Hourly data ingestion
- Entry: `.github/workflows/data-pipeline.yml` cron `5 * * * *`
- Main files: `scripts/fetch-gdelt.ts` → `scripts/aggregate.ts`
- Important symbols: `GdeltTone`, `FetchState`, `parseTone`, `readState`, `writeState`
- Downstream: writes to Supabase `emotions` table → consumed by `/api/emotions`
- Change impact: breaks country emotion scores if aggregate schema changes

### Flow 2: Emotion map render
- Entry: `src/app/[locale]/page.tsx` → fetches `/api/emotions`
- Main files: `MapSection.tsx` → `WorldMap.tsx` (dynamic, SSR disabled) → `buildFillColor`
- Important symbols: `WorldMap`, `MapSection`, `buildFillColor`, `EMOTION_COLORS`, `colorMap`
- Downstream: `CountryDetailPanel`, `EmotionBarChart`, `TrendSparkline`
- Change impact: `Emotion` type changes cascade to all components + API routes

### Flow 3: Auth + session
- Entry: `src/proxy.ts` (middleware) → `src/lib/supabase/proxy.ts:updateSession`
- Main files: `src/app/auth/callback/route.ts`, `src/lib/supabase/server.ts`
- Important symbols: `proxy`, `intlMiddleware`, `updateSession`, `isSupabasePaused`
- Downstream: `UserMenu`, `SignInButton`, favorites actions
- Change impact: middleware runs on every request; errors affect all pages

## CodeGraph Relationship Summary
- `src/lib/emotions.ts` → consumed by all map components, all API routes, and scripts
- `src/proxy.ts` composes `intlMiddleware` (next-intl) + `updateSession` (Supabase)
- `MapSection` dynamically imports `WorldMap` (no SSR); `WorldMap` calls `buildFillColor`
- `/api/emotions` and `/api/sectors` both read Supabase with service role client
- `scripts/fetch-gdelt.ts | scripts/aggregate.ts` pipe data; both use service role `supabase` client
- `src/lib/supabase/pause.ts:isSupabasePaused` guards DB calls when Supabase is paused
- Favorites page + actions depend on Supabase auth session via server client

## High-Risk Change Areas
| Area | Why risky | Verify with |
|---|---|---|
| `src/lib/emotions.ts` | `Emotion` type used everywhere; adding/removing a value breaks all components + APIs + scripts | `codegraph_impact` on `Emotion` |
| `src/proxy.ts` | Middleware runs on every request; broken session refresh affects all auth | `codegraph_callers` of `proxy`, `updateSession` |
| `scripts/aggregate.ts` | Writes to Supabase; schema mismatch silently corrupts data | Manual + `codegraph_callees` |
| `src/app/api/emotions/route.ts` | Primary data API; cache/query changes affect all clients | `codegraph_callers` of `GET` |
| `src/lib/supabase/proxy.ts` | Session cookie handling; errors cause auth loops | `codegraph_callers` of `updateSession` |

## Common Change Routes
| If changing... | Start here | Then verify |
|---|---|---|
| Map colors / emotion display | `src/lib/emotions.ts` → `EMOTION_COLORS` | All map components + `EmotionBarChart` |
| Country data API | `src/app/api/emotions/route.ts` | `page.tsx` fetch + `MapSection` colorMap |
| Sector data | `src/app/api/sectors/route.ts` | `SectorSection`, `SectorDetailPanel`, hooks |
| Auth flow | `src/proxy.ts`, `src/lib/supabase/proxy.ts` | `auth/callback/route.ts`, `UserMenu`, `SignInButton` |
| i18n / locales | `src/i18n/routing.ts` | `src/app/[locale]/layout.tsx`, `LocaleSwitcher` |
| Data pipeline | `scripts/fetch-gdelt.ts` + `scripts/aggregate.ts` | `.github/workflows/data-pipeline.yml` |
| Trend sparklines | `src/hooks/useTrend.ts`, `useSectorTrend.ts` | `TrendSparkline`, `SectorDetailPanel` |
| Favorites | `src/app/[locale]/favorites/` | Supabase RLS policies + `useFavorite.ts` |
| PWA / offline | `public/sw.js`, `src/app/manifest.ts` | `PwaRegistration.tsx` |
| OG image | `src/app/api/og/route.tsx` | Metadata in `layout.tsx` |

## Low-Priority Read Areas
Only inspect these when directly relevant:
- `src/app/[locale]/legal/` — static privacy/terms pages
- `src/app/offline/page.tsx` — PWA offline fallback
- `scripts/gen-icons.js`, `scripts/gen-screenshots.js` — asset generation, run manually
- `scripts/seed.ts`, `scripts/seed-emotions.ts` — one-time DB seeding
- `scripts/detect-anomaly.ts`, `scripts/post-to-x.ts` — disabled in CI
- `config/x-post-*.yaml` — X post templates, disabled
- `src/components/GoogleAnalytics.tsx` — analytics, no logic

## Agent Rule
Before editing:
1. Read `docs/repo-map.md`.
2. Use CodeGraph to verify current relevant files/symbols.
3. Check callers/callees and dependency impact.
4. Read only the minimum necessary source files.
5. Make the smallest safe change.
6. Run `pnpm lint` and `pnpm build` (or `node scripts/verify.mjs`) as verification.
