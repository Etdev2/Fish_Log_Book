# Fishing intelligence platform expansion — specification set

**Date:** 2026-09-15
**Status:** Proposed. Nothing here is committed work.
**Source:** founder brief, "Master Prompt — Fishing Intelligence Platform Expansion"

Twelve specifications plus an audit and a decision report, written after inspecting the
running application, all 62 migrations and the existing architecture documents. Read in
this order.

| # | File | Read it for |
|---|---|---|
| 0 | [00-repository-audit.md](00-repository-audit.md) | **Start here.** What already exists, what the brief assumes wrongly, the two-catch-records finding, and the prior founder decisions this brief collides with |
| 1 | [privacy-consent-and-data-governance.md](privacy-consent-and-data-governance.md) | Precision ladder, consent, grants, k-anonymity, coordinate auditing, retention, deletion. **Blocking dependency for 3, 4, 6, 8, 9** |
| 2 | [data-architecture-expansion.md](data-architecture-expansion.md) | The catch reconciliation, storage tiering, provenance, taxonomy, amendments, the analytical store, sync and immutability |
| 3 | [catch-environmental-enrichment.md](catch-environmental-enrichment.md) | The enrichment worker, per-field provenance, honest observation kinds, offline enrichment |
| 4 | [fisheries-intelligence-map.md](fisheries-intelligence-map.md) | Three maps not one, cell rendering, time animation, suppression, the provider evaluation |
| 5 | [fish-legal-agency-integration.md](fish-legal-agency-integration.md) | Freshness SLA, bag tracking, the agency authorship ladder, what to preserve |
| 6 | [tournament-experience-redesign.md](tournament-experience-redesign.md) | One navigation spine, the live screen, one-catch submission, judging, host command centre |
| 7 | [ui-ux-critic-loop.md](ui-ux-critic-loop.md) | Five rounds, measured then projected, with the unresolved list and the honest final score (7.91) |
| 8 | [equipment-product-catalog.md](equipment-product-catalog.md) | The dependent gear ladder, spec snapshots, admin workflow, and the licensing problem |
| 9 | [ai-fish-identification.md](ai-fish-identification.md) | Ranked candidates, calibration, the safety asymmetry, evaluation, on-device first |
| 10 | [fish-biometric-reidentification.md](fish-biometric-reidentification.md) | A research programme, the confirmation ladder, and the incentive rules that protect the fish |
| 11 | [government-fisheries-partnership.md](government-fisheries-partnership.md) | Three adoption levels, the commercial hypotheses stated as hypotheses, procurement reality |
| 12 | [phased-delivery-roadmap.md](phased-delivery-roadmap.md) | Phases 0–5 with dependencies, risks, specialists, validation and exit criteria |
| 13 | [13-final-decision-report.md](13-final-decision-report.md) | **Read this second.** What to build now, the dangerous assumptions, the smallest credible experiments, the next ten tickets, and where this disagrees with the brief |

## Section structure

Each specification carries: problem statement · users and stakeholders · product goals ·
non-goals · user stories · complete workflow · screen and component requirements · data
requirements · API and service requirements · offline behaviour · privacy and security ·
accessibility · edge cases · failure states · analytics and success metrics · acceptance
criteria · dependencies · risks and unanswered questions · recommended phase.

## The three things to know before reading anything else

1. **`public.tournament_catch` has no foreign key to `public.catch`.** The brief's own
   prohibition — do not create a second, competing catch-record system — was violated three
   months ago. Fixing it is ticket 1.
2. ~~Two founder decisions block roughly a third of the brief.~~ **Both opened 2026-09-15**
   — server media restored (`SPEC.md` D28) and personal-log sync lifted (D29). Phase 3 is
   now gated on expert-verified image collection, which is a season of work regardless.
3. **The UI scores in file 7 are measured for rounds 1–2 and projected for rounds 3–5.**
   They are labelled as such and must be re-measured after implementation. A projected 8.0
   is not a shipped 8.0.
