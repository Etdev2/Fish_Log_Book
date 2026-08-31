"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";

import { LURE_CLASSES, type TackleDraft, type WaterClass } from "../types";

const EMPTY_DRAFT: TackleDraft = {
  label: "",
  lureClass: "",
  waterClass: "both",
  color: "",
  sizeLabel: "",
  isFavorite: false,
};

export function TackleEditorSheet({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (draft: TackleDraft) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<TackleDraft>(EMPTY_DRAFT);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      window.requestAnimationFrame(() => nameRef.current?.focus());
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function close() {
    setSubmitted(false);
    setDraft(EMPTY_DRAFT);
    onClose();
  }

  function selectClass(lureClass: string, waterClass: WaterClass) {
    setDraft((current) => ({ ...current, lureClass, waterClass }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (!draft.label.trim() || !draft.lureClass) return;

    onCreate({
      ...draft,
      label: draft.label.trim(),
      color: draft.color?.trim(),
      sizeLabel: draft.sizeLabel?.trim(),
    });
    close();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="tackle-editor-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClose={() => {
        if (open) onClose();
      }}
      className="m-auto max-h-dvh w-full max-w-reading border-0 bg-transparent p-0 text-text-primary backdrop:bg-background/80"
    >
      <form
        onSubmit={submit}
        className="max-h-dvh overflow-y-auto rounded-t-xl border border-border-interactive bg-surface-raised p-4 shadow-2xl motion-reduce:transition-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-caption font-bold tracking-station text-tide-cyan">SESSION-ONLY</p>
            <h2 id="tackle-editor-title" className="mt-1 text-h2">Add a lure</h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="inline-flex min-h-touch-floor items-center justify-center rounded-md border border-border-interactive px-4 text-label text-text-link focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring active:scale-95"
          >
            Close
          </button>
        </div>

        <p className="mt-3 text-body text-text-muted">
          This prototype keeps changes only in this open session. Nothing syncs yet.
        </p>

        <div className="mt-6 flex flex-col gap-5">
          <label className="flex flex-col gap-2 text-label">
            Your lure name
            <input
              ref={nameRef}
              value={draft.label}
              onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))}
              aria-invalid={submitted && !draft.label.trim()}
              aria-describedby={submitted && !draft.label.trim() ? "tackle-name-error" : undefined}
              className="min-h-touch-floor rounded-md border border-border-interactive bg-background px-4 text-body text-text-primary focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring"
            />
            {submitted && !draft.label.trim() ? (
              <span id="tackle-name-error" className="text-caption text-error-red">
                Give this lure a name.
              </span>
            ) : null}
          </label>

          <fieldset className="flex flex-col gap-3">
            <legend className="text-label">Lure class</legend>
            <div className="flex flex-wrap gap-3" role="group" aria-label="Lure class">
              {LURE_CLASSES.slice(0, 7).map((option) => {
                const selected = draft.lureClass === option.label;
                return (
                  <button
                    key={option.label}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => selectClass(option.label, option.waterClass)}
                    className={`min-h-touch-floor rounded-full border px-4 text-label focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring active:scale-95 ${
                      selected
                        ? "border-signal-orange bg-signal-orange text-ink-on-orange"
                        : "border-border-interactive text-text-link"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            <label className="flex flex-col gap-2 text-label">
              Or choose another class
              <select
                value={draft.lureClass}
                onChange={(event) => {
                  const option = LURE_CLASSES.find((candidate) => candidate.label === event.target.value);
                  selectClass(option?.label ?? "", option?.waterClass ?? "both");
                }}
                aria-invalid={submitted && !draft.lureClass}
                aria-describedby={submitted && !draft.lureClass ? "tackle-class-error" : undefined}
                className="min-h-touch-floor rounded-md border border-border-interactive bg-background px-4 text-body text-text-primary focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring"
              >
                <option value="">Choose a lure class</option>
                {LURE_CLASSES.map((option) => (
                  <option key={option.label} value={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {submitted && !draft.lureClass ? (
              <p id="tackle-class-error" className="text-caption text-error-red">
                Choose the closest lure class.
              </p>
            ) : null}
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-label">
              Color <span className="font-normal text-text-muted">(optional)</span>
              <input
                value={draft.color}
                onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))}
                className="min-h-touch-floor rounded-md border border-border-interactive bg-background px-4 text-body text-text-primary focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring"
              />
            </label>
            <label className="flex flex-col gap-2 text-label">
              Size <span className="font-normal text-text-muted">(optional)</span>
              <input
                value={draft.sizeLabel}
                onChange={(event) => setDraft((current) => ({ ...current, sizeLabel: event.target.value }))}
                className="min-h-touch-floor rounded-md border border-border-interactive bg-background px-4 text-body text-text-primary focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring"
              />
            </label>
          </div>

          <button
            type="button"
            aria-pressed={draft.isFavorite}
            onClick={() => setDraft((current) => ({ ...current, isFavorite: !current.isFavorite }))}
            className={`min-h-touch-floor rounded-md border px-4 text-label focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring active:scale-95 ${
              draft.isFavorite
                ? "border-signal-orange bg-signal-orange text-ink-on-orange"
                : "border-border-interactive text-text-link"
            }`}
          >
            {draft.isFavorite ? "Favorite for quick rigging" : "Save as a favorite"}
          </button>
        </div>

        <button
          type="submit"
          className="mt-8 flex min-h-touch-primary-standard w-full items-center justify-center rounded-md bg-signal-orange px-6 text-label text-ink-on-orange transition-colors hover:bg-signal-orange-pressed focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring active:scale-95 motion-reduce:transition-none"
        >
          Add lure to this session
        </button>
      </form>
    </dialog>
  );
}
