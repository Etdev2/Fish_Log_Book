"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";

import {
  depthToMetres,
  lengthToMillimetres,
  parseMeasurement,
  weightToGrams,
  type DepthUnit,
  type LengthUnit,
  type WeightUnit,
} from "@/core/rules/catch/measurement";
import type { Disposition, GearRole } from "@/core/rules/catch/types";
import type { CatchDraft } from "../create";
import { GEAR_ROLE_LABEL, type UnitSystem } from "../format";
import {
  CHIP_CLASS,
  CHIP_OFF,
  CHIP_ON,
  INPUT_CLASS,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
} from "../ui-classes";
import { MeasurementField } from "./measurement-field";
import { SpeciesPicker } from "./species-picker";

/**
 * Quick Log — the screen the whole feature is judged on (spec §2, §4).
 *
 * Target is a catch in 5–10 seconds, so exactly one thing is above the fold: species.
 * Save is live from the first tap; everything else lives behind **Add details** and is
 * genuinely optional (spec §4's progressive disclosure). The sheet does not validate its
 * way into blocking a save — an angler holding a fish gets to save an imperfect record.
 *
 * Repeat mode (spec §6) reuses this sheet with a seeded draft, so "+ Log another" and a
 * fresh catch are the same code path and cannot drift apart.
 */

export type LogRequest = {
  key: string;
  /** Pre-filled from a repeat or a duplicate; null for a fresh catch. */
  seed: CatchDraft | null;
  note: string | null;
  title: string;
};

const DISPOSITIONS: readonly { id: Disposition; label: string }[] = [
  { id: "kept", label: "Kept" },
  { id: "released", label: "Released" },
];

const GEAR_ROLES: readonly GearRole[] = ["rod", "reel", "main_line", "leader", "hook", "lure", "jig", "bait"];

export function QuickLogSheet({
  request,
  recentSpeciesIds,
  unitSystem,
  onClose,
  onSave,
}: {
  request: LogRequest | null;
  recentSpeciesIds: readonly string[];
  unitSystem: UnitSystem;
  onClose: () => void;
  onSave: (draft: CatchDraft, andAnother: boolean) => void;
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
      aria-labelledby="quick-log-title"
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
        <LogForm
          key={request.key}
          request={request}
          recentSpeciesIds={recentSpeciesIds}
          unitSystem={unitSystem}
          onClose={onClose}
          onSave={onSave}
        />
      ) : null}
    </dialog>
  );
}

function LogForm({
  request,
  recentSpeciesIds,
  unitSystem,
  onClose,
  onSave,
}: {
  request: LogRequest;
  recentSpeciesIds: readonly string[];
  unitSystem: UnitSystem;
  onClose: () => void;
  onSave: (draft: CatchDraft, andAnother: boolean) => void;
}) {
  const seed = request.seed;
  const [speciesId, setSpeciesId] = useState<string | null>(seed?.speciesId ?? null);
  const [speciesOther, setSpeciesOther] = useState<string | null>(seed?.speciesOther ?? null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [weight, setWeight] = useState("");
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(unitSystem === "metric" ? "kg" : "lb");
  const [estimated, setEstimated] = useState(false);
  const [length, setLength] = useState("");
  const [lengthUnit, setLengthUnit] = useState<LengthUnit>(unitSystem === "metric" ? "cm" : "in");
  const [depth, setDepth] = useState(
    seed?.depthM !== null && seed?.depthM !== undefined
      ? String(Math.round(unitSystem === "metric" ? seed.depthM : seed.depthM / 0.3048))
      : "",
  );
  const [depthUnit, setDepthUnit] = useState<DepthUnit>(unitSystem === "metric" ? "m" : "ft");
  const [quantity, setQuantity] = useState(1);
  const [disposition, setDisposition] = useState<Disposition | null>(seed?.disposition ?? null);
  const [notes, setNotes] = useState("");
  const [gear, setGear] = useState<CatchDraft["gear"]>(seed?.gear ?? []);
  const [photos, setPhotos] = useState<readonly File[]>([]);

  const build = (): CatchDraft => {
    const weightValue = parseMeasurement(weight);
    const lengthValue = parseMeasurement(length);
    const depthValue = parseMeasurement(depth);
    return {
      speciesId,
      speciesOther: speciesOther && speciesOther.trim() !== "" ? speciesOther.trim() : null,
      quantity,
      weightG:
        typeof weightValue === "number" ? weightToGrams(weightValue, weightUnit) : null,
      lengthMm:
        typeof lengthValue === "number" ? lengthToMillimetres(lengthValue, lengthUnit) : null,
      sizeEstimated: estimated,
      depthM: typeof depthValue === "number" ? depthToMetres(depthValue, depthUnit) : null,
      disposition,
      outcome: "landed",
      presentation: null,
      notes: notes.trim() || null,
      tags: seed?.tags ?? [],
      gear,
      photos,
    };
  };

  const submit = (event: FormEvent, andAnother: boolean) => {
    event.preventDefault();
    onSave(build(), andAnother);
  };

  return (
    <form
      onSubmit={(event) => submit(event, false)}
      className="flex max-h-dvh flex-col gap-4 overflow-y-auto rounded-lg border border-hairline bg-surface p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 id="quick-log-title" className="text-h2">
          {request.title}
        </h2>
        <button type="button" onClick={onClose} className={SECONDARY_BUTTON}>
          Cancel
        </button>
      </div>

      {request.note ? <p className="text-caption text-text-muted">{request.note}</p> : null}

      <SpeciesPicker
        recentIds={recentSpeciesIds}
        selectedId={speciesId}
        selectedOther={speciesOther}
        onSelect={(id) => {
          setSpeciesId(id);
          setSpeciesOther(null);
        }}
        onSelectOther={(name) => {
          setSpeciesOther(name === "" ? null : name);
          setSpeciesId(null);
        }}
      />

      <button
        type="button"
        onClick={() => setDetailsOpen((value) => !value)}
        aria-expanded={detailsOpen}
        className={`${SECONDARY_BUTTON} self-start`}
      >
        {detailsOpen ? "Hide details" : "Add details"}
      </button>

      {detailsOpen ? (
        <div className="flex flex-col gap-4 border-t border-hairline pt-4">
          <MeasurementField
            label="Weight"
            value={weight}
            onChange={setWeight}
            units={["lb", "kg"]}
            unit={weightUnit}
            onUnitChange={(next) => setWeightUnit(next as WeightUnit)}
            placeholder="84"
          />
          <label className="flex min-h-touch-floor items-center gap-3">
            <input
              type="checkbox"
              checked={estimated}
              onChange={(event) => setEstimated(event.target.checked)}
              className="size-6 accent-signal-orange"
            />
            <span className="text-body">Estimated, not weighed</span>
          </label>

          <MeasurementField
            label="Length"
            value={length}
            onChange={setLength}
            units={["in", "cm"]}
            unit={lengthUnit}
            onUnitChange={(next) => setLengthUnit(next as LengthUnit)}
            placeholder="36"
          />
          <MeasurementField
            label="Depth"
            value={depth}
            onChange={setDepth}
            units={["ft", "m"]}
            unit={depthUnit}
            onUnitChange={(next) => setDepthUnit(next as DepthUnit)}
            placeholder="250"
          />

          <div className="flex flex-col gap-2">
            <span className="text-label text-text-muted">Quantity</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="One fewer"
                className={SECONDARY_BUTTON}
              >
                &minus;
              </button>
              <output className="min-w-space-10 text-center text-body-strong">{quantity}</output>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="One more"
                className={SECONDARY_BUTTON}
              >
                +
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-label text-text-muted">Kept or released</span>
            <div className="flex flex-wrap gap-2">
              {DISPOSITIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setDisposition(disposition === option.id ? null : option.id)}
                  aria-pressed={disposition === option.id}
                  className={`${CHIP_CLASS} ${disposition === option.id ? CHIP_ON : CHIP_OFF}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <GearFields gear={gear} onChange={setGear} />

          <div className="flex flex-col gap-2">
            <span className="text-label text-text-muted">Photos</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => setPhotos(Array.from(event.target.files ?? []))}
              className={`${INPUT_CLASS} py-3 file:mr-4 file:rounded-md file:border-0 file:bg-signal-orange file:px-4 file:py-2 file:text-label file:text-ink-on-orange`}
            />
            {photos.length > 0 ? (
              <p className="text-caption text-text-muted">
                {photos.length} {photos.length === 1 ? "photo" : "photos"} will be saved on
                this device with the catch.
              </p>
            ) : null}
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-label text-text-muted">Notes</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="meter marks at 250, bird school working"
              className={`${INPUT_CLASS} py-3`}
            />
          </label>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 border-t border-hairline pt-4">
        <button type="submit" className={PRIMARY_BUTTON}>
          Save catch
        </button>
        <button
          type="button"
          onClick={(event) => submit(event, true)}
          className={SECONDARY_BUTTON}
        >
          Save &amp; log another
        </button>
      </div>
    </form>
  );
}

/**
 * Gear on the catch (spec §13, §14). Roles, not one field: a catch involves a rod, a
 * reel, a leader and a jig, and flattening them into one string is what makes "which
 * leader was I using" unanswerable later.
 */
function GearFields({
  gear,
  onChange,
}: {
  gear: CatchDraft["gear"];
  onChange: (next: CatchDraft["gear"]) => void;
}) {
  const valueFor = (role: GearRole) => gear.find((g) => g.role === role)?.label ?? "";

  const setRole = (role: GearRole, label: string) => {
    const rest = gear.filter((g) => g.role !== role);
    onChange(
      label.trim() === ""
        ? rest
        : [...rest, { role, label, detail: null, tackleItemId: null }],
    );
  };

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-label text-text-muted">Gear</legend>
      {GEAR_ROLES.map((role) => (
        <label key={role} className="flex flex-col gap-2">
          <span className="text-caption text-text-muted">{GEAR_ROLE_LABEL[role]}</span>
          <input
            type="text"
            value={valueFor(role)}
            onChange={(event) => setRole(role, event.target.value)}
            placeholder={GEAR_PLACEHOLDER[role]}
            className={INPUT_CLASS}
          />
        </label>
      ))}
    </fieldset>
  );
}

const GEAR_PLACEHOLDER: Record<GearRole, string> = {
  rod: "UC Viper",
  reel: "Penn VISX 16",
  main_line: "100 lb braid",
  leader: "200 lb fluorocarbon",
  hook: "Owner 4/0",
  lure: "",
  jig: "Nomad Streaker 200g",
  bait: "Live sardine",
  weight: "",
  terminal: "",
};
