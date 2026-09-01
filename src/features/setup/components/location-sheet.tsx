"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";

import { depthToMetres, metresToDepth, parseMeasurement } from "@/core/rules/catch/measurement";
import type {
  CurrentStrength,
  CurrentTerm,
  LocationConditionRecord,
} from "@/core/rules/catch/types";
import {
  CHIP_CLASS,
  CHIP_OFF,
  CHIP_ON,
  INPUT_CLASS,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
} from "@/features/catches/ui-classes";
import {
  CURRENT_STRENGTHS,
  CURRENT_TERMS,
  STRUCTURE_TYPES,
  WATER_CLARITIES,
  WATER_COLORS,
} from "../vocabulary";

/**
 * Observed conditions at one place (spec §11–§13).
 *
 * Everything except the name is optional. An angler who only wants to record "West End"
 * gets a one-field form; the rest is there for the trip where the current matters.
 *
 * **Water depth here is the bottom**, and the field says so, because spec §13 is
 * emphatic that it is not the depth a fish was caught at. Those are different numbers —
 * 600 ft of water with a fish at 250 — and conflating them would quietly poison every
 * depth correlation the log is being built to support.
 */
export type LocationRequest = {
  key: string;
  existing: LocationConditionRecord | null;
};

export function LocationSheet({
  request,
  tripId,
  depthUnit,
  onClose,
  onSave,
  onDelete,
}: {
  request: LocationRequest | null;
  tripId: string;
  depthUnit: "ft" | "m";
  onClose: () => void;
  onSave: (
    input: Omit<
      LocationConditionRecord,
      "id" | "angler_id" | "created_at" | "client_updated_at" | "deleted_at"
    >,
    id?: string,
  ) => void;
  onDelete: (id: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const open = request !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="location-title"
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
        <LocationForm
          key={request.key}
          request={request}
          tripId={tripId}
          depthUnit={depthUnit}
          onClose={onClose}
          onSave={onSave}
          onDelete={onDelete}
        />
      ) : null}
    </dialog>
  );
}

function LocationForm({
  request,
  tripId,
  depthUnit,
  onClose,
  onSave,
  onDelete,
}: {
  request: LocationRequest;
  tripId: string;
  depthUnit: "ft" | "m";
  onClose: () => void;
  onSave: (
    input: Omit<
      LocationConditionRecord,
      "id" | "angler_id" | "created_at" | "client_updated_at" | "deleted_at"
    >,
    id?: string,
  ) => void;
  onDelete: (id: string) => void;
}) {
  const existing = request.existing;
  const [name, setName] = useState(existing?.name ?? "");
  const [term, setTerm] = useState<CurrentTerm | null>(existing?.current_term ?? null);
  const [strength, setStrength] = useState<CurrentStrength | null>(
    existing?.current_strength ?? null,
  );
  const [structures, setStructures] = useState<readonly string[]>(
    existing?.structure_type_ids ?? [],
  );
  const [depth, setDepth] = useState(
    existing?.bottom_depth_m !== null && existing?.bottom_depth_m !== undefined
      ? String(Math.round(metresToDepth(existing.bottom_depth_m, depthUnit)))
      : "",
  );
  const [color, setColor] = useState<string | null>(existing?.water_color_id ?? null);
  const [clarity, setClarity] = useState<string | null>(existing?.water_clarity_id ?? null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (name.trim() === "") return;
    const parsedDepth = parseMeasurement(depth);
    onSave(
      {
        trip_id: tripId,
        spot_id: existing?.spot_id ?? null,
        name: name.trim(),
        current_term: term,
        current_strength: strength,
        structure_type_ids: structures,
        bottom_depth_m:
          typeof parsedDepth === "number" ? depthToMetres(parsedDepth, depthUnit) : null,
        water_color_id: color,
        water_clarity_id: clarity,
        notes: existing?.notes ?? null,
      },
      existing?.id,
    );
  };

  return (
    <form
      onSubmit={submit}
      className="flex max-h-dvh flex-col gap-4 overflow-y-auto rounded-lg border border-hairline bg-surface p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 id="location-title" className="text-h2">
          {existing ? "Edit location" : "Add location"}
        </h2>
        <button type="button" onClick={onClose} className={SECONDARY_BUTTON}>
          Cancel
        </button>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-label text-text-muted">Where</span>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Catalina — West End"
          required
          className={INPUT_CLASS}
        />
      </label>

      <ChipRow
        legend="Current"
        options={CURRENT_TERMS}
        selected={term}
        onSelect={(id) => setTerm(term === id ? null : (id as CurrentTerm))}
      />
      <p className="text-caption text-text-muted">
        What the water is doing past the spot, in fishing terms. Not a measured current.
      </p>

      <ChipRow
        legend="Current strength"
        options={CURRENT_STRENGTHS}
        selected={strength}
        onSelect={(id) => setStrength(strength === id ? null : (id as CurrentStrength))}
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="text-label text-text-muted">Structure</legend>
        <div className="flex flex-wrap gap-2">
          {STRUCTURE_TYPES.map((option) => {
            const on = structures.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                onClick={() =>
                  setStructures(
                    on ? structures.filter((id) => id !== option.id) : [...structures, option.id],
                  )
                }
                aria-pressed={on}
                className={`${CHIP_CLASS} ${on ? CHIP_ON : CHIP_OFF}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <p className="text-caption text-text-muted">
          Pick as many as fit — &ldquo;Rocky + Kelp&rdquo; is one place, not two.
        </p>
      </fieldset>

      <label className="flex flex-col gap-2">
        <span className="text-label text-text-muted">Water depth ({depthUnit})</span>
        <input
          type="text"
          inputMode="decimal"
          value={depth}
          onChange={(event) => setDepth(event.target.value)}
          placeholder="180"
          className={INPUT_CLASS}
        />
        <span className="text-caption text-text-muted">
          How deep the water is here — not how deep the fish was.
        </span>
      </label>

      <ChipRow
        legend="Water colour"
        options={WATER_COLORS}
        selected={color}
        onSelect={(id) => setColor(color === id ? null : id)}
      />
      <ChipRow
        legend="Water clarity"
        options={WATER_CLARITIES}
        selected={clarity}
        onSelect={(id) => setClarity(clarity === id ? null : id)}
      />

      <button type="submit" className={`${PRIMARY_BUTTON} mt-2`} disabled={name.trim() === ""}>
        {existing ? "Save location" : "Add location"}
      </button>

      {existing ? (
        confirmingDelete ? (
          <div className="flex flex-col gap-2 rounded-md border border-error-red p-3">
            <p role="alert" className="text-body">
              Remove this location? Fish already logged here keep their conditions.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className={SECONDARY_BUTTON}
              >
                Keep it
              </button>
              <button
                type="button"
                onClick={() => onDelete(existing.id)}
                className={`${SECONDARY_BUTTON} text-error-red`}
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className={`${SECONDARY_BUTTON} text-error-red`}
          >
            Remove location
          </button>
        )
      ) : null}
    </form>
  );
}

function ChipRow({
  legend,
  options,
  selected,
  onSelect,
}: {
  legend: string;
  options: readonly { id: string; label: string }[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-label text-text-muted">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelect(option.id)}
            aria-pressed={selected === option.id}
            className={`${CHIP_CLASS} ${selected === option.id ? CHIP_ON : CHIP_OFF}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
