# repo-map.md -- pm-zero v9.4 Repository Map

## Read Policy
- Session start: read Summary only.
- Before editing: read the section for the target area when target files are unclear.
- When navigation is unclear: read Entry Points and Directory Map.
- After structural changes: update only the affected section.

## Summary
- App type: Next.js world emotion map with GDELT/BigQuery/Supabase pipeline.
- Main runtime: Next.js 16, React 19, TypeScript, Supabase, Mapbox GL.
- Package manager: pnpm.
- Primary source directory: src/.
- Data pipeline directory: scripts/.
- Main entry points: src/app/page.tsx, scripts/fetch-gdelt.ts, scripts/aggregate.ts.
- Verification command: node scripts/verify.mjs.

## Directory Map
| Path | Purpose | Edit Frequency | Notes |
|---|---|---|---|
| src/ | Next.js app source | high | Product UI/API code. |
| scripts/ | GDELT, aggregation, anomaly, X posting pipeline | high | Requires env values. |
| config/ | Data and mapping config | medium | No secrets. |
| messages/ | Localization messages | medium | Keep keys aligned with UI. |
| public/ | Static assets | medium | Product assets. |
| supabase/ | Supabase project/local files | medium | Auth/RLS changes require review. |
| docs/ | pm-zero project memory | medium | Vision pointer, state, decisions, issues, repo map. |
| .claude/worktrees/ | Generated/local worktrees | generated | Ignore. |

## Entry Points
| Area | File | Purpose |
|---|---|---|
| App | src/app/page.tsx | Main map experience. |
| Layout | src/app/layout.tsx | Root shell and metadata. |
| Fetch | scripts/fetch-gdelt.ts | GDELT/BigQuery ingestion. |
| Aggregate | scripts/aggregate.ts | Emotion score aggregation. |
| Verification | scripts/verify.mjs | Metadata and lint checks. |

## Common Workflows
| Workflow | Read First | Edit Usually | Verify |
|---|---|---|---|
| UI map change | docs/vision.md | src/app/, src/components/, src/lib/ | pnpm lint; pnpm build |
| Data pipeline change | docs/decisions.md | scripts/, config/ | pnpm lint |
| Auth/data change | docs/decisions.md | src/lib/, supabase/ | pnpm lint; pnpm build |
| pm-zero docs | AGENTS.md | tasks.md, docs/, scripts/verify.mjs | git diff --check |

## Generated / External Files
| Path | Rule |
|---|---|
| node_modules/, .next/, out/, build/ | Ignore. |
| .claude/worktrees/, tools/ | Ignore local/generated workspace artifacts. |
| scripts/.gdelt-state.json | Ignore generated pipeline state. |
| service-account.json | Ignore service-account key. |
| .env, .env.*, .env.local | Ignore secrets; keep .env.local.example. |

## Update Rules
- Keep Summary under 20 lines.
- Keep each directory note concrete.
- Move rationale to docs/decisions.md.
