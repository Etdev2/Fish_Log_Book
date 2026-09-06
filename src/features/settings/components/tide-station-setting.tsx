"use client";

import { StationPicker } from "@/features/conditions/components/station-picker";
import { useSetupErrandDone } from "@/features/setup/return-to-setup";

/**
 * The tide station row on /settings — the plain picker, plus the one thing that is true
 * only here: picking a station is step 2 of guided setup, so when setup is what sent the
 * angler over, choosing walks them back with it ticked.
 *
 * A wrapper rather than a prop on the settings page, because the page is a server
 * component and this is a callback. A wrapper rather than logic inside `StationPicker`,
 * because the picker belongs to the conditions feature and has no business knowing that
 * onboarding exists (ADR 005 §3).
 */
export function TideStationSetting() {
  const errandDone = useSetupErrandDone("station");
  return <StationPicker onChosen={errandDone} />;
}
