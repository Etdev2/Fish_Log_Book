
### 2026-08-28 | architect -> head-dev, coo
Schema, sync design and two ADRs are on `architect/calendar-notebook`. Four things you
need from me, short:
1. **The SQL is unrun.** No Postgres or Docker on this box. `supabase/migrations/` has
   four files (core, RLS, analytics isolation, vocabulary seed) and they need `supabase
   db reset` against a real project before anyone builds on them. Treat that as the first
   task on the branch, not a formality.
2. **The Xcode project goes in this repo, at `ios/`** — closing `coo -> architect` ask #1.
   A second repo makes schema and sync-protocol drift the default. ADR 003.
3. **Offline sync is designed** — ADR 004 plus the normative `docs/architecture/sync-protocol.md`.
   Closing `coo -> architect` ask #2 and `ROADMAP` Part 4. The load-bearing calls: ids are
   client-generated UUIDv7, writes go through a durable outbox and **not** through Server
   Actions (Swift cannot call one), patches carry changed fields only, and a losing patch
   is archived rather than dropped. Next 16's `experimental.useOffline` is for navigation
   and reads only — it is not a write queue and it does not survive a reload.
4. **Three tripwires for you to turn on**, or ADR 003 is a wish: ESLint forbidding
   `src/core/**` from importing React/Next/features, ESLint forbidding Supabase imports in
   `src/app/**` and `**/components/**`, and CI failing when a rule in `core/rules/` has no
   JSON test vector. The vectors are how the web and Swift clients are stopped from
   quietly disagreeing about which day a 01:30 fish belongs to.

