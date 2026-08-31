"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { seedInventory } from "../gear-fixture";
import {
  EMPTY_DRAFT,
  EMPTY_QUERY,
  GEAR_CATEGORIES,
  brandsIn,
  categoryLabel,
  clampQuantity,
  countByCategory,
  draftFrom,
  isNarrowed,
  recentValues,
  selectGear,
  type GearDraft,
  type GearItem,
  type GearQuery,
  type GearSort,
} from "../types";
import { GearCard } from "./gear-card";
import { GearDetailSheet } from "./gear-detail-sheet";
import { GearEditorSheet } from "./gear-editor-sheet";
import { GearFilterSheet } from "./gear-filter-sheet";

/** How many rows are in the DOM before the list grows. Sized so the first paint is one
 *  screenful plus headroom, whatever the inventory behind it (spec §22). */
const PAGE_SIZE = 40;

type Editor = { title: string; draft: GearDraft; replacing: string | null };

/**
 * The Tackle Box (`docs/specs/tackle-box.md`).
 *
 * Two views, one screen: with no search or filter running, it shows category cards, which
 * is the "what do I own" question. The moment the angler types or picks a filter it becomes
 * a flat inventory list, which is the "where is that hook" question. That is why search
 * lives in the header and not inside a category — an angler who remembers the item but not
 * the category should never have to guess the category first (§4, §13).
 *
 * Session-only, like the rest of this prototype: nothing here writes to Supabase, and the
 * screen says so rather than implying a sync that does not exist.
 */
export function TackleBox() {
  const [items, setItems] = useState<GearItem[]>(() => seedInventory());
  const [query, setQuery] = useState<GearQuery>(EMPTY_QUERY);
  const [sort, setSort] = useState<GearSort>("recent");
  const [editor, setEditor] = useState<Editor | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const narrowed = isNarrowed(query);
  const visible = useMemo(() => selectGear(items, query, sort), [items, query, sort]);
  const counts = useMemo(() => countByCategory(items), [items]);
  const brands = useMemo(() => brandsIn(items), [items]);
  const detailItem = items.find((item) => item.id === detailId) ?? null;

  // A new search starts at the top of the list, not 400 rows into the previous one.
  // Adjusted during render rather than in an effect, so the browser never paints the old
  // window against the new results.
  const [windowedFor, setWindowedFor] = useState<{ query: GearQuery; sort: GearSort }>({ query, sort });
  if (windowedFor.query !== query || windowedFor.sort !== sort) {
    setWindowedFor({ query, sort });
    setLimit(PAGE_SIZE);
  }

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setLimit((current) => current + PAGE_SIZE);
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visible.length]);

  function update(id: string, change: (item: GearItem) => GearItem) {
    setItems((current) => current.map((item) => (item.id === id ? { ...change(item), updatedAt: Date.now() } : item)));
  }

  function save(draft: GearDraft, replacing: string | null) {
    if (replacing) {
      update(replacing, (item) => ({ ...item, ...draft }));
      return;
    }
    const now = Date.now();
    // A real, persistent id from the first moment (spec §21) — a catch will eventually
    // point at this row, and a display name is not an identity.
    setItems((current) => [{ ...draft, id: crypto.randomUUID(), createdAt: now, updatedAt: now }, ...current]);
  }

  const openAdd = () =>
    setEditor({
      title: "Add gear",
      // Fast repeat entry (§10): a new item starts in the category being browsed and with
      // the brand last used, so a box of the same hooks is name-and-size each time.
      draft: {
        ...EMPTY_DRAFT,
        categoryId: query.categoryId ?? EMPTY_DRAFT.categoryId,
        brand: recentValues(items, "brand", 1)[0],
      },
      replacing: null,
    });

  return (
    <section className="gear-screen">
      <header className="gear-header">
        <div className="gear-header-top">
          <h1>Tackle box</h1>
          <p>
            {items.length} {items.length === 1 ? "item" : "items"}
          </p>
        </div>
        <div className="gear-search-row">
          <label className="gear-search">
            <span className="sr-only">Search your tackle</span>
            <span className="gear-search-glyph" aria-hidden="true">
              ⌕
            </span>
            <input
              type="search"
              value={query.text}
              placeholder="Search your tackle"
              onChange={(event) => setQuery((current) => ({ ...current, text: event.target.value }))}
            />
          </label>
          <button
            type="button"
            className="gear-filter-button"
            aria-haspopup="dialog"
            data-active={narrowed && (query.categoryId !== null || query.brand !== null || query.favoritesOnly || query.lowStockOnly)}
            onClick={() => setFilterOpen(true)}
          >
            Filter
          </button>
        </div>
      </header>

      <div className="gear-body">
        {items.length === 0 ? (
          <EmptyBox onAdd={openAdd} />
        ) : narrowed ? (
          <>
            <div className="gear-result-line">
              <p>
                {visible.length} {visible.length === 1 ? "match" : "matches"}
                {query.categoryId && <> in {categoryLabel(query.categoryId)}</>}
              </p>
              <button type="button" onClick={() => setQuery(EMPTY_QUERY)}>
                Clear
              </button>
            </div>
            {visible.length === 0 ? (
              <p className="gear-nothing">Nothing matches that. Try fewer words, or clear the filters.</p>
            ) : (
              <ul className="gear-list">
                {visible.slice(0, limit).map((item) => (
                  <GearCard
                    key={item.id}
                    item={item}
                    onOpen={() => setDetailId(item.id)}
                    onQuantityChange={(quantity) => update(item.id, (current) => ({ ...current, quantity: clampQuantity(quantity) }))}
                  />
                ))}
              </ul>
            )}
            {visible.length > limit && <div ref={sentinelRef} className="gear-sentinel" aria-hidden="true" />}
          </>
        ) : (
          <ul className="gear-categories">
            {GEAR_CATEGORIES.map((category) => {
              const count = counts.get(category.id) ?? 0;
              return (
                <li key={category.id}>
                  <button
                    type="button"
                    className="gear-category-card"
                    data-empty={count === 0}
                    onClick={() => setQuery({ ...EMPTY_QUERY, categoryId: category.id })}
                  >
                    <span className="gear-category-glyph" aria-hidden="true">
                      {category.glyph}
                    </span>
                    <span className="gear-category-name">{category.label}</span>
                    <span className="gear-category-count">
                      {count} {count === 1 ? "item" : "items"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="gear-add-bar">
        <p>Session only — nothing here syncs yet.</p>
        <button type="button" className="gear-add" onClick={openAdd} aria-haspopup="dialog">
          + Add gear
        </button>
      </div>

      <GearEditorSheet
        open={editor !== null}
        onClose={() => setEditor(null)}
        onSave={(draft) => save(draft, editor?.replacing ?? null)}
        initial={editor?.draft ?? EMPTY_DRAFT}
        title={editor?.title ?? "Add gear"}
        recentBrands={recentValues(items, "brand")}
        recentSizes={recentValues(items, "size")}
        recentColors={recentValues(items, "color")}
      />

      <GearDetailSheet
        item={detailItem}
        onClose={() => setDetailId(null)}
        onQuantityChange={(quantity) => detailItem && update(detailItem.id, (current) => ({ ...current, quantity }))}
        onToggleFavorite={() => detailItem && update(detailItem.id, (current) => ({ ...current, favorite: !current.favorite }))}
        onEdit={() => {
          if (!detailItem) return;
          setEditor({ title: "Edit gear", draft: draftFrom(detailItem), replacing: detailItem.id });
          setDetailId(null);
        }}
        onDuplicate={() => {
          if (!detailItem) return;
          setEditor({ title: "Duplicate gear", draft: draftFrom(detailItem), replacing: null });
          setDetailId(null);
        }}
        onDelete={() => {
          if (!detailItem) return;
          setItems((current) => current.filter((item) => item.id !== detailItem.id));
          setDetailId(null);
        }}
      />

      <GearFilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        query={query}
        onQueryChange={setQuery}
        sort={sort}
        onSortChange={setSort}
        brands={brands}
      />
    </section>
  );
}

function EmptyBox({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="gear-empty">
      <span aria-hidden="true">🧰</span>
      <h2>Your tackle box is empty</h2>
      <p>
        Add your gear so you can organise tackle, get ready for a trip, and — once the log
        fills up — see which gear actually catches fish.
      </p>
      <button type="button" onClick={onAdd}>
        + Add your first item
      </button>
    </div>
  );
}
