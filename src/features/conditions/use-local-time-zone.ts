"use client";

/**
 * The viewer's own IANA time zone, resolved at runtime — not the tide station's.
 *
 * Founder decision: the chart should default to showing times in the person looking at
 * the phone's own zone, not hardcode the station's (`America/Los_Angeles`). This is a
 * hydration trap if done carelessly: the server has no idea what time zone the browser is
 * in, so formatting a timestamp with it during SSR produces different markup than the
 * first client render, which React flags as a mismatch.
 *
 * Same discipline `useNow()` already uses for the wall clock (ADR 006 §7): return a
 * stable, server-safe value first (`null`, meaning "unknown yet — fall back to the
 * station's own zone") via `useSyncExternalStore`'s `getServerSnapshot`, and only report
 * the real value once React has subscribed on the client, after hydration. No
 * `suppressHydrationWarning` anywhere — the server and the first client render render
 * IDENTICAL markup (the station's zone) on purpose, and the real zone swaps in a moment
 * later, exactly like the live clock does.
 *
 * The zone itself does not change during a session without a reload, so `subscribe` has
 * nothing to listen for — it exists only so `useSyncExternalStore` can give us the
 * SSR-safe `getServerSnapshot` behaviour.
 */
import { useSyncExternalStore } from "react";

function getSnapshot(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function getServerSnapshot(): null {
  return null;
}

function subscribe(): () => void {
  return () => {};
}

/** The viewer's resolved IANA time zone, or `null` during SSR and the first hydration render. */
export function useLocalTimeZone(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
