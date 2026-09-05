"use client";

import { useSyncExternalStore } from "react";

/**
 * A ticking clock and the online flag, as external stores rather than `useEffect` +
 * `setState`.
 *
 * Copied value-for-value from `features/games/use-now.ts`, which explains the reasoning:
 * setting state synchronously in an effect body is a cascading render, and with the React
 * Compiler on it is exactly the shape that behaves differently from what the code appears
 * to say. `useSyncExternalStore` is what these are for — an outside source of truth (the
 * wall clock, the radio) that React subscribes to. Duplicated rather than imported because
 * ADR 005 §3 forbids reaching into another feature's internals.
 *
 * The tournament section needs both for reasons the old code got wrong: it read
 * `navigator.onLine` straight in a render body, which is a `ReferenceError` during the
 * server render every one of these pages still gets, and that error was landing the whole
 * live-catch screen in `error.tsx`.
 *
 * The cached `nowMs` matters: `getSnapshot` must return a value that is `Object.is`-equal
 * between renders or React re-renders forever, so it returns the last tick rather than
 * calling `Date.now()` itself.
 */

let nowMs = 0;
const listeners = new Set<() => void>();
let timer: number | null = null;

function emit(): void {
  const next = Date.now();
  if (next === nowMs) return;
  nowMs = next;
  for (const listener of listeners) listener();
}

function subscribeNow(listener: () => void): () => void {
  listeners.add(listener);
  if (timer === null) {
    nowMs = Date.now();
    // Only while the tab is visible. A countdown burning battery in a pocket for six
    // hours is a real cost on a boat with no charger.
    timer = window.setInterval(() => {
      if (document.visibilityState === "visible") emit();
    }, 1000);
    document.addEventListener("visibilitychange", emit);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== null) {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", emit);
      timer = null;
    }
  };
}

const getNow = (): number => nowMs;
/** Zero on the server, so the first client paint matches and the clock simply hides. */
const getServerNow = (): number => 0;

export function useNow(): number {
  return useSyncExternalStore(subscribeNow, getNow, getServerNow);
}

function subscribeOnline(listener: () => void): () => void {
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  return () => {
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  };
}

/** A boolean, so it is stable between renders without any caching of its own. */
const getOnline = (): boolean => navigator.onLine;
const getServerOnline = (): boolean => true;

export function useOnline(): boolean {
  return useSyncExternalStore(subscribeOnline, getOnline, getServerOnline);
}
