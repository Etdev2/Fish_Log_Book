@AGENTS.md

# Fish Log Book

Next.js 16 + React 19 + Tailwind v4 + Supabase.

This project is built by a named team of specialist roles. Before doing significant
work, read `docs/team/HOUSE-RULES.md` (git protocol, quality bar, worklog format) and
`docs/team/README.md` (who owns what). Before spawning a role, read
`docs/team/AI-OPERATING-SYSTEM.md` (model routing, context, escalation, and worktrees).
Claude adapters are in `.claude/agents/`; matching Codex adapters are in `.codex/agents/`.
Both represent the same platform-neutral employees.

Do not `@`-import those files here — this file loads into every session and every
agent pays for it.

Use the cheapest adequate role. Spawn only bounded work with a minimal handoff. LOW
handles deterministic work, MEDIUM handles ordinary implementation and judgment, and
HIGH is reserved for architecture, difficult root-cause analysis, high-stakes math,
privacy/legal risk, or arbitration after MEDIUM fails. Workers commit only their own
assigned branch; only `git-integrator` merges into `main`.

In a Claude-only session, spawn Claude specialists. If the user explicitly assigns a
workstream to another vendor and no cross-runtime bridge is available, write a bounded
repository handoff for that runtime and say that it still needs to be launched. Never
claim to have spawned another vendor's runtime when you only created a local Claude
subagent.

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage labels, unrenamed. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context, at non-default paths — the glossary is `docs/architecture/ontology.md` and
ADRs live in `docs/architecture/decisions/`. See `docs/agents/domain.md`.
