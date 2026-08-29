<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Fish Log Book agent operations

Before significant work, read `docs/team/HOUSE-RULES.md`. Before choosing, spawning,
or delegating to a specialist, read `docs/team/AI-OPERATING-SYSTEM.md` and use the
matching adapter for the active runtime.

Use the lowest-capability configured agent that can reliably finish the task. Delegate
only bounded work that benefits from separate context or safe parallelism; the existence
of a role is not a reason to spawn it. Give a child only the task, constraints, relevant
paths, expected artifact, and done criteria. Start LOW, then MEDIUM, then HIGH.

Project-scoped Codex agents and model/reasoning settings live under `.codex/`. Claude
Code agents live under `.claude/agents/`. They are equal adapters for the same named
employees; no vendor owns the role. In Codex, spawn the `.codex` specialist. If the user
requests another runtime that is not actually callable, leave a precise repository
handoff rather than pretending it was launched. Future vendors add adapters and native
LOW/MEDIUM/HIGH mappings; they do not create a duplicate team. Do not duplicate work
across runtimes. Each initiative has one coordinating COO and exclusive write lanes;
follow the assignment protocol in `docs/team/AI-OPERATING-SYSTEM.md`. Never touch,
stage, commit, revert, or push another lane's work.
