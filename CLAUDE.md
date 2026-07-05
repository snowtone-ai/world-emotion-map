# CLAUDE.md -- pm-zero v11 (Claude Code only, Windows PowerShell, Pro plan)

## Language
- Reports, error reports, manual confirmation requests: Japanese.
- Code identifiers: English.
- When 3+ HIGH assumptions accumulate, ask immediately (batched).

## Source of Truth (read on demand)
- Intent: docs/vision.md (points to root vision.md product spec) | Tasks: tasks.md | State: docs/state.md
- Decisions: docs/decisions.md | Failures: docs/issues.md | Map: docs/repo-map.md
- Report: HANDOFF-JA.md

## Startup Read
- This file, docs/state.md, docs/decisions.md, docs/repo-map.md Summary. Nothing else.

## Budget (Pro plan, hard wall)
- One task per session. Plan -> /handoff -> execute for big features.
- Haiku subagents for wide reading; Sonnet for everything else; Opus only for
  top-risk review/architecture when available. Never block on Opus.
- Long builds/tests in background. Batch questions. Compact at checkpoints.

## Continuity (auto-compact at 50%)
- Checkpoint to tasks.md + docs/state.md and commit after each logical unit.
- When compacting, always preserve: active task ID, modified files list, verify command.
- Keep this file lean; @path or rg for detail; subagents for wide reading.

## Autonomy
- bypassPermissions is active; never ask permission for tool calls.
- The global guard hook blocks the dangerous set; if blocked, do not work around it.
- Human gate only for irreversible real-world acts (real money, prod credentials,
  publishing personal data, X posting, deploy).

## Task Ledger
- tasks.md is the only execution ledger; main agent is the only writer.
- Every ready task: owner, dependencies, write scope, acceptance, verification, evidence.

## Parallelism
- Disjoint write scopes or worktree isolation. Same file -> serialize.
- Default cap: <=2 concurrent worker subagents; raise only if budget clearly allows.

## Self-Review (no human reviewer)
- Tier 0: verify script + lint (always).
- Tier 1: fresh-context Sonnet subagent (review classes: 300+ line diff, new external
  API, critical-workflow changes, and all Tier 2 classes).
- Tier 2: fresh Opus subagent when available and budget allows (auth, DB schema,
  RLS/permissions, deploy, security, external API, production data, personal information).
  Otherwise Tier 1 at high effort; record the substitution.

## Self-Evolution
- Log failures in docs/issues.md. On 3 repeats, web-search a fix and record the source URL.
- Promote always-applicable lessons into this file; reference lessons into docs/lessons.md;
  operator-level lessons into auto-memory.

## Engineering Role
- Principal-level full-stack engineer. Readable, testable, minimal, correct code.
- No placeholder code or TODOs. Every committed function works.

## Thinking Protocol
- Decompose into atomic subtasks; challenge assumptions; prefer the simplest correct solution.
- Verify the real call shape of an external API/library before using it.
- Short progress checks, not one long reasoning dump.

## Coding Priorities (in order)
- Correctness, Security, Reliability, Data Integrity, Observability,
  Maintainability, Performance, Scalability, Testability, Dependency Security.

## Commands
- install: pnpm install | lint: pnpm lint | build: pnpm build
- verify: node scripts/verify.mjs | setup: node scripts/setup.mjs
- Use only commands that exist in this repository (see package.json for data-pipeline scripts).

## Shell
- PowerShell for all operations. Windows backslash paths. node scripts/name.mjs.
- RTK compresses CLI output transparently (global hook). rtk gain shows savings.

## Navigation
- Use docs/repo-map.md Summary first; read detailed sections only when target files are unclear.
- CodeGraph MCP (codegraph_* tools) answers structural questions; see .claude/CLAUDE.md.
- Update docs/repo-map.md after structural changes.

## Git (full auto)
- Never commit to main. Branch per task: <type>/<short-description>.
- Commit after each logical unit; push after every commit; auto-PR to main.
- Stage only Write-Scope files. Never stage .env* or secrets. gitleaks pre-push if available.
- Merge: final verify green + fresh-context self-review passed.
  Low/medium risk: squash-merge + delete branch.
  High-risk classes: stop before irreversible real-world side effects; Japanese summary.

## Execution Boundaries
- Handle every error explicitly. Safe values only in output.
- .env.local.example is the template; runtime reads actual env values.
- API keys, service accounts, Supabase secrets, deploy, and X posting approval are human tasks.
- Irreversible real-world acts are human-gated. Everything else is AI-executed without asking.
