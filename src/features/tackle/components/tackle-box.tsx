"use client";

import { useMemo, useState } from "react";

import { TACKLE_FIXTURE } from "../tackle-fixture";
import { FILTER_LABELS, itemMatchesFilter, type TackleDraft, type TackleFilter, type TackleItem } from "../types";
import { TackleEditorSheet } from "./tackle-editor-sheet";
import { TackleItemCard } from "./tackle-item-card";

const FILTERS: readonly TackleFilter[] = ["all", "salt", "fresh"];

export function TackleBox() {
  const [items, setItems] = useState<TackleItem[]>(() => [...TACKLE_FIXTURE]);
  const [filter, setFilter] = useState<TackleFilter>("all");
  const [query, setQuery] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);

  const visibleItems = useMemo(
    () => items.filter((item) => itemMatchesFilter(item, filter, query)),
    [filter, items, query],
  );
  const favorites = items.filter((item) => item.isFavorite);

  function toggleFavorite(id: string) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, isFavorite: !item.isFavorite } : item)),
    );
  }

  function createItem(draft: TackleDraft) {
    setItems((current) => [
      { ...draft, id: `session-${crypto.randomUUID()}` },
      ...current,
    ]);
  }

  return (
    <section className="flex flex-col gap-8 pb-8">
      <header className="rounded-lg border border-hairline bg-surface p-4">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
          <div className="min-w-0">
            <p className="text-caption font-bold tracking-station text-tide-cyan">YOUR LURE LIBRARY</p>
            <h1 className="mt-1 text-h1">Tackle Box</h1>
          </div>
          <button
            type="button"
            onClick={() => setEditorOpen(true)}
            className="inline-flex min-h-touch-floor items-center justify-center rounded-md bg-signal-orange px-4 text-label text-ink-on-orange transition-colors hover:bg-signal-orange-pressed focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring active:scale-95 motion-reduce:transition-none"
          >
            Add lure
          </button>
        </div>
        <p className="mt-4 text-body text-text-muted">
          Keep the lures you reach for close. Favorites will be ready when you set a rig.
        </p>
        <p className="mt-3 rounded-md border border-tide-cyan bg-surface-raised px-3 py-2 text-caption text-text-link" role="status">
          Prototype: changes stay in this session and are not synced.
        </p>
      </header>

      {favorites.length > 0 ? (
        <section aria-labelledby="favorite-lures-heading">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="favorite-lures-heading" className="text-h2">Ready to rig</h2>
            <p className="text-caption text-text-muted">Your favorites</p>
          </div>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {favorites.map((item) => (
              <TackleItemCard key={item.id} item={item} compact onToggleFavorite={toggleFavorite} />
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="all-lures-heading">
        <div className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="all-lures-heading" className="text-h2">All lures</h2>
            <p className="text-caption text-text-muted">{items.length} in this session</p>
          </div>
          <label className="flex flex-col gap-2 text-label">
            Search your tackle
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, class, color, or size"
              className="min-h-touch-floor rounded-md border border-border-interactive bg-surface px-4 text-body text-text-primary placeholder:text-text-muted focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring"
            />
          </label>
          <div className="flex flex-wrap gap-3" role="group" aria-label="Water type filter">
            {FILTERS.map((option) => {
              const selected = filter === option;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setFilter(option)}
                  className={`min-h-touch-floor rounded-full border px-5 text-label transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring active:scale-95 motion-reduce:transition-none ${
                    selected
                      ? "border-signal-orange bg-signal-orange text-ink-on-orange"
                      : "border-border-interactive bg-surface text-text-link"
                  }`}
                >
                  {FILTER_LABELS[option]}
                </button>
              );
            })}
          </div>
        </div>

        {items.length > 0 ? (
          <div className="mt-5 flex flex-col gap-3">
            {visibleItems.map((item) => (
              <TackleItemCard key={item.id} item={item} onToggleFavorite={toggleFavorite} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-hairline bg-surface p-6">
            <h3 className="text-h3">Your box is ready when you are.</h3>
            <p className="mt-2 text-body text-text-muted">
              Name the lures you reach for most. They’ll be ready when you set a rig.
            </p>
            <button
              type="button"
              onClick={() => setEditorOpen(true)}
              className="mt-5 inline-flex min-h-touch-floor items-center justify-center rounded-md bg-signal-orange px-4 text-label text-ink-on-orange focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring active:scale-95"
            >
              Add your first lure
            </button>
          </div>
        )}

        {items.length > 0 && visibleItems.length === 0 ? (
          <div className="mt-5 rounded-lg border border-hairline bg-surface p-6">
            <h3 className="text-h3">Nothing matches that view.</h3>
            <p className="mt-2 text-body text-text-muted">
              Try a different water filter or clear your search to see this session’s tackle.
            </p>
            <button
              type="button"
              onClick={() => {
                setFilter("all");
                setQuery("");
              }}
              className="mt-5 inline-flex min-h-touch-floor items-center justify-center rounded-md border border-border-interactive px-4 text-label text-text-link focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring active:scale-95"
            >
              Clear filters
            </button>
          </div>
        ) : null}
      </section>

      <TackleEditorSheet open={editorOpen} onClose={() => setEditorOpen(false)} onCreate={createItem} />
    </section>
  );
}
