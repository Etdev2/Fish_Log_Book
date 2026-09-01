"use client";

import { useMemo, useState } from "react";

import { adjustTackleQuantity, toggleTackleFavorite, useTackleSession } from "../session-store";
import {
  categoryFor,
  countLow,
  itemMatchesSearch,
  itemMatchesView,
  SORT_LABELS,
  sortItems,
  VIEW_FILTER_LABELS,
  type CategoryId,
  type SortOrder,
  type ViewFilter,
} from "../types";
import { CHIP_CLASS, CHIP_OFF_ON_SURFACE, CHIP_ON, FOCUS_RING, PRIMARY_BUTTON } from "../ui-classes";
import { TackleItemCard } from "./tackle-item-card";

const VIEW_FILTERS: readonly ViewFilter[] = ["all", "favorites", "low"];
const SORT_ORDERS: readonly SortOrder[] = ["recent", "name", "category", "quantity"];

/** Rendered in pages so a multi-thousand-item box never mounts thousands of cards;
 *  at scale anglers find with search/filters rather than scrolling the full list. */
const LIST_PAGE = 100;

/**
 * The inventory browser shared by the main Tackle Box (`scopeCategory` null) and
 * each category page: one search field, one chip row, one sort order, the same
 * cards, paging, and empty states — identical behavior everywhere it appears.
 */
export function TackleInventoryList({
  scopeCategory = null,
  headingId,
  onAdd,
  onEdit,
}: {
  scopeCategory?: CategoryId | null;
  headingId: string;
  onAdd: () => void;
  onEdit: (id: string) => void;
}) {
  const { items } = useTackleSession();
  const [view, setView] = useState<ViewFilter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOrder>("recent");
  const [shownCount, setShownCount] = useState(LIST_PAGE);

  const resetWindow = () => setShownCount(LIST_PAGE);

  const scopedItems = useMemo(
    () => (scopeCategory ? items.filter((item) => item.category === scopeCategory) : [...items]),
    [items, scopeCategory],
  );
  const visibleItems = useMemo(
    () =>
      sortItems(
        scopedItems.filter((item) => itemMatchesView(item, view) && itemMatchesSearch(item, query)),
        sort,
      ),
    [query, scopedItems, sort, view],
  );
  const shownItems = visibleItems.slice(0, shownCount);
  const lowCount = countLow(scopedItems);

  const scopeLabel = scopeCategory ? categoryFor(scopeCategory).label : null;

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-label">
        {scopeLabel ? `Search ${scopeLabel.toLowerCase()}` : "Search your tackle"}
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            resetWindow();
          }}
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
              onClick={() => {
                setView(option);
                resetWindow();
              }}
              className={`${CHIP_CLASS} ${selected ? CHIP_ON : CHIP_OFF_ON_SURFACE}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <label className="flex items-center gap-3 text-label">
        Sort
        <select
          value={sort}
          onChange={(event) => {
            setSort(event.target.value as SortOrder);
            resetWindow();
          }}
          className={`min-h-touch-floor rounded-md border border-border-interactive bg-surface px-4 text-body text-text-primary ${FOCUS_RING}`}
        >
          {SORT_ORDERS.map((order) => (
            <option key={order} value={order}>
              {SORT_LABELS[order]}
            </option>
          ))}
        </select>
      </label>

      <section aria-labelledby={headingId} className="flex flex-col gap-3">
        {/*
          On the main box this section is named by the visible "All gear" h2 above it.
          On a category page the section name is the page h1 itself, and the card
          titles (h3) would leap a level — so the outline keeps an unseen h2 here
          rather than skipping from h1 to h3 (WCAG 1.3.1 heading order).
        */}
        {scopeLabel ? <h2 className="sr-only">All {scopeLabel.toLowerCase()}</h2> : null}
        {scopedItems.length === 0 ? (
          <div className="rounded-lg border border-hairline bg-surface p-6">
            <h3 className="text-h3">
              {scopeLabel ? `No ${scopeLabel.toLowerCase()} yet.` : "Your tackle box is empty."}
            </h3>
            <p className="mt-2 text-body text-text-muted">
              {scopeLabel
                ? `Add your first one — it takes a few seconds, and it will show up here and in your whole box.`
                : `Add the gear you actually carry — hooks, line, lures, all of it — so counts stay honest and restocking is obvious.`}
            </p>
            <button type="button" onClick={onAdd} className={`mt-5 ${PRIMARY_BUTTON}`}>
              Add your first item
            </button>
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="rounded-lg border border-hairline bg-surface p-6">
            <h3 className="text-h3">Nothing matches that view.</h3>
            <p className="mt-2 text-body text-text-muted">
              Try a different view or clear your search.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setView("all");
                setSort("recent");
                resetWindow();
              }}
              className={`mt-5 inline-flex min-h-touch-floor items-center justify-center rounded-md border border-border-interactive px-4 text-label text-text-link ${FOCUS_RING} active:scale-95`}
            >
              Clear search and filters
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {shownItems.map((item) => (
                <TackleItemCard
                  key={item.id}
                  item={item}
                  onOpen={onEdit}
                  onToggleFavorite={toggleTackleFavorite}
                  onAdjustQuantity={adjustTackleQuantity}
                />
              ))}
            </div>
            <p className="text-caption text-text-muted">
              {visibleItems.length === scopedItems.length
                ? `${scopedItems.length} ${scopedItems.length === 1 ? "item" : "items"}`
                : `Showing ${shownItems.length} of ${visibleItems.length} matching · ${scopedItems.length} total`}
            </p>
            {shownItems.length < visibleItems.length ? (
              <button
                type="button"
                onClick={() => setShownCount((count) => count + LIST_PAGE)}
                className={`inline-flex min-h-touch-floor w-full items-center justify-center rounded-md border border-border-interactive px-4 text-label text-text-link ${FOCUS_RING} active:scale-95`}
              >
                Show more ({visibleItems.length - shownItems.length} left)
              </button>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
