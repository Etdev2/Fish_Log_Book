# Fish biometric re-identification

**Status:** Proposed — **research programme, not a product feature.** Server media granted 2026-09-15 (`SPEC.md` D28); still gated on a validation study and a tagging partner.
**Date:** 2026-09-15
**Governs:** individual fish re-identification, recapture records, the incentive design
**Extends:** `ai-fish-identification.md`, `privacy-consent-and-data-governance.md`
**Audit:** `00-repository-audit.md` §5 (the gamification ruling)
**Phase:** 3, behind AI Fish ID, and only after a validation study

---

## 1. Problem statement

The brief proposes identifying *individual* fish from photographs — natural patterning,
spots, fin shapes, scars, colour distribution, body proportions — so that a released fish
recaptured later can be recognised.

The brief is right to call this experimental. This spec goes further: **it is a research
programme whose first deliverable is a finding, not a feature.** That finding may be "this
does not work for the species our users catch", and the programme must be designed so that
finding is cheap to reach and acceptable to report.

Three reasons for that stance.

**1. Species-dependence is not a detail; it is the whole result.** Individual re-ID is
established for whale sharks (spot constellations), manta rays (ventral patterns), grouper
and some salmonids. It is largely unestablished for the species this product's users
actually catch — yellowtail, calico bass, halibut, rockfish, croaker — which are close to
uniform in appearance, change colour with stress and depth, and are photographed at
arbitrary angles on a moving boat.

**2. Fish change.** A released 60 cm fish is a 75 cm fish next year. Scars heal, fins
regrow, colour shifts with maturity and season. Every biometric assumption that works for a
static pattern is weaker here.

**3. Incentives point at animal welfare.** `ROADMAP.md` Part 3 already ruled that rewarding
logging corrupts the data. Rewarding *recaptures* is worse: it rewards catching a specific
fish again, handling it more, and photographing it at length. A recapture badge is a
welfare hazard wearing a conservation badge. §12 addresses this and it is the section that
matters most.

---

## 2. Users and stakeholders

Catch-and-release anglers; fisheries scientists (for whom a validated recapture is genuinely
valuable — it estimates growth, movement and survival); tagging programme operators (whose
physical tags are the ground truth); conservation organisations; tournament hosts (for whom
a false "this fish was already weighed" is a fraud detection tool **and** a defamation
risk); the fish.

---

## 3. Product goals

1. Determine, with evidence, **which species this is feasible for** — and publish the
   negative results.
2. Where feasible, surface a **possible** match with a confidence score and never a claim.
3. Integrate with physical tagging programmes, which are the only source of ground truth.
4. Create genuine scientific value: growth rates, movement, post-release survival.
5. Reward data quality and honest participation — never re-catching, never handling.

---

## 4. Non-goals

- A definitive individual identification. It will not exist, for these species, in this
  decade, at this photo quality.
- A leaderboard of recaptures.
- Any feature that makes a fish more likely to be targeted, handled longer, or photographed
  in more positions.
- Tournament disqualification on a biometric match alone (§11).
- Automatic recapture detection without an angler's consent to participate.

---

## 5. User stories

1. As a catch-and-release angler, I opt into the study, take two guided photos, and my fish
   joins the dataset.
2. As an angler, a fish I catch shows *"Possibly caught before — 18 Aug, 2.1 km away,
   58 cm. Confidence: moderate. Not confirmed."* with a way to say yes or no.
3. As an angler, I catch a tagged fish, photograph the tag, and the tag number confirms the
   match definitively — which is worth more than every pixel of pattern matching.
4. As a scientist, I can query confirmed recaptures with time-at-liberty, distance moved and
   growth, with the confirmation method on every row.
5. As an angler, I am **never** told my fish matched when it did not, because the threshold
   is set for precision and the copy is honest about the rest.
6. As a tournament host, a suspected duplicate submission is a signal I investigate, not a
   verdict I act on.
7. As a conservation partner, I fund a study and receive results including the null ones.

---

## 6. Complete workflow

### 6.1 Capture protocol

Re-ID succeeds or fails at capture. The protocol is the feature.

```text
1  Whole fish, side on, flat, filling the frame     REQUIRED
2  Opposite side                                    REQUIRED for bilateral-pattern species
3  Head / operculum close-up                        species-dependent
4  Tail / caudal fin                                species-dependent
5  Any tag, readable                                if present — this outranks everything
+  A scale reference in frame (the app's own card, or a ruler)
```

**Rule B1.** Time out of water is the binding constraint, not photo count. The protocol asks
for **at most two photos for any species**, with a visible timer and a *"put it back"*
prompt at 20 seconds. If the science needs five angles, the science does not get five
angles.

**Rule B2.** The protocol never asks an angler to reposition, re-handle or re-lift a fish
for a better photo. The app takes what it gets or records nothing.

### 6.2 Pipeline

```text
photo → quality gate (angle, occlusion, blur, scale reference present)
      → species identification (ai-fish-identification.md) — a match is only ever
        searched within one species
      → normalisation: orientation, perspective, scale, colour
      → feature extraction: species-specific embedding
      → ANN search within (species, region, time window)
      → candidate list with similarity
      → species-specific threshold
      → POSSIBLE_MATCH | NO_MATCH | INSUFFICIENT_QUALITY
      → angler and/or expert review
      → recapture_confirmation on agreement
```

**Rule B3.** A match is searched only within the same species and a bounded region and time
window. Cross-species and global search multiply false positives without adding plausible
recaptures.

**Rule B4.** Thresholds are **per species**, derived from that species' own validation
study, and set for **precision over recall**. A missed recapture costs a data point. A false
recapture costs credibility, and in a tournament it costs somebody their reputation.

**Rule B5.** Growth handling: similarity is scored with time-at-liberty as a covariate, and
a candidate whose implied growth is biologically impossible for the species and interval is
rejected regardless of visual similarity. Von Bertalanffy bounds per species; `biostat`
supplies them.

### 6.3 Confirmation ladder

| Level | Basis | Usable for |
|---|---|---|
| `TAG_CONFIRMED` | Physical tag number read on both captures | Science, publication, prizes |
| `EXPERT_CONFIRMED` | Two independent expert reviewers agree | Science |
| `ANGLER_CONFIRMED` | Both anglers agree, above threshold | Display only |
| `POSSIBLE` | Above threshold, unconfirmed | Display only, always labelled |
| `REJECTED` | Reviewed and rejected | Negative training data — valuable |

**Rule B6.** Only `TAG_CONFIRMED` and `EXPERT_CONFIRMED` enter a scientific dataset or
trigger any reward. This single rule removes almost all of the fraud surface, because
falsifying a tag number requires a physical tag.

### 6.4 The validation study — the actual first deliverable

Before any product surface:

- **Species:** 2–3, chosen for feasibility, not popularity. Candidates: a distinctly marked
  species (leopard shark, bat ray, some rockfish) and one uniform species as the control
  (calico bass), so the null result is measured rather than assumed.
- **Design:** a controlled set with known individuals — a tagging programme, an aquarium, or
  a hatchery — photographed under both ideal and realistic boat conditions.
- **Measure:** precision at fixed recall, per species; degradation with time-at-liberty
  (0–6, 6–18, 18+ months); sensitivity to angle, light and handling; false-match rate
  against 10,000 non-matching fish of the same species.
- **Exit:** publish the result **including the failures**. A species with < 0.90 precision
  at any useful recall is not offered, and we say so.

**Rule B7.** No product surface ships for a species before its study. The alternative —
shipping and learning from users — means telling anglers their fish matched when it did not,
which is exactly the credibility the fisheries-science relationship rests on.

---

## 7. Screen and component requirements

- **Opt-in**, per programme, never on by default. Explains the protocol, the handling time
  and what happens to the photos.
- **Guided capture** with an on-screen frame, a 20-second timer, and a prominent *"Put it
  back"* — which is the only element that should be able to interrupt the flow.
- **Result card**: *"Possibly caught before"* with date, distance, size then vs now, a
  confidence word (not a bare percentage), the photos side by side, and **Yes / No / Not
  sure**. Never *"This is the same fish."*
- **Recapture record** on both catches, with the confirmation level visible.
- **Study dashboard**: what the programme has learned, including null results. This is the
  page that makes the programme honest.
- **Tag entry** is prominent and separate: a tag number is worth more than the entire
  pipeline and the UI should say so.

---

## 8. Data requirements

```sql
fish_biometric_profile (
  id uuid pk, species_id text not null references species(id),
  region_id text, first_observed_at timestamptz not null,
  last_observed_at timestamptz not null, observation_count integer not null default 1,
  physical_tag_id text,                       -- the ground truth, when it exists
  tag_program text, status text not null default 'ACTIVE'
    check (status in ('ACTIVE','MERGED','RETIRED','DISPUTED')),
  merged_into uuid references fish_biometric_profile(id)
);

biometric_observation (
  id uuid pk, profile_id uuid references fish_biometric_profile(id),
  catch_id uuid not null references catch(id) on delete cascade,
  media_ids uuid[] not null,
  embedding_model_version text not null, embedding_id text not null,  -- vector store ref
  capture_quality numeric not null, angle_deg numeric, scale_reference_present boolean not null,
  length_mm integer, observed_at timestamptz not null,
  geo_cell_10km text,                         -- NEVER exact: this is a released-fish location
  created_at timestamptz not null default now()
);

recapture_candidate (
  id uuid pk, observation_a uuid not null references biometric_observation(id),
  observation_b uuid not null references biometric_observation(id),
  similarity numeric not null, threshold_used numeric not null,
  model_version text not null, days_at_liberty integer not null,
  distance_km numeric, growth_mm integer, growth_plausible boolean not null,
  status text not null default 'POSSIBLE' check (status in
    ('POSSIBLE','ANGLER_CONFIRMED','EXPERT_CONFIRMED','TAG_CONFIRMED','REJECTED')),
  created_at timestamptz not null default now()
);

recapture_confirmation (
  candidate_id uuid not null references recapture_candidate(id),
  confirmed_by uuid, confirmer_role text not null
    check (confirmer_role in ('ANGLER','EXPERT','TAG_MATCH','SYSTEM')),
  decision text not null check (decision in ('CONFIRM','REJECT','UNSURE')),
  reason text, confirmed_at timestamptz not null default now()
);
```

Embeddings live in the vector index, keyed by `embedding_id`, and are deleted with their
media (privacy §6.6). A model change re-embeds; it does not invalidate confirmations, which
are decisions, not scores.

---

## 9. API and service requirements

- Embedding and search run server-side. Too large for on-device, and unlike species ID this
  feature has no on-the-water urgency — a match found an hour later is just as useful.
- `POST /api/biometrics/observations` — enqueue; returns immediately. Nothing blocks the
  catch.
- `GET /api/biometrics/candidates?catch_id` — possible matches for review.
- `POST /api/biometrics/confirmations` — a decision with a reason.
- ANN search scoped by `(species, region, time window)` (Rule B3), with a hard cap on
  candidates returned.
- Re-embedding on model change is a batch job with a version column; old candidates keep
  their `model_version`.

---

## 10. Offline behaviour

- Photos and the observation record are captured and stored locally; everything else is
  server-side and asynchronous.
- No match result is available offline, and the UI says so rather than showing a stale one.
- Tag numbers are entered offline and are the highest-value offline capture in the feature.
- Nothing about this feature can delay or block the catch.

---

## 11. Privacy, welfare and integrity requirements

1. **Released-fish locations are 10 km cells, always.** A released, individually identified
   fish is a target. Its exact position is never stored on the observation and never shown
   to a second angler. This is stricter than the general ladder and it is deliberate.
2. A `POSSIBLE` match reveals to angler B only: date, coarse distance, and size. Never
   angler A's identity, never their spot.
3. Participation is opt-in per programme, revocable; withdrawal removes future
   participation and deletes embeddings (privacy §6.6).
4. **Tournament use is bounded.** A biometric duplicate signal is a `fair_play_signal` for a
   human to investigate — never a disqualification, never surfaced publicly, never shown to
   other competitors. A false accusation of cheating is the worst outcome this feature can
   produce, and it is worse than any missed cheat.
5. **Welfare gates**: the 20-second timer, the two-photo cap (Rule B1), the no-repositioning
   rule (Rule B2), and a hard product rule that **no reward is ever attached to catching a
   specific fish again**.
6. Expert reviewers see photos and measurements, not angler identities, for the review
   decision.

---

## 12. The incentive design (and what it must not do)

`ROADMAP.md` Part 3 is explicit: rewarding logging corrupts the data the product's
statistical claim rests on. That ruling applies here with more force, because the behaviour
being rewarded involves an animal.

**Permitted:**

- **Contribution credit** for photographing to protocol — earned at capture, whether or not
  a match is ever found. Rewards the *data*, not the *outcome*.
- **Tag-programme rewards**, funded and defined by the tagging programme, for reporting a
  physical tag. This already exists in the real world and is well understood.
- **Study milestones**: "this programme has now confirmed 50 recaptures" — collective, not
  individual.
- **Sponsor funding of the study**, acknowledged, with no per-angler prize.

**Forbidden, and this list belongs in the product's rules, not only in this document:**

- Any reward, badge, rank or points for **a recapture occurring**.
- Any leaderboard of recaptures or of individual fish.
- Any reward scaling with the number of photos or angles.
- Any reward for re-catching a fish previously caught by the same angler.
- Any public "most re-caught fish" surface, which is a map to a vulnerable animal.

**Rule B8.** If an incentive can be satisfied by handling a fish longer or catching it
again, it is forbidden. That is the test, and it is the whole of §12.

---

## 13. Edge cases

| Case | Behaviour |
|---|---|
| Same fish, opposite side, unilateral pattern | No match; documented limitation of the species protocol |
| Fish grew beyond plausible bounds | Rejected by Rule B5 regardless of similarity |
| Two genuinely identical-looking fish | Precision-weighted threshold rejects both; the honest outcome |
| Fish caught twice in one day | Likely genuine; still requires confirmation |
| Tag present but unreadable | Prompt to re-photograph the tag only — a tag is worth the extra frame in a way pattern is not |
| Angler A deletes their account | Their observations are deleted; confirmed recaptures retain an anonymised scientific record only if consent covered it — and the consent must say so before it is given |
| Model version change | Re-embed; existing confirmations stand |
| Species reclassified | Profiles follow the taxon chain |
| Suspected tournament duplicate | `fair_play_signal`, human investigation, no automatic action (§11.4) |
| Study finds a species infeasible | Feature removed for that species, result published. This is a success. |

---

## 14. Failure states

- Quality gate fails → *"That photo will not work for the study"* with a specific reason;
  the catch is unaffected.
- Embedding service down → queued indefinitely; nothing user-visible fails.
- Vector index unavailable → matching paused; capture continues.
- Model drift → thresholds re-derived; candidates below the new threshold revert to
  `POSSIBLE` and are never retro-confirmed.
- No match found → silence. **The absence of a match is not a message**, or every release
  becomes a small disappointment.

---

## 15. Analytics and success metrics

| Metric | Target |
|---|---|
| Precision at useful recall, per species (validation study) | ≥ 0.90 to offer; below that, do not |
| False-match rate against 10,000 non-matching same-species fish | < 1 % |
| Median handling time during the protocol | **< 20 s**, and this is a welfare metric that outranks every accuracy metric |
| Protocol abandonment (angler releases before the photos) | Reported and **expected**; a high rate is correct behaviour, not a funnel problem |
| `TAG_CONFIRMED` recaptures | The number that matters scientifically |
| Confirmed recaptures per 1,000 releases | Reported; will be small |
| Species evaluated and found infeasible | **Published.** A programme with no null results is not a study. |

---

## 16. Acceptance criteria

1. No species has a product surface before its validation study (Rule B7), enforced by a
   per-species feature flag keyed to a published study id.
2. Confidence is never expressed as a definitive claim; a copy test asserts the absence of
   "is the same fish" across every string in the feature.
3. Released-fish observations store `geo_cell_10km` only; the exact-coordinate column does
   not exist on `biometric_observation`, proven by schema.
4. A biometric signal cannot set a tournament catch's status, proven by a test.
5. The capture protocol enforces the 20-second prompt and the two-photo cap.
6. Growth-implausible candidates are rejected regardless of similarity, proven by a test.
7. Withdrawal deletes embeddings, proven by a test asserting the vector store is empty.
8. No reward in the system is triggered by a recapture occurring (Rule B8), proven by a test
   over the reward catalog.
9. `npm run verify` passes.

---

## 17. Dependencies

- ~~Server media.~~ **Granted 2026-09-15 (`SPEC.md` D28).**
- `ai-fish-identification.md` for species scoping — re-ID without species ID is unbounded.
- Vector index.
- **A tagging programme partner.** Without physical tags there is no ground truth, and
  without ground truth this is not science. *This is the single hardest dependency and it is
  a relationship, not a build.*
- `biostat` — study design, growth bounds, thresholds, and the authority to report a null.
- `counsel` — the tournament defamation risk (§11.4) and the animal-welfare position.
- `ceo` — acceptance that the first deliverable may be "this does not work".

---

## 18. Risks and unanswered questions

1. **It probably does not work for the species our users catch.** This is the base case,
   not the pessimistic one. The programme is designed to find that out for the price of one
   study rather than one product.
2. **A false match is a personal accusation** in a tournament and a false scientific claim
   in a dataset. Rule B4's precision bias and Rule B6's confirmation ladder are the defence.
3. **Incentives and animal welfare are in direct tension**, and the pressure will be to
   loosen §12 to drive engagement. Rule B8 exists to be quoted when that happens.
4. **Photo quality on a boat is the binding constraint**, and it is not improvable by
   engineering.
5. **Handling time is a real harm.** Any version of this feature that increases it has made
   the world worse regardless of its scientific output.
6. **Scientific credibility is spent, not earned, by a premature claim.** One published
   "we identified the same fish" that turns out to be wrong costs more than the entire
   programme is worth.
7. *Open:* is a validated recapture dataset actually valuable to the agencies we want to
   work with, or do their existing tagging programmes already answer it better and cheaper?
   **This question should be asked of a real fisheries scientist before the study is
   funded**, and the answer may be that our contribution is *volume of tag reports*, not
   biometrics at all — which would be a cheaper and more useful product.

---

## 19. Recommended implementation phase

**Phase 3, last.** After AI Fish ID, after media, after the government pilot has established
whether anyone wants this data.

The smallest credible experiment is in `13-final-decision-report.md` §11, and it involves
**no machine learning at all** for its first six months.
