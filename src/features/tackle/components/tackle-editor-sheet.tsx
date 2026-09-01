"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";

import {
  autoName,
  categoryFor,
  clampQuantity,
  retainedAttributes,
  TACKLE_CATEGORIES,
  type CategoryId,
  type RecentsMap,
  type TackleDraft,
  type TackleItem,
} from "../types";
import { ChoiceField } from "./choice-field";
import { QuantityStepper } from "./quantity-stepper";

/** What the sheet should show; null means closed. One dialog, three entry stories:
 *  fresh add, add pre-filled (last add / duplicate), and edit. The key remounts
 *  the form so each request starts from its own source with no reset effect. */
export type EditorRequest = { key: string } & (
  | { kind: "add"; prefill: TackleDraft | null; note: string | null }
  | { kind: "edit"; item: TackleItem }
);

type DraftState = {
  category: CategoryId | null;
  label: string;
  quantity: number;
  lowStockAt: number | null;
  attributes: Record<string, string>;
  notes: string;
  isFavorite: boolean;
};

const EMPTY_DRAFT: DraftState = {
  category: null,
  label: "",
  quantity: 1,
  lowStockAt: null,
  attributes: {},
  notes: "",
  isFavorite: false,
};

function draftFrom(request: Exclude<EditorRequest, null>): DraftState {
  if (request.kind === "edit") {
    const { category, label, quantity, lowStockAt, attributes, notes, isFavorite } = request.item;
    return { category, label, quantity, lowStockAt, attributes: { ...attributes }, notes: notes ?? "", isFavorite };
  }
  if (request.prefill) {
    return {
      ...request.prefill,
      attributes: { ...request.prefill.attributes },
      notes: request.prefill.notes ?? "",
    };
  }
  return EMPTY_DRAFT;
}

import { CHIP_CLASS as SHARED_CHIP_CLASS, CHIP_OFF as SHARED_CHIP_OFF, CHIP_ON as SHARED_CHIP_ON, FOCUS_RING } from "../ui-classes";

const INPUT_CLASS = `min-h-touch-floor rounded-md border border-border-interactive bg-background px-4 text-body text-text-primary placeholder:text-text-muted ${FOCUS_RING}`;
const CHIP_CLASS = SHARED_CHIP_CLASS;
const CHIP_ON = SHARED_CHIP_ON;
const CHIP_OFF = SHARED_CHIP_OFF;

export function TackleEditorSheet({
  request,
  recents,
  onClose,
  onSave,
  onDuplicate,
  onDelete,
}: {
  request: EditorRequest | null;
  recents: RecentsMap;
  onClose: () => void;
  onSave: (draft: TackleDraft, id?: string) => void;
  onDuplicate: (item: TackleItem) => void;
  onDelete: (id: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const open = request !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="tackle-editor-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={() => {
        if (open) onClose();
      }}
      className="m-auto max-h-dvh w-full max-w-reading border-0 bg-transparent p-0 text-text-primary backdrop:bg-background/80"
    >
      {request ? (
        <EditorForm
          key={request.key}
          request={request}
          recents={recents}
          onClose={onClose}
          onSave={onSave}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      ) : null}
    </dialog>
  );
}

function EditorForm({
  request,
  recents,
  onClose,
  onSave,
  onDuplicate,
  onDelete,
}: {
  request: Exclude<EditorRequest, null>;
  recents: RecentsMap;
  onClose: () => void;
  onSave: (draft: TackleDraft, id?: string) => void;
  onDuplicate: (item: TackleItem) => void;
  onDelete: (id: string) => void;
}) {
  const nameRef = useRef<HTMLInputElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const keepItRef = useRef<HTMLButtonElement>(null);
  const [draft, setDraft] = useState<DraftState>(() => draftFrom(request));
  const [submitted, setSubmitted] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const editing = request.kind === "edit" ? request.item : null;

  useEffect(() => {
    window.requestAnimationFrame(() => nameRef.current?.focus());
  }, []);

  function update(patch: Partial<DraftState>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function changeCategory(category: CategoryId) {
    setDraft((current) => ({
      ...current,
      category,
      attributes: retainedAttributes(categoryFor(category), current.attributes),
    }));
  }

  function setAttribute(key: string, value: string) {
    setDraft((current) => ({ ...current, attributes: { ...current.attributes, [key]: value } }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (!draft.category) return;

    const attributes: Record<string, string> = {};
    for (const [key, value] of Object.entries(draft.attributes)) {
      const trimmed = value.trim();
      if (trimmed) attributes[key] = trimmed;
    }

    onSave(
      {
        category: draft.category,
        // Typed name wins. Blank name = the category noun plus the buttons pushed
        // ("Hook Owner 2/0 J-hook") — quick inventory stays a taps-only flow
        // (founder request 2026-09-01).
        label: draft.label.trim() || (draft.category ? autoName(draft.category, attributes) : ""),
        quantity: clampQuantity(draft.quantity),
        lowStockAt: draft.lowStockAt,
        attributes,
        notes: draft.notes.trim() || undefined,
        isFavorite: draft.isFavorite,
      },
      editing?.id,
    );
    onClose();
  }

  const categorySpec = draft.category ? categoryFor(draft.category) : null;

  return (
    <form
      onSubmit={submit}
      className="max-h-dvh overflow-y-auto rounded-t-xl border border-border-interactive bg-surface-raised p-4 shadow-2xl motion-reduce:transition-none"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-caption font-bold tracking-station text-tide-cyan">SESSION-ONLY</p>
          <h2 id="tackle-editor-title" className="mt-1 text-h2">
            {editing ? "Edit gear" : "Add gear"}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={`inline-flex min-h-touch-floor items-center justify-center rounded-md border border-border-interactive px-4 text-label text-text-link ${FOCUS_RING} active:scale-95`}
        >
          Close
        </button>
      </div>

      {request.kind === "add" && request.note ? (
        <p className="mt-3 rounded-md border border-hairline bg-surface px-3 py-2 text-caption text-text-link" role="status">
          {request.note}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-5">
        <fieldset className="flex flex-col gap-3">
          <legend className="text-label">Category</legend>
          <div className="flex flex-wrap gap-3" role="group" aria-label="Gear category">
            {TACKLE_CATEGORIES.map((category) => {
              const selected = draft.category === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => changeCategory(category.id)}
                  className={`${CHIP_CLASS} ${selected ? CHIP_ON : CHIP_OFF}`}
                >
                  {category.label}
                </button>
              );
            })}
          </div>
          {submitted && !draft.category ? (
            <p id="tackle-category-error" className="text-caption text-error-red">
              Pick the category this gear belongs in.
            </p>
          ) : null}
        </fieldset>

        <label className="flex flex-col gap-2 text-label">
          Item name <span className="font-normal text-text-muted">(optional)</span>
          <input
            ref={nameRef}
            value={draft.label}
            onChange={(event) => update({ label: event.target.value })}
            placeholder={
              draft.category
                ? `Saves as “${autoName(draft.category, draft.attributes)}”`
                : "e.g. Owner Mutu circle 4/0"
            }
            aria-describedby={submitted && !draft.category ? "tackle-category-error" : undefined}
            className={INPUT_CLASS}
          />
          <span className="text-caption text-text-muted">
            Leave it blank and the buttons you tap become the name.
          </span>
        </label>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-label">
            Quantity <span className="font-normal text-text-muted">(type it or tap)</span>
          </legend>
          <QuantityStepper
            value={draft.quantity}
            onChange={(next) => update({ quantity: next })}
            editable
            ariaLabel="Quantity"
          />
        </fieldset>

        {categorySpec?.fields.map((field) => (
          <ChoiceField
            key={`${categorySpec.id}:${field.key}`}
            field={field}
            value={draft.attributes[field.key] ?? ""}
            recents={draft.category ? recents[`${draft.category}:${field.key}`] ?? [] : []}
            onChange={(value) => setAttribute(field.key, value)}
          />
        ))}

        <div className="flex flex-col gap-3 rounded-md border border-hairline bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-label">
              Low-stock alert <span className="font-normal text-text-muted">(optional)</span>
            </p>
            {draft.lowStockAt === null ? (
              <button
                type="button"
                onClick={() => update({ lowStockAt: 5 })}
                className={`inline-flex min-h-touch-floor items-center justify-center rounded-full border border-border-interactive px-4 text-label text-text-link ${FOCUS_RING} active:scale-95`}
              >
                Set alert
              </button>
            ) : null}
          </div>
          {draft.lowStockAt !== null ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-caption text-text-muted">Alert me at or below</span>
              <QuantityStepper
                value={draft.lowStockAt}
                onChange={(next) => update({ lowStockAt: Math.max(1, next) })}
                ariaLabel="Low-stock alert threshold"
              />
              <button
                type="button"
                onClick={() => update({ lowStockAt: null })}
                className={`inline-flex min-h-touch-floor items-center justify-center rounded-full px-2 text-label text-text-link underline decoration-dotted underline-offset-4 ${FOCUS_RING}`}
              >
                Turn off
              </button>
            </div>
          ) : null}
        </div>

        <label className="flex flex-col gap-2 text-label">
          Notes <span className="font-normal text-text-muted">(optional)</span>
          <textarea
            value={draft.notes}
            onChange={(event) => update({ notes: event.target.value })}
            rows={2}
            placeholder="Where it lives, what it’s for…"
            className={`${INPUT_CLASS} py-3`}
          />
        </label>

        <button
          type="button"
          aria-pressed={draft.isFavorite}
          onClick={() => update({ isFavorite: !draft.isFavorite })}
          className={`min-h-touch-floor rounded-md border px-4 text-label ${FOCUS_RING} active:scale-95 ${
            draft.isFavorite ? CHIP_ON : "border-border-interactive text-text-link"
          }`}
        >
          {draft.isFavorite ? "Favorited — shows in Ready to rig" : "Save as a favorite"}
        </button>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <button
          type="submit"
          className={`flex min-h-touch-primary-standard w-full items-center justify-center rounded-md bg-signal-orange px-6 text-label text-ink-on-orange transition-colors hover:bg-signal-orange-pressed ${FOCUS_RING} active:scale-95 motion-reduce:transition-none`}
        >
          {editing ? "Save changes" : "Add to your box"}
        </button>

        {editing ? (
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onDuplicate(editing)}
                className={`inline-flex min-h-touch-floor flex-1 items-center justify-center rounded-md border border-border-interactive px-4 text-label text-text-link ${FOCUS_RING} active:scale-95`}
              >
                Duplicate
              </button>
              <button
                type="button"
                ref={deleteButtonRef}
                aria-expanded={confirmingDelete}
                onClick={() => {
                  setConfirmingDelete(true);
                  window.requestAnimationFrame(() => keepItRef.current?.focus());
                }}
                className={`inline-flex min-h-touch-floor flex-1 items-center justify-center rounded-md border border-error-red-fill px-4 text-label text-error-red ${FOCUS_RING} active:scale-95`}
              >
                Delete…
              </button>
            </div>
            {confirmingDelete ? (
              <div className="flex flex-col gap-3 rounded-md border border-error-red-fill p-4">
                <p className="text-body text-text-primary" role="alert">
                  Delete “{editing.label}” for good?
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    ref={keepItRef}
                    onClick={() => {
                      setConfirmingDelete(false);
                      window.requestAnimationFrame(() => deleteButtonRef.current?.focus());
                    }}
                    className={`inline-flex min-h-touch-floor flex-1 items-center justify-center rounded-md border border-border-interactive px-4 text-label text-text-link ${FOCUS_RING} active:scale-95`}
                  >
                    Keep it
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(editing.id);
                      onClose();
                    }}
                    className={`inline-flex min-h-touch-floor flex-1 items-center justify-center rounded-md bg-error-red-fill px-4 text-label text-text-primary ${FOCUS_RING} active:scale-95`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </form>
  );
}
