# AI Development Operating System

This is the routing and responsibility policy for Claude Code, Codex, and any human
operating the named Fish Log Book team. Product-specific authority stays with the
existing roles; this document decides who should do a task, with how much reasoning,
and under what Git and context boundaries.

## Prime directive

Use the lowest-capability agent that can reliably finish the task.

The normal escalation ladder is LOW -> MEDIUM -> HIGH. Do not begin at HIGH unless the
task is architectural, security/privacy/legal sensitive, statistically high-stakes, or
a difficult root-cause problem that clearly benefits from deeper reasoning.

HIGH agents normally decide or plan. MEDIUM agents implement. LOW agents search,
transform, verify straightforward behavior, diagram approved decisions, and integrate
mechanically. Do not spend premium reasoning on a decision that has already been made.

## Platform mapping

| Tier | Claude Code default | Codex default | Use for |
|---|---|---|---|
| LOW | Haiku, low effort | GPT-5.6 Luna, low reasoning | Narrow, deterministic, repeatable work |
| MEDIUM | Sonnet, medium effort | GPT-5.6 Terra, medium reasoning | Ordinary implementation and bounded judgment |
| HIGH | Opus, high effort | GPT-5.6, high reasoning | Architecture, hard arbitration, high-stakes or failed MEDIUM work |

These are defaults, not prestige levels. An agent returns `ESCALATION_REQUIRED` with the
specific ambiguity or failure when its assigned tier is no longer adequate. The parent
may relaunch the same responsibility at a higher tier or route it to the named owner.

## Spawn decision

Before spawning, answer:

1. Is the task bounded and independently verifiable?
2. Will separate context or real parallelism save more than the extra agent consumes?
3. Which named role owns the decision?
4. What is the lowest tier likely to succeed?
5. Is the task read-only, a single write workstream, or a parallel write workstream?
6. What is the minimum context and exact artifact the child needs?

Do not spawn for a tiny task the parent can finish immediately. Do not make two agents
derive the same answer. Parallelize read-heavy exploration, review specialties, or
independent files; keep coupled edits sequential.

## Minimum handoff

Every delegated task contains only:

```text
TASK:
MODEL TIER:
SOURCE / RELEVANT PATHS:
ALLOWED WRITES:
CONSTRAINTS / DO NOT:
EXPECTED OUTPUT:
DONE WHEN:
```

Do not forward the parent's full conversation. Durable decisions belong in the relevant
spec, ADR, plan, channel message, or worklog file. Search first, read targeted sections
second, reason third.

## Role matrix

| Agent | Responsibility | Tier | Reasoning | Git access | Worktree | Escalates to |
|---|---|---:|---|---|---|---|
| `ceo` | Product scope and priority arbitration | MEDIUM | Medium | Product docs; commit assigned branch; never merge | Conditional for concurrent doc writes | Founder for unresolved product choice |
| `coo` | Sequencing, delegation, dependencies, backlog | MEDIUM | Medium | Team ops docs; commit assigned branch; never merge | Conditional for concurrent doc writes | `ceo` for scope; `architect` for structural dependency |
| `architect` | System boundaries, schema, data flow, ADRs | HIGH | High | Architecture docs and assigned schema artifacts; commit; never merge | Required for parallel writes | `ceo` for product constraint; specialist owner for domain risk |
| `ux-ui` | Front-end UX, accessibility, interaction implementation | MEDIUM | Medium | Front-end/design files; commit; never merge | Required for parallel code writes | `architect` for data/structure; `ceo` for scope |
| `head-dev` | Planned implementation, debugging, build/CI ownership | MEDIUM | Medium | Application/config code; commit; never merge | Required for parallel code writes | HIGH debugging pass; `architect` for cross-cutting design |
| `biostat` | Statistics, units, time, environmental data validity | HIGH | High | Analysis docs and assigned data/math code; commit; never merge | Required for parallel writes | `counsel` for licensing; `ceo` for unsupported claims |
| `cfo` | Infrastructure/vendor/token cost | MEDIUM | Medium | Finance docs only; commit; never merge | Conditional for concurrent doc writes | `ceo` for spend/scope decision |
| `counsel` | Privacy, terms, licensing risk; not legal advice | HIGH | High | Legal docs only; commit; never merge | Conditional for concurrent doc writes | Licensed attorney and `ceo` |
| `diagram-agent` | Render approved designs as Mermaid diagrams | LOW | Low | Diagram/docs paths only; commit if assigned; never merge | No, unless it is an independent parallel write stream | `architect` with `ARCHITECTURE_CLARIFICATION_REQUIRED` |
| `repo-scout` | Locate files, symbols, dependencies, tests | LOW | Low | Read-only; no commits | No | Requesting parent or owning specialist |
| `test-agent` | Write/run bounded tests and report failures | LOW | Low | Tests and approved test config only; commit; never merge | Required when writing tests in parallel | `head-dev`; MEDIUM for complex behavioral tests |
| `code-reviewer` | Evidence-backed correctness/security/test review | MEDIUM | Medium | Read-only; no commits | No | `head-dev`, `architect`, or `counsel` by finding type |
| `git-integrator` | Branch/worktree status, merge order, integration | LOW | Low | Git operations and mechanical conflict edits; may merge | No; operates from the integration worktree | MEDIUM for complex mechanics; owner for semantic conflict |

## Role boundaries

- `architect` decides structure; `diagram-agent` only represents an approved structure.
- `head-dev` implements and debugs; `test-agent` verifies; `code-reviewer` reviews;
  `git-integrator` integrates. None silently absorbs another role.
- `repo-scout` returns paths and concise evidence, not implementation proposals unless
  explicitly requested.
- `test-agent` may add straightforward coverage but does not redesign production code.
- `code-reviewer` does not fix the code it reviews.
- `git-integrator` may resolve only mechanical conflicts. Business logic, API behavior,
  schema intent, authentication, or competing architecture is a semantic conflict and
  goes back to its owner.

## Git and worktrees

Branches represent independent write workstreams, not agents. A planner, scout, reviewer,
or test runner needs no branch when it makes no changes. A helper contributing to the
same workstream normally uses the owner's branch sequentially.

Every simultaneously active write workstream has its own branch and worktree. Before
parallel work, assign probable file ownership. If two tasks need the same core file, run
them sequentially.

```text
worker branch -> tests -> review -> git-integrator -> main
```

Workers commit and push only their assigned branch. They never merge into `main`.
`git-integrator` confirms relevant checks, reviews the changed-file set, updates the
branch when necessary, merges approved work, and cleans completed branches/worktrees.

## Escalation and retries

LOW escalates when requirements are ambiguous, existing behavior is unclear, or the
task stops being mechanical. MEDIUM escalates when architecture must change, root cause
remains unknown, security or privacy consequences appear, multiple systems conflict, or
one or two materially different attempts fail.

Do not repeat the same failed attempt at the same tier. State the evidence, the exact
unresolved question, and the smallest next decision needed.

## Success signals

This system is working when most tasks use LOW or MEDIUM, HIGH decisions are rare and
reused, workers receive small contexts, parallel agents rarely touch the same files,
semantic conflicts are never guessed through, and integration has one clear owner.
