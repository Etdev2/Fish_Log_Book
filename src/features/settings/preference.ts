"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

/**
 * One local preference, stored on the device and readable without a round trip.
 *
 * This is the pattern `units.ts` worked out, lifted into a factory so a second
 * preference does not become a second implementation of the same careful hydration
 * handling. Both preferences now go through this; there is one system, not two.
 *
 * **The hydration hazard, restated because it is the whole reason this is not four
 * lines.** `getServerSnapshot` alone does not guarantee the first client render matches
 * the server: `getSnapshot` can be called independently during that first render and
 * return the stored value instead of the default, which is a mismatch for any returning
 * visitor who ever changed the setting. So `getSnapshot` reads a ref that is only ever
 * written from `subscribe`, which React calls *after* mount and never during render. The
 * first paint is therefore always the default, on both sides, and the stored value
 * applies a moment later.
 *
 * ADR 005 §6 says preferences belong in the local store's `meta` table. That store now
 * exists (`src/lib/offline/db.ts`), but IndexedDB is async: reading it would paint the
 * default and then rearrange the layout a frame later, which for a preference that
 * decides whether a control exists is a visible jump. `localStorage` is synchronous and
 * right for this job. When preferences do migrate, this one file changes and every
 * caller — which only ever sees the returned hook — does not.
 */
export interface LocalPreference<T> {
  /** Reads the value and re-renders on change, including changes from this same tab. */
  use: () => readonly [T, (next: T) => void];
  /** Sets the value from outside React. */
  set: (next: T) => void;
  /** Reads the value outside React (snapshot builders, engine calls). */
  read: () => T;
  readonly defaultValue: T;
}

export function createLocalPreference<T>(options: {
  key: string;
  defaultValue: T;
  /** Narrows whatever is in storage back to `T`. Anything unrecognised falls back. */
  parse: (raw: string | null) => T;
  serialize: (value: T) => string;
}): LocalPreference<T> {
  const { key, defaultValue, parse, serialize } = options;
  const changeEvent = `flb:preference-changed:${key}`;

  function read(): T {
    try {
      return parse(window.localStorage.getItem(key));
    } catch {
      // Storage can throw outright, not merely return null: Safari private mode and
      // "block all cookies" both do. A preference is never worth breaking a page over.
      return defaultValue;
    }
  }

  function set(next: T): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, serialize(next));
    } catch {
      // Nothing to do. The in-memory value still updates below, so the control responds
      // for this session; it simply will not survive a reload.
    }
    window.dispatchEvent(new CustomEvent(changeEvent));
  }

  function getServerSnapshot(): T {
    return defaultValue;
  }

  function use(): readonly [T, (next: T) => void] {
    const latest = useRef<T>(defaultValue);

    const subscribe = useCallback((onStoreChange: () => void) => {
      latest.current = read();
      onStoreChange();
      const onChange = () => {
        latest.current = read();
        onStoreChange();
      };
      window.addEventListener(changeEvent, onChange);
      // `storage` fires only in OTHER tabs, which is why the custom event above exists.
      window.addEventListener("storage", onChange);
      return () => {
        window.removeEventListener(changeEvent, onChange);
        window.removeEventListener("storage", onChange);
      };
    }, []);

    const getSnapshot = useCallback(() => latest.current, []);
    const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    const update = useCallback((next: T) => set(next), []);
    return [value, update] as const;
  }

  return { use, set, read, defaultValue };
}
