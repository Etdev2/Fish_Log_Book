"use client";

import Link from "next/link";
import { useState } from "react";

import {
  CARD_CLASS,
  FOCUS_RING,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
} from "@/features/catches/ui-classes";

import { resetSetupLatch } from "../checklist-latch";
import { setupStepHref } from "../return-to-setup";
import { useSetupProgress } from "../use-setup-progress";

/**
 * /onboarding — guided setup, on a screen of its own.
 *
 * It used to be a card sitting on top of the calendar, and that was the wrong shape for
 * both of them. The calendar is the home surface (D23) and was being pushed down the page
 * by a tutorial; the tutorial was a cramped list competing with a month grid for the
 * angler's attention. Founder call, 2026-09-06: separate them. The calendar is the
 * calendar. Setup is a place you go, finish, and leave — and, now, can come back to.
 *
 * Three things this screen owes the angler that the old card could not give them:
 *
 * 1. **A way back in.** The card vanished for good the moment the last step ticked. This
 *    page is a permanent destination — in the drawer, in Settings, and linked from the
 *    calendar until it is finished. "Done" is a state, not a demolition.
 * 2. **A way out.** Every step leads somewhere else in the app, and until now that was a
 *    one-way trip. Steps are tagged (`setupStepHref`) so the screen at the other end can
 *    offer the way home, and Settings' region and station controls take you back the
 *    instant you choose one.
 * 3. **A way to start over.** `resetSetupLatch` clears what the guide remembers. It is
 *    honest about what that means — see the copy on the button, and the note in
 *    `checklist-latch.ts` about why it does not un-choose real settings.
 *
 * Never a wall: even at zero steps done there is a plain "Skip for now" out to the
 * calendar. An angler who opened the app to log a fish that is flopping in the well right
 * now must not have to finish a tutorial first.
 */
export function OnboardingPage() {
  const { steps, doneCount, total, allDone, untouched } = useSetupProgress();
  const [confirmingReset, setConfirmingReset] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <section className={`${CARD_CLASS} flex flex-col gap-3 p-4`}>
        <h1 className="text-h1">{allDone ? "You are all set" : "Set up Fish Log Book"}</h1>
        <p className="text-body text-text-muted">
          {allDone
            ? "Everything below is done. Come back any time — nothing here locks."
            : "Six one-time steps. Do them in any order, stop whenever you like, and the app works throughout."}
        </p>

        {/* Number first, bar second. The bar is a picture of the number, never the only
            carrier of it (06-accessibility-baseline: colour and shape are never alone). */}
        <p className="text-body-strong text-text-primary">
          {doneCount} of {total} done
        </p>
        <div
          role="progressbar"
          aria-valuenow={doneCount}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label="Setup progress"
          className="h-2 w-full overflow-hidden rounded-full bg-surface-raised"
        >
          <div
            className="h-full rounded-full bg-success-green transition-[width] motion-reduce:transition-none"
            style={{ width: `${(doneCount / total) * 100}%` }}
          />
        </div>
      </section>

      <ol className="flex flex-col gap-2">
        {steps.map((step, index) => (
          <li key={step.id}>
            <Link
              href={setupStepHref(step.href, step.id)}
              className={`${CARD_CLASS} ${FOCUS_RING} flex min-h-touch-floor items-center gap-3 p-4 transition-colors hover:bg-surface-raised active:scale-[0.99] motion-reduce:transition-none`}
            >
              {/* The green disc and the word "Done" say the same thing twice on purpose. */}
              <span
                aria-hidden
                className={`flex size-space-8 shrink-0 items-center justify-center rounded-full border text-label ${
                  step.done
                    ? "border-success-green bg-success-green text-ink-on-orange"
                    : "border-border-interactive text-text-muted"
                }`}
              >
                {step.done ? "✓" : index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-body text-text-primary">{step.label}</span>
                {step.done ? (
                  <span className="block text-caption text-success-green">
                    Done — tap to change it
                  </span>
                ) : (
                  <span className="block text-caption text-text-muted">{step.hint}</span>
                )}
              </span>
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="size-space-5 shrink-0 text-text-muted"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 6 6 6-6 6" />
              </svg>
            </Link>
          </li>
        ))}
      </ol>

      <section className={`${CARD_CLASS} flex flex-col gap-3 p-4`}>
        <Link href="/" className={`${allDone ? PRIMARY_BUTTON : SECONDARY_BUTTON} self-start`}>
          {allDone ? "Go to the Calendar" : "Skip for now — go to the Calendar"}
        </Link>
        <p className="text-caption text-text-muted">
          You can reopen this guide from the Menu or from Settings whenever you want.
        </p>
      </section>

      {/*
        Start over sits last, behind a confirmation, and states plainly what it does and
        does not do. A destructive-looking control that turns out to be harmless is a good
        surprise; the reverse is the one this app must never spring on anybody.
      */}
      {untouched ? null : (
        <section className={`${CARD_CLASS} flex flex-col gap-3 p-4`}>
          <h2 className="text-h3">Start the guide over</h2>
          {confirmingReset ? (
            <>
              <p className="text-body text-text-muted">
                This clears what the guide remembers, so you can walk the steps again. It
                does not change your region, your tide station, your gear or your log —
                anything still true today will simply tick itself again.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetSetupLatch();
                    setConfirmingReset(false);
                  }}
                  className={PRIMARY_BUTTON}
                >
                  Yes, start over
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingReset(false)}
                  className={SECONDARY_BUTTON}
                >
                  Keep my progress
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-body text-text-muted">
                Forget which steps are marked done and go through setup again. Your
                settings, gear and catches are untouched.
              </p>
              <button
                type="button"
                onClick={() => setConfirmingReset(true)}
                className={`${SECONDARY_BUTTON} self-start`}
              >
                Start over
              </button>
            </>
          )}
        </section>
      )}
    </div>
  );
}
