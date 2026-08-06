# decisions.md

## D-001: pm-zero v9.4 Lean Task Ledger alignment

- Date: 2026-05-16
- Decision: Add pm-zero v9.4 ledger, state, handoff, and repository map files without changing Next.js product code or data pipeline code.
- Rationale: Old practice left local worktrees, MCP files, and root scratch files untracked. pm-zero v9.4 keeps those generated/local files out of commits.
- Consequence: .claude/worktrees, .claude/settings.local.json, .mcp.json, and tools/ are ignored as local/generated workspace artifacts.

## D-002: Real-time map updates via client polling, not Supabase Realtime

- Date: 2026-08-06
- Decision: MapSection polls `/api/emotions` every 60s (client-side, paused while tab hidden) instead of subscribing to Supabase Realtime `postgres_changes` on `emotion_snapshots`.
- Rationale: user chose the polling approach explicitly. The upstream GDELT pipeline only writes hourly, so a websocket subscription would not surface data any sooner than polling in practice, while adding replication setup and persistent-connection cost. Polling reuses the existing REST endpoint and its CDN cache (`s-maxage=300`).
- Consequence: map data can lag up to ~60s behind a completed pipeline write (previously required a full page reload). Production currently returns `{"data":[],"message":"Supabase connection is temporarily paused"}` from `/api/emotions` (`NEXT_PUBLIC_SUPABASE_PAUSED` not set to false) — polling is functional but shows no data until a human unpauses Supabase in production.
