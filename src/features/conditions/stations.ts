/**
 * NOAA CO-OPS tide stations an angler can choose between.
 *
 * **Verification status, stated plainly.** These ids and names are transcribed from NOAA's
 * published primary station list, but they were NOT re-verified against the live API when
 * this file was written — the machine that wrote it has no route to
 * `api.tidesandcurrents.noaa.gov`. Every one is a well-known primary station and the app
 * is built so a wrong id is visible rather than silent: a station that returns no
 * predictions shows "no predictions for this station", never another station's curve.
 * A pass that walks this list against the live API is owed before release, the same debt
 * `species-photos.ts` carries for image licensing.
 *
 * Only the station's own id matters to NOAA. `timeZone` and `location` are ours, used for
 * clock labels and for sun/moon at the station — never inside the tide maths (ADR 006 §2).
 */

export interface TideStation {
  readonly id: string;
  readonly name: string;
  /** Coast or state, for grouping the picker. */
  readonly region: string;
  readonly timeZone: string;
  readonly latitude: number;
  readonly longitude: number;
}

/** The station the app ships pointing at, and the only one with a bundled offline fixture. */
export const DEFAULT_STATION_ID = "9410580";

export const TIDE_STATIONS: readonly TideStation[] = [
  // --- Southern California ---
  { id: "9410580", name: "Newport Bay Entrance", region: "Southern California", timeZone: "America/Los_Angeles", latitude: 33.6047, longitude: -117.883 },
  { id: "9410170", name: "San Diego, San Diego Bay", region: "Southern California", timeZone: "America/Los_Angeles", latitude: 32.7142, longitude: -117.1736 },
  { id: "9410660", name: "Los Angeles, Outer Harbor", region: "Southern California", timeZone: "America/Los_Angeles", latitude: 33.72, longitude: -118.2717 },
  { id: "9410840", name: "Santa Monica", region: "Southern California", timeZone: "America/Los_Angeles", latitude: 34.0083, longitude: -118.5 },
  { id: "9411340", name: "Santa Barbara", region: "Southern California", timeZone: "America/Los_Angeles", latitude: 34.4083, longitude: -119.6858 },

  // --- Central and Northern California ---
  { id: "9412110", name: "Port San Luis", region: "Central California", timeZone: "America/Los_Angeles", latitude: 35.1767, longitude: -120.7601 },
  { id: "9413450", name: "Monterey", region: "Central California", timeZone: "America/Los_Angeles", latitude: 36.605, longitude: -121.8883 },
  { id: "9414290", name: "San Francisco", region: "Northern California", timeZone: "America/Los_Angeles", latitude: 37.8063, longitude: -122.4659 },
  { id: "9414750", name: "Alameda", region: "Northern California", timeZone: "America/Los_Angeles", latitude: 37.7717, longitude: -122.3 },
  { id: "9418767", name: "North Spit, Humboldt Bay", region: "Northern California", timeZone: "America/Los_Angeles", latitude: 40.7663, longitude: -124.2172 },
  { id: "9419750", name: "Crescent City", region: "Northern California", timeZone: "America/Los_Angeles", latitude: 41.745, longitude: -124.1843 },

  // --- Pacific Northwest ---
  { id: "9435380", name: "South Beach, Newport", region: "Oregon", timeZone: "America/Los_Angeles", latitude: 44.6254, longitude: -124.0449 },
  { id: "9432780", name: "Charleston", region: "Oregon", timeZone: "America/Los_Angeles", latitude: 43.345, longitude: -124.322 },
  { id: "9440910", name: "Toke Point", region: "Washington", timeZone: "America/Los_Angeles", latitude: 46.7075, longitude: -123.9669 },
  { id: "9443090", name: "Neah Bay", region: "Washington", timeZone: "America/Los_Angeles", latitude: 48.3703, longitude: -124.6017 },
  { id: "9447130", name: "Seattle", region: "Washington", timeZone: "America/Los_Angeles", latitude: 47.6026, longitude: -122.3393 },
  { id: "9449880", name: "Friday Harbor", region: "Washington", timeZone: "America/Los_Angeles", latitude: 48.5453, longitude: -123.0129 },

  // --- Alaska and Hawaii ---
  { id: "9451600", name: "Sitka", region: "Alaska", timeZone: "America/Anchorage", latitude: 57.0517, longitude: -135.342 },
  { id: "9455920", name: "Anchorage", region: "Alaska", timeZone: "America/Anchorage", latitude: 61.2383, longitude: -149.89 },
  { id: "1612340", name: "Honolulu", region: "Hawaii", timeZone: "Pacific/Honolulu", latitude: 21.3067, longitude: -157.867 },

  // --- Gulf ---
  { id: "8771450", name: "Galveston Pier 21", region: "Texas", timeZone: "America/Chicago", latitude: 29.31, longitude: -94.7933 },
  { id: "8761724", name: "Grand Isle", region: "Louisiana", timeZone: "America/Chicago", latitude: 29.2633, longitude: -89.9567 },
  { id: "8729108", name: "Panama City", region: "Florida Gulf", timeZone: "America/Chicago", latitude: 30.1523, longitude: -85.6669 },
  { id: "8726520", name: "St. Petersburg", region: "Florida Gulf", timeZone: "America/New_York", latitude: 27.7606, longitude: -82.6269 },

  // --- Florida and the South Atlantic ---
  { id: "8724580", name: "Key West", region: "Florida Keys", timeZone: "America/New_York", latitude: 24.5551, longitude: -81.8079 },
  { id: "8723214", name: "Virginia Key, Biscayne Bay", region: "South Florida", timeZone: "America/New_York", latitude: 25.7317, longitude: -80.1617 },
  { id: "8665530", name: "Charleston, Cooper River", region: "South Carolina", timeZone: "America/New_York", latitude: 32.7817, longitude: -79.9247 },
  { id: "8658120", name: "Wilmington", region: "North Carolina", timeZone: "America/New_York", latitude: 34.2275, longitude: -77.9536 },

  // --- Mid-Atlantic and Northeast ---
  { id: "8638610", name: "Sewells Point", region: "Virginia", timeZone: "America/New_York", latitude: 36.9467, longitude: -76.3300 },
  { id: "8534720", name: "Atlantic City", region: "New Jersey", timeZone: "America/New_York", latitude: 39.3567, longitude: -74.4183 },
  { id: "8518750", name: "The Battery", region: "New York", timeZone: "America/New_York", latitude: 40.7006, longitude: -74.0142 },
  { id: "8452660", name: "Newport", region: "Rhode Island", timeZone: "America/New_York", latitude: 41.5043, longitude: -71.3261 },
  { id: "8443970", name: "Boston", region: "Massachusetts", timeZone: "America/New_York", latitude: 42.3548, longitude: -71.0534 },
  { id: "8418150", name: "Portland", region: "Maine", timeZone: "America/New_York", latitude: 43.6567, longitude: -70.2467 },
];

export function stationById(id: string): TideStation | null {
  return TIDE_STATIONS.find((s) => s.id === id) ?? null;
}

/** Stations grouped for the picker, in catalog order — coasts stay together. */
export function stationsByRegion(): readonly (readonly [string, readonly TideStation[]])[] {
  const groups = new Map<string, TideStation[]>();
  for (const station of TIDE_STATIONS) {
    const list = groups.get(station.region) ?? [];
    list.push(station);
    groups.set(station.region, list);
  }
  return [...groups.entries()];
}
