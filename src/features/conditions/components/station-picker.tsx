"use client";

import { setTideStationPreference, useTideStationPreference } from "../station-preference";
import { stationsByRegion } from "../stations";

/**
 * Choose which NOAA station the tide chart reads.
 *
 * A grouped native select rather than a search: the catalog is a few dozen primary
 * stations, and a native picker is the one control that is already usable one-handed on a
 * moving boat with wet fingers.
 *
 * Changing this refetches, and the chart's badge says whether what you are looking at came
 * from NOAA just now, from this device's memory, or from the bundled sample.
 */
export function StationPicker({ id }: { id?: string }) {
  const [stationId, setStationId] = useTideStationPreference();

  return (
    <select
      id={id}
      value={stationId}
      onChange={(event) => {
        setStationId(event.target.value);
        setTideStationPreference(event.target.value);
      }}
      className="min-h-touch-floor w-full rounded-md border border-border-interactive bg-background px-3 text-body text-text-primary focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring"
    >
      {stationsByRegion().map(([region, stations]) => (
        <optgroup key={region} label={region}>
          {stations.map((station) => (
            <option key={station.id} value={station.id}>
              {station.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
