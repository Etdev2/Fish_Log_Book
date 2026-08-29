"use client";

/**
 * The height-unit preference (feet/metres). Founder decision: defaults to feet.
 *
 * ADR 005 §6 says a preference like this belongs in the local store's `meta` table
 * (IndexedDB via `idb`), so it survives reload the same way the sticky rig and the
 * platform selector will. That store does not exist in this worktree yet (`src/lib/`
 * is out of bounds for this branch — it belongs to the offline-storage lane), so this
 * is a deliberate stopgap: `localStorage`, read once on mount and written on change,
 * behind the same hook shape a future `meta`-backed implementation would have. When the
 * real store lands, only this file's internals change — every caller already goes
 * through `useUnitPreference()` / `setUnitPreference()`, never `localStorage` directly.
 */
import { useCallback, useEffect, useState } from "react";

export type UnitPreference = "ft" | "m";

const STORAGE_KEY = "flb.units";
const DEFAULT_UNIT: UnitPreference = "ft";
const CHANGE_EVENT = "flb:units-changed";

function isUnitPreference(value: string | null): value is UnitPreference {
  return value === "ft" || value === "m";
}

function readStored(): UnitPreference {
  if (typeof window === "undefined") return DEFAULT_UNIT;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return isUnitPreference(raw) ? raw : DEFAULT_UNIT;
}

/** Sets the preference and notifies every mounted `useUnitPreference()` in this tab. */
export function setUnitPreference(unit: UnitPreference): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, unit);
  window.dispatchEvent(new CustomEvent<UnitPreference>(CHANGE_EVENT, { detail: unit }));
}

/**
 * Reads the unit preference and re-renders on change, including changes made from another
 * component in the same tab (a `storage` event alone only fires cross-tab). Always starts
 * at the default on the server and the first client render, so there is nothing for React
 * to flag as a hydration mismatch — the real stored value (if different) applies a moment
 * later, exactly like `useNow()`'s SSR-safe `null`.
 */
export function useUnitPreference(): readonly [UnitPreference, (unit: UnitPreference) => void] {
  const [unit, setUnit] = useState<UnitPreference>(DEFAULT_UNIT);

  useEffect(() => {
    setUnit(readStored());
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<UnitPreference>).detail;
      setUnit(isUnitPreference(detail ?? null) ? (detail as UnitPreference) : readStored());
    };
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const update = useCallback((next: UnitPreference) => setUnitPreference(next), []);

  return [unit, update] as const;
}
