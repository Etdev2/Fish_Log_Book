# Codex review of Fish Log Book PR 172

Reviewer: Codex — Reef Calder. Builder: Claude — Kelp Halyard.

## Comparison point

- PR: https://github.com/Etdev2/Fish_Log_Book/pull/172
- Base (merge-base of origin/main and the builder branch): `79bdb14622ce94940362c215e2517ee62c4a9efb`.
- Reviewed head: `ce916e05a4b2f4e6dc18567e5b88dc319d299fad`.
- Current main observed during review: `5129d734983af44226a44ba26238d378c01f1720`; this is not the merge-base. This review uses the three-dot comparison required by Et.
- The first head was `2d93fe16c401f20a53c1ab633ac5af43ea34f315`, then `acd3adbc6c4fe891ab69bab33f84c18007774f89`. Both moves were detected; the added list/Fin ID/card/test changes were reviewed again. The original six screenshots and later screenshots 07 and 08 were inspected.
- No PR existed initially. After PR 172 opened, the review switched to it. Neither the builder branch nor main was changed by this reviewer.

## Verdicts

| Axis | Verdict | Reason |
| --- | --- | --- |
| Standards | **FAIL** | Incorrect attribution is newly exposed on the catalog, explicit band-word test proof is missing, and the project still fails the control room's strict TypeScript baseline. See findings and baseline distinctions below. |
| Spec | **FAIL** | The catalog omits quillback's no-take warning and the explicit workstream B unit-test requirement for displayed band words is not met. Workstream A's real-iPhone behavior remains **INCONCLUSIVE**. |

Scope is handoff workstreams A, B and C, read independently of the PR description. D/new photo sourcing and E/chart implementation are excluded. ADR 013 is a proposal, not code to approve. The list/Fin ID additions were inspected for shared-card regressions; their missing new photos are not treated as failures of A–C.

## Findings

### P1 — Catalog drops the existing quillback prohibition

`src/features/fish-legal/rockfish-catalog.ts:53` derives noRetention only from an ID profile or the ontology's protected flag. Quillback has no ID profile and its ontology entry is regulated, so the generated catalog row has noRetention=false. Consequently `src/features/fish-legal/components/rockfish-catalog.tsx:42` omits the warning and line 52 offers the ordinary "Current limits" wording.

This is not a missing regulation source: **the existing rules already prohibit quillback**, in `src/features/fish-legal/reg-data.ts:529–535`. CDFW's current [groundfish summary](https://wildlife.ca.gov/Fishing/Ocean/Regulations/Groundfish-Summary), checked 2026-10-18, also lists bronzespotted, cowcod, quillback and yelloweye as no-retention. Independent browser inspection reproduced the missing catalog warning. The PR/worklog claim that the rules data makes quillback keepable is inaccurate (`docs/team/worklog/2026-10-18-01-head-dev.md:58–60`).

Derive the catalog warning from authoritative applicable prohibition data or a reviewed conservative flag; add a behavioral regression covering all four prohibited species. Do not change correct rules data to repair this presentation bug. `src/features/fish-legal/rockfish-catalog.test.ts:36–38` currently checks only cowcod and yelloweye, so it passes despite the omission. Bronzespotted's flag at `rockfish-catalog.ts:28` is correct.

### P2 — The new catalog shows known-wrong artist credits

`src/features/fish-legal/components/rockfish-catalog.tsx:37` displays the calico and widow drawings using `SpeciesPicture`, whose caption outputs the registry credit (`src/features/fish-legal/components/species-picture.tsx:43`). The underlying registry entries at `src/features/fish-legal/species-photos.ts:79` and `:82` name Amadeo Bachar. I inspected the bundled files: their visible signatures instead read L. Sinclair and C. Matley. Claude also records the mismatch at `docs/team/worklog/2026-10-18-01-head-dev.md:29–32`.

The registry problem predates this PR, but the catalog newly exposes it and the spec's hard attribution requirement still applies. Correct the credits from the agency/source licence record or withhold the affected drawing pending proof. This finding does not require completing D's missing-photo sourcing. The exact reuse rights of the CDFW drawings remain unproven here; a generic agency-attribution string is not independent licence verification.

### P2 — Workstream B's displayed-band unit-test criterion is not covered

The acceptance criterion is `docs/team/handoff/2026-10-18-map-id-photos-prompt.md:95–96`. The new tests at `src/core/rules/identification/identify.test.ts:101–128` check null/strong/moderate enum results; they never test the displayed band words in `src/features/fish-legal/components/candidate-card.tsx:10–14`, nor a positive weak-band result. Searching all test files found no test of that exported mapping or the three displayed labels. The latest photo tests at `src/features/fish-legal/species-photos.test.ts:6–15` do cover the restricted-image and no-image choices, so that portion now passes.

Add meaningful coverage for all displayed words, no word before answers, weak-band behavior and the ranked-winner gate. A screenshot showing "Best match" does not satisfy the separate unit-test criterion for all band words.

## Baseline standards and governance findings

- **Pre-existing strict-lane gap:** `tsconfig.json:7–15` has strict=true but omits noUncheckedIndexedAccess, exactOptionalPropertyTypes, noImplicitOverride and noFallthroughCasesInSwitch required by Sweet Potato's TypeScript lane. `package.json:12` runs eslint without a zero-warning gate; verification still reports eight warnings. These files/settings are unchanged by this branch, so this is baseline noncompliance, not a new weakening. There are no new warnings in the changed files observed in this review. A successful verify command is not a strict-lane PASS.
- **Readiness/assignment: INCONCLUSIVE.** The review request identifies Claude as this builder, but the pre-build owner-ready/assignment record is not established. The original issue 159 records proposed lanes and a different prospective builder, not a ready assignment for this branch. The session's origin is described only in `docs/team/worklog/2026-10-18-01-head-dev.md:3–6`. This review does not invent missing authority evidence.
- **Builder clock/overlap proof: INCONCLUSIVE.** `docs/team/worklog/2026-10-18-01-head-dev.md:1` and `docs/team/worklog/2026-10-18-02-head-dev.md:1–5` record two stretches of one Claude session. No Agent Resources timecard exists in the reviewed builder tree. That is not evidence of a closed builder slot under the control-room contract. Open PRs 168 and 169, and the previous coordination record that their session stopped polling but retained watches, do not establish whether a separate builder was running concurrently. With cap.buildersAtOnce=1, overlap cannot be certified absent runtime/card evidence. No confirmed concurrent duplicate is alleged.
- **Usage:** PR usage is labelled unavailable; no measured token total is claimed. The duration wording was corrected on the moved head. The assertion that the iPhone no longer bounces (`docs/team/worklog/2026-10-18-01-head-dev.md:19`) is stronger than its own limitation at lines 56–57 permits.

## Acceptance and close-check matrix

| Requirement | Result and evidence |
| --- | --- |
| A: manifest generated/served | PASS in the built app: GET manifest.webmanifest returned 200/application-manifest JSON, standalone display, icons and token colours. Root metadata includes viewport-fit=cover and mobile/app metadata. Sources: `src/app/manifest.ts:13–27`, `src/app/layout.tsx:27–39`. |
| A: gate excludes manifest | PASS for compiled matcher: manifest is excluded while ordinary product routes remain included; `src/proxy.ts:103`. No production authentication settings or credentials were changed. |
| A: overscroll CSS and bottom dock | PASS for inspected Chromium layout: computed html/body overscroll=none; nav bottom=844 at both 320×844 and 390×844, no horizontal overflow. `src/app/globals.css:11–15`, `src/features/shell/components/shell-nav.tsx:134`, plus supplied Home screenshot. Desktop env safe-area inset is zero; this does not exercise an iPhone home indicator. |
| A: actual iPhone bounce/install behavior | **INCONCLUSIVE**. No real iPhone was available. `docs/team/worklog/2026-10-18-01-head-dev.md:56–57` acknowledges the same limitation. CSS presence, manifest JSON and desktop screenshots cannot prove the physical-device behavior. |
| B: photos/credits/placeholder in Fish ID and rockfish | Picture/placeholder wiring passes; correct attribution fails as above. Supplied salmon/bass/rockfish screenshots show real agency drawings. No missing D photo is counted as an A–C failure. |
| B: no percentages, no ranking before answers | PASS for the in-scope rendered screens inspected and code. `pack-wizard.tsx:153–164`, `rockfish-wizard.tsx:115–127`, `candidate-card.tsx:65–68`; matchBand returns null at zero answers. Fin ID's later change uses the same gate. |
| B: only engine's ranked winner says Best match | PASS in code and engine tests: `src/core/rules/identification/identify.ts:60–65`; no-rank and runner-up cases are covered. The heading also requires reading.ranked. |
| B: band words and photo-or-placeholder unit coverage | Photo choice PASS on latest head. Displayed words **FAIL** as above. |
| B: every image checked against source | Builder records an eye check at `docs/team/worklog/2026-10-18-01-head-dev.md:25–34`; all agency page comparisons cannot be independently reproduced with the blocked portal requests. The known wrong credit is concrete; broader source/rights verification remains **INCONCLUSIVE**. |
| C: catalog coverage and sorting | PASS for the required universe: 19 cards; inclusion tests cover all rockfish ID profiles, ontology rockfish and image keys, plus alphabetical order and uniqueness (`rockfish-catalog.test.ts:16–33`). A future image-only species omitted from the explicit extra list will fail the image-key inclusion test. |
| C: picture-or-placeholder and rules links | PASS: 18 catalog drawings decode when scrolled into view; bronzespotted has the honest placeholder and a rules link. Lazy images below the fold are not broken images. Catalog reachable via Fish Legal → Rockfish ID → catalog; the latest head deliberately removes a direct home link. |
| C: scientific names | The six new picture-only binomials at `rockfish-catalog.ts:28–33` match NOAA's [groundfish species table](https://www.fisheries.noaa.gov/s3/2026-02/fmp-text-am37-01-2026.pdf), pages 16–17: gilli, auriculatus, dallii, nebulosus, rastrelliger, serriceps. No discrepancy found in the inherited catalog binomials checked. This table is taxonomic evidence, not a retention-law source. |
| C: no-take flags | FAIL for quillback. Bronzespotted true is correct; the known no-take set is not fully enforced by the new test. |
| New photo-mat token | PASS: `src/core/design/tokens.json:108–111`, generated CSS and bg-photo-mat agree; white in both themes is deliberate for the agency drawings. tokens:check passes. |

## Commands and independent proof

At final head `ce916e05a4b2f4e6dc18567e5b88dc319d299fad`, the requested commands ran in sequence:

| Command | Exit |
| --- | --- |
| npm ci | 0 |
| npm run verify | 0 |
| npm run build | 0 |

Verify passed 99 test files / 1,089 tests and reported eight existing lint warnings. The production build completed, including the manifest route. `git diff --check` returned 0 and the detached review checkout had no tracked changes. Earlier-head results are not used to certify this moved head.

The accompanying [independent browser proof](2026-10-18-codex-photo-id-proof.json) records the final head, manifest/matcher checks, 320/390-pixel measurements, salmon answer transitions, all catalog image decodes and the four no-retention card texts. Chromium emulation is not an iPhone field test.

No approval, ready action, merge, deployment, production migration or push to Claude's branch was performed. The reviewer/spec branch is `codex/map-environment-spec-20261018`; it uses new documentation/proof/card paths only, with no file overlap against the builder diff.
