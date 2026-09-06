"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { SETUP_STEPS, type SetupStepId } from "@/core/rules/setup-progress";

/**
 * The thread that ties a setup step to the screen that completes it.
 *
 * The complaint this fixes, in the founder's words: "I select a region and then I'm just
 * standing in Settings." The guided checklist sent people away and had no way to bring
 * them home, so finishing a step felt like falling out of the app rather than progressing
 * through it.
 *
 * The state that says "you are in the middle of setup" lives in the URL, not in storage.
 * That is the whole trick, and it is worth saying why: a stored flag has to be cleared by
 * somebody, and every path that forgets to clear it leaves a stale "back to setup" bar
 * pinned to a screen the angler wandered onto three taps later. A query parameter cleans
 * itself up — navigate anywhere by any other route and it is simply gone.
 *
 * Reading it costs a `Suspense` boundary (see `use-search-params.md`: a prerendered route
 * client-renders the tree up to the nearest boundary). That boundary is in `shell-frame`,
 * around the bar and nothing else, so every page above it still prerenders and ADR 005 §5
 * holds.
 */

export const ONBOARDING_PATH = "/onboarding";

const FROM_PARAM = "from";
const FROM_VALUE = "setup";
const STEP_PARAM = "step";

/**
 * A step's destination, tagged so the screen at the other end knows why you are there.
 *
 * Real parsing rather than string concatenation, because step hrefs carry both halves of a
 * URL's tail: a fragment naming the control that completes the step
 * (`/settings#fishing-region`) and, in principle, a query of their own (`/log?add=…` is
 * the shape the calendar already uses). Appending would have produced
 * `/settings#fishing-region?from=setup`, where the query is part of the fragment and
 * nothing on the far end sees it.
 */
export function setupStepHref(href: string, step: SetupStepId): string {
  const [beforeHash, hash] = href.split("#");
  const [path, query] = beforeHash.split("?");
  const params = new URLSearchParams(query);
  params.set(FROM_PARAM, FROM_VALUE);
  params.set(STEP_PARAM, step);
  return `${path}?${params.toString()}${hash ? `#${hash}` : ""}`;
}

/** Which step the angler was sent here to do, or null if they arrived some other way. */
export function useSetupErrand(): SetupStepId | null {
  const params = useSearchParams();
  if (params.get(FROM_PARAM) !== FROM_VALUE) return null;
  const step = params.get(STEP_PARAM);
  return SETUP_STEPS.includes(step as SetupStepId) ? (step as SetupStepId) : null;
}

/**
 * "I just did the thing you sent me here for." Call it from the control's own handler.
 *
 * Deliberately driven by the user's action rather than by watching the step flip to done.
 * Watching looks tidier and is a trap: every local preference in this app paints its
 * default first and syncs from storage a moment after mount (see `preference.ts`), so a
 * watcher cannot tell "the angler just chose a region" from "storage caught up with the
 * region they chose last March", and would bounce a browsing angler out of Settings.
 *
 * A no-op when the angler is not on that errand, so a control can call it unconditionally.
 */
export function useSetupErrandDone(step: SetupStepId): () => void {
  const errand = useSetupErrand();
  const router = useRouter();
  const onErrand = errand === step;

  return useCallback(() => {
    if (onErrand) router.push(ONBOARDING_PATH);
  }, [onErrand, router]);
}
