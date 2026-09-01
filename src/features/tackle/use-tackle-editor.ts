"use client";

import { useState } from "react";

import type { EditorRequest } from "./components/tackle-editor-sheet";
import { useTackleSession } from "./session-store";
import type { CategoryId, TackleItem } from "./types";

/**
 * The add/edit/duplicate choreography behind the editor sheet, shared by the main
 * Tackle Box page and every category page so every entry point behaves identically.
 */
export function useTackleEditor() {
  const { items, recents, lastDraft } = useTackleSession();
  const [editor, setEditor] = useState<EditorRequest | null>(null);

  function openAdd(presetCategory?: CategoryId) {
    const reuseLast = lastDraft && (!presetCategory || presetCategory === lastDraft.category);
    if (reuseLast && lastDraft) {
      setEditor({
        kind: "add",
        key: crypto.randomUUID(),
        prefill: { ...lastDraft, label: "" },
        note: "Pre-filled from your last add — change what’s different and save.",
      });
      return;
    }
    setEditor({
      kind: "add",
      key: crypto.randomUUID(),
      prefill: presetCategory
        ? { category: presetCategory, label: "", quantity: 1, lowStockAt: null, attributes: {}, isFavorite: false }
        : null,
      note: null,
    });
  }

  function openEdit(id: string) {
    const item = items.find((candidate) => candidate.id === id);
    if (item) setEditor({ kind: "edit", key: crypto.randomUUID(), item });
  }

  function openDuplicate(source: TackleItem) {
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

  return {
    editor,
    recents,
    openAdd,
    openEdit,
    openDuplicate,
    closeEditor: () => setEditor(null),
  };
}
