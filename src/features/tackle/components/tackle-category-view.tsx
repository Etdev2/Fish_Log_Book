"use client";

import Link from "next/link";

import { deleteTackleItem, saveTackleItem, useTackleSession } from "../session-store";
import { categoryFor, countByCategory, countLow, type CategoryId } from "../types";
import { FOCUS_RING, PRIMARY_BUTTON } from "../ui-classes";
import { useTackleEditor } from "../use-tackle-editor";
import { CategoryIcon } from "./category-icon";
import { TackleEditorSheet } from "./tackle-editor-sheet";
import { TackleInventoryList } from "./tackle-inventory-list";

/**
 * One category's inventory. Same header anatomy as the main Tackle Box so the
 * transition reads as a drill-in, not a different app; the back link lands on /tackle.
 */
export function TackleCategoryView({ category }: { category: CategoryId }) {
  const { items, recents } = useTackleSession();
  const editor = useTackleEditor();

  const spec = categoryFor(category);
  const scoped = items.filter((item) => item.category === category);
  const lowCount = countByCategory(scoped)[category]?.low ?? countLow(scoped);

  return (
    <section className="flex flex-col gap-8 pb-8">
      <header className="rounded-lg border border-hairline bg-surface p-4">
        <Link
          href="/tackle"
          className={`inline-flex min-h-touch-floor items-center gap-2 rounded-md text-label text-text-link ${FOCUS_RING}`}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-5 w-5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 6-6 6 6 6" />
          </svg>
          Tackle Box
        </Link>
        <div className="mt-2 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <CategoryIcon id={category} className="h-8 w-8 shrink-0 text-text-muted" />
            <h1 id="category-heading" className="text-h1">{spec.label}</h1>
          </div>
          <button type="button" onClick={() => editor.openAdd(category)} className={PRIMARY_BUTTON}>
            + Add gear
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-caption text-text-muted">
          <span>
            <strong className="text-text-primary">{scoped.length}</strong> {scoped.length === 1 ? "item" : "items"}
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

      <TackleInventoryList
        scopeCategory={category}
        headingId="category-heading"
        onAdd={() => editor.openAdd(category)}
        onEdit={editor.openEdit}
      />

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
