# Equipment product catalog — dependent gear selection

**Status:** Proposed — extends a shipped mechanism (ADR 008); the data-supply problem is the real work
**Date:** 2026-09-15
**Governs:** Tackle Box, Quiver, dependent product selection, catalog administration
**Extends:** `docs/specs/tackle-box.md`, `docs/architecture/decisions/008-quiver-identity-and-type-scoped-gear-options.md`
**Audit:** `00-repository-audit.md` §3.6, §6 G5
**Phase:** 1

---

## 1. Problem statement

The brief describes a dependent ladder — Add Reel → type → manufacturer → family → model →
size → preloaded specifications the angler can override.

**Two of those rungs already exist.** ADR 008 and `src/features/tackle/types.ts` implement
`dependsOn` / `optionsBy` / `fieldOptions()`, and reel *type* already filters reel *size*
options, because spinning reels are numbered in thousands and conventional reels in line
classes. That mechanism was built to fix the exact complaint the brief restates ("the sizes
read as too large or too broad").

What does not exist is a **catalog**: manufacturers, product families, models and their
specifications, shared across anglers. Today every field is a chip list of common values
plus free text, per category, hard-coded in one TypeScript file. That is the right design
for a prototype and the wrong one for a product where "Shimano Talica 25 II" should preload
a gear ratio and a drag figure.

The hard part is not the schema. It is that **manufacturer catalogs are copyrighted
compilations**, and the brief says so. A scraped spec table is a legal problem wearing a
convenience costume.

---

## 2. Users and stakeholders

| User | Need |
|---|---|
| Angler adding gear | Find their reel in three taps, not type its name |
| Angler on the water | Attach a rod setup to a fish in one tap (already works, must not regress) |
| Angler with unusual gear | Add anything not in the catalog, with no friction penalty |
| `biostat` | Comparable gear across anglers — free text cannot be pooled |
| Catalog admin | Add, correct, merge and deprecate records |
| `counsel` | Compilation copyright, trademark use, and manufacturer relations |
| `cfo` | The cost of maintaining a catalog nobody is paid to maintain |

---

## 3. Product goals

1. Dependent selection: type → brand → family → model → size, each narrowing the next.
2. Preloaded specifications, **every field editable**.
3. A catch's gear keeps the specifications as they were when chosen — forever.
4. Custom and unlisted gear is a first-class path, never a second-class one.
5. One schema serves rods, reels, line, hooks, lures, terminal tackle and electronics.
6. Existing saved gear never breaks when the catalog changes.

---

## 4. Non-goals

- Scraping manufacturer sites. §11.
- A shopping or affiliate feature in Phase 1. It is the obvious monetisation and it changes
  the product's incentives; `ceo` decides, not this spec.
- Replacing free-text entry. The chip-plus-Other pattern works and stays.
- Price, availability or reviews. Not a retail product.
- A universal identifier scheme (GTIN/UPC). Nice; not obtainable without manufacturer
  cooperation.

---

## 5. User stories

1. As an angler, I tap Add Reel, choose Conventional, choose Shimano, see only Shimano
   conventional families, pick Talica, pick 25 II, and the gear ratio, drag and capacity
   are already filled in.
2. As an angler, my reel is a discontinued 1998 Penn and it is not listed, so I type its
   name and keep going — with no dead end and no "request this product" form.
3. As an angler, the catalog later corrects the drag figure on my reel, and **my saved reel
   does not change**, because I chose it when it said something else.
4. As an angler, my last five reels are at the top of the list, because I fish the same
   tackle.
5. As an admin, I merge two duplicate entries for the same model and every angler's saved
   gear continues to resolve.
6. As `biostat`, I can ask "do 6.2:1 reels out-catch 4.8:1 reels on this species" because
   gear ratio is a number on a shared record, not a string in a free-text field.

---

## 6. Complete workflow

### 6.1 The ladder

```text
category  (rods | reels | line | hooks | lures | terminal | electronics | other)
  └─ type            e.g. Conventional · Spinning · Baitcast · Fly · Surf
      └─ manufacturer  filtered to those making that type
          └─ family     filtered to that manufacturer AND that type
              └─ model   filtered to that family
                  └─ variant  size / length / power / capacity
                      └─ specs  preloaded, every field editable
```

Each rung is `dependsOn` the one above — the same mechanism `fieldOptions()` already
implements, with a catalog behind it instead of a hard-coded array.

**Rule C1.** Every rung is skippable. An angler may stop after "Conventional" and type a
name. The ladder is an accelerator, never a gate. A "not listed" affordance appears at
every rung, with the same visual weight as a catalog entry.

**Rule C2.** The ladder is never more than five taps to a usable item, and one tap for a
recently-used item. Favourites and recents render **above** the ladder, because the real
distribution is that anglers own six reels and use three.

### 6.3 Snapshot on selection

```text
angler picks Shimano Talica 25 II
  → user_equipment row references product_variant
  → product_spec_snapshot jsonb copied onto user_equipment at selection time
  → catch_gear / trip_rig_gear reference user_equipment
```

**Rule C3.** The snapshot is immutable (`data-architecture-expansion.md` §11). Catalog
corrections never rewrite an angler's saved gear or a caught fish's rig. This is the same
rule the regulation snapshot already follows, and for the same reason.

**Rule C4.** A catalog entry is never hard-deleted. It is deprecated, with
`superseded_by` where a merge applies. A `user_equipment` row whose variant was merged
resolves through the chain and keeps working.

### 6.4 Admin workflow

`/internal/catalog`, behind an admin role:

```text
Add        one record at a time, with source URL and verification date
Correct    writes a new version; the old version stays queryable
Merge      A into B, sets superseded_by, requires a reason
Deprecate  discontinued or wrong; hidden from pickers, resolvable for saved gear
Review     user-submitted additions, queued, never auto-published
```

**Rule C5.** Every catalog record carries `source` and `source_verified_at`, the same
citation-or-nothing standard Fish Legal holds itself to. A specification with no source is
marked *unverified* in the picker and is not preloaded silently.

### 6.5 Seeding, without scraping

Ordered by legal safety:

1. **Manufacturer-supplied data**, by agreement. Best, slowest, and the only one that
   scales to "preloaded specifications" with confidence. Start with 3–5 brands.
2. **Angler-contributed entries**, reviewed. A model name, a size and a gear ratio typed by
   an owner is a fact about their object, not a copy of a catalog.
3. **Facts, not compilations.** In the US, individual facts are not copyrightable; the
   *selection and arrangement* of a catalog is. A single model's gear ratio is a fact. A
   systematic reproduction of a manufacturer's product table is a compilation. `counsel`
   must draw this line before any bulk import — this spec does not have the standing to
   draw it.
4. **Open datasets**, if any exist with a usable licence. Unverified; `repo-scout` to check.

Phase 1 ships the **structure plus the top ~200 models** most likely to appear in this
product's first regions: surf, inshore and offshore reels and rods common to Southern
California, the Gulf and the Northeast. Not 20,000 SKUs.

---

## 7. Screen and component requirements

Extends `tackle-editor-sheet.tsx` and `choice-field.tsx`; reuses `rod-setup-sheet.tsx` for
the Quiver.

- **Recents and favourites first.** A row of up to five, above the ladder.
- **One rung per screen-height chunk** at 320 px, with the chosen value from the rung above
  pinned as a breadcrumb chip that is tappable to go back.
- **Search across the ladder.** Typing "talica 25" jumps straight to the variant, because
  anglers who know their gear should not walk a tree. The ladder is for browsing; search is
  for knowing.
- **Preloaded specs render as editable fields with a "from catalog" marker**, not as
  read-only text. The brief is explicit that every field is correctable, and an angler who
  re-spooled to 65 lb braid is right and the catalog is not.
- **"Not listed"** at every rung, same weight, leading to free text.
- **Unverified specs** are labelled and are not silently preloaded.
- Empty states: a manufacturer with no families yet says so and offers free text.

The **Quiver must not regress.** Its lineage grouping (`quiver_id`), revision semantics and
"put away / bring back" behaviour are untouched by this spec. A rod setup built from
catalog items and one built from free text are the same kind of thing.

---

## 8. Data requirements

```sql
product_manufacturer (
  id text pk, name text not null, aliases text[] not null default '{}',
  country text, website text, status text not null default 'active'
    check (status in ('active','defunct','merged')),
  superseded_by text references product_manufacturer(id),
  source text, source_verified_at date
);

product_family (
  id text pk, manufacturer_id text not null references product_manufacturer(id),
  name text not null, category_id text not null, type_id text not null,
  introduced_year integer, discontinued boolean not null default false,
  status text not null default 'active', superseded_by text references product_family(id),
  source text, source_verified_at date
);

product_model (
  id text pk, family_id text not null references product_family(id),
  name text not null, introduced_year integer, discontinued boolean not null default false,
  status text not null default 'active', superseded_by text references product_model(id),
  source text, source_verified_at date
);

-- The thing an angler actually owns: a size, a length, a power rating.
product_variant (
  id text pk, model_id text not null references product_model(id),
  variant_label text not null,          -- "25 II", "8000", "7'6\" MH"
  specs jsonb not null default '{}',    -- typed per category; see below
  spec_confidence text not null default 'unverified'
    check (spec_confidence in ('manufacturer','verified','community','unverified')),
  status text not null default 'active', superseded_by text references product_variant(id),
  source text, source_verified_at date, version integer not null default 1
);

-- What the angler owns. Survives every catalog change.
user_equipment (
  id uuid pk, angler_id uuid not null references angler(id) on delete cascade,
  category_id text not null, type_id text,
  product_variant_id text references product_variant(id),   -- null = custom
  custom_name text,                                         -- required when variant is null
  spec_snapshot jsonb not null default '{}',                -- IMMUTABLE (Rule C3)
  spec_overrides jsonb not null default '{}',               -- the angler's corrections
  nickname text, favourite boolean not null default false,
  acquired_on date, retired_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint equipment_identifiable check (product_variant_id is not null
    or nullif(btrim(custom_name), '') is not null)
);
```

`specs` by category, canonical SI with display conversion at the edge (`core/units.ts`):

| Category | Fields |
|---|---|
| Reel | `type`, `gear_ratio`, `max_drag_kg`, `retrieve_per_crank_mm`, `line_capacity[]` (as `{line_type, test_kg, length_m}`), `handedness`, `weight_g`, `bearings`, `line_class` |
| Rod | `length_mm`, `power`, `action`, `pieces`, `line_rating_kg[]`, `lure_rating_g[]`, `guides`, `material`, `handle` |
| Line | `line_type`, `test_kg`, `diameter_mm`, `colour`, `spool_length_m` |
| Hook | `style`, `size`, `gauge`, `finish`, `barbless` |
| Lure | `lure_class`, `length_mm`, `weight_g`, `colour`, `depth_range_m`, `hook_config` |
| Terminal | `kind`, `size`, `rating_kg`, `material` |
| Electronics | `kind`, `frequency_khz`, `depth_capability_m`, `transducer` |

**Migration from today:** `tackle_item.attributes` (a flat record of chip values) becomes
`user_equipment.spec_overrides` with `product_variant_id` null. Nothing is lost, nothing
breaks, and the migration is a straight copy. The existing `TACKLE_CATEGORIES` registry
becomes the seed for `category_id` / `type_id`.

---

## 9. API and service requirements

```text
GET /api/v1/catalog/manufacturers?category&type
GET /api/v1/catalog/families?manufacturer&category&type
GET /api/v1/catalog/models?family
GET /api/v1/catalog/variants?model
GET /api/v1/catalog/search?q&category           typo-tolerant, ranked
POST /api/v1/catalog/suggestions                user submission, queued for review
```

- Catalog is **public read**, admin write. It contains no personal data.
- Served as a **versioned bundle** for offline use, exactly like regulation packs — the
  pattern already exists and works.
- `fieldOptions()` in `core/` is extended, not replaced: the pure function still answers
  "what options does this field offer given these answers", now sourced from the catalog
  bundle rather than a literal array. Existing vector tests must continue to pass.

---

## 10. Offline behaviour

- The catalog bundle is cached; the whole ladder works offline. Adding gear on a boat is
  the normal case, not the exception.
- Bundle size budget: **< 2 MB compressed** for the shipped subset. Beyond that, ship the
  top brands and fetch the long tail online with a graceful "search needs a connection"
  state.
- Custom entries are created offline and sync through the existing outbox.
- Suggestions queue offline and submit later.
- A saved item's `spec_snapshot` is local, so a fish logged offline keeps its full gear
  detail.

---

## 11. Privacy, security and licensing requirements

1. **No scraping, no bulk import of a manufacturer's catalog, without a licence review.**
   The brief says this and it is correct. `counsel` must rule on the fact/compilation line
   (§6.5 item 3) before any import job is written. This is a **blocking** dependency for
   seeding, not for schema.
2. Trademarks are used nominatively — to identify the product an angler owns. No logos, no
   implied endorsement, no manufacturer branding in the UI.
3. Catalog data is public and personal gear is not: `user_equipment` carries the standard
   default-deny RLS on `angler_id`.
4. Gear can be identifying (a rare custom rod in a small fleet). Gear fields are excluded
   from public and community surfaces by default, and included in research exports only at
   category/type granularity unless a grant says otherwise.
5. User-submitted entries are reviewed before publication. An unreviewed submission is
   visible only to its submitter.
6. Admin actions are audited (who changed what, when, why).

---

## 12. Accessibility requirements

- Each rung is a labelled list with a heading; the breadcrumb states the full path in text.
- 48 px minimum for every option row, 12 px spacing (design 03 §§1–2).
- Search results announce their count (`aria-live="polite"`).
- "From catalog" and "Unverified" are text, not icons or colour.
- Numeric specs announce their units.
- The ladder is fully keyboard-operable; nothing depends on a long-press or swipe.
- Long model names wrap rather than truncate at 320 px; the variant label never truncates,
  because "25" and "25 II" are different reels.

---

## 13. Edge cases

| Case | Behaviour |
|---|---|
| Manufacturer makes both spinning and conventional reels | Appears under both types; families are type-scoped |
| Model spans families after a rebrand | `superseded_by` chain; both names resolve |
| Two admins add the same model | Merge tool; `user_equipment` resolves through the chain (Rule C4) |
| Angler re-spooled with different line | `spec_overrides` wins over `spec_snapshot`; both are stored |
| Discontinued model | Hidden from the picker, fully functional for existing owners |
| Catalog spec is wrong | Angler overrides; a "suggest a correction" affordance queues it for review |
| Angler owns two identical reels | Two `user_equipment` rows; nicknames distinguish them |
| Offline and the variant is not in the cached bundle | Free text; a later online session can link it |
| A fish caught on gear the angler later deletes | `catch_gear` keeps its own labels and the snapshot; deleting gear never alters a caught fish |
| Rod setup built from catalog items, then a catalog merge | Quiver lineage unaffected; `quiver_id` is ours, not the catalog's |

---

## 14. Failure states

- Catalog service down → cached bundle; if none, free text with a quiet explanation. Adding
  gear never fails.
- Bundle corrupt → refuse to load, keep the previous bundle.
- Search backend down → local bundle search only, stated.
- Suggestion submission fails → queued, retried; the angler's item is already saved locally.
- Variant resolution fails (deleted despite Rule C4) → show the snapshot, mark the link
  broken, never show an empty gear row.

---

## 15. Analytics and success metrics

| Metric | Target |
|---|---|
| Gear added via the catalog vs free text | > 60 % catalog within two seasons |
| Taps to add a known reel | ≤ 5 via ladder, ≤ 2 via search or recents |
| Spec fields overridden by anglers | Reported per field — a high override rate is a **catalog data** defect |
| Suggestions submitted / approved | Reported; approval rate is a review-quality signal |
| Catalog coverage of gear actually logged | The real coverage metric. Not SKU count. |
| Bundle size | < 2 MB compressed |
| Broken variant resolutions | 0 |

---

## 16. Acceptance criteria

1. The ladder narrows correctly at every rung, proven by vector tests extending the existing
   `field-options.test.ts`.
2. "Not listed" is reachable at every rung and leads to a working free-text entry, proven by
   a test.
3. `spec_snapshot` is immutable: a catalog correction leaves saved gear byte-identical,
   proven by a test.
4. A merged variant still resolves for existing `user_equipment`, proven by a test.
5. Migration from `tackle_item.attributes` preserves every existing item, proven by a
   round-trip test on the existing fixture (`tackle-fixture.ts`).
6. The whole ladder works with the network disabled.
7. The Quiver's lineage, revision and put-away/bring-back behaviour are unchanged, proven by
   the existing `quiver.test.ts` continuing to pass untouched.
8. No catalog record exists without `source` and `source_verified_at`, enforced at the
   database level for `spec_confidence = 'manufacturer' | 'verified'`.
9. At 320 px, a 60-character model name and a 12-character variant label render without
   truncating the variant.
10. `npm run verify` passes.

---

## 17. Dependencies

- `counsel` — the fact/compilation line, trademark nominative use, and manufacturer terms.
  **Blocking for seeding.**
- `ceo` — whether affiliate/retail links are in scope (they change the product's incentives
  and this spec assumes not).
- `cfo` — who maintains the catalog, and what it costs per season.
- ADR 008 remains authoritative for type-scoped options.
- `docs/specs/tackle-box.md` for the two-level item model.

---

## 18. Risks and unanswered questions

1. **A catalog is a maintenance commitment, not a feature.** Manufacturers release yearly.
   An unmaintained catalog is worse than free text, because it looks authoritative and is
   wrong. *This is the risk that kills the feature, and it is organisational, not
   technical.*
2. **Legal exposure from bulk import is real** and the brief already flags it. The safe
   path (manufacturer agreements) is slow; the fast path is the risky one. Expect pressure
   to take the fast path.
3. **Coverage drives adoption and adoption drives coverage.** With 200 models, most anglers
   will not find theirs and will learn the ladder is not worth walking. Mitigation: recents
   and search first, "not listed" everywhere, and honest coverage messaging.
4. **`biostat`'s pooling case is weaker than it looks.** Gear ratio may correlate with
   angler skill and target species rather than with catch rate. Catalog data enables the
   question; it does not answer it, and nobody should claim it does.
5. *Open:* do we accept community-submitted specs into the preloaded path, or only into an
   "unverified" tier? This spec says unverified tier, shown but not silently preloaded. A
   looser policy gets coverage faster and gets facts wrong.
6. *Open:* does the catalog ever become a revenue surface (affiliate, sponsored placement)?
   If yes, the ranking rules must be written **before** the first payment, not after.
