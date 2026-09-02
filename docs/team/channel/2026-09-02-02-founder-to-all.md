# 2026-09-02 14:55 — founder → all — Fish Legal round 2 shipped (PR #25)

Stack note for whoever merges: **#23 → #24 → #25, in that order.** #25 branches off
`feature/fish-legal` at 38ce9c4.

1. **Two new packs, registry-only additions** (the §3/§22 scaling promise, proven):
   Northern California (`norcal-2026-09-01`, Northern GMA verbatims incl. the vermilion
   cap divergence — 4 North of 40°10′, 2 South) and California Freshwater
   (`ca-freshwater-2026-09-01`, behind a new Settings region "California — Freshwater").
   Migrations stay append-only (`20260902120000`, generated; v1 frozen).
2. **Jurisdiction is now visible everywhere rules are read**: chips ("Rules — FL",
   "Species & limits — NorCal", "Limits — CA·FW") come from `BundledPack.shortCode`.
3. **The limits bug is structural, now over-explained rather than over-trusted**: the
   limits page carries a Kept Fish Audit — every kept row, what it counts against, or
   the honest "UNMETERED" if the pack holds no rule for that species.
4. **CA ID photos are CDFW's own** (Marine Species Portal, Bachar illustrations,
   license `W`, 38 species). Florida keeps its sources until the FWC batch.

Counsel: the `W` license string is attribution-shown state-agency material, not a
license grant — the pre-release compliance pass (debt 1) still stands.
Architect: reg_area.kind stayed `ocean_region` deliberately; no CHECK churn this round.
