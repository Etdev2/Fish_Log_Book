"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";

import {
  celsiusToFahrenheit,
  depthToMetres,
  fahrenheitToCelsius,
  hpaToInHg,
  inHgToHpa,
  knotsToMps,
  lengthToMillimetres,
  mpsToKnots,
  parseMeasurement,
  weightToGrams,
  type DepthUnit,
  type LengthUnit,
  type WeightUnit,
} from "@/core/rules/catch/measurement";
import { rodSetupLabel } from "@/core/rules/catch/rules";
import type {
  Disposition,
  GearRole,
  LocationConditionRecord,
  RigRecord,
} from "@/core/rules/catch/types";
import type { CatchDraft } from "../create";
import { GEAR_ROLE_LABEL, type UnitSystem } from "../format";
import {
  CHIP_CLASS,
  CHIP_OFF,
  CHIP_ON,
  FOCUS_RING,
  INPUT_CLASS,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
} from "../ui-classes";
import { MeasurementField } from "./measurement-field";
import { useNow } from "@/lib/time/use-now";
import { SpeciesPicker } from "./species-picker";
import { LimitBanner } from "@/features/fish-legal/components/limit-banner";

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
 *
 * **Rod and location sit above Add details, not inside it** (spec §15). They are the two
 * questions that make a catch analysable later — what it came on and where — and unlike
 * weight or notes they are answered by tapping one already-configured chip rather than
 * typing. They only appear at all once the angler has set something up: an angler who
 * has never opened Setup sees exactly the screen they saw before.
 */

export type LogRequest = {
  key: string;
  /** Pre-filled from a repeat or a duplicate; null for a fresh catch. */
  seed: CatchDraft | null;
  note: string | null;
  title: string;
  /**
   * Set when finishing an existing quick mark. The sheet looks identical; the save
   * updates that mark in place instead of writing a new catch (spec §5).
   */
  resolveId?: string;
  /** Calendar backfill (founder Historical §1): the day the sheet should open on. */
  backfillDateKey?: string;
  /** Editing an existing catch (Historical §3): save rewrites that row in place. */
  editId?: string;
};

const DISPOSITIONS: readonly { id: Disposition; label: string }[] = [
  { id: "kept", label: "Kept" },
  { id: "released", label: "Released" },
];

const GEAR_ROLES: readonly GearRole[] = ["rod", "reel", "main_line", "leader", "hook", "lure", "jig", "bait"];

export function QuickLogSheet({
  request,
  recentSpeciesIds,
  rods,
  locations,
  unitSystem,
  onClose,
  onSave,
}: {
  request: LogRequest | null;
  recentSpeciesIds: readonly string[];
  rods: readonly RigRecord[];
  locations: readonly LocationConditionRecord[];
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
          rods={rods}
          locations={locations}
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
  rods,
  locations,
  unitSystem,
  onClose,
  onSave,
}: {
  request: LogRequest;
  recentSpeciesIds: readonly string[];
  rods: readonly RigRecord[];
  locations: readonly LocationConditionRecord[];
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
  // Smart defaults (spec §16): the previous catch's rod and place come pre-selected, and
  // with exactly one rod rigged or one place set up there is nothing to choose between,
  // so it starts selected. Both are *visible* selections the angler can see and change —
  // suggested, never silently assumed. With two or more, nothing is guessed.
  const [rodSetupId, setRodSetupId] = useState<string | null>(
    seed?.rodSetupId ?? (rods.length === 1 ? rods[0].id : null),
  );
  const [locationId, setLocationId] = useState<string | null>(
    seed?.locationId ?? (locations.length === 1 ? locations[0].id : null),
  );

  // When (founder Historical §1): always visible but costs nothing until touched —
  // default "today, now" (or the calendar day the sheet was opened from), never a
  // required decision between the angler and Save.
  const [initialWhen] = useState(() => {
    const fromSeed = seed?.caughtAt ? new Date(seed.caughtAt) : null;
    const now = new Date();
    if (fromSeed && !Number.isNaN(fromSeed.getTime())) {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${fromSeed.getFullYear()}-${pad(fromSeed.getMonth() + 1)}-${pad(fromSeed.getDate())}T${pad(fromSeed.getHours())}:${pad(fromSeed.getMinutes())}`;
    }
    if (request.backfillDateKey) {
      // The day is chosen; the clock time defaults to midday so nobody saves "midnight"
      // by accident while backfilling last Saturday.
      return `${request.backfillDateKey}T12:00`;
    }
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  });
  const [when, setWhen] = useState(initialWhen);
  const whenMs = Date.parse(when);
  const whenValid = !Number.isNaN(whenMs);
  // useNow is the only honest wall-clock in the house (ADR 006 §7); null until hydrated,
  // which conveniently means "no future-warning" during SSR/first paint.
  const now = useNow();
  const whenFuture = whenValid && now !== null && whenMs > Number(now) + 15 * 60_000;

  // Optional conditions (Historical §2): typed in display units, stored SI. Seeded from
  // the edit draft (which carries SI back from the record's snapshot) so an untouched
  // block round-trips unchanged, and clearing a field truly clears it on save.
  const [waterTemp, setWaterTemp] = useState(() =>
    seed?.waterTempC != null
      ? String(Math.round((unitSystem === "metric" ? seed.waterTempC : celsiusToFahrenheit(seed.waterTempC)) * 10) / 10)
      : "",
  );
  const [pressure, setPressure] = useState(() =>
    seed?.pressureHpa != null
      ? String(Math.round((unitSystem === "metric" ? seed.pressureHpa : hpaToInHg(seed.pressureHpa)) * 100) / 100)
      : "",
  );
  const [windSpeed, setWindSpeed] = useState(() =>
    seed?.windSpeedMs != null ? String(Math.round(mpsToKnots(seed.windSpeedMs) * 10) / 10) : "",
  );
  const [windDirDeg, setWindDirDeg] = useState<number | null>(seed?.windDirDeg ?? null);

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
      rodSetupId,
      locationId,
      photos,
      caughtAt: whenValid ? new Date(whenMs).toISOString() : undefined,
      waterTempC: typeof parseMeasurement(waterTemp) === "number"
        ? (unitSystem === "metric" ? (parseMeasurement(waterTemp) as number) : fahrenheitToCelsius(parseMeasurement(waterTemp) as number))
        : null,
      pressureHpa: typeof parseMeasurement(pressure) === "number"
        ? (unitSystem === "metric" ? (parseMeasurement(pressure) as number) : inHgToHpa(parseMeasurement(pressure) as number))
        : null,
      windSpeedMs: typeof parseMeasurement(windSpeed) === "number"
        ? knotsToMps(parseMeasurement(windSpeed) as number)
        : null,
      windDirDeg,
    };
  };

  const submit = (event: FormEvent, andAnother: boolean) => {
    event.preventDefault();
    if (!whenValid || whenFuture) return;
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

      <div className="flex flex-col gap-1">
        <label className="flex flex-col gap-2">
          <span className="text-label text-text-muted">
            {request.backfillDateKey ? "When was it caught?" : "When?"}
          </span>
          <input
            type="datetime-local"
            value={when}
            onChange={(event) => setWhen(event.target.value)}
            className={INPUT_CLASS}
          />
        </label>
        {whenFuture ? (
          <p className="text-caption text-amber-flag">
            That looks like the future — pick the real catch time. Save stays off until it is honest.
          </p>
        ) : null}
      </div>

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

      {/* Fish Legal §12: limit posture for the fish in hand — informational, and only
        when the disposition is "kept". Rendering nothing = no counted rule, not "fine". */}
      {speciesId ? (
        <LimitBanner speciesId={speciesId} disposition={disposition} quantity={quantity} />
      ) : null}

      {rods.length > 0 ? (
        <PresetPicker
          heading="Rod"
          emptyHint={null}
          options={rods.map((rod) => ({
            id: rod.id,
            label: rodSetupLabel(rod),
            detail: rodSummary(rod),
          }))}
          selectedId={rodSetupId}
          onSelect={setRodSetupId}
          clearLabel="Not recorded"
        />
      ) : null}

      {locations.length > 0 ? (
        <PresetPicker
          heading="Where"
          emptyHint={null}
          options={locations.map((location) => ({
            id: location.id,
            label: location.name,
            detail: locationSummary(location),
          }))}
          selectedId={locationId}
          onSelect={setLocationId}
          clearLabel="Not recorded"
        />
      ) : null}

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

          <fieldset className="flex flex-col gap-3 rounded-md border border-hairline p-3">
            <legend className="text-label text-text-muted">Conditions at the catch (optional)</legend>
            <div className="grid grid-cols-2 gap-3">
              <MeasurementField
                label="Water temp"
                value={waterTemp}
                onChange={setWaterTemp}
                units={[unitSystem === "metric" ? "°C" : "°F"]}
                unit={unitSystem === "metric" ? "°C" : "°F"}
                onUnitChange={() => undefined}
                placeholder={unitSystem === "metric" ? "18" : "64"}
              />
              <MeasurementField
                label="Air pressure"
                value={pressure}
                onChange={setPressure}
                units={[unitSystem === "metric" ? "hPa" : "inHg"]}
                unit={unitSystem === "metric" ? "hPa" : "inHg"}
                onUnitChange={() => undefined}
                placeholder={unitSystem === "metric" ? "1013" : "29.92"}
              />
              <MeasurementField
                label="Wind (knots)"
                value={windSpeed}
                onChange={setWindSpeed}
                units={["kt"]}
                unit="kt"
                onUnitChange={() => undefined}
                placeholder="8"
              />
              <label className="flex flex-col gap-2">
                <span className="text-label text-text-muted">Wind from</span>
                <select
                  value={windDirDeg ?? ""}
                  onChange={(event) =>
                    setWindDirDeg(event.target.value === "" ? null : Number(event.target.value))
                  }
                  className={`${INPUT_CLASS} min-h-touch-floor`}
                >
                  <option value="">—</option>
                  {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5, 180, 202.5, 225, 247.5, 270, 292.5, 315, 337.5].map(
                    (deg, i) => (
                      <option key={deg} value={deg}>
                        {["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"][i]}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>
          </fieldset>

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

/**
 * One row of preset chips — today's rods, or today's places.
 *
 * Every option carries a second line saying what it actually is ("65 lb braid · 40 lb
 * fluoro · 2/0"), because "Rod 2" three hours into a trip is not a memory anybody should
 * be asked to hold. `Not recorded` is always present: spec §14 makes presets an
 * accelerator, never a requirement, and a fish caught on a borrowed rod still gets
 * logged.
 */
function PresetPicker({
  heading,
  emptyHint,
  options,
  selectedId,
  onSelect,
  clearLabel,
}: {
  heading: string;
  emptyHint: string | null;
  options: readonly { id: string; label: string; detail: string | null }[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  clearLabel: string;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-label text-text-muted">{heading}</legend>
      {options.length === 0 && emptyHint ? (
        <p className="text-caption text-text-muted">{emptyHint}</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = selectedId === option.id;
          return (
            <button
              key={option.id}
              type="button"
              // Select-only, deliberately not a toggle. Re-tapping the rod you are
              // actually using must never silently clear it — that would be a wrong
              // record produced by a confirming tap, which is the worst kind. Clearing
              // is the explicit "Not recorded" chip beside these.
              onClick={() => onSelect(option.id)}
              aria-pressed={selected}
              className={`flex min-h-touch-floor flex-col items-start justify-center rounded-full border px-4 py-2 text-left transition-colors ${FOCUS_RING} active:scale-95 motion-reduce:transition-none ${
                selected ? CHIP_ON : CHIP_OFF
              }`}
            >
              <span className="text-label">{option.label}</span>
              {option.detail ? (
                <span
                  className={`text-caption ${selected ? "text-ink-on-orange" : "text-text-muted"}`}
                >
                  {option.detail}
                </span>
              ) : null}
            </button>
          );
        })}
        {/*
          "Not recorded" is the absence of a choice, so it never wears the orange fill.
          Orange is this system's affirmative signal, and putting it on the do-nothing
          option made the default look like the recommendation and out-shout the real
          rods. Selected here means "this is where things stand", not "do this".
        */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          aria-pressed={selectedId === null}
          className={`${CHIP_CLASS} ${
            selectedId === null
              ? "border-border-interactive bg-surface-raised text-text-primary"
              : CHIP_OFF
          }`}
        >
          {clearLabel}
        </button>
      </div>
    </fieldset>
  );
}

/** "65 lb braid · 40 lb fluoro · 2/0" — the rig, in the order it reads down the rod. */
export function rodSummary(rod: RigRecord): string | null {
  const parts = rod.gear
    .slice()
    .sort((a, b) => GEAR_ROLES.indexOf(a.role) - GEAR_ROLES.indexOf(b.role))
    .map((g) => g.label)
    .filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : null;
}

/** "Strong uphill · Rocky + Kelp" — what an angler would say about the spot. */
export function locationSummary(location: LocationConditionRecord): string | null {
  const parts: string[] = [];
  if (location.current_term && location.current_term !== "unknown") {
    const strength = location.current_strength;
    parts.push(
      [strength && strength !== "none" ? CURRENT_STRENGTH_LABEL[strength] : null, CURRENT_TERM_LABEL[location.current_term]]
        .filter(Boolean)
        .join(" "),
    );
  }
  if (location.structure_type_ids.length > 0) {
    parts.push(location.structure_type_ids.length === 1 ? "1 structure" : `${location.structure_type_ids.length} structures`);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

export const CURRENT_TERM_LABEL: Record<string, string> = {
  uphill: "uphill",
  downhill: "downhill",
  inshore: "inshore",
  offshore: "offshore",
  unknown: "unknown",
};

export const CURRENT_STRENGTH_LABEL: Record<string, string> = {
  none: "No",
  light: "Light",
  moderate: "Moderate",
  strong: "Strong",
  very_strong: "Very strong",
};
