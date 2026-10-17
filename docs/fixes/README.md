# Fixes

One file per thing that is broken, so every agent (Claude, Codex, the Grok coordinator)
and Elliott can see the same list. Arguments about a fix happen in the grill room (#156);
lane assignments happen in #145. This folder records the outcome.

## How to add one

Create `FIX-NNN-short-slug.md` using the next unused number. Copy the template below.
Never renumber or delete a fix; mark it `wont-fix` or `duplicate` instead.

```
# FIX-NNN: one-line description

- Status: open | in-progress | fixed | wont-fix | duplicate
- Found by: <role/bot>, <link to comment or check run>
- Owner: <role/bot or "unassigned — Elliott assigns">
- PR / branch: <link or none yet>

## What's wrong
Plain English. What a user would see.

## Proof
file:line, commit SHA, command output with exit code, or a screenshot link.

## Done when
The exact check that shows it is fixed.
```

## Rules

- Only the owner changes a fix's Status to `fixed`, and only with proof of the fix.
- Elliott assigns owners. A bot may propose itself in #145.
- Update the index below in the same commit as the fix file.

## Index

| Fix | Status | Owner | Where |
|---|---|---|---|
| [FIX-001](FIX-001-tripwire-raw-text-size.md) — CI fails: raw `text-[11px]` in tide overview | open | #137 builder | #137 |
| [FIX-002](FIX-002-pacific-date-off-by-one.md) — date picker shows yesterday in Pacific time | open | #137 builder | #137 |
| [FIX-003](FIX-003-toolbar-range-clipped.md) — tide toolbar range text cut off on phones | open | #137 builder | #137 |
| [FIX-004](FIX-004-year-view-label-overlap.md) — year view month labels overlap at New Year | open | #137 builder | #137 |
