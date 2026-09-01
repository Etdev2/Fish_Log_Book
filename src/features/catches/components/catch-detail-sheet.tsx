"use client";

import { useEffect, useRef, useState } from "react";

import { sortGear } from "@/core/rules/catch/rules";
import type { SearchableCatch } from "@/core/rules/catch/search";
import { speciesById } from "@/core/ontology/species";
import {
  DISPOSITION_LABEL,
  formatClock,
  formatDepth,
  formatLength,
  formatWeight,
  GEAR_ROLE_LABEL,
  OUTCOME_LABEL,
  type UnitSystem,
} from "../format";
import { photosFor } from "../media";
import { CHIP_CLASS, CHIP_OFF, FOCUS_RING, PRIMARY_BUTTON, SECONDARY_BUTTON } from "../ui-classes";

/**
 * Catch detail (spec §10) — the record, in sections, plus the actions that act on it.
 *
 * Sections render only when they hold something. An empty "Conditions" heading tells the
 * angler nothing and costs them a scroll; absence is information here, not a gap to fill
 * with placeholders.
 *
 * Delete is a two-step inline confirm rather than a browser `confirm()`: it keeps focus
 * inside the dialog and matches the Tackle Box's existing destructive pattern.
 */
export function CatchDetailSheet({
  item,
  unitSystem,
  spotName,
  onClose,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  onResolve,
}: {
  item: SearchableCatch | null;
  unitSystem: UnitSystem;
  spotName: string | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (item: SearchableCatch) => void;
  onToggleFavorite: (id: string) => void;
  onResolve: (item: SearchableCatch) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const open = item !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="catch-detail-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={() => {
        if (open) onClose();
      }}
      className="m-auto max-h-dvh w-full max-w-reading border-0 bg-transparent p-0 text-text-primary backdrop:bg-background/80"
    >
      {item ? (
        <DetailBody
          key={item.record.id}
          item={item}
          unitSystem={unitSystem}
          spotName={spotName}
          onClose={onClose}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onToggleFavorite={onToggleFavorite}
          onResolve={onResolve}
        />
      ) : null}
    </dialog>
  );
}

function weightText(item: SearchableCatch, system: UnitSystem): string | null {
  const weight = formatWeight(item.record.weight_g, system);
  if (weight === null) return null;
  return item.record.size_estimated ? `${weight} (estimated)` : `${weight} (measured)`;
}

function Header({ item, onClose }: { item: SearchableCatch; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <h2 id="catch-detail-title" className="text-h2">
        {item.speciesName ?? "Unresolved mark"}
      </h2>
      <button type="button" onClick={onClose} className={SECONDARY_BUTTON}>
        Close
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 border-t border-hairline pt-4">
      <h3 className="text-label text-text-muted">{title}</h3>
      <dl className="flex flex-col gap-2">{children}</dl>
    </section>
  );
}

/** A label/value pair that renders nothing at all when there is no value. */
function Row({ label, value }: { label: string; value: string | null }) {
  if (value === null || value === "") return null;
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-caption text-text-muted">{label}</dt>
      <dd className="text-body text-text-primary">{value}</dd>
    </div>
  );
}

/**
 * The detail body, remounted per catch via `key`. Keeping the delete confirmation and
 * its focus management here means opening a different catch resets them by construction,
 * rather than by an effect that has to remember to.
 */
function DetailBody({
  item,
  unitSystem,
  spotName,
  onClose,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  onResolve,
}: {
  item: SearchableCatch;
  unitSystem: UnitSystem;
  spotName: string | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (item: SearchableCatch) => void;
  onToggleFavorite: (id: string) => void;
  onResolve: (item: SearchableCatch) => void;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const keepRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);
  const wasConfirming = useRef(false);

  // Opening the confirm unmounts the focused button; move focus deliberately rather
  // than letting it fall to <body>, which strands a keyboard user outside the dialog.
  useEffect(() => {
    if (confirmingDelete) keepRef.current?.focus();
    else if (wasConfirming.current) deleteRef.current?.focus();
    wasConfirming.current = confirmingDelete;
  }, [confirmingDelete]);

  return (
        <div className="flex max-h-dvh flex-col gap-4 overflow-y-auto rounded-lg border border-hairline bg-surface p-4">
          <Header item={item} onClose={onClose} />

          <Section title="Catch">
            <Row label="Time" value={`${formatClock(item.record.caught_at, item.record.caught_tz)} · ${item.record.local_date}`} />
            <Row label="Weight" value={weightText(item, unitSystem)} />
            <Row label="Length" value={formatLength(item.record.length_mm, unitSystem)} />
            <Row label="Quantity" value={item.record.quantity > 1 ? String(item.record.quantity) : null} />
            <Row label="Outcome" value={item.record.outcome ? OUTCOME_LABEL[item.record.outcome] : null} />
            <Row
              label="Kept / released"
              value={item.record.disposition ? DISPOSITION_LABEL[item.record.disposition] : null}
            />
            {speciesById(item.record.species_id)?.scientificName ? (
              <Row label="Species" value={speciesById(item.record.species_id)?.scientificName ?? null} />
            ) : null}
          </Section>

          {item.gear.length > 0 ? (
            <Section title="Gear">
              {sortGear(item.gear).map((g) => (
                <Row key={g.id} label={GEAR_ROLE_LABEL[g.role]} value={g.label} />
              ))}
            </Section>
          ) : null}

          <Section title="Fishing">
            <Row label="Depth" value={formatDepth(item.record.depth_fished_m, unitSystem)} />
            <Row label="Presentation" value={item.record.presentation} />
            <Row label="Platform" value={item.record.platform} />
          </Section>

          <Section title="Location">
            <Row label="Spot" value={spotName} />
            {/* Spec §20/§37: coordinates are never rendered. The angler's spots are the
                most sensitive thing this app holds, and a screen is shoulder-surfable. */}
            <Row
              label="Position"
              value={item.record.lat !== null ? "Saved privately with this catch" : "Not captured"}
            />
          </Section>

          <Photos catchId={item.record.id} />

          {item.record.notes ? (
            <Section title="Notes">
              <p className="text-body whitespace-pre-wrap">{item.record.notes}</p>
            </Section>
          ) : null}

          {item.record.inherited_fields.length > 0 ? (
            <p className="text-caption text-text-muted">
              Carried over from your standing rig: {item.record.inherited_fields.join(", ")}.
            </p>
          ) : null}

          <div className="flex flex-col gap-2 border-t border-hairline pt-4">
            {item.record.resolution_state === "unresolved" ? (
              <button type="button" onClick={() => onResolve(item)} className={PRIMARY_BUTTON}>
                Say what this was
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onDuplicate(item)}
              className={SECONDARY_BUTTON}
            >
              Duplicate
            </button>
            <button
              type="button"
              onClick={() => onToggleFavorite(item.record.id)}
              aria-pressed={item.record.favorite}
              className={`${CHIP_CLASS} ${CHIP_OFF}`}
            >
              {item.record.favorite ? "★ Favorited" : "☆ Favorite"}
            </button>

            {confirmingDelete ? (
              <div className="flex flex-col gap-2 rounded-md border border-error-red p-3">
                <p role="alert" className="text-body">
                  Delete this catch? It leaves your log.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    ref={keepRef}
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className={SECONDARY_BUTTON}
                  >
                    Keep it
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item.record.id)}
                    className={`inline-flex min-h-touch-floor items-center justify-center rounded-md bg-error-red px-4 text-label font-semibold text-ink-on-orange ${FOCUS_RING}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <button
                ref={deleteRef}
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className={`${SECONDARY_BUTTON} text-error-red`}
              >
                Delete
              </button>
            )}
          </div>
        </div>
  );
}

/**
 * Photos held on this device for a catch.
 *
 * Object URLs are created on load and revoked on unmount — without the revoke, opening
 * fifty catches in a session leaks fifty decoded images and the tab eventually dies on a
 * phone. The section renders nothing at all when there are no photos.
 */
function Photos({ catchId }: { catchId: string }) {
  const [urls, setUrls] = useState<readonly string[]>([]);

  useEffect(() => {
    let live = true;
    const created: string[] = [];
    void photosFor(catchId).then((photos) => {
      if (!live) return;
      for (const photo of photos) created.push(URL.createObjectURL(photo.blob));
      setUrls(created);
    });
    return () => {
      live = false;
      for (const url of created) URL.revokeObjectURL(url);
    };
  }, [catchId]);

  if (urls.length === 0) return null;

  return (
    <section className="flex flex-col gap-2 border-t border-hairline pt-4">
      <h3 className="text-label text-text-muted">Photos</h3>
      <ul className="flex flex-wrap gap-2">
        {urls.map((url) => (
          <li key={url}>
            {/* eslint-disable-next-line @next/next/no-img-element -- a blob: URL from
                IndexedDB cannot go through next/image, which needs a static or remote src. */}
            <img
              src={url}
              alt="Catch photo"
              className="max-h-space-16 rounded-md border border-hairline object-cover"
            />
          </li>
        ))}
      </ul>
      <p className="text-caption text-text-muted">Saved on this device.</p>
    </section>
  );
}
