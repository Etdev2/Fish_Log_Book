# Tackle Box — Product & UX Specification

**Status:** MVP / Ready for Implementation
**Feature:** Tackle Box
**Platform:** Mobile-first fishing application
**Author:** founder, 2026-08-31

> Implementation note (ux-ui, 2026-08-31): §37 asks for architectural conflicts to be
> flagged rather than resolved unilaterally. There is one, and it is recorded in
> `docs/team/channel/2026-08-31-01-ux-ui-to-architect.md`: this spec's **Category** is
> broader than the schema's existing `lure_class` vocabulary, and `tackle_item.lure_class_id`
> is `not null`. Nothing in this pass changes the database. See §20 below.

---

## 1. Purpose

The Tackle Box is the user's personal fishing gear inventory.

> Let an angler quickly record what tackle they own and find it again without turning
> inventory management into a chore.

It must work equally well for a casual angler with 20 items, a serious angler with
hundreds, and a power user with thousands.

Priorities: fast item entry, fast search, simple inventory management, clear organization,
scalability, mobile usability. Do not overload the first version.

## 2. Core UX principle

Adding tackle should never feel like filling out a database. A basic item in **10 seconds
or less**; finding an existing item in **5 seconds or less**. Required information is
minimal; advanced information is optional.

## 3. Primary user flow

    Tackle Box → View gear → Search / browse categories → Select item
    Tackle Box → Quick Add → Category → Name → Quantity → Save

No multi-screen navigation just to add tackle.

## 4. Main screen

Title `Tackle Box`, plus search, filter and sort. Search stays available while browsing
large inventories.

## 5. Category system

Broad categories: Lures, Hooks, Jigs, Soft Plastics, Hard Baits, Terminal Tackle, Line,
Leaders, Sinkers / Weights, Swivels, Rods, Reels, Tools, Accessories, Other.

Categories must not be hard-coded in a way that prevents expansion later.

## 6. Category cards

Icon or image, category name, number of inventory entries. Selecting one opens its
inventory.

## 7. Gear inventory list

A clean list or compact card system: image, name, brand, size, colour, quantity, favourite
indicator. Not every attribute belongs on the card. Selecting an item opens its detail.

## 8. Quick Add

A prominent `+ Add Gear` action, always easy to reach, using whichever persistent-control
pattern matches the existing design system.

## 9. Quick Add form

**Required:** category, item name, quantity.
**Optional:** photo, brand, size, colour, weight, notes, tags, favourite.

The user must never be required to complete an optional field.

## 10. Fast entry

Remember recently used category, brand, size and colour, so entering twenty hook sizes does
not mean re-selecting the same three things twenty times.

## 11. Duplicate

Every item has `Duplicate`. The user changes only the fields that differ.

## 12. Quantity controls

`−  12  +`, without opening the edit form. Quantity may never go negative.

## 13. Search

Fast, from the primary interface, over name, brand, category, size, colour and tags.

## 14. Filters

Category, brand, size, colour, favourites, low stock. Use a sheet rather than a large
permanent filter surface.

## 15. Sorting

Name, category, recently added, recently updated, quantity, brand. Default to usability
rather than exposing everything.

## 16. Tags

Optional in the MVP; the data model supports them. They become useful later for
recommendations and Fish Log analytics.

## 17. Item detail

**Primary:** photo, name, category, quantity.
**Additional:** brand, size, colour, weight, notes, tags.
**Actions:** edit, duplicate, adjust quantity, favourite, delete.

## 18. Delete behaviour

Confirmation or undo. Destructive actions never sit beside commonly used controls.

## 19. Images

Optional. Take a photo, choose an existing one, or none. Never required. Without one, show
a category icon or placeholder.

## 20. Data model

    gear_items
      id · user_id · category_id · name · brand · size · color · weight
      quantity · notes · image_url · favorite · created_at · updated_at

Tags use either a structured relationship table or the existing project tagging
architecture. **Every gear item must have a persistent unique ID.**

> **Conflict with the existing schema, flagged per §37.** `public.tackle_item` already
> exists and requires `lure_class_id not null`, referencing the global `lure_class`
> vocabulary. That is the "two-level move" in `docs/architecture/ontology.md` §4: the
> angler's own lure is not poolable, its *class* is. This spec's **Category** is a broader
> axis — it includes Rods, Reels, Line and Tools, which are not lures and have no
> `lure_class`. Reconciling the two is an architecture decision (a new `gear_category`
> vocabulary, and `lure_class_id` becoming nullable), so this pass ships the client model
> and leaves the migration to `architect`.

## 21. Why unique IDs matter

A catch will eventually reference the specific tackle item used, so gear must never be
identified by display name alone.

## 22. Scale

Design for at least **5,000 entries per user** without UX degradation: efficient list
rendering, virtualization, indexed search fields, efficient filtering, image optimization.
Never render thousands of heavy image cards at once.

## 23. Mobile UX

Mobile-first; primary actions reachable one-handed. Avoid tiny targets, excessive scrolling,
deep menus, long forms, desktop-style tables, and controls near unsafe edges.

## 24. Visual alignment and layout standards

Components align along both axes and share common alignment lines. Consistent spacing scale.
Typography communicates hierarchy (page title → section heading → item name → supporting
metadata). Colour follows the existing design system and communicates hierarchy, state,
interaction and status. Nothing should appear randomly positioned.

## 25. Empty state

> **Your Tackle Box is empty** — Add your fishing gear so you can organize tackle, prepare
> for trips, and eventually track which gear catches fish. `[ + Add your first item ]`

## 26. MVP scope

Main screen, category browsing, gear inventory, Quick Add, gear detail, edit, delete,
duplicate, quantity adjustment, search, basic filters, basic sorting, favourites, optional
images, optional tags.

## 27. Not MVP

CSV import, barcode scanning, image recognition, product identification, retail database,
affiliate shopping, automatic re-ordering, advanced gear analytics.

## 28–32. Future

Shopping list from low stock; trip loadouts compared against inventory; Fish Log entries
referencing gear IDs; gear performance from catch data; environmental correlation across
tackle, catches, tide, moon, temperature, weather, location, time and species.

## 33. Performance goals

Add basic gear < 10s. Find existing gear < 5s. Quantity update in 1–2 interactions.
Duplicate similar gear < 5s. Search effectively instant at normal inventory sizes.

## 34. Accessibility

Adequate tap targets, sufficient contrast, accessible labels for icons, screen-reader
friendly controls, and never state through colour alone.

## 35. Acceptance criteria

Open the Tackle Box; browse categories; add an item with only category, name and quantity;
optionally add more attributes; edit; delete safely; duplicate; adjust quantity quickly;
search; filter; sort; favourite. Inventory stays usable at large sizes. UI follows the
existing design system and is visually aligned. Records have persistent unique IDs, and the
architecture allows future Fish Log relationships.

## 36. Implementation priority

Review architecture and design system → review schema → data model → screen shell →
category navigation → Quick Add → inventory list → detail/edit → duplicate → quantity →
search → filters and sorting → favourites → optional images → test at scale → polish.

## 37. Agent instructions

Inspect the repository first. Reuse existing components. Do not introduce a second design
language. Do not rewrite unrelated code. Do not build future features. Keep changes modular
and reviewable. Preserve future compatibility with Fish Log and trip planning. Flag
conflicts with established architecture rather than changing it unilaterally.

## 38. Product principle

Start as a very good fishing gear inventory — not a store, an assistant, a recommendation
engine, or a warehouse system. Build the inventory foundation correctly first.
