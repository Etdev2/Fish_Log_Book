/**
 * The input contract a live NOAA CO-OPS fetch must satisfy unchanged. See ADR 006 §2.
 */
import type { Instant, Metres } from "@/core/units";

export interface TideStation {
  readonly id: string;
  readonly name: string;
  /** IANA zone. Presentation metadata only — never read inside `core/rules/tide/` maths. */
  readonly timeZone: string;
  readonly datum: "MLLW" | "MSL" | "NAVD88";
}

export interface TidePredictionSample {
  readonly at: Instant;
  /** Height above `station.datum`. */
  readonly height: Metres;
  readonly turn: "high" | "low" | null;
}

export interface TidePredictionSeries {
  readonly station: TideStation;
  /** Ascending by `at`, non-empty. Validated by `tideSeries()`. */
  readonly samples: readonly TidePredictionSample[];
  readonly provider: "noaa-coops" | "fixture";
  /** `null` = provenance unrecorded. */
  readonly retrievedAt: Instant | null;
}

/**
 * The only way to construct a `TidePredictionSeries`. Throws on empty or non-ascending
 * input so every downstream read function can assume a validated series.
 */
export function tideSeries(input: {
  station: TideStation;
  samples: readonly TidePredictionSample[];
  provider: TidePredictionSeries["provider"];
  retrievedAt?: Instant | null;
}): TidePredictionSeries {
  const { station, samples, provider } = input;
  const retrievedAt = input.retrievedAt ?? null;

  if (samples.length === 0) {
    throw new Error("tideSeries: samples must be non-empty.");
  }

  for (let i = 1; i < samples.length; i++) {
    if (samples[i].at <= samples[i - 1].at) {
      throw new Error(
        `tideSeries: samples must be strictly ascending by \`at\`. ` +
          `Sample ${i} (at=${samples[i].at}) does not follow sample ${i - 1} (at=${samples[i - 1].at}).`,
      );
    }
  }

  return { station, samples, provider, retrievedAt };
}
