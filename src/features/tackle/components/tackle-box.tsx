"use client";

import { useMemo, useState } from "react";

import { TACKLE_FIXTURE } from "../tackle-fixture";
import {
  categoryFor,
  countByCategory,
  countLow,
  itemMatchesSearch,
  itemMatchesView,
  rememberValue,
  SORT_LABELS,
  sortItems,
  TACKLE_CATEGORIES,
  VIEW_FILTER_LABELS,
  type CategoryId,
  type RecentsMap,
  type SortOrder,
  type TackleDraft,
  type TackleItem,
  type ViewFilter,
} from "../types";
import { CategoryIcon } from "./category-icon";
import { TackleEditorSheet, type EditorRequest } from "./tackle-editor-sheet";
import { TackleItemCard } from "./tackle-item-card";

const VIEW_FILTERS: readonly ViewFilter[] = ["all", "favorites", "low"];

/** Rendered in pages so a 5,000-item box never mounts 5,000 cards; anglers at
 *  scale find with search/filters rather than scrolling the full list. */
const LIST_PAGE = 100;
/** The horizontal rail stays a quick rig list, not a second inventory. */
const RAIL_MAX = 12;
const SORT_ORDERS: readonly SortOrder[] = ["recent", "name", "category", "quantity"];

const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring";
const CHIP_CLASS = `min-h-touch-floor rounded-full border px-4 text-label transition-colors ${FOCUS_RING} active:scale-95 motion-reduce:transition-none`;
const CHIP_ON = "border-signal-orange bg-signal-orange text-ink-on-orange";
const CHIP_OFF = "border-border-interactive bg-surface text-text-link";
const PRIMARY_BUTTON = `inline-flex min-h-touch-floor items-center justify-center rounded-md bg-signal-orange px-4 text-label text-ink-on-orange transition-colors hover:bg-signal-orange-pressed ${FOCUS_RING} active:scale-95 motion-reduce:transition-none`;

export function TackleBox() {
  const [items, setItems] = useState<TackleItem[]>(() => [...TACKLE_FIXTURE]);
  const [view, setView] = useState<ViewFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryId | "all">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOrder>("recent");
  const [shownCount, setShownCount] = useState(LIST_PAGE);
  const [recents, setRecents] = useState<RecentsMap>({});
  const [lastDraft, setLastDraft] = useState<TackleDraft | null>(null);
  const [editor, setEditor] = useState<EditorRequest | null>(null);

  const visibleItems = useMemo(
    () =>
      sortItems(
        items.filter(
          (item) =>
            (categoryFilter === "all" || item.category === categoryFilter) &&
            itemMatchesView(item, view) &&
            itemMatchesSearch(item, query),
        ),
        sort,
      ),
    [categoryFilter, items, query, sort, view],
  );
  const shownItems = visibleItems.slice(0, shownCount);
  const favorites = items.filter((item) => item.isFavorite);
  const railItems = favorites.slice(0, RAIL_MAX);

  function applyQuery(next: string) {
    setQuery(next);
    setShownCount(LIST_PAGE);
  }

  function applyView(next: ViewFilter) {
    setView(next);
    setShownCount(LIST_PAGE);
  }

  function applyCategoryFilter(next: CategoryId | "all") {
    setCategoryFilter(next);
    setShownCount(LIST_PAGE);
  }

  function applySort(next: SortOrder) {
    setSort(next);
    setShownCount(LIST_PAGE);
  }
  const categoryCounts = countByCategory(items);
  const lowCount = countLow(items);
  const categoriesInUse = TACKLE_CATEGORIES.filter(
    (category) => (categoryCounts[category.id]?.total ?? 0) > 0 || categoryFilter === category.id,
  );

  function openAddSheet() {
    setEditor(
      lastDraft
        ? {
            kind: "add",
            key: crypto.randomUUID(),
            prefill: { ...lastDraft, label: "" },
            note: "Pre-filled from your last add — change what’s different and save.",
          }
        : { kind: "add", key: crypto.randomUUID(), prefill: null, note: null },
    );
  }

  function openEditSheet(id: string) {
    const item = items.find((candidate) => candidate.id === id);
    if (item) setEditor({ kind: "edit", key: crypto.randomUUID(), item });
  }

  function openDuplicateSheet(source: TackleItem) {
    setEditor({
      kind: "add",
      key: crypto.randomUUID(),
      prefill: {
        category: source.category,
        label: source.label,
        quantity: source.quantity,
        lowStockAt: source.lowStockAt,
        attributes: { ...source.attributes },
        notes: source.notes,
        isFavorite: source.isFavorite,
      },
      note: `Duplicating “${source.label}” — change what’s different, then save.`,
    });
  }

  function saveItem(draft: TackleDraft, id?: string) {
    setItems((current) =>
      id
        ? current.map((item) => (item.id === id ? { ...draft, id, addedAt: item.addedAt } : item))
        : [{ ...draft, id: `session-${crypto.randomUUID()}`, addedAt: Date.now() }, ...current],
    );
    setRecents((current) => {
      let next = current;
      for (const [fieldKey, value] of Object.entries(draft.attributes)) {
        next = rememberValue(next, `${draft.category}:${fieldKey}`, value);
      }
      return next;
    });
    setLastDraft(draft);
  }

  function deleteItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function toggleFavorite(id: string) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, isFavorite: !item.isFavorite } : item)),
    );
  }

  function adjustQuantity(id: string, next: number) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, quantity: next } : item)),
    );
  }

  function clearListControls() {
    setQuery("");
    setView("all");
    setCategoryFilter("all");
    setSort("recent");
    setShownCount(LIST_PAGE);
  }

  return (
    <section className="flex flex-col gap-8 pb-8">
      <header className="rounded-lg border border-hairline bg-surface p-4">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-caption font-bold tracking-station text-tide-cyan">YOUR GEAR INVENTORY</p>
            <h1 className="mt-1 text-h1">Tackle Box</h1>
          </div>
          <button type="button" onClick={openAddSheet} className={PRIMARY_BUTTON}>
            + Add gear
          </button>
        </div>
        <p className="mt-4 text-body text-text-muted">
          Add gear in seconds, keep counts honest, and spot what needs restocking before a trip.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-caption text-text-muted">
          <span>
            <strong className="text-text-primary">{items.length}</strong> items
          </span>
          <span>
            <strong className={lowCount > 0 ? "text-amber-flag" : "text-text-primary"}>{lowCount}</strong>{" "}
            running low
          </span>
        </div>
        <p className="mt-4 border-t border-hairline pt-3 text-caption text-text-muted" role="status">
          Prototype: changes stay in this session and are not synced.
        </p>
      </header>

      {favorites.length > 0 ? (
        <section aria-labelledby="favorite-gear-heading">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="favorite-gear-heading" className="text-h2">Ready to rig</h2>
            {favorites.length > RAIL_MAX ? (
              <p className="text-caption text-text-muted">{favorites.length} total — see the Favorites view</p>
            ) : null}
          </div>
          <div className="mt-4 flex items-stretch gap-3 overflow-x-auto pb-2">
            {railItems.map((item) => (
              <TackleItemCard
                key={item.id}
                item={item}
                compact
                onOpen={openEditSheet}
                onToggleFavorite={toggleFavorite}
                onAdjustQuantity={adjustQuantity}
              />
            ))}
          </div>
        </section>
      ) : null}

      {items.length > 0 ? (
        <section aria-labelledby="categories-heading">
          <h2 id="categories-heading" className="text-h2">Browse by category</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {categoriesInUse.map((category) => {
              const counts = categoryCounts[category.id] ?? { total: 0, low: 0 };
              const active = categoryFilter === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => applyCategoryFilter(active ? "all" : category.id)}
                  className={`flex min-h-touch-floor flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors ${FOCUS_RING} active:scale-95 motion-reduce:transition-none ${
                    active ? "border-signal-orange bg-surface-raised" : "border-hairline bg-surface"
                  }`}
                >
                  <CategoryIcon
                    id={category.id}
                    className={`h-6 w-6 ${active ? "text-signal-orange" : "text-text-muted"}`}
                  />
                  <span className="text-label text-text-primary">{category.label}</span>
                  <span className="mt-auto text-caption text-text-muted">
                    {counts.total} {counts.total === 1 ? "item" : "items"}
                    {counts.low > 0 ? (
                      <span className="text-amber-flag"> · {counts.low} low</span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="all-gear-heading">
        <div className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="all-gear-heading" className="text-h2">All gear</h2>
            <p className="text-caption text-text-muted">{items.length} in this session</p>
          </div>

          <label className="flex flex-col gap-2 text-label">
            Search your tackle
            <input
              value={query}
              onChange={(event) => applyQuery(event.target.value)}
              placeholder="Name, brand, size, color…"
              className={`min-h-touch-floor rounded-md border border-border-interactive bg-surface px-4 text-body text-text-primary placeholder:text-text-muted ${FOCUS_RING}`}
            />
          </label>

          <div className="flex flex-wrap gap-3" role="group" aria-label="Inventory view">
            {VIEW_FILTERS.map((option) => {
              const selected = view === option;
              const label =
                option === "low" && lowCount > 0
                  ? `${VIEW_FILTER_LABELS[option]} (${lowCount})`
                  : VIEW_FILTER_LABELS[option];
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => applyView(option)}
                  className={`${CHIP_CLASS} ${selected ? CHIP_ON : CHIP_OFF}`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <label className="flex items-center gap-3 text-label">
              Sort
              <select
                value={sort}
                onChange={(event) => applySort(event.target.value as SortOrder)}
                className={`min-h-touch-floor rounded-md border border-border-interactive bg-surface px-4 text-body text-text-primary ${FOCUS_RING}`}
              >
                {SORT_ORDERS.map((order) => (
                  <option key={order} value={order}>
                    {SORT_LABELS[order]}
                  </option>
                ))}
              </select>
            </label>
            {categoryFilter !== "all" ? (
              <button
                type="button"
                onClick={() => applyCategoryFilter("all")}
                aria-label={`Clear the ${categoryFor(categoryFilter).label} category filter`}
                className={`${CHIP_CLASS} ${CHIP_ON}`}
              >
                {categoryFor(categoryFilter).label} ✕
              </button>
            ) : null}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mt-5 rounded-lg border border-hairline bg-surface p-6">
            <h3 className="text-h3">Your tackle box is empty.</h3>
            <p className="mt-2 text-body text-text-muted">
              Add the gear you actually carry — hooks, line, lures, all of it — so counts stay honest
              and restocking is obvious.
            </p>
            <button type="button" onClick={openAddSheet} className={`mt-5 ${PRIMARY_BUTTON}`}>
              Add your first item
            </button>
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="mt-5 rounded-lg border border-hairline bg-surface p-6">
            <h3 className="text-h3">Nothing matches that view.</h3>
            <p className="mt-2 text-body text-text-muted">
              Try a different view, another category, or clear your search.
            </p>
            <button
              type="button"
              onClick={clearListControls}
              className={`mt-5 inline-flex min-h-touch-floor items-center justify-center rounded-md border border-border-interactive px-4 text-label text-text-link ${FOCUS_RING} active:scale-95`}
            >
              Clear search and filters
            </button>
          </div>
        ) : (
          <>
            <div className="mt-5 flex flex-col gap-3">
              {shownItems.map((item) => (
                <TackleItemCard
                  key={item.id}
                  item={item}
                  onOpen={openEditSheet}
                  onToggleFavorite={toggleFavorite}
                  onAdjustQuantity={adjustQuantity}
                />
              ))}
            </div>
            <p className="mt-4 text-caption text-text-muted">
              {visibleItems.length === items.length
                ? `${items.length} items`
                : `Showing ${shownItems.length} of ${visibleItems.length} matching · ${items.length} total`}
            </p>
            {shownItems.length < visibleItems.length ? (
              <button
                type="button"
                onClick={() => setShownCount((count) => count + LIST_PAGE)}
                className={`mt-3 inline-flex min-h-touch-floor w-full items-center justify-center rounded-md border border-border-interactive px-4 text-label text-text-link ${FOCUS_RING} active:scale-95`}
              >
                Show more ({visibleItems.length - shownItems.length} left)
              </button>
            ) : null}
          </>
        )}
      </section>

      <TackleEditorSheet
        request={editor}
        recents={recents}
        onClose={() => setEditor(null)}
        onSave={saveItem}
        onDuplicate={openDuplicateSheet}
        onDelete={deleteItem}
      />
    </section>
  );
}
