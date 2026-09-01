"use client";

import { regionById, type RegionId } from "@/core/ontology/regions";
import { createLocalPreference } from "./preference";

/**
 * Fishing region (ADR 007 §4, founder requirements §4). A device-local preference like
 * units: it changes suggestions, never data. Default Southern California — the
 * founder's call: SoCal is the strong initial experience, just not a permanent
 * constraint baked into the model.
 */
export const regionPreference = createLocalPreference<RegionId>({
  key: "flb:fishing-region",
  defaultValue: "southern_california",
  parse: (raw) => {
    const region = raw === null ? null : regionById(raw);
    return region ? region.id : "southern_california";
  },
  serialize: (value) => value,
});

export function useRegionPreference() {
  return regionPreference.use();
}
