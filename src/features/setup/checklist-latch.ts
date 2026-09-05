"use client";

import { SETUP_STEPS, type SetupStepId } from "@/core/rules/setup-progress";
import { createLocalPreference } from "@/features/settings/preference";

/**
 * Which guided-setup steps this device has ever completed.
 *
 * Stored rather than derived, and that is the design (see `core/rules/setup-progress.ts`).
 * Live data answers "do you have tackle now", not "have you ever added tackle", and the
 * two differ exactly where it matters: an angler who clears out their box should not be
 * marched back through the tutorial.
 *
 * Local, not on the account, because the app is fully usable signed out.
 */
const latch = createLocalPreference<readonly SetupStepId[]>({
  key: "flb:setup-checklist",
  defaultValue: [],
  parse: (raw) => {
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      // Narrow rather than trust: an unknown id from an older or newer build must not
      // become a step that can never be completed.
      return parsed.filter((id): id is SetupStepId =>
        SETUP_STEPS.includes(id as SetupStepId),
      );
    } catch {
      return [];
    }
  },
  serialize: (value) => JSON.stringify(value),
});

/** Read the latch inside a component. Never `latch.use()` — see tripwire §4. */
export function useSetupLatch() {
  return latch.use();
}

/** Write newly completed steps down. No-op when there is nothing new, so it is safe in an effect. */
export function latchSteps(newly: readonly SetupStepId[]): void {
  if (newly.length === 0) return;
  const merged = new Set([...latch.read(), ...newly]);
  latch.set([...merged]);
}
