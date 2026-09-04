"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { moonReading, phaseName } from "@/core/rules/astro";
import { compassLabel } from "@/core/rules/catch/measurement";
import type { SearchableCatch } from "@/core/rules/catch/search";
import {
  DISPOSITION_LABEL,
  formatClock,
  formatDayHeading,
  formatDepth,
  formatLength,
  formatPressure,
  formatTemperature,
  formatWeight,
  formatWindSpeed,
  GEAR_ROLE_LABEL,
  OUTCOME_LABEL,
  type UnitSystem,
} from "../format";
import { logActions } from "../store";

/** Plain English for the eight phases. Hyphenated ids are for code, not for a card. */
const MOON_PHASE_LABEL: Record<string, string> = {
  new: "New moon",
  "waxing-crescent": "Waxing crescent",
  "first-quarter": "First quarter",
  "waxing-gibbous": "Waxing gibbous",
  full: "Full moon",
  "waning-gibbous": "Waning gibbous",
  "last-quarter": "Last quarter",
  "waning-crescent": "Waning crescent",
};
import { CHIP_CLASS, CHIP_OFF, PRIMARY_BUTTON, SECONDARY_BUTTON } from "../ui-classes";

/**
 * The full Catch Detail page for one record (founder Historical spec §3: Calendar →
 * Day → Catch → Detail).
 *
 * Where the fish-log sheet is a glance, this page is the record: every field the catch
 * actually holds, in sections, with absences simply absent (the sheet's own rule). The
 * tide block is NOT here — it comes from the conditions feature and is composed in by
 * the page, keeping the import direction one-way (conditions → catches, never back).
 *
 * Actions mirror the detail sheet: edit (rewrites in place via the log sheet), favorite,
 * delete with the same inline two-step confirm. Duplicate stays in the sheet's world —
 * this page is for looking at THIS catch, not spawning the next one.
 */
export function CatchRecordView({
  item,
  unitSystem,
  onEdit,
}: {
  item: SearchableCatch;
  unitSystem: UnitSystem;
  /** Opens the log sheet seeded with this record (the host owns the sheet). */
  onEdit: (item: SearchableCatch) => void;
}) {
  const router = useRouter();
  const { record } = item;
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const dateHeading = formatDayHeading(record.local_date, "");
  const timeText = formatClock(record.caught_at, record.caught_tz);

  const summary = useMemo(() => {
    const parts: (string | null)[] = [
      formatWeight(record.weight_g, unitSystem)
        ? `${formatWeight(record.weight_g, unitSystem)} (${
            record.size_estimated ? "estimated" : "measured"
          })`
        : null,
      formatLength(record.length_mm, unitSystem),
      record.quantity > 1 ? `×${record.quantity}` : null,
      formatDepth(record.depth_fished_m, unitSystem)
        ? `at ${formatDepth(record.depth_fished_m, unitSystem)}`
        : null,
    ];
    return parts.filter((p): p is string => p !== null);
  }, [record, unitSystem]);

  const gpsText =
    record.lat !== null && record.lng !== null
      ? record.gps_accuracy_m !== null
        ? `${record.lat.toFixed(5)}, ${record.lng.toFixed(5)} (±${Math.round(record.gps_accuracy_m)} m)`
        : `${record.lat.toFixed(5)}, ${record.lng.toFixed(5)}`
      : null;

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex items-center justify-between gap-3">
        <Link
          href={`/day/${record.local_date}`}
          className="inline-flex min-h-touch-floor items-center gap-2 rounded-md text-label text-text-link focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring"
        >
          ‹ {dateHeading || record.local_date}
        </Link>
        <span className="text-caption text-text-muted">
          {record.capture_mode === "backfill" ? "Backfilled record" : "Logged live"}
        </span>
      </nav>

      <header className="rounded-lg border border-hairline bg-surface p-4">
        <h1 className="text-h1">{item.speciesName ?? record.species_other ?? "Unresolved mark"}</h1>
        <p className="mt-1 text-body text-text-muted">
          {timeText} · {dateHeading || record.local_date}
        </p>
        {summary.length > 0 ? <p className="mt-2 text-h3">{summary.join(" · ")}</p> : null}
        {record.notes ? <p className="mt-3 text-body italic">“{record.notes}”</p> : null}
        {record.tags.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {record.tags.map((tag) => (
              <li key={tag} className={`${CHIP_CLASS} ${CHIP_OFF}`}>
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      <Section title="Where" rows={[
        record.location_name ? ["Spot", record.location_name] : null,
        item.spotName ? ["Named spot", item.spotName] : null,
        gpsText ? ["GPS", gpsText] : null,
        record.bottom_depth_m !== null
          ? ["Bottom", formatDepth(record.bottom_depth_m, unitSystem) as string]
          : null,
        record.platform ? ["Platform", record.platform] : null,
      ]} />

      {item.gear.length > 0 ? (
        <section className="rounded-lg border border-hairline bg-surface p-4">
          <h2 className="text-h3">Gear</h2>
          <ul className="mt-2 flex flex-col gap-1">
            {item.gear.map((g) => (
              <li key={g.id} className="text-body">
                <span className="text-text-muted">
                  {GEAR_ROLE_LABEL[g.role] ?? g.role}:
                </span>{" "}
                {g.label}
                {g.detail ? ` — ${g.detail}` : ""}
              </li>
            ))}
          </ul>
          {record.inherited_fields.length > 0 ? (
            <p className="mt-2 text-caption text-text-muted">
              Carried over from your standing rig: {record.inherited_fields.join(", ")}.
            </p>
          ) : null}
        </section>
      ) : null}

      <Section title="How it happened" rows={[
        record.outcome ? ["Outcome", OUTCOME_LABEL[record.outcome] ?? record.outcome] : null,
        record.disposition && record.disposition !== "n/a"
          ? ["", DISPOSITION_LABEL[record.disposition] ?? record.disposition]
          : null,
        record.presentation ? ["Presentation", record.presentation] : null,
        record.current_term
          ? [
              "Current",
              `${record.current_term}${record.current_strength ? `, ${record.current_strength}` : ""}`,
            ]
          : null,
      ]} />

      <Actions
        item={item}
        confirmingDelete={confirmingDelete}
        onConfirmDelete={() => setConfirmingDelete(true)}
        onCancelDelete={() => setConfirmingDelete(false)}
        onDelete={async () => {
          await logActions.deleteCatch(record.id);
          router.replace("/log");
        }}
        onEdit={() => onEdit(item)}
        onToggleFavorite={() => void logActions.toggleFavorite(record.id)}
        resolvable={record.resolution_state === "unresolved"}
      />
    </div>
  );
}

function Section({
  title,
  rows,
}: {
  title: string;
  rows: readonly (readonly [string, string] | null)[];
}) {
  const present = rows.filter((r): r is readonly [string, string] => r !== null);
  if (present.length === 0) return null;
  return (
    <section className="rounded-lg border border-hairline bg-surface p-4">
      <h2 className="text-h3">{title}</h2>
      <dl className="mt-2 flex flex-col gap-1">
        {present.map(([label, value], i) => (
          <div key={`${label}-${i}`} className="flex gap-2 text-body">
            {label ? <dt className="min-w-24 text-text-muted">{label}</dt> : <dt className="sr-only">Detail</dt>}
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** Snapshot astro + manual environment, shown as its own section. Pure presentation;
    the tide block beside it is composed by the page from the conditions feature. */
export function CatchEnvironmentSection({
  snapshot,
  unitSystem,
  zone,
  observedAt,
}: {
  /** The catch's own IANA zone. Sun times are read in the zone the fish was caught in. */
  zone: string;
  /** When the fish was caught. The moon is computed from this when the snapshot lacks it. */
  observedAt: string;
  snapshot: {
    water_temp_c: number | null;
    pressure_hpa: number | null;
    wind_speed_ms: number | null;
    wind_dir_deg: number | null;
    sunrise_utc: string | null;
    sunset_utc: string | null;
    minutes_from_sunrise: number | null;
    minutes_from_sunset: number | null;
    moon_phase_angle_deg: number | null;
    moon_illumination_fraction: number | null;
    provenance: Record<string, unknown>;
  };
  unitSystem: UnitSystem;
}) {
  /*
   * The moon, from the snapshot when it has one and from the clock when it does not.
   *
   * Catches logged before the app recorded lunar data — and every catch logged without a
   * GPS fix, back when the sun and moon were skipped together — carry nulls that will
   * never fill in. The moon does not need backfilling: its phase is a function of the
   * instant alone, so the value computed now is the same value that would have been
   * written then. Nothing is stored; this is a reading, like the phase name beside it.
   */
  const moon = ((): { phaseAngleDeg: number; illuminationFraction: number } | null => {
    if (snapshot.moon_illumination_fraction !== null && snapshot.moon_phase_angle_deg !== null) {
      return {
        phaseAngleDeg: snapshot.moon_phase_angle_deg,
        illuminationFraction: snapshot.moon_illumination_fraction,
      };
    }
    const atMs = Date.parse(observedAt);
    return Number.isNaN(atMs) ? null : moonReading(atMs);
  })();

  const rows: (readonly [string, string] | null)[] = [
    snapshot.water_temp_c !== null
      ? ["Water temp", formatTemperature(snapshot.water_temp_c, unitSystem) as string]
      : null,
    snapshot.pressure_hpa !== null
      ? ["Air pressure", formatPressure(snapshot.pressure_hpa, unitSystem) as string]
      : null,
    snapshot.wind_speed_ms !== null
      ? [
          "Wind",
          `${formatWindSpeed(snapshot.wind_speed_ms)}${
            snapshot.wind_dir_deg !== null ? ` from ${compassLabel(snapshot.wind_dir_deg)}` : ""
          }`,
        ]
      : null,
    snapshot.sunrise_utc !== null
      ? [
          "Sun",
          // The catch's own zone, the same one the catch time is shown in — "local" was
          // never a time zone, and reading sunrise in a different zone to the catch would
          // be wrong even if it had been.
          `rise ${formatClock(snapshot.sunrise_utc, zone)} · set ${formatClock(
            snapshot.sunset_utc ?? snapshot.sunrise_utc,
            zone,
          )}`,
        ]
      : null,
    moon !== null
      ? [
          "Moon",
          /*
           * The phase NAME is derived here rather than stored: spec §18 keeps raw values
           * in the snapshot and nothing derived. Illumination alone reads as a number
           * nobody asked for — "waxing gibbous · 78% lit" is the sentence an angler says.
           * Both are shown, never the name alone, per the note in moon.ts.
           */
          `${MOON_PHASE_LABEL[phaseName(moon.phaseAngleDeg)]} · ${Math.round(
            moon.illuminationFraction * 100,
          )}% lit`,
        ]
      : null,
  ];
  const present = rows.filter((r): r is readonly [string, string] => r !== null);
  if (present.length === 0) return null;

  return (
    <section className="rounded-lg border border-hairline bg-surface p-4">
      <h2 className="text-h3">Conditions</h2>
      <dl className="mt-2 flex flex-col gap-1">
        {present.map(([label, value]) => (
          <div key={label} className="flex gap-2 text-body">
            <dt className="min-w-24 text-text-muted">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {typeof snapshot.provenance.manual === "string" ? (
        <p className="mt-2 text-caption text-text-muted">
          Water temp, pressure and wind: {snapshot.provenance.manual}.
        </p>
      ) : null}
    </section>
  );
}

function Actions({
  item,
  confirmingDelete,
  onConfirmDelete,
  onCancelDelete,
  onDelete,
  onEdit,
  onToggleFavorite,
  resolvable,
}: {
  item: SearchableCatch;
  confirmingDelete: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onToggleFavorite: () => void;
  resolvable: boolean;
}) {
  return (
    <section
      aria-label="Catch actions"
      className="flex flex-col gap-2 rounded-lg border border-hairline bg-surface p-4"
    >
      {resolvable ? (
        <button type="button" onClick={onEdit} className={PRIMARY_BUTTON}>
          Say what this was
        </button>
      ) : (
        <button type="button" onClick={onEdit} className={SECONDARY_BUTTON}>
          Edit this catch
        </button>
      )}
      <button
        type="button"
        onClick={onToggleFavorite}
        aria-pressed={item.record.favorite}
        className={`${CHIP_CLASS} ${CHIP_OFF} self-start`}
      >
        {item.record.favorite ? "★ Favorited" : "☆ Favorite"}
      </button>
      {confirmingDelete ? (
        <div className="flex flex-col gap-2 rounded-md border border-error-red p-3">
          <p role="alert" className="text-body">
            Delete this catch? It leaves your log.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onCancelDelete} className={SECONDARY_BUTTON}>
              Keep it
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex min-h-touch-floor items-center justify-center rounded-md bg-error-red px-4 text-label font-semibold text-ink-on-orange"
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={onConfirmDelete} className={SECONDARY_BUTTON}>
          Delete…
        </button>
      )}
    </section>
  );
}
