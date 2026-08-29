"use client";

/**
 * `useNow` — the ONLY place the wall clock is read (ADR 006 §7).
 *
 * Every calculation in `src/core/rules/**` takes the present moment as an injected
 * `Instant` parameter; nothing in `core/` calls `Date.now()`. This hook is the one place
 * that reads it, on an interval, so a live-moving chart marker can re-render without any
 * component reaching for the clock itself.
 *
 * Built on `useSyncExternalStore` rather than `useState` + `useEffect`: the clock is an
 * external, time-varying store, which is exactly what that API is for, and it gives SSR
 * safety for free via `getServerSnapshot` — the server (and the client's first hydration
 * render) always see `null`, so there is nothing for React to flag as a mismatch. The real
 * `Instant` only appears once React has subscribed on the client, after hydration.
 */
import { useCallback, useRef, useSyncExternalStore } from "react";
import type { Instant } from "@/core/units";
import { instant } from "@/core/units";

function getServerSnapshot(): null {
  return null;
}

/**
 * @param intervalMs how often to refresh, in milliseconds. Default 30s.
 * @returns the current `Instant`, or `null` before the first client-side subscription
 *          (i.e. during SSR and the initial hydration render).
 */
export function useNow(intervalMs: number = 30_000): Instant | null {
  // `getSnapshot` must return a value stable across repeated calls until the store
  // actually changes (React checks this for tearing), and the render path may not call an
  // impure function like `Date.now()` at all. So the current value is held in a ref, only
  // ever written from `subscribe` — which React calls as a side effect, not during render.
  const latestRef = useRef<Instant | null>(null);

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      latestRef.current = instant(Date.now());
      onStoreChange();
      const id = setInterval(() => {
        latestRef.current = instant(Date.now());
        onStoreChange();
      }, intervalMs);
      return () => clearInterval(id);
    },
    [intervalMs],
  );

  const getSnapshot = useCallback(() => latestRef.current, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
