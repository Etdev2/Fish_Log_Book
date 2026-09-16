/**
 * What an enriched value is, and what it has to carry to be worth storing.
 *
 * `condition_snapshot` was built for this two months ago — it has the columns, the
 * `enrichment_status` lifecycle, `snapshot_basis`, `algo_version`, a retry counter and a
 * schema comment explaining that `unavailable` is terminal. Nothing ever filled it in,
 * because no worker was ever built. Every snapshot in the system is `pending` and always
 * has been.
 *
 * These types are the contract that worker writes against. The rule they exist to enforce
 * is `catch-environmental-enrichment.md` Rule D3: **a value with no provenance is not a
 * value.** A number arriving without a provider, a dataset version and an honest
 * statement of what kind of observation it is cannot be distinguished later from a guess,
 * and a fisheries scientist will — correctly — refuse the whole dataset over it.
 *
 * Pure, per ADR 003.
 */

/**
 * The distinction the founder brief asks for, made structural instead of editorial.
 *
 * These are not confidence levels and must not be sorted as if they were. A buoy 30 km
 * away (`SENSOR`) may be a worse description of the water at the fish than a 1 km model
 * analysis. They say what KIND of claim a number is, so that a later correlation can
 * exclude the kinds it must not treat as measurement.
 */
export type ObservationKind =
  /** The angler, with a thermometer. The only in-situ measurement in the whole system. */
  | "USER_MEASURED"
  /** A real instrument somewhere else: a buoy, a tide gauge, a weather station. */
  | "SENSOR"
  /** Remote sensing, typically composited over days and gapped by cloud. Never "live". */
  | "SATELLITE"
  /** A model run over past observations. Tide predictions are this, not measurements. */
  | "MODEL_ANALYSIS"
  /** A model run forward. Never backfills: a forecast for a past date is not evidence. */
  | "MODEL_FORECAST"
  /** Derived between known points, ours or a provider's. Always the weakest claim. */
  | "INTERPOLATED"
  /** A long-run average for this place and season. Better than null, barely. */
  | "CLIMATOLOGY";

/** Fields an observation may describe. One name per `condition_snapshot` column. */
export type EnrichmentField =
  | "tide_height_m"
  | "tide_state"
  | "tide_rate_m_per_hr"
  | "minutes_to_next_tide_turn"
  | "water_temp_c"
  | "sst_c"
  | "air_temp_c"
  | "pressure_hpa"
  | "pressure_trend_3h_hpa"
  | "wind_speed_ms"
  | "wind_dir_deg"
  | "wave_height_m"
  | "wave_period_s"
  | "wave_dir_deg"
  | "swell_height_m"
  | "swell_period_s"
  | "swell_dir_deg"
  | "current_speed_ms"
  | "current_speed_dir_deg"
  | "chlorophyll_mg_m3"
  | "seafloor_depth_m";

export interface Observation {
  readonly field: EnrichmentField;
  readonly value: number | string | null;
  readonly unit: string;
  readonly kind: ObservationKind;
  readonly providerId: string;
  readonly datasetId: string;
  /** REQUIRED. A value whose dataset version is unknown cannot be reproduced. */
  readonly datasetVersion: string;
  /** When the world was like this. Null only for a value with no meaningful instant. */
  readonly observedAt: number | null;
  /** When we asked. Always known, always the caller's clock — never read in here. */
  readonly retrievedAt: number;
  readonly spatialResolutionM: number | null;
  /** Distance from the station, buoy or grid centre that produced it. */
  readonly distanceToSourceM: number | null;
  /** The provider's own quality flag, verbatim. Never reinterpreted. */
  readonly qualityFlag: string | null;
  readonly algoVersion: number;
}

/** Why a field in the plan produced nothing. Drives retry, so the distinction matters. */
export type RefusalReason =
  /** No source covers this place and date, and none ever will. TERMINAL. */
  | "NO_COVERAGE"
  /** The nearest source is too far to describe this water. TERMINAL for this catch. */
  | "TOO_FAR"
  /** The provider failed or timed out. Retryable. */
  | "TRANSPORT"
  /** A forecast-only field asked for a past date. TERMINAL. */
  | "NOT_BACKFILLABLE"
  /** Not applicable here at all — tide on a lake. TERMINAL, and not a failure. */
  | "NOT_APPLICABLE";

export interface Refusal {
  readonly field: EnrichmentField;
  readonly reason: RefusalReason;
  readonly detail: string | null;
}

/** Retryable refusals leave the snapshot pending; the rest are final for that field. */
export const RETRYABLE_REASONS: readonly RefusalReason[] = ["TRANSPORT"];

export function isRetryable(reason: RefusalReason): boolean {
  return RETRYABLE_REASONS.includes(reason);
}
