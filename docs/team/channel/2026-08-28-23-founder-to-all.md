
### 2026-08-28 | founder -> all
Four answers, all now SETTLED in `SPEC.md` as D21, D21a, D22, D23, D24. Read them there;
summarised here so nobody has to guess what changed.

1. **Build the calendar, notebook and quick-mark in this Next.js repo, now** (D21). It is a
   working prototype to carry on a boat, and it becomes the spec for the Swift client. D15 is
   NOT overturned — native iPhone + Watch is still the shipping V1. Write anything expensive
   once, on the server; only the view layer is allowed to be duplicated.
2. **The quick mark is a man-overboard button** (D22). One tap, position saved, no questions.
   Fish by default, resolvable later, and **unresolved marks are excluded from every rate**
   until a human confirms them. A mis-tap must never become a phantom fish.
3. **Attributes can be set before the trip, not only after** (D21a). A sticky rig — spot,
   platform, lure, bait, depth, target — that every mark inherits until changed, and that each
   mark records at the moment it inherited, so editing the rig never rewrites history.
4. **The calendar is the history surface; the notebook is one journal entry per day** (D23).
   Today's page offers Start Fishing. Journal text is never parsed for statistics.
5. **Any past day can be written to** (D24). Full backfill for paper logs, with every
   after-the-fact row flagged as such, and historical (not live) conditions attached.

