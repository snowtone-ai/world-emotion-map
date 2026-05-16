#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const requiredPaths = [
  'AGENTS.md',
  'CLAUDE.md',
  'HANDOFF-JA.md',
  'tasks.md',
  'docs/vision.md',
  'docs/state.md',
  'docs/decisions.md',
  'docs/issues.md',
  'docs/repo-map.md',
  '.claude/settings.json',
]

const failures = []
for (const file of requiredPaths) {
  const ok = existsSync(file)
  console.log(`${ok ? 'OK' : 'MISSING'} ${file}`)
  if (!ok) failures.push(`required:${file}`)
}

const lint = spawnSync(...createProcessSpec(pnpm, ['lint']), { stdio: 'inherit', shell: false })
if (lint.status !== 0) {
  failures.push('lint')
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`[verify] failed: ${failure}`)
  process.exit(1)
}

console.log('[verify] all checks passed')

function createProcessSpec(command, args) {
  if (process.platform !== 'win32') return [command, args]
  return ['cmd.exe', ['/d', '/s', '/c', command, ...args]]
}
