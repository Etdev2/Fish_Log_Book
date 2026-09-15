# Phased delivery roadmap

**Status:** Proposed sequencing for the expansion
**Date:** 2026-09-15
**Governs:** phase definitions, dependencies, exit criteria, and what must not be built yet
**Extends:** `docs/product/ROADMAP.md` (which remains authoritative for the pre-expansion product)
**Audit:** `00-repository-audit.md`
**Phase:** —

---

## 1. Problem statement

The brief describes six phases of work spanning a personal logbook, a tournament platform,
an AI research programme and a government partnership. Sequenced badly, that is three years
of architecture ahead of one season of evidence.

This file sequences it against two constraints the audit established:

1. **Some of it is already built.** Fish Legal, the tournament backend, the offline outbox,
   the dependent-options mechanism and the condition-snapshot schema exist.
2. **Two things block a third of it.** Server media is a founder decision made against it on
   cost; server sync for the personal log is deferred by founder ruling. Neither is an
   engineering problem and neither can be worked around honestly.

---

## 2. The dependency spine

```text
         ┌─────────────────────────────────────────────────┐
         │ P0  audit · privacy rules · catch reconciliation │
         └───────────────┬─────────────────────────────────┘
                         │
        ┌────────────────┼──────────────────┐
        │                │                  │
  ┌─────▼─────┐   ┌──────▼──────┐   ┌───────▼────────┐
  │ P1 tourn. │   │ P1 enrich.  │   │ P1 catalog     │
  │ IA + flow │   │ worker      │   │ (gear ladder)  │
  └─────┬─────┘   └──────┬──────┘   └────────────────┘
        │                │
        │          ┌─────▼──────────────┐
        │          │ P2 analytics store │
        │          │    map · exports   │
        │          └─────┬──────────────┘
        │                │
        │        ┌───────▼─────────┐       ┌──────────────────┐
        │        │ P4 gov pilot    │◄──────┤ P0 discovery (10 │
        │        └─────────────────┘       │ conversations)   │
        │                                  └──────────────────┘
        │
  ┌─────▼──────────────────────────────────────────┐
  │ FOUNDER DECISION: server media                  │
  │   └─► P3 AI fish ID ─► P3 biometrics           │
  └────────────────────────────────────────────────┘
```

**Two hard gates, neither of them technical:**

- **Gate A — server sync for the personal log.** Deferred by founder ruling 2026-09-04.
  Blocks enrichment, aggregation, exports and every agency feature.
- **Gate B — server media.** Killed on cost 2026-09-03. Blocks AI ID, biometrics, and
  photo evidence for tournaments.

---

## 3. Phase 0 — Audit and foundations

**Complexity:** Medium. Mostly writing, one migration.
**Duration:** 2–3 weeks.

| Work | Owner | Artifact |
|---|---|---|
| Repository audit | done | `00-repository-audit.md` |
| Catch reconciliation ruling + migration | `architect`, `head-dev` | `tournament_catch.catch_id` |
| Privacy rules: precision ladder, k-gate, consent shapes | `counsel`, `architect` | `core/privacy/` + vectors |
| Species-sensitivity policy shape | `biostat`, `counsel` | `species_location_policy` |
| Environmental provider + observation schema | `architect` | migration |
| Taxonomy schema | `architect`, `biostat` | migration |
| **Founder decisions: Gate A and Gate B** | founder | written ruling |
| **10 agency discovery conversations** | `ceo` | notes, no code |

**Dependencies:** none. This is why it goes first.

**Risks:** the reconciliation backfill is a data-quality problem with no clean answer
(`data-architecture-expansion.md` §18.1); the privacy work is `counsel`-gated and `counsel`
is HIGH tier and scarce.

**Specialists:** `architect` (HIGH), `counsel` (HIGH), `biostat` (HIGH), `head-dev` (MEDIUM).

**Technical unknowns:** whether the two sync reconcilers can converge; whether the k
threshold survives `biostat`'s analysis.

**Validation:** `npm run verify` plus `db:check` against a clean Postgres; a test proving
grant → read → audit → revoke.

**Exit criteria:**
1. `tournament_catch.catch_id` exists with its trigger and a backfill decision recorded.
2. `core/privacy/` is pure, vector-tested, and the only coarsening authority.
3. Gate A and Gate B have written founder rulings, whichever way they go.
4. 10 discovery conversations held and written up.

---

## 4. Phase 1 — Near-term product improvements

**Complexity:** High — the most work in the plan, and the most user-visible return.
**Duration:** 8–12 weeks.

| Work | Spec | Notes |
|---|---|---|
| Tournament IA and flow rebuild | `tournament-experience-redesign.md` | No new backend. Highest visible return in the brief. |
| One-catch submission (personal → tournament) | same, §6.5 | Depends on P0 reconciliation |
| Enrichment worker + provider cache | `catch-environmental-enrichment.md` | **Depends on Gate A** |
| Missing snapshot fields (SST, waves, currents, bathymetry, zones) | same | |
| Equipment catalog + dependent ladder | `equipment-product-catalog.md` | Structure + ~200 models |
| GPS accuracy surfacing, offline queue visibility | tournaments + enrichment | `gps_accuracy_m` already stored, never shown |
| `geo_cell_50km`, per-catch privacy override, `/settings/privacy` | `privacy-consent-...` §19 | |
| Fish Legal freshness + bag tracking | `fish-legal-agency-integration.md` §6.2–6.3 | No new data needed |
| Shell fixes: bottom bar, bottom padding, drawer names | `ui-ux-critic-loop.md` R1-C, R1-H | |
| Measurement tests in CI | `ui-ux-critic-loop.md` §11 | Prevents regression of every R1 finding |

**Dependencies:** P0. Gate A for enrichment only — everything else ships without it.

**Risks:** the tournament rebuild touches the most complex feature in the app; the catalog
needs `counsel` before seeding; the bottom-bar decision is contested.

**Specialists:** `ux-ui` (MEDIUM, heaviest load), `head-dev` (MEDIUM), `architect` (HIGH,
consulting), `counsel` (catalog licensing), `test-agent` (LOW).

**Technical unknowns:** whether the 200 px primary-action target survives a complex event
(`ui-ux-critic-loop.md` R5-B); enrichment cost per catch at real volume.

**Validation:** re-run the critic loop as **Round 6, by measurement**; one real tournament
with friendly users; an offline-to-enriched integration test.

**Exit criteria:**
1. One navigation system per tournament screen; primary action < 200 px at 320 × 568.
2. A tournament fish is logged once and appears in both the Fish Log and the leaderboard.
3. > 95 % of synced catches enrich within 15 minutes (if Gate A opened).
4. The gear ladder reaches a known reel in ≤ 5 taps, ≤ 2 from recents.
5. Critic-loop Round 6 measured mean ≥ 7.5 with no category below 7.0.
6. One real (non-demo) tournament completed end to end.

---

## 5. Phase 2 — Intelligence and visualisation

**Complexity:** High. New infrastructure.
**Duration:** 10–14 weeks.

| Work | Spec |
|---|---|
| Analytical store + ETL | `data-architecture-expansion.md` §8 |
| `agg_*` tables with build-time suppression | same |
| My map (own catches, offline, Leaflet) | `fisheries-intelligence-map.md` §6.1 |
| Community map (k-gated, delayed) | same — **gated on data volume, not on a date** |
| `data_access_grant`, `research_project`, grant UI, coordinate receipts | `privacy-consent-...` §19 |
| Export service with manifests | `fisheries-intelligence-map.md` §9.3 |
| Data-quality scoring | `biostat` |
| Map provider evaluation | `fisheries-intelligence-map.md` §9.1 |

**Dependencies:** P0, P1, Gate A. The community map additionally depends on **enough users
in one region for k ≥ 5 to leave anything visible** — the real gate.

**Risks:** the community map may be blank for a year; map licensing has a cost cliff; CPUE
may be undefendable for most of the dataset.

**Specialists:** `architect` (HIGH), `biostat` (HIGH), `head-dev` (MEDIUM), `ux-ui`
(MEDIUM), `cfo` (provider cost ceiling).

**Technical unknowns:** ETL cost at volume; whether Postgres suffices as the analytical
store (it should, for a year); tile hosting economics.

**Validation:** a differencing-attack test suite; an analyst's judgement on whether a real
export is usable; p95 latency budgets.

**Exit criteria:**
1. My map works fully offline with the angler's own catches.
2. Every shared surface reads only from suppressed-at-build aggregates; the map service
   has no select privilege on `catch`.
3. A real export is produced with a complete manifest and reviewed by someone outside the
   team.
4. Community map ships **only** when measured cell coverage passes the k threshold in at
   least one region.

---

## 6. Phase 3 — AI features

**Complexity:** Very high, and mostly not software.
**Duration:** 6–12 months, dominated by data collection.
**Gate:** B (server media). **Without it, Phase 3 does not start.**

| Work | Spec |
|---|---|
| Object storage, EXIF stripping, content hashing, moderation | `privacy-consent-...` §11 |
| Consented image collection through normal use | `ai-fish-identification.md` §9.1 |
| Expert-verification workflow | same §6.4 |
| Trait-key vs model comparison study | same §9.3 — **the go/no-go** |
| On-device model, one region, ≤ 60 species | same §9.4 |
| Species-specific evaluation + published report | same §9.3 |
| Biometric validation study (2–3 species, controlled) | `fish-biometric-reidentification.md` §6.4 |
| Biometric product surface | same — **only for species that passed** |

**Dependencies:** Gate B; a vector index; expert reviewer time; a tagging-programme partner
for biometrics.

**Risks:** 500 verified images × 60 species is the real cost and it is measured in months of
expert time; the trait keys may simply win for the species that matter; biometrics probably
does not work for uniform species; a wrong "legal to keep" is the liability event.

**Specialists:** `biostat` (HIGH), `counsel` (HIGH), `architect` (HIGH), an actual
ichthyologist (not on the team), `head-dev` (MEDIUM).

**Technical unknowns:** on-device model size vs accuracy at 60 classes; calibration
stability; whether re-ID precision exceeds 0.90 for any species our users catch.

**Validation:** held-out evaluation with per-species and per-slice reporting; the trait-key
comparison; a published biometric study **including null results**.

**Exit criteria:**
1. Per-species precision ≥ 0.85 for every offered species; protected-species recall ≥ 0.95;
   ECE < 0.05.
2. The model matches or beats the trait key on every group a key covers, **or** the key
   stays primary and the model's scope shrinks accordingly.
3. A published biometric study for 2–3 species, with the honest verdict.
4. No feature can set a verification status or a legal conclusion — proven by test.

---

## 7. Phase 4 — Government pilot

**Complexity:** Medium technically, high organisationally.
**Duration:** one season plus 3–6 months of legal and security work beforehand.

| Work | Spec |
|---|---|
| `government_organization`, `agency_program`, `report_submission`, `license_link` | `government-fisheries-partnership.md` §8 |
| Agency dashboard (WCAG 2.1 AA, data-table equivalents) | same §7.4 |
| Programme enrolment + consent | same §7.2 |
| Reporting workflow with offline receipts | same §7.3 |
| Security package, VPAT, incident-response runbook | same §10 |
| Licence-link proof of concept (self-declared + hashed) | same §8 |
| Fish Legal agency authorship for one pack | `fish-legal-agency-integration.md` §6.4 |
| Published pilot report | same §15 |

**Dependencies:** P0 discovery, P2 aggregates and exports, `counsel` throughout, a signed
data-sharing agreement.

**Risks:** the incumbent licence vendor; procurement timelines; public-records exposure of
angler data; political change; the possibility that the agency is a data partner rather
than a customer (§18.8 of that spec).

**Specialists:** `ceo` (relationship), `counsel` (HIGH, critical path), `biostat` (bias
statements), `architect`, `ux-ui` (accessible dashboard).

**Technical unknowns:** what data shape an agency analyst can actually use — answerable only
by asking one.

**Validation:** an agency analyst answering *"could you use this in a stock assessment?"*.
That question is the exit criterion; nothing else is.

**Exit criteria:**
1. One signed pilot, one fishery, one season.
2. ≥ 200 enrolled anglers; ≥ 60 % of the pilot area meeting k ≥ 5.
3. A published report, including limitations and null findings.
4. ≥ 1 Fish Legal pack upgraded to agency-reviewed.
5. A written go/no-go on Level 2 based on evidence, not enthusiasm.

---

## 8. Phase 5 — Multi-region expansion

**Complexity:** High and mostly non-technical.
**Duration:** open-ended. **Do not start before Phase 4 has a verdict.**

Additional states; freshwater coverage; Mexico and international regulation packs;
white-label agency deployments; H3/S2 cell replacement for international geography
(`data-architecture-expansion.md` §12); localisation; per-jurisdiction legal review.

**Risks:** ~50 regulation packs is already more maintenance than is funded
(`fish-legal-agency-integration.md` §18.2). Expanding coverage before solving maintenance
multiplies a known problem. **The honest first move in Phase 5 may be to *retire* packs we
cannot keep current.**

**Exit criteria:** each new jurisdiction has a maintained regulation pack, a legal review,
and a named owner. No jurisdiction ships without all three.

---

## 9. What must not be built, and when

| Do not build | Until |
|---|---|
| Agency-scale architecture | a pilot is signed |
| Community map | measured k-coverage passes in one region |
| 3-D ocean visualisation | never, on current data resolution (`fisheries-intelligence-map.md` §4) |
| Per-licence fee machinery | H4 is validated (it probably will not be) |
| Revenue-sharing accounting | `counsel` clears the conflict-of-interest question |
| Mandatory reporting flows | authorising legislation exists |
| Biometric product surface | that species' validation study passes |
| AI ID for a species | 500 verified images and a published evaluation |
| A second catch-record system | never again |
| Recapture leaderboards or badges | never (`fish-biometric-reidentification.md` §12) |

---

## 10. Cross-phase risks

1. **Gate A and Gate B are founder decisions that block a third of the brief.** Naming them
   is more useful than designing around them.
2. **`counsel` is on the critical path of four phases** and is a HIGH-tier, scarce resource.
   Sequence their work explicitly or it becomes the bottleneck nobody scheduled.
3. **The tournament section has never run against real data.** Every estimate about it is
   uncertain until one real event happens.
4. **Maintenance debt compounds**: ~50 regulation packs, a growing equipment catalog, model
   versions, provider datasets. Each new dataset is a recurring commitment, and none is
   currently funded.
5. **Scientific credibility is spent once.** One premature claim — a CPUE figure, a
   biometric match, an AI identification — costs more than the feature is worth.
6. **Privacy retrofits are impossible.** The rules must land in Phase 0 or the expansion
   inherits a foundation that cannot be fixed later.
