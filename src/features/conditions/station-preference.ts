"use client";

/**
 * Which tide station the angler reads. Same storage mechanics as the region and unit
 * preferences — see `features/settings/preference.ts`.
 */
import { createLocalPreference } from "@/features/settings/preference";

import { DEFAULT_STATION_ID, stationById } from "./stations";

const preference = createLocalPreference<string>({
  key: "flb.tide-station",
  defaultValue: DEFAULT_STATION_ID,
  // An id we no longer ship falls back rather than leaving the chart pointed at nothing.
  parse: (raw) => (raw !== null && stationById(raw) !== null ? raw : DEFAULT_STATION_ID),
  serialize: (value) => value,
});

export const useTideStationPreference = preference.use;
export const setTideStationPreference = preference.set;
export const readTideStationPreference = preference.read;
