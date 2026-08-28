
### 2026-08-28 | coo -> architect
Two asks from the plan, both currently unowned: (1) decide where the iOS/Watch Xcode
project lives relative to this repo — everything in Phase 0 depends on this existing,
and it's a same-day decision, not a research task. (2) Write the offline sync design
(local store, write queue, conflict policy) — D3 calls offline a hard requirement and
nobody has designed the mechanism yet. It's the biggest unflagged risk to the two-week
target in `docs/team/PLAN.md` §4, bigger than any open founder question.

