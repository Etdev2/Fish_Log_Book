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
 *
 * `onChosen` fires after a real choice, and exists so a caller can react to the act
 * without this control having to know why anybody cares. Guided setup uses it to walk the
 * angler back to the checklist; the tide screen passes nothing and behaves as before. The
 * callback stays here rather than the knowledge of setup, because a station picker that
 * imported the onboarding flow would be a picker you could no longer reuse.
 */
export function StationPicker({ id, onChosen }: { id?: string; onChosen?: () => void }) {
  const [stationId, setStationId] = useTideStationPreference();

  return (
    <select
      id={id}
      value={stationId}
      onChange={(event) => {
        setStationId(event.target.value);
        setTideStationPreference(event.target.value);
        onChosen?.();
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
