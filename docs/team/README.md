# The Team

Thirteen roles. Each one is a specialist you can call by name. They work on the same repo
and leave a trail anyone can read — no coding knowledge required.

Call one from Claude Code by asking for it: *"have ux-ui look at the catch form"*.

| Name | Tier | Plain English | Call them when |
|---|---|---|---|
| `ceo` | MEDIUM | Decides what we build | Two good ideas compete, or scope is creeping |
| `coo` | MEDIUM | Runs sequencing and delegation | You need a plan, an order, or someone unblocked |
| `architect` | HIGH | Decides durable system structure | New feature area, schema boundaries, or the future iPhone app |
| `ux-ui` | MEDIUM | Makes screens anyone can use | Any screen, form, layout, accessibility, or confusing flow |
| `head-dev` | MEDIUM | Implements and debugs application code | A planned feature or reproducible bug needs code changes |
| `biostat` | HIGH | Owns numbers and outside data | Correlations, tides, weather, units, or statistical validity |
| `cfo` | MEDIUM | Owns run/build cost | Before adding a paid service or when auditing waste |
| `counsel` | HIGH | Drafts terms and flags legal risk | User data, privacy, licensing, or API terms. **Not legal advice** |
| `diagram-agent` | LOW | Turns approved designs into diagrams | Mermaid, sequence, state, ER, or dependency diagrams |
| `repo-scout` | LOW | Finds the smallest relevant change surface | Files, symbols, imports, tests, or configuration must be located |
| `test-agent` | LOW | Writes and runs bounded tests | Straightforward tests, regression coverage, or check execution |
| `code-reviewer` | MEDIUM | Reviews without editing | Correctness, regression, security, or missing-test review |
| `git-integrator` | LOW | Integrates approved work | Branch status, safe rebase/merge order, or mechanical conflicts |

## How the team works

**Horizontal.** Nobody's field is off-limits to anyone else. The biostatistician can
tell the designer a button is confusing. The designer can tell the architect a schema
is wrong. Good arguments win, regardless of who makes them.

**But decisions have an owner.** Scope is the CEO's. Sequencing is the COO's. Structure
is the architect's. Implementation is the head developer's. Integration is the Git
integrator's. Argue once, then commit.

## Where things are written down

| File | What it is |
|---|---|
| [HOUSE-RULES.md](HOUSE-RULES.md) | The rules every role follows. Git, quality bar, logging |
| [AI-OPERATING-SYSTEM.md](AI-OPERATING-SYSTEM.md) | Model tiers, role boundaries, escalation, context, worktrees |
| [CHANNEL.md](CHANNEL.md) | The team chatroom. Findings one role passes to another |
| [WORKLOG.md](WORKLOG.md) | What was done, when, how long. Written for non-coders |
| [BACKLOG.md](BACKLOG.md) | Now / Next / Someday. Max 3 items in Now |
| `docs/architecture/` | Diagrams and decisions (architect) |
| `docs/analysis/` | How the statistics work, in plain language (biostat) |
| `docs/finance/` | What it costs (cfo) |
| `docs/legal/` | Drafts and open questions for a real attorney (counsel) |
| `docs/product/` | What this product is and isn't (ceo) |

The platform-neutral job definitions live in `.claude/agents/`; their frontmatter also
configures Claude Code. Matching Codex definitions live in `.codex/agents/`, with shared
Codex defaults in `.codex/config.toml`.

## The trail

Every session ends with a worklog entry: date, who, how long, what changed in plain
words, and what is still broken. If it isn't in the log, it didn't happen.
