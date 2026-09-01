# 08 — Tackle Box

**Status:** Built as a session-only web prototype · **Second slice:** 2026-08-31
(product/UX spec: `docs/specs/tackle-box.md`)

## Job

An angler should be able to record any piece of tackle they own in about ten seconds,
keep its count honest with one tap, and see at a glance what needs restocking before a
trip. The page is a personal gear inventory, not a product catalogue, social feed, or
fishing-performance dashboard.

## Second slice (category-driven inventory)

The first slice modeled only lures: one generic name/class/color/size form, no
quantity, no edit path. This slice turns the page into a real inventory while keeping
the session-only boundary:

- **Categories are data, not code.** `TACKLE_CATEGORIES` (in
  `src/features/tackle/types.ts`) registers Hooks, Jigs, Hard baits, Soft plastics,
  Line, Leaders, Sinkers & weights, Terminal tackle, Rods, Reels, Tools, Accessories,
  Other. Adding a category is adding one entry.
- **One consistent Add Gear sheet whose fields follow the category.** Required path is
  Category → Name → Quantity → Save. Each category declares its own optional fields
  (hooks: brand/style/size; line: brand/material/pound test/spool length/color; …) so
  the form asks for what actually describes the gear. Switching category mid-entry
  keeps attributes whose keys the new category also uses (brand, color, weight…).
- **Common options, never lock-in.** Every field is the same component: the angler's
  recently used values first, then common real-world choices, always ending in an
  "Other…" chip with a free-text input. Values typed into "Other" become that user's
  chips next time (the box personalizes itself to their brands and sizes).
- **Repetitive entry:** reopening Add pre-fills from the last save with an honest
  banner ("Pre-filled from your last add — change what's different"). Every item's
  edit sheet has Duplicate, which reopens Add pre-filled from that item; the spec's
  "20 hook sizes" flow is two taps + a size change per item.
- **Quantity is first-class.** Cards carry a tappable −/+ stepper (never below zero);
  the sheet's stepper is typeable so "pack of 25" is not 24 taps.
- **Low stock is unobtrusive by design:** an optional per-item "alert at or below"
  threshold (off by default, so durable gear never false-flags), text badges on cards
  (LOW / OUT — never color alone), quantity 0 always surfaces, a header
  "N running low" count, and a Low stock view chip with the count. No dashboard, no
  clutter.
- **Full item lifecycle in the same sheet:** tap a card to edit; Delete hides behind
  an inline two-step confirm; Favorite toggles the "Ready to rig" rail as before.
- **Finding gear:** multi-token search over name, brand, every attribute, notes, and
  category ("owner 4/0", "40 lb fluoro"); category cards double as browse filters with
  live counts; All / Favorites / Low stock views; sort by recent, name, category, or
  lowest quantity.
- **Built for the 5,000-item spec without virtualization:** the list renders in pages
  of 100 with a "Show more (N left)" button and the rail caps at 12 favorites —
  anglers at scale find via search/filters, not endless scroll. Measured headless at
  5,000 items: initial render 2.6s/61k DOM nodes (unpaged) → 0.6s/1.5k nodes (paged),
  search keystroke→paint ≤133ms, zero long tasks while scrolling.

The old All/Salt/Fresh water filter was removed: `waterClass` described lure *classes*,
not an inventory of every gear type, and categories + search carry the load now.

## Third slice (category pages, 2026-08-31)

Two owner-review changes:

- **The "Ready to rig" rail is gone.** Favoriting stays (it drives the Favorites
  view), but the duplicated strip above the list was determined to be noise.
- **Categories navigate instead of filtering.** Each browse card is a real link to
  `/tackle/<category>` — one prerendered page per registry entry (`generateStaticParams`,
  `dynamicParams = false`, unknown categories 404). The category page mirrors the main
  header anatomy (back link, icon + title, + Add gear, scoped counts) and hosts the
  same inventory list scoped to the category; Add gear there pre-picks the category.

State moved from component state to a tiny module-level session store
(`session-store.ts`, `useSyncExternalStore`), so client-side navigation between the
box and category pages keeps the session's edits — while a full refresh still resets
to the fixture, exactly as the on-screen notice says. The inventory list (search,
views, sort, cards, paging, empty states) is now one shared component used by both
routes, and every chip/pill/primary class string lives in `ui-classes.ts` so the
treatment cannot drift between pages.

## Consistency pass (2026-08-31)

Applied the owner's alignment & visual-consistency standard to everything above:

- **Color has one job per slot.** Card attribute text no longer uses the link color;
  LOW/OUT badges and the header "running low" count are the only amber/red on the
  page; the "session-only" notice is a quiet muted caption under a hairline instead
  of a cyan-bordered box competing with the content.
- **One chip, everywhere.** Filter chips, sheet chips, and favorite pills share one
  48px / radius-full / px-4 treatment; the favorite pill carries a star glyph and a
  fixed minimum width so both states paint identical geometry.
- **Categories carry identity.** Each browse card got a hand-drawn 24px stroke icon
  (same grid, same stroke weight) alongside its label and a bottom-aligned count, so
  wrapped labels can no longer knock counts off the row's shared baseline.
- **The rail is a rail.** Ready-to-rig cards use a raised surface, clamp long names
  to two lines, pin their controls to the bottom, and stretch to one shared height —
  visibly distinct from the inventory records below instead of a duplicate list.
- **Typography follows one chain.** Page title → section heading (h2) → item name
  (h3) → attribute line (primary, caption size) → context line (muted, caption size);
  equivalent data uses equivalent treatment on every card.

## Design decisions (answers to the review questions)

1. **Keep:** native dialog sheet with focus management and Escape; 48px touch floor /
   68px primary; `aria-pressed` chips; Ready-to-rig rail; pure tested filter logic;
   the session-banner honesty; existing token palette and type scale.
2. **Fixed:** lures-only model; no quantity; no brand; generic form for every gear
   type; no edit/duplicate/delete; no low-stock signal; salt/fresh as the only filter.
3. **Universal fields** = category, name, quantity, notes, favorite, low-stock alert.
   Brand is universal in *position* (always the first field) but its common options
   are per-category (Owner vs Shimano vs Tady). Everything else is category-specific.
4. **Custom values:** every choice field ends in Other…; typed values are remembered
   per category+field and surfaced as leading chips (session-scoped for now).
5. **Low stock:** opt-in threshold per item + always-on empty detection, surfaced as
   text badges, a header count, and a view chip — a filter + indicator combo without
   a separate screen.
6. **Simplifications:** one sheet handles add/edit/duplicate (no separate detail
   screen to maintain); quantity adjusts without opening the sheet; water filter
   deleted; chips replace the chips+select pair so each field is one aligned row.

## Scope boundary

Persistence is still deferred until the offline store/query lane lands, so the page
keeps local fixtures, never touches Supabase, and says so on screen; item ids are
stable (`crypto.randomUUID()` per entry) and attributes are a flat record so the later
`gear_items` mapping stays mechanical. Photos, tags UI, CSV/barcode, shopping lists,
trip loadouts, and Fish Log gear links are future lanes per spec §26–32; the model
leaves room (flat attributes, category registry, stable ids) without building them.

## Phone and accessibility rules

- Every interactive target is 48px or larger; the primary save action is 68px.
- Chips, cards, and filters are real buttons with `aria-pressed`; LOW/OUT are text
  badges, not color alone; the stepper announces each count change via `aria-live`.
- The native dialog owns focus while open; Escape and the visible Close button both
  return the user to the page. Card text areas open edit from a plain button — no
  nested interactive elements inside the card. Deleting keeps the Delete… and
  Duplicate buttons mounted and moves focus into the confirm step (and back), so
  keyboard users never lose their place; the confirm text is announced via
  `role="alert"`.
- At 320px, chips and controls wrap rather than compress below the touch floor; the
  favorites rail remains the only intentional horizontal scroll.
