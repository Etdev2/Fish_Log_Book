<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Fish Log Book agent operations

Before significant work, read `docs/team/HOUSE-RULES.md`. Before choosing, spawning,
or delegating to a specialist, read `docs/team/AI-OPERATING-SYSTEM.md` and the relevant
role definition under `.claude/agents/`.

Use the lowest-capability configured agent that can reliably finish the task. Delegate
only bounded work that benefits from separate context or safe parallelism; the existence
of a role is not a reason to spawn it. Give a child only the task, constraints, relevant
paths, expected artifact, and done criteria. Start LOW, then MEDIUM, then HIGH.

Project-scoped Codex agents and model/reasoning settings live under `.codex/`. Claude
Code agents live under `.claude/agents/`. Do not bypass those definitions with an
unclassified general-purpose worker when a matching specialist exists.
