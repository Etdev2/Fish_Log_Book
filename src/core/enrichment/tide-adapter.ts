import type { TideReading } from "@/core/rules/tide/index-types";

import { FIELD_THRESHOLDS } from "./thresholds";
import type { Observation, Refusal } from "./types";

/**
 * A tide reading the app already computes, turned into observations with provenance.
 *
 * The tide engine (`core/rules/tide`) and its NOAA client
 * (`features/conditions/queries/noaa-tides.ts`) are already built, already tested, and
 * already know how to fetch predictions and difference them for movement. This adapter
 * adds the only thing missing for enrichment: the honest labelling.
 *
 * **Tide predictions are `MODEL_ANALYSIS`, not `SENSOR`.** They are a harmonic model
 * evaluated at a station, not a measurement of the water. The distinction matters to
 * anyone who later asks whether a correlation used observations, and getting it wrong
 * would be the most widespread provenance error in the dataset, since tide is the field
 * we can serve most often.
 *
 * NOAA also publishes *verified water levels* for past dates, which ARE sensor readings
 * and are strictly better for backfill. `catch-environmental-enrichment.md` §18.6 leaves
 * that second fetch open for `biostat`; this adapter takes whichever product the caller
 * fetched and labels it accordingly rather than assuming.
 *
 * Pure, per ADR 003: no clock, no network, no station lookup.
 */

export type TideProduct = "predictions" | "verified";

export interface TideAdapterInput {
  readonly reading: TideReading;
  /** Which NOAA product produced it — decides the observation kind. */
  readonly product: TideProduct;
  readonly stationId: string;
  /** Metres from the catch to the station. Drives the distance verdict in merge.ts. */
  readonly distanceToStationM: number;
  /** The caller's clock, passed in. Nothing here reads time. */
  readonly retrievedAtMs: number;
  readonly datasetVersion: string;
  readonly algoVersion: number;
}

const PROVIDER_ID = "noaa-coops";

/**
 * `tide_state` in the schema's vocabulary, from the engine's four-way motion.
 *
 * The engine distinguishes `slack` from `near-slack`; the column does not, and ontology.md
 * §7 fixes its values at flood/ebb/slack. Both slack kinds map to `slack`, which is a
 * deliberate widening: SPEC.md §19 forbids calling anything slack that was not measured,
 * and "near-slack" is the engine being careful about a boundary rather than a fifth state.
 */
function tideStateOf(reading: TideReading): "flood" | "ebb" | "slack" {
  if (reading.motion === "slack" || reading.motion === "near-slack") return "slack";
  return reading.motion === "rising" ? "flood" : "ebb";
}

export function tideObservations(input: TideAdapterInput): {
  readonly observations: readonly Observation[];
  readonly refusals: readonly Refusal[];
} {
  const { reading, product, stationId, distanceToStationM, retrievedAtMs } = input;

  const base = {
    kind: product === "verified" ? ("SENSOR" as const) : ("MODEL_ANALYSIS" as const),
    providerId: PROVIDER_ID,
    datasetId: `coops:${product}:${stationId}`,
    datasetVersion: input.datasetVersion,
    observedAt: Number(reading.at),
    retrievedAt: retrievedAtMs,
    /*
      A tide station is a point, not a grid. Spatial resolution is meaningless here and is
      null rather than 0 — zero would read as "perfectly resolved", which is the opposite
      of what a station 12 km away tells you. The distance carries that instead.
    */
    spatialResolutionM: null,
    distanceToSourceM: Math.round(distanceToStationM),
    qualityFlag: null,
    algoVersion: input.algoVersion,
  };

  const observations: Observation[] = [
    { ...base, field: "tide_height_m", value: Number(reading.height.value), unit: "m" },
    { ...base, field: "tide_state", value: tideStateOf(reading), unit: "" },
    {
      ...base,
      field: "tide_rate_m_per_hr",
      value: Number(reading.rate.value),
      unit: "m/h",
    },
  ];

  const refusals: Refusal[] = [];

  /*
    Time to the next turn is the field an angler actually plans around, and it is the one
    that is null most often: the series has to extend past the catch for a next turn to
    exist at all. A fetch window that ends at the catch instant has no next turn, and
    inventing one by extrapolating a harmonic curve past its data is exactly the kind of
    plausible wrong number this module refuses to produce.
  */
  if (reading.nextTurn === null) {
    refusals.push({
      field: "minutes_to_next_tide_turn",
      reason: "NO_COVERAGE",
      detail: "the fetched series does not extend past this catch",
    });
  } else {
    observations.push({
      ...base,
      field: "minutes_to_next_tide_turn",
      value: Math.round((Number(reading.nextTurn.at) - Number(reading.at)) / 60_000),
      unit: "min",
    });
  }

  return { observations, refusals };
}

/** The station is too far for any tide field to mean anything here. */
export function tideOutOfRange(distanceToStationM: number): boolean {
  return distanceToStationM > FIELD_THRESHOLDS.tide_height_m.maxDistanceM;
}
