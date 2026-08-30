"use client";

/**
 * The height-unit preference (feet/metres). Founder decision: defaults to feet.
 *
 * ADR 005 §6 says a preference like this belongs in the local store's `meta` table
 * (IndexedDB via `idb`), so it survives reload the same way the sticky rig and the
 * platform selector will. That store does not exist in this worktree yet (`src/lib/`
 * is out of bounds for this branch — it belongs to the offline-storage lane), so this
 * is a deliberate stopgap: `localStorage`, treated as an external store via
 * `useSyncExternalStore` — the same pattern `useNow()` uses for the wall clock.
 *
 * A first version of this hook read `localStorage` directly and unconditionally inside
 * `getSnapshot`. That is the same class of hydration hazard found in
 * `use-local-time-zone.ts`: `getServerSnapshot` alone does not guarantee the first client
 * render matches the server if `getSnapshot` can independently be called and return a
 * different value on that same first render (e.g. a returning visitor who had already
 * chosen "m" — the server always renders the "ft" default). `getSnapshot` here now reads
 * a `ref` that is only ever written from `subscribe`, which React calls after mount, never
 * during render — so it returns the SSR-safe default no matter when it is called, right up
 * until the first post-mount `subscribe` callback runs. When the real `meta` store lands,
 * only this file's internals change — every caller already goes through
 * `useUnitPreference()` / `setUnitPreference()`, never `localStorage` directly.
 */
import { useCallback, useRef, useSyncExternalStore } from "react";

export type UnitPreference = "ft" | "m";

const STORAGE_KEY = "flb.units";
const DEFAULT_UNIT: UnitPreference = "ft";
const CHANGE_EVENT = "flb:units-changed";

function isUnitPreference(value: string | null): value is UnitPreference {
  return value === "ft" || value === "m";
}

function readStored(): UnitPreference {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return isUnitPreference(raw) ? raw : DEFAULT_UNIT;
}

/** Sets the preference and notifies every mounted `useUnitPreference()` in this tab. */
export function setUnitPreference(unit: UnitPreference): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, unit);
  window.dispatchEvent(new CustomEvent<UnitPreference>(CHANGE_EVENT, { detail: unit }));
}

function getServerSnapshot(): UnitPreference {
  return DEFAULT_UNIT;
}

/**
 * Reads the unit preference and re-renders on change, including changes made from another
 * component in the same tab (a `storage` event alone only fires cross-tab). Returns the
 * default on the server AND on the first client render — guaranteed by the ref-gating
 * below, not merely by `getServerSnapshot` — so there is nothing for React to flag as a
 * hydration mismatch; the real stored value (if different) applies a moment later.
 */
export function useUnitPreference(): readonly [UnitPreference, (unit: UnitPreference) => void] {
  const latestRef = useRef<UnitPreference>(DEFAULT_UNIT);

  const subscribe = useCallback((onStoreChange: () => void) => {
    latestRef.current = readStored();
    onStoreChange();
    const onChange = () => {
      latestRef.current = readStored();
      onStoreChange();
    };
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const getSnapshot = useCallback(() => latestRef.current, []);

  const unit = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const update = useCallback((next: UnitPreference) => setUnitPreference(next), []);
  return [unit, update] as const;
}
