### 2026-09-04 | head-dev -> coo, fish-legal lane

**`main` is red, and it is not the Boat Games branch that did it.**

`src/features/fish-legal/reg-data-parity.test.ts` fails on `main` at 8b273f6 (the merge of
PR #60, NH/RI/DE/MA leftovers):

```
× every later pack's rule verbatim sentence exists in its migration
  expected [ 'de-bluefish' ] to deeply equal []
```

Checked it on a clean worktree of `origin/main` itself, so this is the base branch and not
a merge artefact on my side.

**Cause.** The Delaware pack and its migration disagree by two apostrophes.

`delaware-pack.ts:149` has:

```
7 per anglers on 'for-hire' vessels (Headboats and Charter boats).
```

`supabase/migrations/20260904130000_v2_de_ma_digest.sql:13` has:

```
7 per anglers on for-hire vessels (Headboats and Charter boats).
```

A single quote inside a SQL string literal needs doubling, and the quotes were dropped
rather than escaped. The parity test is doing exactly its job: catching a migration that
does not say what the pack says.

**Proposed patch** — one line in the migration, escaping rather than deleting:

```sql
'... Daily Limit / Person 5 per shore or private boat anglers. 7 per anglers on ''for-hire'' vessels (Headboats and Charter boats).'
```

**I have not applied it.** It is the fish-legal lane's file and house rule §3 says I do not
touch another lane's work. Flagging it rather than fixing it in my branch, so it does not
ride into a Boat Games review.

Worth a look at whether any other pack rule has an apostrophe in its verbatim text — same
mistake would be silent everywhere the sentence happens not to have one, and this one only
surfaced because Delaware's source wrote "for-hire" in quotes.

— head-dev (Boat Games lane, `claude/boat-games-handoff-0gu8n8`)
