"use client";

import { REGIONS } from "@/core/ontology/regions";
import { useRegionPreference } from "../region";

/**
 * Fishing region control for /settings (ADR 007 §4).
 *
 * Nine options, so a select, not a row of chips — the chip wall would wrap twice on a
 * phone for a control that gets touched once, maybe twice. Same select idiom the tackle
 * sort uses, so the gesture vocabulary stays one deep.
 *
 * The note matters: this changes suggestions and nothing else. An angler on a Baja trip
 * out of Dana Point must never feel locked out of their own app's species list.
 */
export function RegionSelect() {
  const [regionId, setRegionId] = useRegionPreference();

  return (
    <label className="flex flex-col gap-2">
      <span className="sr-only">Fishing region</span>
      <select
        value={regionId}
        onChange={(event) => setRegionId(event.target.value as typeof regionId)}
        className="min-h-touch-floor w-full rounded-md border border-border-interactive bg-surface px-4 text-body text-text-primary focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-focus-ring"
      >
        {REGIONS.map((region) => (
          <option key={region.id} value={region.id}>
            {region.label}
          </option>
        ))}
      </select>
    </label>
  );
}
