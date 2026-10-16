# AI fish identification

**Status:** Proposed — **unblocked 2026-09-15** (`SPEC.md` D28 restores server media). Now gated on data collection, not permission.
**Date:** 2026-09-15
**Governs:** photo-based species suggestion, its evaluation, its safety messaging, and its boundaries
**Extends:** `docs/specs/fishing-passport-wildlife-boat-games.md` §15–§17, `src/features/fish-id/`
**Audit:** `00-repository-audit.md` §3.7, §5, §6 G2
**Phase:** 3 (prototype), with a Phase 1 data-collection prerequisite

---

## 1. Problem statement

The brief asks for a plant-ID-style camera feature returning ranked species candidates with
confidence, distinguishing features, look-alikes and regulatory warnings.

Three things about this repository change how that should be built.

**First, a deterministic baseline already ships.** `src/features/fish-id/` asks two
questions from the WDFW/ADF&G salmon key — what the spots do on the tail, what colour the
gum line is — and identifies five Pacific salmon species from an agency-published key. Its
stated principle is *consequence, not coverage*. That feature is offline, free, auditable,
and cites the agency that wrote the rules. **Any model must be evaluated against it, not
instead of it.** For salmon, a two-question key is very hard to beat and impossible to beat
on auditability.

**Second, there is no photo infrastructure.** Photos live as IndexedDB blobs on one device.
There is no server storage, no EXIF stripping, no content hashing, no moderation. The
founder killed this on cost on 2026-09-03. **AI Fish ID is not blocked on model quality;
it is blocked on that decision.**

**Third, `ROADMAP.md` Part 3 killed photo identification** — *"wrong answers are worse than
no feature"* — and the passport spec partly reversed it under strict terms: a ranked
suggestion that never sets a verification status or a legal conclusion. Those terms are
correct and this spec adopts them without loosening them.

---

## 2. Users and stakeholders

Angler who does not know what they caught; angler who does and wants it logged faster;
angler deciding whether a fish is legal to keep (**the dangerous one**); tournament judge
(assist only); researcher needing labelled data; `counsel` (a wrong "legal to keep" is the
liability event); the model itself, which will be wrong and must be designed to be wrong
safely.

---

## 3. Product goals

1. Reduce the friction of logging a species an angler cannot name.
2. Return **ranked candidates with calibrated confidence**, never a single answer.
3. Say "I do not know" often and early.
4. Be region-aware: a fish photographed in Monterey is not an Atlantic species.
5. Generate labelled ground truth as a by-product of honest use.
6. **Never** be the basis for a retention decision, a legal identity, a tournament
   verification, a record, or a scientific confirmation.

---

## 4. Non-goals

- Replacing the trait-key packs. They are better where they exist.
- Identifying every fish on earth. Coverage without consequence is the failure mode the
  existing feature was designed against.
- On-boat real-time video identification.
- Setting `verification_status` on anything. Passport spec §17 already forbids it.
- Automated enforcement, reporting or flagging of a suspected illegal catch. **The product
  never reports an angler to anybody.**

---

## 5. User stories

1. As an angler, I photograph a fish, and get: *"Most likely **Vermilion rockfish** (72 %).
   Also possible: Canary rockfish (19 %), Yelloweye (4 %)."* with what separates them.
2. As an angler, the model is unsure and says *"I cannot tell these apart from this photo.
   Take one of the whole fish, side on, in daylight — or answer two questions."* and hands
   me to the trait key.
3. As an angler, a candidate is protected or closed here and the result says so
   **prominently, before the identification**, with the Fish Legal card attached.
4. As an angler, the model is wrong, I correct it, and the correction becomes training data
   with my consent.
5. As an angler with no signal, I get either on-device inference or an honest *"needs a
   connection"*, never a spinner that fails silently.
6. As a judge, an AI suggestion appears as a signal beside the evidence, clearly labelled,
   and I decide.
7. As `biostat`, I can see per-species precision and recall, look-alike confusion pairs, and
   calibration, before anyone claims the feature works.

---

## 6. Complete workflow

### 6.1 Capture → suggest → decide

```text
photo (camera or library)
  └─ on-device quality gate: blur, exposure, subject size, obvious non-fish
  └─ region + season + water class from the catch context (already known)
  └─ inference (on-device model first; cloud for the hard tier)
  └─ region filter: candidates not plausible here are demoted and LABELLED as such,
       never silently removed — "not expected here" is information
  └─ out-of-distribution check
  └─ ranked candidates + calibrated confidence + distinguishing features
  └─ if top-1 below threshold OR top-2 within margin → UNCERTAIN
       └─ offer the trait key if one covers these candidates
       └─ offer follow-up questions ("Is the gum line black or white?")
  └─ angler picks, or types their own, or leaves it unresolved
  └─ ai_identification_run recorded with model version and what the angler chose
```

**Rule A1.** The angler's choice is always the stored species. The model's suggestion is
recorded alongside it and never overwrites it.

**Rule A2.** Confidence is **calibrated**, not a softmax score. A reported 70 % must mean
that of all predictions at 70 %, about 70 % are right — measured on held-out data and
re-measured per model version. An uncalibrated percentage is a lie with a decimal point.

**Rule A3.** Where a trait key covers the candidate set, the trait key is offered **first**
and its result outranks the model's. An agency-published key beats a model with no
provenance, every time.

### 6.2 The uncertainty rules

`UNCERTAIN` is returned when any of:

- top-1 calibrated confidence < 0.60, or
- top-1 − top-2 < 0.15, or
- the OOD detector fires (an eel, a hand, a boat deck, a bird), or
- the top candidate is implausible for the region **and** no plausible candidate clears 0.5,
  or
- image quality is below the gate, or
- **the top candidate or a close runner-up is protected, closed, or size-regulated in this
  region** — the safety bias in §6.3.

**Rule A4.** `UNCERTAIN` is a good outcome, presented without apology. The copy is *"I
cannot tell from this photo"*, not *"Sorry, try again"*. A feature that is embarrassed by
its own uncertainty will be tuned until it stops expressing it.

### 6.3 The safety asymmetry

The costs are not symmetric. Calling a legal fish protected costs a released fish. Calling
a protected fish legal costs a citation, a dead protected animal, and the product's
credibility with every agency it wants to work with.

**Rule A5.** When any candidate within the top-3 is protected, out of season, or
size-regulated in the active region, the result leads with that warning and the
identification becomes advisory regardless of confidence. Thresholds are asymmetric by
design and this is not a bug to be tuned away.

**Rule A6.** Every result carries, non-dismissibly:
*"A suggestion, not an identification. Do not keep a fish based on this. Check {agency}."*

### 6.4 Correction and ground truth

A correction writes `ai_identification_run.corrected_species_id` plus a `catch_amendment`.
Ground truth is only created when:

- an expert reviewer confirms it, **or**
- the trait key and the angler agree, **or**
- a tournament judge confirmed the species on the same catch, **or**
- the angler is a verified expert contributor for that species group.

**Rule A7.** An angler's unverified correction is a *label candidate*, not ground truth.
Training on unverified user labels produces a model that confidently reproduces common
misidentifications — the sculpin/scorpionfish problem, industrialised.

---

## 7. Screen and component requirements

Extends `fish-id-home.tsx` and `pack-wizard.tsx`; reuses the species picker.

- **Camera guidance before capture**: an overlay showing the required framing (whole fish,
  side on, flat, something for scale). Most identification failures are photography
  failures.
- **Results**: top candidate with its calibrated confidence as a **word plus a number**
  ("Likely · 72 %"), then up to four alternatives. Never a single answer, ever.
- **Distinguishing features** per candidate, in plain language with a figure where the trait
  packs already have one (`trait-figure.tsx` exists).
- **Look-alike pairs** shown explicitly: *"Often confused with Canary rockfish — check the
  lateral line."*
- **Regulatory band** above the results when Rule A5 fires, in `amber-flag`, with the
  Fish Legal card.
- **Photo quality feedback** is specific: "too blurry", "fish too small in frame", "too
  dark" — never a generic retry.
- **Trait-key handoff** as a first-class button when Rule A3 applies.
- **Correction** is one tap from the result and from the catch detail.
- Photos remain **optional** for personal logging. Required only where a tournament,
  record, research programme or agency programme requires them — and the requirement comes
  from that programme, never from this feature.

---

## 8. Data requirements

```sql
ai_model_version (
  id text pk, task text not null check (task in ('SPECIES_ID','QUALITY','OOD')),
  architecture text, trained_at date not null,
  training_set_id text not null, class_count integer not null,
  regions text[] not null, calibration_method text not null,
  eval_report_url text not null,            -- REQUIRED. no model ships without one.
  deployed_at timestamptz, retired_at timestamptz,
  on_device boolean not null default false
);

ai_identification_run (
  id uuid pk, angler_id uuid not null references angler(id) on delete cascade,
  catch_id uuid references catch(id) on delete cascade,
  media_id uuid not null, model_version_id text not null references ai_model_version(id),
  region_id text, water_class text,
  inference_location text not null check (inference_location in ('DEVICE','CLOUD')),
  outcome text not null check (outcome in ('RANKED','UNCERTAIN','REFUSED_QUALITY','REFUSED_OOD','ERROR')),
  image_quality_score numeric, ood_score numeric,
  latency_ms integer, created_at timestamptz not null default now(),
  chosen_species_id text references species(id),      -- what the ANGLER chose
  corrected_species_id text references species(id),   -- a later correction
  ground_truth_species_id text references species(id),-- only via Rule A7
  ground_truth_source text check (ground_truth_source in
    ('EXPERT','TRAIT_KEY_AGREEMENT','JUDGE','VERIFIED_CONTRIBUTOR'))
);

ai_identification_candidate (
  run_id uuid not null references ai_identification_run(id) on delete cascade,
  rank integer not null, species_id text not null references species(id),
  raw_score numeric not null, calibrated_confidence numeric not null,
  region_plausible boolean not null,
  regulatory_flag text check (regulatory_flag in ('PROTECTED','CLOSED','SIZE_LIMITED','NONE')),
  primary key (run_id, rank)
);
```

Media lives in object storage (`data-architecture-expansion.md` §6). Embeddings live in the
vector index and are deleted with their media (privacy §6.6).

---

## 9. Model, training and evaluation requirements

### 9.1 Training data

- **Regional first.** A model covering the ~120 species an angler actually encounters in
  Southern California, correctly, beats a global model that is confident and wrong.
- Sources: licensed image sets, agency photo libraries, expert-verified user submissions
  under explicit consent, and museum/ichthyology collections where terms allow.
- **Consent is explicit and separate.** Using an angler's photo to train is a distinct
  consent from storing it (privacy §6.2). Default **off**.
- Minimum per class before a species is offered at all: **500 verified images spanning ≥ 3
  photographers, ≥ 2 seasons, and both fresh and handled states.** Below that the species is
  not in the label set — it is not "low confidence", it is absent, and the model says
  "unknown species" rather than picking a neighbour.

### 9.2 Labels and taxonomy

Labels map to `species_taxon` (`data-architecture-expansion.md` §7.2) with external
identifiers. **Groups are first-class labels**: "rockfish (unspecified)" is a correct and
useful answer where the species-level call is not supportable from a photo, and the ontology
already treats groups as first-class.

### 9.3 Evaluation — the part that decides whether this ships

Held-out test set, stratified by species, region, season, lighting and handling state.
Reported **per species**, never as a single headline accuracy:

| Metric | Requirement |
|---|---|
| Per-species precision / recall | Reported for every class; a species below 0.80 precision is not offered |
| **Look-alike confusion matrix** | Explicitly evaluated on known pairs: vermilion/canary/yelloweye rockfish; kelp/sand bass; the five Pacific salmon; spotfin/yellowfin croaker; the surfperch complex |
| Calibration (ECE / reliability curve) | ECE < 0.05, with the curve published |
| Juvenile and sex variation | Separate slices; a model trained on adults will fail on juveniles, which is exactly when identification matters most |
| Poor light, underwater, wet-hands, partial fish | Separate slices, each reported |
| OOD detection | AUROC > 0.90 against non-fish and out-of-region fish |
| **Protected-species recall** | **> 0.95.** A missed protected species is the failure that ends the agency relationship. |
| Trait-key comparison | For every species group covered by a trait pack, the model must **match or beat** the key on the same images, or the key stays primary (Rule A3) |

**Rule A8.** No model version deploys without a published `eval_report_url`. The schema
makes it `not null` so this cannot be skipped under deadline.

### 9.4 On-device vs cloud

| | On-device | Cloud |
|---|---|---|
| Latency | ~200 ms | 1–3 s |
| Offline | Works | Does not |
| Privacy | Photo never leaves | Photo uploaded |
| Capacity | Small model, ~50–150 classes | Large model, full label set |
| Cost | Zero marginal | Per-inference |

**Recommendation: on-device first, as a hard requirement.** The use case is a boat with no
signal. A cloud-only feature is unavailable exactly when it is needed, and it uploads a
photograph of a fish and its metadata for every identification — a privacy cost the
on-device path avoids entirely. Cloud is the escalation tier for an uncertain on-device
result, with explicit consent per upload.

---

## 10. Offline behaviour

- On-device inference works fully offline. This is the primary path.
- Trait keys already work offline and remain the fallback.
- Cloud escalation queues with the catch and runs on reconnect, attaching its result to the
  catch afterwards. It never blocks logging.
- Model bundles download over wifi only, are versioned, and are applied atomically.
- The species picker works with no model at all. AI is an accelerator on a path that
  already exists.

---

## 11. Privacy and security requirements

1. **EXIF GPS stripped on ingest**, before storage (`ontology.md` §6 item 1). Non-negotiable
   and it is a Phase-2 blocker for any media feature.
2. Photos are private by default. Cloud inference requires per-photo consent with a clear
   statement of what is uploaded.
3. Training consent is separate, explicit, default off, and revocable — with the honest
   caveat that a model already trained cannot unlearn one image (privacy §6.6). Say that
   **before** the consent, not after the withdrawal.
4. Inference requests carry no coordinates. Region is a coarse identifier
   (`southern_california`), not a position.
5. Model bundles are signed; a tampered model producing a confident "legal to keep" is the
   highest-severity integrity risk in this feature.
6. No image is retained from a cloud inference beyond the request unless training consent
   was given.
7. Runs are angler-owned rows under the standard RLS.

---

## 12. Accessibility requirements

- Results are text-first. Confidence is a word and a number, never a bar alone.
- Every figure has a text description of the distinguishing feature — the trait packs
  already do this and it is the pattern.
- Camera guidance is announced, not purely visual, and a library-upload path exists for
  anyone who cannot frame a live camera.
- The regulatory warning is in the accessible name path of the result, not a visually
  adjacent sibling.
- Colour never distinguishes candidates or confidence tiers.
- The whole feature is skippable: the species picker is always one tap away and is never
  gated behind a photo.

---

## 13. Edge cases

| Case | Behaviour |
|---|---|
| Not a fish | OOD fires; *"That does not look like a fish."* |
| Multiple fish in frame | Ask for one fish, or identify the largest and say which |
| Fish in a net / underwater / in hand | Separate evaluation slices; degraded confidence, stated |
| Juvenile | Separate slice; many juveniles are not identifiable from a photo and the honest answer is the group |
| Hybrid | Not in the label set; expect `UNCERTAIN`. Say "possibly a hybrid" only where the group is known for it |
| Filleted or headless | Refuse. Identification from fillets is a different, harder, and legally loaded problem |
| Species outside its known range | Demoted and labelled "not expected here" — range shifts are real signal and must not be silently deleted (this is a climate-relevant observation) |
| Region unknown | Global model, wider uncertainty, stated |
| Protected species suspected | Rule A5. Warn, advise release, **never report the angler** |
| Model unavailable | Trait key or species picker; the feature degrades, logging does not |
| Angler disagrees and is right | Correction stored; feeds §6.4 |
| Angler disagrees and is wrong | Their choice is stored anyway (Rule A1). We do not argue with users about their own catch. |

---

## 14. Failure states

- Model load failure → trait key / picker, with a quiet note.
- Inference timeout → `UNCERTAIN`, never a hang.
- Cloud unreachable → on-device result stands, or honest unavailability.
- Quality gate rejects → specific guidance, retry, and an always-available "skip and pick
  manually".
- Calibration drift detected in production → the model version is demoted to advisory-only
  and an alert fires. Drift is expected, not exceptional.

---

## 15. Analytics and success metrics

| Metric | Target |
|---|---|
| Top-1 accuracy on the evaluation set, **per species** | ≥ 0.85 for offered species |
| Protected-species recall | ≥ 0.95 |
| Calibration ECE | < 0.05 |
| `UNCERTAIN` rate | **Reported, not minimised.** A falling uncertain rate with flat accuracy is a tuning failure. |
| Angler correction rate | Reported per species — the honest field accuracy signal |
| Median time from photo to logged species | < 10 s |
| Anglers who log a species they could not otherwise name | The feature's actual purpose |
| Retention decisions influenced by AI | **Unmeasurable, and that is the point.** Rule A6 exists because we cannot measure this. |

---

## 16. Acceptance criteria

1. No model version deploys without `eval_report_url` (database-enforced).
2. A species with < 500 verified training images across ≥ 3 photographers is absent from
   the label set, proven by a build-time check.
3. Confidence is calibrated and the reliability curve is published per version.
4. Rule A5 fires for every protected/closed/size-limited candidate in the active region,
   proven by a test across every region pack.
5. Rule A6's disclaimer is present on every result surface, proven by a coverage test.
6. The trait key outranks the model wherever a pack covers the candidate set (Rule A3),
   proven by a test.
7. On-device inference works with the network disabled.
8. EXIF GPS is absent from every stored image, proven by an ingest test.
9. Unverified angler corrections never enter the training set, proven by a pipeline test.
10. Nothing in this feature can write `verification_status` on a tournament catch, proven by
    a test.
11. `npm run verify` passes.

---

## 17. Dependencies

- ~~Founder ruling on server media.~~ **Granted 2026-09-15 (`SPEC.md` D28).** The
  remaining blocker is the storage build itself plus expert-verified image collection.
- Object storage with EXIF stripping (privacy §11).
- `species_taxon` with external identifiers.
- Training image licensing — `counsel`.
- `biostat` — evaluation design, calibration, slice definitions, and the sign-off that the
  numbers support the claim.
- Vector index for embeddings (`data-architecture-expansion.md` §6).
- The existing trait packs, which are the control arm.

---

## 18. Risks and unanswered questions

1. **Somebody will keep a fish because of this feature.** Rule A6 and the asymmetric
   thresholds reduce it; nothing eliminates it. `counsel` must confirm the disclaimer
   position is defensible, and `ceo` must accept the residual risk explicitly.
2. **Training data is the whole project.** 500 verified images × 120 species = 60,000
   expert-verified photographs. That is the real cost, and it is measured in months of
   expert time, not GPU hours.
3. **The trait keys may simply be better** for the species that matter most. If salmon and
   rockfish — the two highest-consequence groups — are better served by the existing keys,
   the honest scope of AI Fish ID is *the low-consequence long tail*, which is also the
   segment with the least value. **This is the question that should be answered before
   anything is built.**
4. **Uncertainty will be tuned away under pressure.** A feature that says "I don't know"
   30 % of the time will be called broken. Rule A4 and the reported-not-minimised metric
   are the defence and they are cultural, not technical.
5. **On-device models are small.** 150 classes at acceptable accuracy on a phone is
   achievable; 1,000 is not. Regional scoping is the answer and it constrains international
   expansion.
6. **Look-alike pairs are where the value and the danger both are.** A model that nails
   yellowtail and fails on the rockfish complex has solved the easy half of a problem nobody
   had.
7. *Open:* does an AI suggestion, recorded on a catch, become discoverable evidence in an
   enforcement action against a user? `counsel` — and the answer may argue for **not storing
   rejected candidates at all**.

---

## 19. Recommended implementation phase

**Phase 1 (prerequisite, no AI):** build storage with EXIF stripping (D28 is granted);
begin collecting consented, expert-verified images through normal use. Without this, Phase 3
cannot start — and this collection takes a season regardless of engineering speed.

**Phase 3a:** the smallest credible experiment — see `13-final-decision-report.md` §10.

**Phase 3b:** on-device model for one region, ≤ 60 species, with published evaluation.

**Phase 3c:** cloud escalation tier, more regions, expert review workflow.
