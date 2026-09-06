"use client";

import { REGIONS } from "@/core/ontology/regions";
import { useSetupErrandDone } from "@/features/setup/return-to-setup";
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
 *
 * When guided setup is what sent the angler here, choosing walks them straight back to
 * the checklist with the step ticked. That is the founder's own description of what
 * should have happened all along — picking a region and then being left standing in
 * Settings was the moment setup stopped feeling like a flow. Reading the errand costs a
 * `Suspense` boundary on this page; see `return-to-setup.ts` for why the URL holds that
 * state rather than storage.
 */
export function RegionSelect() {
  const [regionId, setRegionId] = useRegionPreference();
  const errandDone = useSetupErrandDone("region");

  return (
    <label className="flex flex-col gap-2">
      <span className="sr-only">Fishing region</span>
      <select
        value={regionId}
        onChange={(event) => {
          setRegionId(event.target.value as typeof regionId);
          errandDone();
        }}
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
