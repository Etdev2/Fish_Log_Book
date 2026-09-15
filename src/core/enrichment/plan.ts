import { FIELD_THRESHOLDS } from "./thresholds";
import type { EnrichmentField } from "./types";

/**
 * Which fields are even askable for this catch, before any network call is made.
 *
 * A plan is data, so it is testable without a provider, and so "we never asked" and "we
 * asked and got nothing" stay distinguishable. The second is a coverage fact worth
 * storing; the first is a bug.
 *
 * Pure, per ADR 003: no clock, no I/O. The caller supplies the instant.
 */

export type WaterClass = "salt" | "fresh";
/** D24: was this captured near the moment, or reassembled from an archive later? */
export type SnapshotBasis = "observed" | "historical_reconstruction";

export interface PlanInput {
  readonly waterClass: WaterClass;
  /** The 1 km cell, never the coordinate — providers and logs see this and only this. */
  readonly geoCell1km: string | null;
  readonly observedAtMs: number;
  readonly basis: SnapshotBasis;
  /** What the angler typed. Planned around, never over-written. */
  readonly userMeasuredFields: readonly EnrichmentField[];
}

export interface PlannedField {
  readonly field: EnrichmentField;
  readonly reason: "PLANNED";
}

export interface SkippedField {
  readonly field: EnrichmentField;
  readonly reason: "NOT_APPLICABLE" | "USER_SUPPLIED" | "NOT_BACKFILLABLE" | "NO_POSITION";
}

export interface FetchPlan {
  readonly planned: readonly PlannedField[];
  readonly skipped: readonly SkippedField[];
}

/**
 * Salt-only fields. `condition_snapshot`'s own check constraint already refuses these on
 * freshwater rows, so planning one would be a write the database rejects.
 *
 * ontology.md §3 is firm about why they are absent rather than null: "a meaningless
 * nullable column gets filled in eventually". The same logic applies a layer up — a
 * freshwater catch whose tide is `pending` forever is a queue entry that can never
 * succeed, and a worker that retries it is a worker burning money on a lake.
 */
const SALT_ONLY: readonly EnrichmentField[] = [
  "tide_height_m",
  "tide_state",
  "tide_rate_m_per_hr",
  "minutes_to_next_tide_turn",
  "sst_c",
  "wave_height_m",
  "wave_period_s",
  "wave_dir_deg",
  "swell_height_m",
  "swell_period_s",
  "swell_dir_deg",
  "current_speed_ms",
  "current_speed_dir_deg",
  "chlorophyll_mg_m3",
];

/** Everything the worker knows how to ask for, in the order a person would want it. */
const ALL_FIELDS = Object.keys(FIELD_THRESHOLDS) as readonly EnrichmentField[];

/**
 * Fields computed on the device from the instant and position (D25), never fetched.
 *
 * Sun and moon are deliberately absent from this whole module. They are exact, free and
 * available on a boat with no signal; asking a server for them later would be strictly
 * worse data for no gain.
 */
const DEVICE_COMPUTED: readonly EnrichmentField[] = [];

export function buildFetchPlan(input: PlanInput): FetchPlan {
  const planned: PlannedField[] = [];
  const skipped: SkippedField[] = [];

  for (const field of ALL_FIELDS) {
    if (DEVICE_COMPUTED.includes(field)) continue;

    /*
      The angler's own reading wins and is never fetched over. `water_temp_c` typed on the
      boat is the only in-situ measurement in the system; replacing it with a satellite
      composite would be trading the best number for the worst and calling it enrichment.
    */
    if (input.userMeasuredFields.includes(field)) {
      skipped.push({ field, reason: "USER_SUPPLIED" });
      continue;
    }

    if (input.waterClass === "fresh" && SALT_ONLY.includes(field)) {
      skipped.push({ field, reason: "NOT_APPLICABLE" });
      continue;
    }

    // Everything left is a grid or station product keyed on position.
    if (input.geoCell1km === null) {
      skipped.push({ field, reason: "NO_POSITION" });
      continue;
    }

    if (input.basis === "historical_reconstruction" && !FIELD_THRESHOLDS[field].backfillable) {
      skipped.push({ field, reason: "NOT_BACKFILLABLE" });
      continue;
    }

    planned.push({ field, reason: "PLANNED" });
  }

  return { planned, skipped };
}

/**
 * The cache key a provider request is made under.
 *
 * `catch-environmental-enrichment.md` Rule E2, and it is the single largest cost control
 * available: ten anglers on the same reef in the same hour are one request, not ten. It
 * is also a privacy control, because the key is what appears in a log line — the cell,
 * never the coordinate (Rule E1, and ontology.md §6 item 4).
 */
export function providerCacheKey(
  providerId: string,
  datasetVersion: string,
  geoCell1km: string,
  observedAtMs: number,
): string {
  const hourBucket = Math.floor(observedAtMs / 3_600_000);
  return `${providerId}:${datasetVersion}:${geoCell1km}:${hourBucket}`;
}
