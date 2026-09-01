"use client";

import { createLocalPreference } from "./preference";

/**
 * Fishing shortcuts — power-user accelerators that are off until asked for.
 *
 * The product rule this encodes: simple by default, fast when needed. The quick mark is
 * an *action*, not a destination, and an angler who does not use it should not pay for
 * it in permanent screen space.
 *
 * Default OFF is deliberate and is the founder's call. Note that the quick mark's
 * underlying behaviour (D22 unresolved marks, offline-first writes) is untouched by this
 * setting — `features/catches/create.ts` still owns all of it. This only decides whether
 * the control is on screen.
 */
const quickMark = createLocalPreference<boolean>({
  key: "flb.shortcuts.quick-mark",
  defaultValue: false,
  parse: (raw) => raw === "on",
  serialize: (value) => (value ? "on" : "off"),
});

export const useQuickMarkEnabled = quickMark.use;
export const setQuickMarkEnabled = quickMark.set;
export const QUICK_MARK_DEFAULT = quickMark.defaultValue;
