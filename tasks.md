# tasks.md -- pm-zero v9.4 Execution Ledger

## Goal Binding
- Vision source: docs/vision.md
- Active goal: Refactor World Emotion Map internals without changing product behavior or external interfaces.
- Planning owner: Codex CLI
- Implementation owner: Codex CLI
- Review owner: Codex CLI self-audit

## Status Vocabulary
- proposed: idea exists, not ready
- ready: owner, dependencies, write scope, acceptance, verification, and expected evidence are clear
- doing: one owner is actively working
- blocked: needs decision, dependency, credential, environment, or human action
- review: implementation complete, review pending
- done: accepted by reviewer
- verified: evidence recorded

## Parallelization Rules
- Coordinator owns tasks.md.
- Worker agents own only their assigned Write Scope.
- Parallel implementation requires disjoint Write Scopes or isolated worktrees.
- If two tasks need the same file, serialize them.
- Subagents return reports; coordinator updates tasks.md.

## Tasks
| ID | Status | Owner | Depends On | Write Scope | Acceptance | Verification | Evidence |
|---|---|---|---|---|---|---|---|
| T001 | verified | Codex CLI | none | AGENTS.md, CLAUDE.md, HANDOFF-JA.md, tasks.md, docs/, scripts/setup.mjs, scripts/verify.mjs, .claude/settings.json, .gitignore | pm-zero v9.4 source-of-truth files exist, generated worktrees/local tools are ignored, and product code is untouched | git diff --check; node scripts/verify.mjs | 2026-05-17: node scripts/verify.mjs passed; git diff --check passed before commit. |
| T002 | verified | Codex CLI | T001 | src/components/map/WorldMap.tsx, tasks.md | Map debug probing remains available via the explicit callback, while routine map rendering no longer writes unconditional debug logs | pnpm lint; pnpm build | 2026-05-17: lint passed; build passed with existing edge-runtime static-generation warning. |
| T003 | verified | Codex CLI | T002 | src/proxy.ts, src/lib/supabase/pause.ts, src/lib/supabase/proxy.ts, src/app/[locale]/page.tsx, src/components/Header.tsx, src/components/SignInButton.tsx, src/components/UserMenu.tsx, src/app/api/emotions/route.ts, src/app/api/sectors/route.ts, src/app/api/og/route.tsx, .env.local.example, tasks.md | Supabase connection can be paused without breaking base page rendering by returning fallback empty data and skipping session refresh/auth actions | pnpm lint | 2026-05-24: pnpm lint passed after adding `NEXT_PUBLIC_SUPABASE_PAUSED`-based guard paths. |

## Blockers
| ID | Task | Blocker | Needed decision | Owner |
|---|---|---|---|---|

## Review Notes
| Task | Reviewer | Result | Follow-up |
|---|---|---|---|
