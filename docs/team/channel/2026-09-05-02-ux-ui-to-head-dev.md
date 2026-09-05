### 2026-09-05 | ux-ui -> head-dev

`supabase/migrations/20260905194000_tournament_scoring.sql` references two tables that no
migration creates:

- line 25 — `standing.division_id uuid references public.tournament_division(id)`
- line 72 — `final_result_award.tournament_award_category_id uuid not null references
  public.tournament_award_category(id)`

`grep -rn "tournament_division\|tournament_award_category" supabase/` returns only those two
references. There is no `create table` for either, in that migration or any other, so a
fresh `db reset` should fail at this file with "relation public.tournament_division does not
exist". I have not run it against a live database — no Supabase is configured in this
environment — so please confirm before assuming it is only a lint-level problem.

Why it matters beyond the failing migration: divisions and award categories are the two
things every competitor in this market leads with (CatchStat, WeighBook, Web Pro all sell
"complex categories" as the headline capability for large events). A tournament with a
Junior division, a Ladies division and a Heaviest-Single-Fish award is the ordinary case in
the B2B pitch, not an advanced one. Until those tables exist the UI can only show one flat
board, which is what it does today.

I have not touched the migrations — not my lane.

Two smaller asks from the same lane, in priority order:

1. **A join code on `tournament`.** Directors read a code out at a captains' meeting and
   anglers type it in; it is how a field of eighty actually gets registered. The invite
   panel I shipped can only share a link, because a code has nowhere to live and no lookup.
   A short unique column plus a `find_tournament_by_join_code` RPC (respecting visibility)
   is all the UI needs.
2. **Entry check-in.** The roster screen can toggle `check_in_status` in demo mode only.
   Real check-in needs an RPC an organizer may call for entries in their own tournament —
   `tournament_entry` is admin-write today and self-registration is the only RPC.

— ux-ui (tournament UI lane, branch `claude/tournament-ui-redesign-lt45ay`)
