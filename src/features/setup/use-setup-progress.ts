"use client";

import { useEffect, useMemo } from "react";

import {
  allStepsDone,
  observedSteps,
  setupSteps,
  stepsToLatch,
  type SetupStep,
  type SetupStepId,
} from "@/core/rules/setup-progress";
import { useLog } from "@/features/catches/store";
import { useTideStationChosen } from "@/features/conditions/station-preference";
import { useRegionChosen } from "@/features/settings/region";
import { useTackleSession } from "@/features/tackle/session-store";
import { isFixtureItem } from "@/features/tackle/tackle-fixture";

import { latchSteps, useSetupLatch } from "./checklist-latch";

/**
 * Where the angler is in guided setup, for anything that needs to know.
 *
 * This used to live inside `setup-checklist.tsx`, which was fine while exactly one card
 * on exactly one screen asked the question. Three things ask now — the onboarding page,
 * the calendar's banner, and the "back to setup" bar that follows an angler into
 * Settings — and three copies of the observe-latch-merge dance would have been three
 * chances to disagree about what "done" means.
 *
 * The latch write lives here too, so it happens once per render pass no matter how many
 * of those three are on screen. `latchSteps` no-ops on an empty list, which is what keeps
 * an effect that writes storage from being a render loop.
 */
export interface SetupProgress {
  readonly steps: readonly SetupStep[];
  readonly doneCount: number;
  readonly total: number;
  readonly allDone: boolean;
  /** The first step still outstanding — what "Continue setup" should open. */
  readonly nextStep: SetupStep | null;
  /** Whether the angler has started at all. Drives welcome-vs-progress copy. */
  readonly untouched: boolean;
}

export function useSetupProgress(): SetupProgress {
  const state = useLog();
  const tackle = useTackleSession();
  const [latched] = useSetupLatch();
  // Chosen in Settings, not merely defaulted: both preferences ship with a value, and
  // ticking "choose your region" for somebody who never opened Settings would teach them
  // the checklist is decorative.
  const regionChosen = useRegionChosen();
  const stationChosen = useTideStationChosen();

  const observed = useMemo(
    () =>
      observedSteps({
        catches: state.catches,
        rigs: state.rigs,
        locations: state.locations,
        // Sample data is not the angler's gear — see `isFixtureItem`.
        tackleItemCount: tackle.items.filter((item) => !isFixtureItem(item)).length,
        regionChosen,
        stationChosen,
      }),
    [state.catches, state.rigs, state.locations, tackle.items, regionChosen, stationChosen],
  );

  const latchedSet = useMemo(() => new Set(latched), [latched]);
  const steps = useMemo(() => setupSteps(latchedSet, observed), [latchedSet, observed]);
  const newly = useMemo(() => stepsToLatch(latchedSet, observed), [latchedSet, observed]);

  // Write down anything newly true, so it survives the data changing later.
  useEffect(() => {
    latchSteps(newly);
  }, [newly]);

  const doneCount = steps.filter((step) => step.done).length;

  return {
    steps,
    doneCount,
    total: steps.length,
    allDone: allStepsDone(steps),
    nextStep: steps.find((step) => !step.done) ?? null,
    untouched: doneCount === 0,
  };
}

/** One step by id, for the screens that only care about the one they were sent to do. */
export function useSetupStep(id: SetupStepId | null): SetupStep | null {
  const { steps } = useSetupProgress();
  return id === null ? null : (steps.find((step) => step.id === id) ?? null);
}
