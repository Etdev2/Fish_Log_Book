# Worklog

One file per session, in [`worklog/`](worklog/). **Do not add entries to this file.**

## How to add an entry

Create a new file. Never edit an existing one.

```
docs/team/worklog/YYYY-MM-DD-NN-yourrole.md
```

`NN` is the next number not already used — `ls docs/team/worklog/` and add one. If two
people take the same number on the same day, rename yours; that is a five-second fix and
the only collision this layout can produce.

## Format

Plain English, written so a person who does not code can read it and know what happened.

```
### 2026-08-27 | head-dev | 40m
- Catch form crashed when the date was left empty. Fixed.
- Turned on the type checker in CI so this class of bug stops at the PR.
- Files: src/features/catches/form.tsx, .github/workflows/ci.yml
- Next: nobody has tested the form on a real phone yet.
```

No jargon, no ticket numbers, say the honest time, say what is still broken.

## Why one file per entry

Every agent appending to one shared file guarantees a merge conflict the moment two of
them work in parallel. Separate files cannot collide. It also means an agent reads only
the entries it needs instead of loading the entire project history into context.

## Reading the history

```
ls docs/team/worklog/                    # everything, oldest first
cat docs/team/worklog/2026-08-28-*.md    # one day
grep -rl "offline" docs/team/worklog/    # sessions that touched a topic
```
