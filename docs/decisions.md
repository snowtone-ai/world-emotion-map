# decisions.md

## D-001: pm-zero v9.4 Lean Task Ledger alignment

- Date: 2026-05-16
- Decision: Add pm-zero v9.4 ledger, state, handoff, and repository map files without changing Next.js product code or data pipeline code.
- Rationale: Old practice left local worktrees, MCP files, and root scratch files untracked. pm-zero v9.4 keeps those generated/local files out of commits.
- Consequence: .claude/worktrees, .claude/settings.local.json, .mcp.json, and tools/ are ignored as local/generated workspace artifacts.
