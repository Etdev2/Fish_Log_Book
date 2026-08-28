# The Team

Eight roles. Each one is a specialist you can call by name. They work on the same repo
and leave a trail anyone can read — no coding knowledge required.

Call one from Claude Code by asking for it: *"have ux-ui look at the catch form"*.

| Name | Plain English | Call them when |
|---|---|---|
| `ceo` | Decides what we build | Two good ideas compete, or scope is creeping |
| `coo` | Runs the day-to-day. The boss on sequencing | You need a plan, an order, or someone unblocked |
| `architect` | Decides where code lives so it still works at 100x | New feature area, folder questions, the future iPhone app |
| `ux-ui` | Makes screens anyone can use | Any screen, form, or "this is confusing" |
| `head-dev` | Fixes bugs, guards the build, merges to GitHub | Something broke, or work is ready to merge |
| `biostat` | Owns the numbers and the outside data | Correlations, tides, weather, units, "is this math right" |
| `cfo` | Owns what it costs to run and to build | Before adding a paid service; auditing waste |
| `counsel` | Drafts terms, flags legal risk | User data, privacy, API terms. **Not legal advice** |

## How the team works

**Horizontal.** Nobody's field is off-limits to anyone else. The biostatistician can
tell the designer a button is confusing. The designer can tell the architect a schema
is wrong. Good arguments win, regardless of who makes them.

**But decisions have an owner.** Scope is the CEO's. Sequencing is the COO's. Structure
is the architect's. Merging is the head developer's. Argue once, then commit.

## Where things are written down

| File | What it is |
|---|---|
| [HOUSE-RULES.md](HOUSE-RULES.md) | The rules every role follows. Git, quality bar, logging |
| [CHANNEL.md](CHANNEL.md) | The team chatroom. Findings one role passes to another |
| [WORKLOG.md](WORKLOG.md) | What was done, when, how long. Written for non-coders |
| [BACKLOG.md](BACKLOG.md) | Now / Next / Someday. Max 3 items in Now |
| `docs/architecture/` | Diagrams and decisions (architect) |
| `docs/analysis/` | How the statistics work, in plain language (biostat) |
| `docs/finance/` | What it costs (cfo) |
| `docs/legal/` | Drafts and open questions for a real attorney (counsel) |
| `docs/product/` | What this product is and isn't (ceo) |

The role definitions themselves live in `.claude/agents/`. Edit those files to change
how a role behaves.

## The trail

Every session ends with a worklog entry: date, who, how long, what changed in plain
words, and what is still broken. If it isn't in the log, it didn't happen.
