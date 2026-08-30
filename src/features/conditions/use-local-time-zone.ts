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
 * A first version of this hook returned `null` from `getServerSnapshot` but read the real
 * zone directly and unconditionally in `getSnapshot`. That is NOT the same guarantee
 * `useNow()` has, and it produced a real hydration-attribute mismatch in the browser
 * (`title`/`aria-label`/`aria-valuetext`, all built from `displayTimeZone`): React's
 * documented contract is that `getServerSnapshot` is used to produce the FIRST client
 * render's output during hydration, but `getSnapshot` can still be called on that very
 * same first render for its own bookkeeping, and there is nothing stopping a future React
 * version, a Strict Mode double-render, or a streaming/Suspense boundary from actually
 * *using* that first `getSnapshot` call's result. `useNow()` is safe not because of the
 * `getServerSnapshot` argument alone, but because its `getSnapshot` reads a `ref` that is
 * only ever written inside `subscribe` — which React only calls after commit, i.e. after
 * mount. So `getSnapshot()` returns `null` no matter how many times or when it is called,
 * right up until the first post-mount `subscribe` callback runs. This hook now copies that
 * exact shape instead of reading `Intl` straight out of `getSnapshot`.
 *
 * No `suppressHydrationWarning` anywhere — server and the first client render produce
 * IDENTICAL markup (`null`, i.e. the caller's station-zone fallback) on purpose, and the
 * real zone swaps in a moment later via the post-mount `subscribe` call, exactly like the
 * live clock does.
 */
import { useCallback, useRef, useSyncExternalStore } from "react";

function getServerSnapshot(): null {
  return null;
}

/** The viewer's resolved IANA time zone, or `null` during SSR and the first hydration render. */
export function useLocalTimeZone(): string | null {
  // Same ref-gating as `useNow()`: written only from `subscribe`, which React calls as a
  // post-mount side effect, never during render. `getSnapshot` is therefore guaranteed to
  // return `null` on every call — no matter when React chooses to make it — until after
  // the component has actually mounted on the client.
  const latestRef = useRef<string | null>(null);

  const subscribe = useCallback((onStoreChange: () => void) => {
    latestRef.current = Intl.DateTimeFormat().resolvedOptions().timeZone;
    onStoreChange();
    // The zone cannot change again without a full reload, so there is nothing to
    // unsubscribe from.
    return () => {};
  }, []);

  const getSnapshot = useCallback(() => latestRef.current, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
