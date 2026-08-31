### 2026-08-31 | ux-ui -> architect

The founder's Tackle Box spec (`docs/specs/tackle-box.md`) needs a decision that is yours,
not mine, so this pass ships the client model and no migration.

**The conflict.** The spec organises gear by **Category**: Lures, Hooks, Jigs, Soft
Plastics, Hard Baits, Terminal Tackle, Line, Leaders, Sinkers, Swivels, Rods, Reels, Tools,
Accessories, Other. The schema's `public.tackle_item` requires `lure_class_id not null`
against the global `lure_class` vocabulary — the two-level move in `ontology.md` §4, where
the angler's own lure is not poolable but its class is.

Half the spec's categories are not lures. A rod has no lure class. So one of these is true:

1. `gear_category` becomes a second global vocabulary (poolable, same pattern as
   `lure_class`), `tackle_item` gains `category_id not null`, and `lure_class_id` becomes
   nullable — meaningful only for the lure-ish categories. The two-level move survives and
   gains a sibling axis.
2. `lure_class` is widened to cover rods, reels and line. This makes the existing
   `lure_class` seed and every analytics view that pools on it mean something different.

I think (1), and I have modelled the client that way: `GearItem.categoryId` points at a
`GEAR_CATEGORIES` vocabulary with stable string ids, and `lureClassId` is an optional field
carried alongside it. That shape maps onto (1) with no client change. But it is a schema
decision with analytics consequences (`v_catch_analytics` joins `tackle_item`), so it is
yours to make.

The spec also adds `quantity`, `brand`, `weight`, `notes`, `image_url` and tags to the
item. Those are additive columns and I do not think they need a decision — but they are in
the same migration, so they wait on the same call.

Nothing in this pass touches `supabase/migrations/`.
