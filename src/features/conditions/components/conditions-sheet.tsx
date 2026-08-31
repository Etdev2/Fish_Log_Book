"use client";

import { useEffect, useId, useRef } from "react";

/**
 * The one bottom sheet the tide screen uses for every piece of secondary information
 * (station, moon, tide detail).
 *
 * Why a sheet and not a route: a separate page is the right shape for a separate TASK.
 * Detail about the thing already on screen is progressive disclosure — pushing a route for
 * it costs a navigation, a back tap, and the reader's place on the timeline, and on this
 * screen "where was I looking?" is the whole point. The chart stays mounted and scrolled
 * where the angler left it while a sheet is open.
 *
 * Native `<dialog showModal()>` rather than a hand-rolled overlay: it brings the top layer,
 * focus trapping, `Esc`, inert background, and the `::backdrop` pseudo-element with no ARIA
 * wiring of our own — the same pattern `features/tackle`'s editor sheet already uses here.
 */
export function ConditionsSheet({
  open,
  onClose,
  eyebrow,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="tide-sheet"
      aria-labelledby={headingId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={() => {
        if (open) onClose();
      }}
      // A click on the dialog element itself is a click on the backdrop: the panel below
      // stops propagation, so this only ever fires outside it.
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div className="tide-sheet-panel" onClick={(event) => event.stopPropagation()}>
        <div className="tide-sheet-grabber" aria-hidden="true" />
        <header className="tide-sheet-header">
          <div>
            <p className="tide-sheet-eyebrow">{eyebrow}</p>
            <h2 id={headingId} className="tide-sheet-title">
              {title}
            </h2>
          </div>
          <button type="button" className="tide-sheet-close" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="tide-sheet-body">{children}</div>
      </div>
    </dialog>
  );
}

/** A label/value row. The label is the question, the value is the answer — one per line so
 *  a reader with the glasses in the truck is never scanning a dense table for one number. */
export function SheetRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="tide-sheet-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
