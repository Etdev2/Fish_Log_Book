import type { EnrichmentField } from "./types";

/**
 * How far away a source may be before its number stops describing this water.
 *
 * These are the numbers `catch-environmental-enrichment.md` §18.5 records as **unset and
 * owed by `biostat`**. They are placeholders chosen to be defensible rather than
 * optimistic, and they live in one table so replacing them is a value change.
 *
 * The reasoning behind the shape, which should survive even when the numbers change: a
 * field's radius is how far its quantity stays similar, not how far the provider will
 * happily serve. Air pressure varies over hundreds of kilometres and a station 80 km away
 * is genuinely informative. Tide phase can invert across a single headland, so a gauge on
 * the wrong side of one is worse than nothing. Sea-surface temperature has fronts you can
 * see from space with a degree of difference across a kilometre.
 *
 * Beyond the radius the value is not silently downgraded — it is refused. An
 * `INTERPOLATED` tide from 80 km away would be a number with a provenance line that reads
 * fine and a meaning that is wrong, which is the failure this whole module exists to
 * avoid.
 */
export interface FieldThreshold {
  /** Past this, refuse. */
  readonly maxDistanceM: number;
  /** Past this but inside `maxDistanceM`, keep it but mark it INTERPOLATED. */
  readonly trustedDistanceM: number;
  /** How stale an observation may be relative to the catch instant, in minutes. */
  readonly maxAgeMinutes: number;
  /** Forecast-only fields cannot describe a past date (Refusal NOT_BACKFILLABLE). */
  readonly backfillable: boolean;
}

const HOUR = 60;

export const FIELD_THRESHOLDS: Readonly<Record<EnrichmentField, FieldThreshold>> = {
  // Tide phase inverts across a headland. A gauge on the wrong side of one is not data.
  tide_height_m: { maxDistanceM: 30_000, trustedDistanceM: 12_000, maxAgeMinutes: 30, backfillable: true },
  tide_state: { maxDistanceM: 30_000, trustedDistanceM: 12_000, maxAgeMinutes: 30, backfillable: true },
  tide_rate_m_per_hr: { maxDistanceM: 30_000, trustedDistanceM: 12_000, maxAgeMinutes: 30, backfillable: true },
  minutes_to_next_tide_turn: { maxDistanceM: 30_000, trustedDistanceM: 12_000, maxAgeMinutes: 30, backfillable: true },

  // The angler's own thermometer. Distance is zero by definition; it is never fetched.
  water_temp_c: { maxDistanceM: 0, trustedDistanceM: 0, maxAgeMinutes: 24 * HOUR, backfillable: true },

  /*
    SST is the field anglers care about most and the one we serve worst: a 1 km satellite
    composite over several days is not the temperature at the fish. The wide radius is
    honest about what the product is — a grid cell, not a reading — and the provenance
    line carries the rest.
  */
  sst_c: { maxDistanceM: 25_000, trustedDistanceM: 5_000, maxAgeMinutes: 3 * 24 * HOUR, backfillable: true },

  air_temp_c: { maxDistanceM: 60_000, trustedDistanceM: 25_000, maxAgeMinutes: 2 * HOUR, backfillable: true },
  pressure_hpa: { maxDistanceM: 100_000, trustedDistanceM: 50_000, maxAgeMinutes: 2 * HOUR, backfillable: true },
  pressure_trend_3h_hpa: { maxDistanceM: 100_000, trustedDistanceM: 50_000, maxAgeMinutes: 3 * HOUR, backfillable: true },

  // Wind at the coast is local. A station behind a ridge reports a different day.
  wind_speed_ms: { maxDistanceM: 40_000, trustedDistanceM: 15_000, maxAgeMinutes: HOUR, backfillable: true },
  wind_dir_deg: { maxDistanceM: 40_000, trustedDistanceM: 15_000, maxAgeMinutes: HOUR, backfillable: true },

  wave_height_m: { maxDistanceM: 80_000, trustedDistanceM: 30_000, maxAgeMinutes: 2 * HOUR, backfillable: true },
  wave_period_s: { maxDistanceM: 80_000, trustedDistanceM: 30_000, maxAgeMinutes: 2 * HOUR, backfillable: true },
  wave_dir_deg: { maxDistanceM: 80_000, trustedDistanceM: 30_000, maxAgeMinutes: 2 * HOUR, backfillable: true },
  swell_height_m: { maxDistanceM: 120_000, trustedDistanceM: 60_000, maxAgeMinutes: 3 * HOUR, backfillable: true },
  swell_period_s: { maxDistanceM: 120_000, trustedDistanceM: 60_000, maxAgeMinutes: 3 * HOUR, backfillable: true },
  swell_dir_deg: { maxDistanceM: 120_000, trustedDistanceM: 60_000, maxAgeMinutes: 3 * HOUR, backfillable: true },

  /*
    HF radar is coastal and patchy. `unavailable` will be the common, correct answer, and
    the product must not look broken when it is — the brief lists current speed as if it
    were routinely available and it is not.
  */
  current_speed_ms: { maxDistanceM: 15_000, trustedDistanceM: 6_000, maxAgeMinutes: 2 * HOUR, backfillable: true },
  current_speed_dir_deg: { maxDistanceM: 15_000, trustedDistanceM: 6_000, maxAgeMinutes: 2 * HOUR, backfillable: true },

  chlorophyll_mg_m3: { maxDistanceM: 30_000, trustedDistanceM: 8_000, maxAgeMinutes: 5 * 24 * HOUR, backfillable: true },

  // Bathymetry does not change. Age is irrelevant; resolution is the honest caveat.
  seafloor_depth_m: { maxDistanceM: 2_000, trustedDistanceM: 500, maxAgeMinutes: Number.MAX_SAFE_INTEGER, backfillable: true },
};

export type DistanceVerdict = "TRUSTED" | "INTERPOLATED" | "TOO_FAR";

export function distanceVerdict(field: EnrichmentField, distanceM: number | null): DistanceVerdict {
  const threshold = FIELD_THRESHOLDS[field];
  // A value with no known distance is treated as local. Only the angler's own readings
  // and grid products reach here, and both are already about this cell.
  if (distanceM === null) return "TRUSTED";
  if (distanceM > threshold.maxDistanceM) return "TOO_FAR";
  return distanceM > threshold.trustedDistanceM ? "INTERPOLATED" : "TRUSTED";
}

/** Metres between two coordinates. Haversine on a spherical earth: ±0.3%, far inside every threshold above. */
export function distanceM(
  a: { readonly lat: number; readonly lng: number },
  b: { readonly lat: number; readonly lng: number },
): number {
  const R = 6_371_008.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
