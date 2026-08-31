"use client";

import { BottomSheet } from "@/components/bottom-sheet";

import {
  EMPTY_QUERY,
  GEAR_CATEGORIES,
  GEAR_SORT_LABELS,
  LOW_STOCK_AT,
  type GearQuery,
  type GearSort,
} from "../types";

/**
 * Filters and sort, in a sheet rather than a permanent surface (spec §14): they are a
 * question an angler asks occasionally, and a filter bar that is always on screen costs
 * inventory rows every second it is not being used.
 */
export function GearFilterSheet({
  open,
  onClose,
  query,
  onQueryChange,
  sort,
  onSortChange,
  brands,
}: {
  open: boolean;
  onClose: () => void;
  query: GearQuery;
  onQueryChange: (query: GearQuery) => void;
  sort: GearSort;
  onSortChange: (sort: GearSort) => void;
  brands: readonly string[];
}) {
  const set = <K extends keyof GearQuery>(key: K, value: GearQuery[K]) =>
    onQueryChange({ ...query, [key]: value });

  return (
    <BottomSheet open={open} onClose={onClose} eyebrow="Tackle box" title="Filter & sort">
      <fieldset className="gear-chipset">
        <legend>Category</legend>
        <div>
          <button type="button" aria-pressed={query.categoryId === null} onClick={() => set("categoryId", null)}>
            All
          </button>
          {GEAR_CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              aria-pressed={query.categoryId === category.id}
              onClick={() => set("categoryId", query.categoryId === category.id ? null : category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>
      </fieldset>

      {brands.length > 0 && (
        <fieldset className="gear-chipset">
          <legend>Brand</legend>
          <div>
            <button type="button" aria-pressed={query.brand === null} onClick={() => set("brand", null)}>
              Any
            </button>
            {brands.map((brand) => (
              <button
                key={brand}
                type="button"
                aria-pressed={query.brand === brand}
                onClick={() => set("brand", query.brand === brand ? null : brand)}
              >
                {brand}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className="gear-chipset">
        <legend>Show only</legend>
        <div>
          <button type="button" aria-pressed={query.favoritesOnly} onClick={() => set("favoritesOnly", !query.favoritesOnly)}>
            ★ Favourites
          </button>
          <button type="button" aria-pressed={query.lowStockOnly} onClick={() => set("lowStockOnly", !query.lowStockOnly)}>
            Low stock ({LOW_STOCK_AT} or fewer)
          </button>
        </div>
      </fieldset>

      <fieldset className="gear-chipset">
        <legend>Sort by</legend>
        <div>
          {(Object.keys(GEAR_SORT_LABELS) as GearSort[]).map((option) => (
            <button key={option} type="button" aria-pressed={sort === option} onClick={() => onSortChange(option)}>
              {GEAR_SORT_LABELS[option]}
            </button>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        className="gear-clear"
        onClick={() => {
          onQueryChange({ ...EMPTY_QUERY, text: query.text });
          onSortChange("recent");
        }}
      >
        Clear filters
      </button>
    </BottomSheet>
  );
}
