"use client";

import { createLocalPreference } from "@/features/settings/preference";
import type { FishingMode } from "./types";

/**
 * Device-local (ADR 004/ADR 007 §4): the fishing MODE is how you're fishing right now,
 * not who you are. It never lands on a catch — platforms on catches stay the trip's own
 * field — it only steers how regulation cards read the platform split.
 */
export const fishingModePreference = createLocalPreference<FishingMode>({
  key: "flb:regs-fishing-mode",
  defaultValue: "boat",
  parse: (raw) =>
    raw === "kayak" || raw === "shore" || raw === "spearfishing" || raw === "boat"
      ? raw
      : "boat",
  serialize: (value) => value,
});

export function useFishingModePreference() {
  return fishingModePreference.use();
}
