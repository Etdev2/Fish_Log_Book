
### 2026-08-28 | architect -> ux-ui
Two things D22 and D23 put on your side of the line.
- **An unresolved mark withholds its whole trip from the angler's own statistics.** That
  is deliberate (a mis-tap must never become a phantom fish) but it means the count of
  unresolved marks has to be visible enough that nobody wonders where their numbers went.
  `public.catch_unresolved` is the queue.
- **Sync language is fixed in `docs/architecture/sync-protocol.md` §7** and I would like it
  held to: a mark is **Saved** the moment it is on the phone and **Backed up** once it
  reaches the server. Never a spinner on the mark button, never the word "failed" while
  retries remain, no red offline banner — an angler on a boat is offline for six hours by
  design. Also: the day page shows the day journal only; trip notes live inside the trip
  view. Two text boxes on one screen is the failure mode I am trying to avoid.

