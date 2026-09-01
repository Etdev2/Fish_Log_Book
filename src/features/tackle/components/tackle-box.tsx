"use client";

import Link from "next/link";

import { deleteTackleItem, saveTackleItem, useTackleSession } from "../session-store";
import { countByCategory, countLow, TACKLE_CATEGORIES } from "../types";
import { FOCUS_RING, PRIMARY_BUTTON } from "../ui-classes";
import { useTackleEditor } from "../use-tackle-editor";
import { CategoryIcon } from "./category-icon";
import { TackleEditorSheet } from "./tackle-editor-sheet";
import { TackleInventoryList } from "./tackle-inventory-list";

export function TackleBox() {
  const { items, recents } = useTackleSession();
  const editor = useTackleEditor();

  const categoryCounts = countByCategory(items);
  const lowCount = countLow(items);

  return (
    <section className="flex flex-col gap-8 pb-8">
      <header className="rounded-lg border border-hairline bg-surface p-4">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-caption font-bold tracking-station text-tide-cyan">YOUR GEAR INVENTORY</p>
            <h1 className="mt-1 text-h1">Tackle Box</h1>
          </div>
          <button type="button" onClick={() => editor.openAdd()} className={PRIMARY_BUTTON}>
            + Add gear
          </button>
        </div>
        <p className="mt-4 text-body text-text-muted">
          Add gear in seconds, keep counts honest, and spot what needs restocking before a trip.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-caption text-text-muted">
          <span>
            <strong className="text-text-primary">{items.length}</strong> {items.length === 1 ? "item" : "items"}
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

      <section aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="text-h2">Browse by category</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TACKLE_CATEGORIES.map((category) => {
            const counts = categoryCounts[category.id] ?? { total: 0, low: 0 };
            return (
              <Link
                key={category.id}
                href={`/tackle/${category.id}`}
                className={`flex min-h-touch-floor flex-col items-start gap-2 rounded-lg border border-hairline bg-surface p-4 text-left transition-colors hover:bg-surface-raised ${FOCUS_RING} active:scale-95 motion-reduce:transition-none`}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <CategoryIcon id={category.id} className="h-6 w-6 text-text-muted" />
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 text-text-muted"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </span>
                <span className="text-label text-text-primary">{category.label}</span>
                <span className="mt-auto text-caption text-text-muted">
                  {counts.total} {counts.total === 1 ? "item" : "items"}
                  {counts.low > 0 ? <span className="text-amber-flag"> · {counts.low} low</span> : null}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="all-gear-heading">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <h2 id="all-gear-heading" className="text-h2">All gear</h2>
          <p className="text-caption text-text-muted">{items.length} in this session</p>
        </div>
        <TackleInventoryList headingId="all-gear-heading" onAdd={() => editor.openAdd()} onEdit={editor.openEdit} />
      </section>

      <TackleEditorSheet
        request={editor.editor}
        recents={recents}
        onClose={editor.closeEditor}
        onSave={saveTackleItem}
        onDuplicate={editor.openDuplicate}
        onDelete={deleteTackleItem}
      />
    </section>
  );
}
