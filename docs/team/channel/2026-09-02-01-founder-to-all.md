# 2026-09-02 — Fish Legal expansion lands (architect, all-hands)

The founder's expansion spec is implemented in PR #24 (Phases 1–3, locked slice).
What's new for the team's map:

- **Rules → Fish Legal.** Nav reads "Legal"; routes moved to `/fish-legal/*`. Deep
  links renamed (old /regulations paths 404 — nobody holds them in cells yet).
- **Region → pack is data.** `packs.ts` is the ONLY place a region unlocks a rule set.
  New jurisdictions = one bundle + one SQL migration + one row there. Designer caution:
  the species list now contains both US coasts; qa-agent should run the Settings-region
  flip the founder demoed (SoCal → Florida → SoCal) against the preview build.
- **Catch rows gain `regulation_snapshot` (jsonb, nullable).** The record of "what the
  law said at log time" (spec §18). Sync-safe: column adds additively, never breaks old
  clients — older clients just read null into the card slot.
- **Limit computations are pure** (`catch-limits.ts`, 7 tests) — read-only over the
  logbook, kept-fish only, local-day boundaries. The log form shows the banner; it
  NEVER blocks a save (diary-vs-almanac boundary is sacred).
- **Boundary alerts live as a state machine** (`boundary-alerts.ts`); one event per
  transition, inbox in `alerts.ts` (localStorage), toggles on the Fish Legal alerts
  page. The GPS feed lives on the boundaries page.
- **Photos are bundled local files** with per-image attribution and an HONEST license
  flag; a Wikimedia/NOAA-only compliance pass is owed before distribution (treated as
  a blocker-class debt, see spec capture doc §Standing debts).
- **What we deliberately did not do:** Mexico pack (zero sourced rows earned yet),
  Phase 4 detritus. The legal-review team's checklist stands alongside: sources are
  agent-grade; human verification against FWC pages before the releases is their queue.

Review lanes: ux-ui gets the limits page + alerts page; qa-agent gets the region-flip
demo + the IRL boundary at a simulated Florida fix; legal-team reads the disclaimer
copy + status words before any user-facing release. — architect
