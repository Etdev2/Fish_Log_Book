"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";

import {
  allStepsDone,
  observedSteps,
  setupSteps,
  stepsToLatch,
} from "@/core/rules/setup-progress";
import { useTideStationChosen } from "@/features/conditions/station-preference";
import { useLog } from "@/features/catches/store";
import { useRegionChosen } from "@/features/settings/region";
import { CARD_CLASS, FOCUS_RING } from "@/features/catches/ui-classes";
import { useTackleSession } from "@/features/tackle/session-store";
import { isFixtureItem } from "@/features/tackle/tackle-fixture";

import { latchSteps, useSetupLatch } from "../checklist-latch";

/**
 * The five-step guided setup checklist, on the calendar home (founder spec §1).
 *
 * It teaches the order of operations once — location, tackle, rod, conditions, fish —
 * and then gets out of the way for good. A step that could un-complete itself would put
 * an angler of ten years back at step one every new trip, which is the failure the
 * founder named: a checklist that keeps nagging is one you learn to ignore.
 *
 * All five decisions live in `core/rules/setup-progress.ts`; the latch that makes them
 * one-way lives in `../checklist-latch.ts`. This renders.
 */
export function SetupChecklist() {
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

  // Write down anything newly true, so it survives the data changing later. `latchSteps`
  // no-ops on an empty list, which is what keeps this from being a render loop.
  useEffect(() => {
    latchSteps(newly);
  }, [newly]);

  if (allStepsDone(steps)) {
    return (
      <section className={`${CARD_CLASS} p-4`}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-body text-text-muted">Setup complete</p>
          <Link
            href="/setup"
            className={`inline-flex min-h-touch-floor items-center rounded-md border border-border-interactive px-4 text-label text-text-link ${FOCUS_RING}`}
          >
            Review
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className={`${CARD_CLASS} flex flex-col gap-3 p-4`} aria-labelledby="setup-checklist">
      <h2 id="setup-checklist" className="text-h3">
        Get set up
      </h2>
      <ol className="flex flex-col gap-1">
        {steps.map((step, index) => (
          <li key={step.id}>
            <Link
              href={step.href}
              className={`flex min-h-touch-floor items-center gap-3 rounded-md px-1 transition-colors hover:bg-surface-raised ${FOCUS_RING} motion-reduce:transition-none`}
            >
              <span
                aria-hidden
                className="w-5 shrink-0 text-label text-text-muted"
              >
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-body text-text-primary">{step.label}</span>
                {/* Completed rows say "Done" rather than only turning green — colour is
                    never the only signal (06-accessibility-baseline). They stay tappable:
                    somebody who added gear in January may want to add more in September. */}
                {step.done ? (
                  <span className="block text-caption text-success-green">Done</span>
                ) : (
                  <span className="block text-caption text-text-muted">{step.hint}</span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
