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

## Sweet Potato control room

This repo is a project of the [Sweet Potato](https://github.com/Etdev2/sweet-potato) control room. Its coordinator, builder and reviewer bots meet on GitHub issues and pull requests. The roles above stay as they are; Sweet Potato adds these rules on top.

| Rule | Enforced by |
| --- | --- |
| Every pull request commits a fresh, passing proof bundle in `proof/`, made by `scripts/prove.sh` (see `.claude/skills/verify/`). | Hard check: `scripts/check-proof.sh` in the CI `proof` job, at the PR head commit |
| The proof scripts and `skills/registry.json` copied from the control room match its reviewed commit. | Hard check: `scripts/check-pinned-scripts.sh` against `scripts/control-room-pin.txt`, in `npm run verify`; `scripts/test-proof-tools.sh` in CI |
| No secret-looking file (env files, private keys, credential files) is committed. `*.example` env templates are allowed. | Hard check: `.gitignore`, plus `scripts/check-secret-files.sh` in `npm run verify` |
| Upstream skills come from the pinned commits in `skills/registry.json`. | Pin check above; update only by copying a newer reviewed control-room commit |
| Et marks product tickets ready, names the builder, and merges every pull request. | Soft rule: control-room ADR 0006 |
| A different model family reviews the builder's pull request (Codex: comment `@codex review`), on two axes: repository standards and the originating spec. | Soft rule: review |
| Handoffs between bots use the control room's TO / HANDOFF / status format on the issue or pull request. | Soft rule: review |

Don't edit a pinned file here. Change it in the control room, then copy it and update the pin in one pull request.
