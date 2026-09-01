"use client";

/**
 * The height-unit preference (feet/metres). Founder decision: defaults to feet.
 *
 * The storage mechanics — localStorage, the ref-gated `useSyncExternalStore`, the
 * same-tab change event, and the reasoning behind all three — now live in
 * `preference.ts`, shared with the fishing shortcuts. This file is just the declaration
 * of *which* preference this is.
 *
 * Callers go through `useUnitPreference()` / `setUnitPreference()` and never touch
 * storage directly, so when preferences move to the local store's `meta` table
 * (ADR 005 §6) nothing here or downstream changes.
 */
import { createLocalPreference } from "./preference";

export type UnitPreference = "ft" | "m";

const preference = createLocalPreference<UnitPreference>({
  key: "flb.units",
  defaultValue: "ft",
  parse: (raw) => (raw === "ft" || raw === "m" ? raw : "ft"),
  serialize: (value) => value,
});

export const useUnitPreference = preference.use;
export const setUnitPreference = preference.set;
