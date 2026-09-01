import { moonPhaseAt, sunEventsFor, type GeoPoint } from "@/core/rules/astro";
import { degrees, instant } from "@/core/units";
import { uuidv7 } from "@/core/sync/uuid";
import { LOCAL_ANGLER_ID } from "./store";

/**
 * The environmental snapshot attached to a catch (spec §16–§19).
 *
 * **What this captures and what it deliberately does not.** `PLAN.md` §1 cuts live
 * enrichment from the web prototype: tide, weather, pressure and water temperature are
 * fetched server-side later, and every web write lands `enrichment_status = 'pending'`.
 * That cut is honoured here.
 *
 * Sun and moon are the exception, and the reason is D25: they are *computed on device*
 * from the instant and the coordinates. There is no API, no key, and no network — the
 * numbers are as available on a boat with no signal as they are on wifi. Leaving them
 * null and asking a server for them later would be strictly worse data for no gain.
 *
 * So a snapshot written here is `partial`, never `complete`: the astronomical fields are
 * real observations, the marine ones are genuinely still pending. Saying `complete`
 * would be a lie a future correlation would act on.
 *
 * Raw values only (spec §18): `moon_phase_angle_deg` and `moon_illumination_fraction`
 * are stored, and nothing here derives "good moon" or a bite score from them. Tide state
 * is not guessed at all — spec §19 forbids calling anything slack that was not measured,
 * and with no tide series fetched there is nothing to call.
 */

export interface SnapshotInput {
  readonly catchId: string;
  readonly tripId: string;
  readonly observedAt: string;
  readonly waterClass: "salt" | "fresh";
  readonly lat: number | null;
  readonly lng: number | null;
}

export interface ConditionSnapshotRecord {
  readonly id: string;
  readonly angler_id: string;
  readonly trip_id: string;
  readonly catch_id: string;
  readonly kind: "catch";
  readonly observed_at: string;
  readonly water_class: "salt" | "fresh";
  readonly moon_phase_angle_deg: number | null;
  readonly moon_illumination_fraction: number | null;
  readonly sunrise_utc: string | null;
  readonly sunset_utc: string | null;
  readonly civil_twilight_begin_utc: string | null;
  readonly civil_twilight_end_utc: string | null;
  readonly minutes_from_sunrise: number | null;
  readonly minutes_from_sunset: number | null;
  readonly day_of_year: number | null;
  readonly enrichment_status: "pending" | "partial";
  readonly snapshot_basis: "observed" | "historical_reconstruction";
  readonly provenance: Record<string, unknown>;
  readonly created_at: string;
  readonly deleted_at: string | null;
}

const MS_PER_MINUTE = 60_000;

function minutesBetween(from: number, to: number): number {
  return Math.round((from - to) / MS_PER_MINUTE);
}

function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  return Math.floor((date.getTime() - start) / 86_400_000);
}

/**
 * Build the snapshot for a catch.
 *
 * Without coordinates there is no sun or moon to compute — the moon's phase is global but
 * its rise and the angler's relationship to sunset are not — so the row is written with
 * the astronomical fields null and `pending`. A snapshot row is still created, because
 * the catch happened somewhere and the enrichment job needs something to fill in.
 */
export function buildCatchSnapshot(
  input: SnapshotInput,
  captureMode: "live" | "backfill",
): ConditionSnapshotRecord {
  const now = new Date().toISOString();
  const observedMs = Date.parse(input.observedAt);
  const hasFix = input.lat !== null && input.lng !== null && Number.isFinite(observedMs);

  const base = {
    id: uuidv7(),
    angler_id: LOCAL_ANGLER_ID,
    trip_id: input.tripId,
    catch_id: input.catchId,
    kind: "catch" as const,
    observed_at: input.observedAt,
    water_class: input.waterClass,
    // D24: a row typed in months later is reconstructed, not observed, and a future
    // analysis must be able to tell the difference.
    snapshot_basis:
      captureMode === "backfill"
        ? ("historical_reconstruction" as const)
        : ("observed" as const),
    created_at: now,
    deleted_at: null,
  };

  if (!hasFix) {
    return {
      ...base,
      moon_phase_angle_deg: null,
      moon_illumination_fraction: null,
      sunrise_utc: null,
      sunset_utc: null,
      civil_twilight_begin_utc: null,
      civil_twilight_end_utc: null,
      minutes_from_sunrise: null,
      minutes_from_sunset: null,
      day_of_year: Number.isFinite(observedMs) ? dayOfYear(new Date(observedMs)) : null,
      enrichment_status: "pending",
      provenance: { astro: "skipped: no position fix at the moment of the catch" },
    };
  }

  const at = instant(observedMs);
  const point: GeoPoint = {
    latitude: degrees(input.lat as number),
    longitude: degrees(input.lng as number),
  };

  const sun = sunEventsFor(at, point);
  const moon = moonPhaseAt(at);
  const iso = (value: number | null) => (value === null ? null : new Date(value).toISOString());

  return {
    ...base,
    // Phase angle is the correlate; illumination is for display (ontology §3). Age in
    // days maps onto the synodic month, 29.53 days over 360°.
    moon_phase_angle_deg: Math.round((moon.ageDays / 29.530588853) * 360 * 1000) / 1000,
    moon_illumination_fraction: Math.round(moon.illumination * 10_000) / 10_000,
    sunrise_utc: iso(sun.sunrise),
    sunset_utc: iso(sun.sunset),
    civil_twilight_begin_utc: iso(sun.civilDawn),
    civil_twilight_end_utc: iso(sun.civilDusk),
    minutes_from_sunrise: sun.sunrise === null ? null : minutesBetween(observedMs, sun.sunrise),
    minutes_from_sunset: sun.sunset === null ? null : minutesBetween(observedMs, sun.sunset),
    day_of_year: dayOfYear(new Date(observedMs)),
    // Partial, not complete: sun and moon are real, the marine fields are still owed.
    enrichment_status: "partial",
    provenance: {
      astro: "computed on device (D25)",
      tide: "pending: server enrichment (PLAN.md §1)",
      weather: "pending: server enrichment (PLAN.md §1)",
    },
  };
}
